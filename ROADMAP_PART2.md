# Cricket Betting Platform - Development Roadmap Part 2

**Continuation from Phase 3...**

---

## 👥 PHASE 4: BACKEND API - AGENT MANAGEMENT

**Duration:** 5-7 days  
**Goal:** Implement agent hierarchy, credit management, and agent operations

### Tasks:

#### 4.1 Agent Service
**File:** `backend/src/services/agent.service.ts`
```typescript
import prisma from '../db';
import { AgentType, UserStatus, UserRole } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { hashPassword } from '../utils/password';
import logger from '../config/logger';

class AgentService {
  async createAgent(data: {
    username: string;
    email?: string;
    phone: string;
    password: string;
    displayName: string;
    agentType: AgentType;
    parentAgentId?: string;
    commissionRate: number;
    creditLimit: number;
    createdBy: string;
  }) {
    // Validate parent agent if provided
    if (data.parentAgentId) {
      const parentAgent = await prisma.agent.findUnique({
        where: { id: data.parentAgentId },
        select: { agentType: true, status: true },
      });

      if (!parentAgent || parentAgent.status !== UserStatus.ACTIVE) {
        throw new AppError('Parent agent not found or inactive', 404);
      }

      // Validate hierarchy rules
      if (data.agentType === AgentType.SUPER_MASTER) {
        throw new AppError('Super Master agents cannot have parent agents', 400);
      }

      if (data.agentType === AgentType.MASTER && parentAgent.agentType !== AgentType.SUPER_MASTER) {
        throw new AppError('Master agents can only be created by Super Master agents', 400);
      }

      if (data.agentType === AgentType.AGENT && parentAgent.agentType !== AgentType.MASTER) {
        throw new AppError('Regular agents can only be created by Master agents', 400);
      }
    }

    // Check if username/email/phone already exists
    const existing = await prisma.agent.findFirst({
      where: {
        OR: [
          { username: data.username },
          ...(data.email ? [{ email: data.email }] : []),
          { phone: data.phone },
        ],
      },
    });

    if (existing) {
      throw new AppError('Username, email, or phone already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        displayName: data.displayName,
        agentType: data.agentType,
        parentAgentId: data.parentAgentId,
        commissionRate: data.commissionRate,
        creditLimit: data.creditLimit,
        status: UserStatus.PENDING,
        createdBy: data.createdBy,
      },
    });

    logger.info(`Agent created: ${agent.id} by ${data.createdBy}`);

    return agent;
  }

  async createPlayer(
    agentId: string,
    data: {
      username: string;
      password: string;
      displayName: string;
      email?: string;
      phone?: string;
      creditLimit: number;
    }
  ) {
    // Verify agent
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { status: true, agentType: true, maxPlayersAllowed: true, _count: { select: { players: true } } },
    });

    if (!agent || agent.status !== UserStatus.ACTIVE) {
      throw new AppError('Agent not found or inactive', 404);
    }

    // Check if agent can create more players
    if (agent._count.players >= agent.maxPlayersAllowed) {
      throw new AppError(`Agent has reached maximum players limit (${agent.maxPlayersAllowed})`, 400);
    }

    // Check if username/email/phone already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new AppError('Username, email, or phone already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create player
    const player = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        displayName: data.displayName,
        agentId,
        creditLimit: data.creditLimit,
        balance: 0,
        role: UserRole.PLAYER,
        status: UserStatus.ACTIVE,
        createdBy: agentId,
      },
    });

    logger.info(`Player created: ${player.id} by agent ${agentId}`);

    return player;
  }

  async transferCredit(agentId: string, playerId: string, amount: number) {
    if (amount <= 0) {
      throw new AppError('Invalid transfer amount', 400);
    }

    return await prisma.$transaction(async (tx) => {
      // Get agent
      const agent = await tx.agent.findUnique({
        where: { id: agentId },
        select: { balance: true, status: true },
      });

      if (!agent || agent.status !== UserStatus.ACTIVE) {
        throw new AppError('Agent not found or inactive', 404);
      }

      // Check agent balance
      if (agent.balance.toNumber() < amount) {
        throw new AppError('Insufficient agent balance', 400);
      }

      // Get player
      const player = await tx.user.findUnique({
        where: { id: playerId },
        select: { agentId: true, balance: true, status: true },
      });

      if (!player || player.status !== UserStatus.ACTIVE) {
        throw new AppError('Player not found or inactive', 404);
      }

      // Verify player belongs to agent
      if (player.agentId !== agentId) {
        throw new AppError('Player does not belong to this agent', 403);
      }

      // Update balances
      const newAgentBalance = agent.balance.toNumber() - amount;
      const newPlayerBalance = player.balance.toNumber() + amount;

      await tx.agent.update({
        where: { id: agentId },
        data: { balance: newAgentBalance },
      });

      await tx.user.update({
        where: { id: playerId },
        data: { balance: newPlayerBalance },
      });

      // Create transactions
      await tx.transaction.create({
        data: {
          agentId,
          type: 'DEBIT_TRANSFER',
          status: 'COMPLETED',
          amount,
          balanceBefore: agent.balance,
          balanceAfter: newAgentBalance,
          referenceId: playerId,
          referenceType: 'credit_transfer',
          processedBy: agentId,
          processedAt: new Date(),
          description: `Credit transferred to ${player.username}`,
        },
      });

      await tx.transaction.create({
        data: {
          userId: playerId,
          type: 'CREDIT_TRANSFER',
          status: 'COMPLETED',
          amount,
          balanceBefore: player.balance,
          balanceAfter: newPlayerBalance,
          referenceType: 'credit_transfer',
          processedBy: agentId,
          processedAt: new Date(),
          description: `Credit received from agent`,
        },
      });

      logger.info(`Credit transferred: ₹${amount} from agent ${agentId} to player ${playerId}`);

      return {
        agentNewBalance: newAgentBalance,
        playerNewBalance: newPlayerBalance,
      };
    });
  }

  async deductCredit(agentId: string, playerId: string, amount: number) {
    if (amount <= 0) {
      throw new AppError('Invalid deduction amount', 400);
    }

    return await prisma.$transaction(async (tx) => {
      // Get player
      const player = await tx.user.findUnique({
        where: { id: playerId },
        select: { agentId: true, balance: true, status: true },
      });

      if (!player || player.status !== UserStatus.ACTIVE) {
        throw new AppError('Player not found or inactive', 404);
      }

      // Verify player belongs to agent
      if (player.agentId !== agentId) {
        throw new AppError('Player does not belong to this agent', 403);
      }

      // Check player balance
      if (player.balance.toNumber() < amount) {
        throw new AppError('Insufficient player balance', 400);
      }

      // Get agent
      const agent = await tx.agent.findUnique({
        where: { id: agentId },
        select: { balance: true },
      });

      if (!agent) {
        throw new AppError('Agent not found', 404);
      }

      // Update balances
      const newPlayerBalance = player.balance.toNumber() - amount;
      const newAgentBalance = agent.balance.toNumber() + amount;

      await tx.user.update({
        where: { id: playerId },
        data: { balance: newPlayerBalance },
      });

      await tx.agent.update({
        where: { id: agentId },
        data: { balance: newAgentBalance },
      });

      // Create transactions
      await tx.transaction.create({
        data: {
          userId: playerId,
          type: 'DEBIT_TRANSFER',
          status: 'COMPLETED',
          amount,
          balanceBefore: player.balance,
          balanceAfter: newPlayerBalance,
          referenceType: 'withdrawal',
          processedBy: agentId,
          processedAt: new Date(),
          description: 'Withdrawal by agent',
        },
      });

      await tx.transaction.create({
        data: {
          agentId,
          type: 'CREDIT_TRANSFER',
          status: 'COMPLETED',
          amount,
          balanceBefore: agent.balance,
          balanceAfter: newAgentBalance,
          referenceId: playerId,
          referenceType: 'withdrawal',
          processedBy: agentId,
          processedAt: new Date(),
          description: `Withdrawal from ${playerId}`,
        },
      });

      logger.info(`Credit deducted: ₹${amount} from player ${playerId} by agent ${agentId}`);

      return {
        agentNewBalance: newAgentBalance,
        playerNewBalance: newPlayerBalance,
      };
    });
  }

  async getAgentPlayers(agentId: string) {
    return await prisma.user.findMany({
      where: { agentId },
      select: {
        id: true,
        username: true,
        displayName: true,
        balance: true,
        creditLimit: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAgentStats(agentId: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        players: {
          select: {
            id: true,
            balance: true,
            bets: {
              select: {
                amount: true,
                status: true,
              },
            },
          },
        },
        commissionsEarned: {
          select: {
            commissionAmount: true,
            paid: true,
          },
        },
      },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    // Calculate stats
    const totalPlayers = agent.players.length;
    const totalPlayersBalance = agent.players.reduce((sum, p) => sum + p.balance.toNumber(), 0);

    const totalBets = agent.players.reduce((sum, p) => sum + p.bets.length, 0);
    const totalBetsAmount = agent.players.reduce(
      (sum, p) => sum + p.bets.reduce((s, b) => s + b.amount.toNumber(), 0),
      0
    );

    const totalCommissions = agent.commissionsEarned.reduce((sum, c) => sum + c.commissionAmount.toNumber(), 0);
    const unpaidCommissions = agent.commissionsEarned
      .filter((c) => !c.paid)
      .reduce((sum, c) => sum + c.commissionAmount.toNumber(), 0);

    return {
      agentId: agent.id,
      agentType: agent.agentType,
      balance: agent.balance.toNumber(),
      totalCommissions,
      unpaidCommissions,
      stats: {
        totalPlayers,
        totalPlayersBalance,
        totalBets,
        totalBetsAmount,
      },
    };
  }

  async getAgentHierarchy(agentId: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        subAgents: {
          include: {
            subAgents: true,
          },
        },
        players: {
          select: {
            id: true,
            username: true,
            displayName: true,
            balance: true,
          },
        },
      },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    return agent;
  }
}

export default new AgentService();
```

#### 4.2 Agent Controller
**File:** `backend/src/controllers/agent.controller.ts`
```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import agentService from '../services/agent.service';

export const createAgent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const createdBy = req.user!.id;
  const data = { ...req.body, createdBy };

  const agent = await agentService.createAgent(data);

  successResponse(res, 'Agent created successfully', agent, 201);
});

export const createPlayer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const data = req.body;

  const player = await agentService.createPlayer(agentId, data);

  successResponse(res, 'Player created successfully', player, 201);
});

export const transferCredit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { playerId, amount } = req.body;

  const result = await agentService.transferCredit(agentId, playerId, parseFloat(amount));

  successResponse(res, 'Credit transferred successfully', result);
});

export const deductCredit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { playerId, amount } = req.body;

  const result = await agentService.deductCredit(agentId, playerId, parseFloat(amount));

  successResponse(res, 'Credit deducted successfully', result);
});

export const getPlayers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;

  const players = await agentService.getAgentPlayers(agentId);

  successResponse(res, 'Players retrieved successfully', players);
});

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;

  const stats = await agentService.getAgentStats(agentId);

  successResponse(res, 'Stats retrieved successfully', stats);
});

export const getHierarchy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;

  const hierarchy = await agentService.getAgentHierarchy(agentId);

  successResponse(res, 'Hierarchy retrieved successfully', hierarchy);
});
```

#### 4.3 Agent Routes
**File:** `backend/src/routes/agent.routes.ts`
```typescript
import { Router } from 'express';
import * as agentController from '../controllers/agent.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createAgentSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required(),
  password: Joi.string().min(6).max(100).required(),
  displayName: Joi.string().min(2).max(100).required(),
  agentType: Joi.string().valid('SUPER_MASTER', 'MASTER', 'AGENT').required(),
  parentAgentId: Joi.string().uuid().optional(),
  commissionRate: Joi.number().min(0).max(10).required(),
  creditLimit: Joi.number().min(0).required(),
});

const createPlayerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  password: Joi.string().min(6).max(100).required(),
  displayName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  creditLimit: Joi.number().min(0).default(10000),
});

const transferCreditSchema = Joi.object({
  playerId: Joi.string().uuid().required(),
  amount: Joi.number().min(1).required(),
});

// Routes
router.post('/create-agent', validate(createAgentSchema), agentController.createAgent);
router.post('/create-player', validate(createPlayerSchema), agentController.createPlayer);
router.post('/transfer-credit', validate(transferCreditSchema), agentController.transferCredit);
router.post('/deduct-credit', validate(transferCreditSchema), agentController.deductCredit);
router.get('/players', agentController.getPlayers);
router.get('/stats', agentController.getStats);
router.get('/hierarchy', agentController.getHierarchy);

export default router;
```

#### 4.4 Update Server
**Update:** `backend/src/server.ts`
```typescript
import agentRoutes from './routes/agent.routes';

// Add route
app.use('/api/v1/agents', agentRoutes);
```

### ✅ Phase 4 Completion Checklist:
- [ ] Agent service with create/manage functions
- [ ] Player creation by agents
- [ ] Credit transfer system (agent to player)
- [ ] Credit deduction (player to agent)
- [ ] Agent stats and analytics
- [ ] Agent hierarchy retrieval
- [ ] Agent controller created
- [ ] Agent routes created
- [ ] Validation schemas for agent operations
- [ ] Can create agents via API
- [ ] Can create players via API
- [ ] Can transfer credits

---

## 🎨 PHASE 5: FRONTEND FOUNDATION

**Duration:** 3-4 days  
**Goal:** Set up Next.js frontend with basic structure and authentication

### Tasks:

#### 5.1 Tailwind Configuration
**File:** `frontend/tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

#### 5.2 Global Styles
**File:** `frontend/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

#### 5.3 API Client Setup
**File:** `frontend/lib/api.ts`
```typescript
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const api = new ApiClient();
```

#### 5.4 Auth Store (Zustand)
**File:** `frontend/store/authStore.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  displayName?: string;
  role: string;
  type: 'user' | 'agent';
  balance?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateBalance: (balance: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (token, user) => {
        localStorage.setItem('authToken', token);
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('authToken');
        set({ token: null, user: null, isAuthenticated: false });
      },

      updateBalance: (balance) =>
        set((state) => ({
          user: state.user ? { ...state.user, balance } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

#### 5.5 Auth Service
**File:** `frontend/services/auth.service.ts`
```typescript
import { api } from '@/lib/api';

interface LoginCredentials {
  username: string;
  password: string;
  userType: 'player' | 'agent';
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      username: string;
      displayName?: string;
      role: string;
      type: 'user' | 'agent';
      balance?: number;
    };
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return await api.post('/auth/login', credentials);
  }

  async logout() {
    // Call API logout endpoint if needed
    localStorage.removeItem('authToken');
  }

  async getCurrentUser() {
    return await api.get('/auth/me');
  }
}

export const authService = new AuthService();
```

#### 5.6 Login Page
**File:** `frontend/app/login/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    userType: 'player' as 'player' | 'agent',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(credentials);
      login(response.data.token, response.data.user);

      // Redirect based on user type
      if (credentials.userType === 'agent') {
        router.push('/agent/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Cricket Betting Platform</CardTitle>
          <CardDescription className="text-center">Login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={credentials.userType}
            onValueChange={(value) => setCredentials({ ...credentials, userType: value as 'player' | 'agent' })}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="player">Player</TabsTrigger>
              <TabsTrigger value="agent">Agent</TabsTrigger>
            </TabsList>

            <TabsContent value="player">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login as Player'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="agent">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Agent Username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login as Agent'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

### ✅ Phase 5 Completion Checklist:
- [ ] Tailwind configuration set up
- [ ] Global styles created
- [ ] API client configured with interceptors
- [ ] Auth store created with Zustand
- [ ] Auth service created
- [ ] Login page designed and functional
- [ ] Can login as player
- [ ] Can login as agent
- [ ] Token stored in localStorage
- [ ] Redirects work correctly

---

**DUE TO LENGTH CONSTRAINTS, I'll provide the remaining phases (6-12) as separate sections. This gives you the first complete working backend API and basic frontend login. Would you like me to continue with:**

1. **Phase 6-7:** Complete Player & Agent UI
2. **Phase 8-9:** Real-time features & Admin Panel
3. **Phase 10-12:** Testing, Security, Deployment

**Or would you prefer I create a condensed summary of the remaining phases?**

The roadmap is now structured so Claude Code can:
- Follow it sequentially
- Build each phase independently
- Have all code examples ready to implement
- Validate completion at each step

Let me know how you'd like to proceed!
