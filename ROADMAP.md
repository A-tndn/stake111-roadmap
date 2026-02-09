# Cricket Betting Platform - Development Roadmap for Claude Code

**Project Name:** Cricket Betting Platform (Agent-Based)  
**Development Duration:** 12-14 weeks (MVP: 6-8 weeks)  
**Last Updated:** February 2026

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Phases](#development-phases)
4. [Phase 0: Environment Setup](#phase-0-environment-setup)
5. [Phase 1: Database Foundation](#phase-1-database-foundation)
6. [Phase 2: Backend API - Core](#phase-2-backend-api---core)
7. [Phase 3: Backend API - Betting Engine](#phase-3-backend-api---betting-engine)
8. [Phase 4: Backend API - Agent Management](#phase-4-backend-api---agent-management)
9. [Phase 5: Frontend Foundation](#phase-5-frontend-foundation)
10. [Phase 6: Frontend - User Interface](#phase-6-frontend---user-interface)
11. [Phase 7: Frontend - Agent Dashboards](#phase-7-frontend---agent-dashboards)
12. [Phase 8: Real-time Features](#phase-8-real-time-features)
13. [Phase 9: Admin Panel](#phase-9-admin-panel)
14. [Phase 10: Integration & Testing](#phase-10-integration--testing)
15. [Phase 11: Security & Optimization](#phase-11-security--optimization)
16. [Phase 12: Deployment Preparation](#phase-12-deployment-preparation)
17. [File Structure Reference](#file-structure-reference)
18. [Dependencies Reference](#dependencies-reference)
19. [Completion Checklist](#completion-checklist)

---

## 🎯 PROJECT OVERVIEW

### Core Requirements:
- **Agent-based hierarchy system** (Admin → Super Master → Master → Agent → Player)
- **No direct user signup** (agents create player accounts)
- **No direct deposits** (agents manually manage credits)
- **Cricket betting** with multiple bet types
- **Real-time scores** and bet settlement
- **Commission system** flowing upward through hierarchy
- **Multi-currency support** (₹ Indian Rupee primary)

### System Constraints:
- Must handle 1000+ concurrent users during peak matches
- Support for 50+ live matches simultaneously
- 99.9% uptime requirement
- Data retention: 2 years minimum
- Geographic restriction capability (India-focused initially)

---

## 🛠 TECHNOLOGY STACK

### Backend:
```
- Runtime: Node.js 20+ LTS
- Framework: Express.js 4.18+
- Language: TypeScript 5+
- Database: PostgreSQL 15+
- Cache: Redis 7+
- ORM: Prisma 5+ or TypeORM 0.3+
- Validation: Joi or Zod
- Authentication: JWT (jsonwebtoken)
- WebSocket: Socket.io 4+
- API Documentation: Swagger/OpenAPI
```

### Frontend:
```
- Framework: Next.js 14+ (App Router)
- Language: TypeScript 5+
- UI Library: shadcn/ui + Tailwind CSS
- State Management: Zustand or Redux Toolkit
- HTTP Client: Axios or Fetch API
- Real-time: Socket.io-client
- Forms: React Hook Form + Zod
- Tables: TanStack Table
- Charts: Recharts or Chart.js
```

### DevOps & Tools:
```
- Package Manager: pnpm (preferred) or npm
- Version Control: Git
- Container: Docker + Docker Compose
- Environment: .env files with dotenv
- Logging: Winston or Pino
- Process Manager: PM2 (production)
- Testing: Jest + Supertest (backend), Vitest (frontend)
```

### External Services:
```
- Cricket API: CricAPI or Cricbuzz API or SportsRadar
- SMS: Twilio (optional)
- Email: SendGrid (optional)
- Monitoring: (to be added later)
```

---

## 📅 DEVELOPMENT PHASES

### Timeline Overview:
```
Phase 0: Environment Setup          → 2-3 days
Phase 1: Database Foundation        → 4-5 days
Phase 2: Backend API - Core         → 7-10 days
Phase 3: Backend API - Betting      → 7-10 days
Phase 4: Backend API - Agent Mgmt   → 5-7 days
Phase 5: Frontend Foundation        → 3-4 days
Phase 6: Frontend - User Interface  → 10-12 days
Phase 7: Frontend - Agent Dashboards → 7-10 days
Phase 8: Real-time Features         → 5-7 days
Phase 9: Admin Panel                → 7-10 days
Phase 10: Integration & Testing     → 7-10 days
Phase 11: Security & Optimization   → 5-7 days
Phase 12: Deployment Preparation    → 3-5 days

TOTAL: 72-95 days (10-14 weeks)
MVP can be achieved by end of Phase 8 (6-8 weeks)
```

---

## 🚀 PHASE 0: ENVIRONMENT SETUP

**Duration:** 2-3 days  
**Goal:** Set up development environment and project structure

### Tasks:

#### 0.1 Project Initialization
```bash
# Create project root
mkdir cricket-betting-platform
cd cricket-betting-platform

# Initialize monorepo structure
mkdir backend frontend shared
```

#### 0.2 Backend Setup
**File:** `backend/package.json`
```json
{
  "name": "cricket-betting-backend",
  "version": "1.0.0",
  "description": "Cricket Betting Platform Backend API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.3.3",
    "@types/express": "^4.17.21",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "prisma": "^5.7.1",
    "@prisma/client": "^5.7.1",
    "redis": "^4.6.11",
    "socket.io": "^4.6.0",
    "axios": "^1.6.2",
    "date-fns": "^2.30.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2",
    "@types/node": "^20.10.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2"
  }
}
```

#### 0.3 Backend TypeScript Configuration
**File:** `backend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### 0.4 Backend Environment Template
**File:** `backend/.env.example`
```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cricket_betting?schema=public"

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Cricket API
CRICKET_API_KEY=your-cricket-api-key
CRICKET_API_URL=https://api.cricapi.com/v1

# Admin
ADMIN_EMAIL=admin@cricketbetting.com
ADMIN_PASSWORD=change-this-password

# Security
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15

# Limits
MAX_BET_AMOUNT=100000
MIN_BET_AMOUNT=10
DEFAULT_CREDIT_LIMIT=10000

# Commission Rates (in percentage)
AGENT_COMMISSION=1.0
MASTER_AGENT_COMMISSION=0.5
SUPER_MASTER_COMMISSION=0.3
PLATFORM_COMMISSION=0.2
```

#### 0.5 Frontend Setup
**File:** `frontend/package.json`
```json
{
  "name": "cricket-betting-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.3",
    "socket.io-client": "^4.6.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0",
    "recharts": "^2.10.3"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.0.4"
  }
}
```

#### 0.6 Frontend Environment Template
**File:** `frontend/.env.local.example`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Cricket Betting Platform
NEXT_PUBLIC_CURRENCY_SYMBOL=₹
```

#### 0.7 Docker Setup
**File:** `docker-compose.yml` (root level)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: cricket-betting-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: cricket_user
      POSTGRES_PASSWORD: cricket_pass_123
      POSTGRES_DB: cricket_betting
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - cricket-network

  redis:
    image: redis:7-alpine
    container_name: cricket-betting-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - cricket-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: cricket-betting-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://cricket_user:cricket_pass_123@postgres:5432/cricket_betting
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - cricket-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: cricket-betting-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000/api
      NEXT_PUBLIC_WS_URL: http://localhost:5000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    networks:
      - cricket-network

volumes:
  postgres_data:
  redis_data:

networks:
  cricket-network:
    driver: bridge
```

#### 0.8 Backend Dockerfile
**File:** `backend/Dockerfile`
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

#### 0.9 Frontend Dockerfile
**File:** `frontend/Dockerfile`
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

#### 0.10 Git Configuration
**File:** `.gitignore` (root level)
```
# Dependencies
node_modules/
.pnp/
.pnp.js

# Testing
coverage/
*.log

# Next.js
.next/
out/
build/
dist/

# Environment
.env
.env*.local
.env.production

# IDEs
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite
postgres_data/
redis_data/

# Prisma
migrations/
```

#### 0.11 README
**File:** `README.md` (root level)
```markdown
# Cricket Betting Platform

Agent-based cricket betting platform with hierarchical management system.

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Set up environment variables:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```

4. Start services:
   ```bash
   docker-compose up -d postgres redis
   ```

5. Run database migrations:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

6. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

7. Access:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

## Architecture

- **Backend:** Node.js + Express + TypeScript + Prisma
- **Frontend:** Next.js 14 + TypeScript + Tailwind
- **Database:** PostgreSQL
- **Cache:** Redis
- **Real-time:** Socket.io

## Project Structure

See `ROADMAP.md` for detailed development phases.
```

### ✅ Phase 0 Completion Checklist:
- [ ] Project folders created (backend, frontend, shared)
- [ ] Backend package.json created with all dependencies
- [ ] Backend tsconfig.json configured
- [ ] Backend .env.example created
- [ ] Frontend package.json created with Next.js 14
- [ ] Frontend .env.local.example created
- [ ] Docker Compose file created
- [ ] Dockerfiles created for backend and frontend
- [ ] .gitignore configured
- [ ] README.md created
- [ ] All dependencies installed (`npm install` in both folders)
- [ ] Docker containers running (postgres, redis)

**Validation:**
```bash
# Backend
cd backend && npm install && npm run build

# Frontend
cd frontend && npm install && npm run build

# Docker
docker-compose up -d
docker ps  # Should show 4 containers running
```

---

## 🗄 PHASE 1: DATABASE FOUNDATION

**Duration:** 4-5 days  
**Goal:** Complete database schema, migrations, and seed data

### Tasks:

#### 1.1 Prisma Setup
**File:** `backend/prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  SUPER_ADMIN
  ADMIN
  SUPER_MASTER_AGENT
  MASTER_AGENT
  AGENT
  PLAYER
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BLOCKED
  PENDING
}

enum AgentType {
  SUPER_MASTER
  MASTER
  AGENT
}

enum MatchStatus {
  UPCOMING
  LIVE
  COMPLETED
  CANCELLED
  POSTPONED
}

enum MatchType {
  TEST
  ODI
  T20
  T10
  HUNDRED
  DOMESTIC
}

enum BetType {
  MATCH_WINNER
  TOP_BATSMAN
  TOP_BOWLER
  TOTAL_RUNS
  TOTAL_WICKETS
  PLAYER_PERFORMANCE
  SESSION
  FANCY
  OVER_UNDER
  PARLAY
}

enum BetStatus {
  PENDING
  WON
  LOST
  CANCELLED
  VOID
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  BET_PLACED
  BET_WON
  BET_LOST
  BET_REFUND
  COMMISSION_EARNED
  CREDIT_TRANSFER
  DEBIT_TRANSFER
  ADJUSTMENT
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}

// ============================================
// MODELS
// ============================================

model User {
  id                String          @id @default(uuid())
  username          String          @unique
  email             String?         @unique
  phone             String?         @unique
  password          String
  displayName       String?
  role              UserRole        @default(PLAYER)
  status            UserStatus      @default(ACTIVE)
  
  // Financial
  balance           Decimal         @default(0) @db.Decimal(12, 2)
  creditLimit       Decimal         @default(0) @db.Decimal(12, 2)
  totalDeposited    Decimal         @default(0) @db.Decimal(12, 2)
  totalWithdrawn    Decimal         @default(0) @db.Decimal(12, 2)
  
  // Relationships
  agentId           String?
  agent             Agent?          @relation("AgentPlayers", fields: [agentId], references: [id])
  
  // Betting
  bets              Bet[]
  transactions      Transaction[]
  
  // Tracking
  lastLoginAt       DateTime?
  lastLoginIp       String?
  loginAttempts     Int             @default(0)
  lockedUntil       DateTime?
  
  // Metadata
  metadata          Json?           // For storing additional user preferences
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  createdBy         String?
  
  @@index([username])
  @@index([agentId])
  @@index([status])
  @@index([createdAt])
  @@map("users")
}

model Agent {
  id                String          @id @default(uuid())
  username          String          @unique
  email             String?         @unique
  phone             String          @unique
  password          String
  displayName       String
  agentType         AgentType
  status            UserStatus      @default(PENDING)
  
  // Hierarchy
  parentAgentId     String?
  parentAgent       Agent?          @relation("AgentHierarchy", fields: [parentAgentId], references: [id])
  subAgents         Agent[]         @relation("AgentHierarchy")
  
  // Financial
  balance           Decimal         @default(0) @db.Decimal(12, 2)
  creditLimit       Decimal         @default(0) @db.Decimal(12, 2)
  riskDeposit       Decimal         @default(0) @db.Decimal(12, 2)
  
  // Commission
  commissionRate    Decimal         @default(0) @db.Decimal(5, 2) // Percentage
  totalCommission   Decimal         @default(0) @db.Decimal(12, 2)
  
  // Players
  players           User[]          @relation("AgentPlayers")
  
  // Transactions
  transactions      Transaction[]
  commissionsEarned Commission[]    @relation("AgentCommissions")
  
  // KYC
  kycDocuments      Json?           // Store document URLs and verification status
  kycVerified       Boolean         @default(false)
  kycVerifiedAt     DateTime?
  
  // Limits
  maxPlayersAllowed Int             @default(100)
  maxExposure       Decimal         @default(100000) @db.Decimal(12, 2)
  
  // Tracking
  lastLoginAt       DateTime?
  lastLoginIp       String?
  
  // Metadata
  metadata          Json?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  createdBy         String?
  
  @@index([agentType])
  @@index([parentAgentId])
  @@index([status])
  @@index([createdAt])
  @@map("agents")
}

model Match {
  id                String          @id @default(uuid())
  cricketApiId      String?         @unique
  
  // Match Details
  name              String
  shortName         String?
  matchType         MatchType
  venue             String?
  city              String?
  country           String?
  
  // Teams
  team1             String
  team2             String
  team1Logo         String?
  team2Logo         String?
  
  // Tournament
  tournament        String
  tournamentId      String?
  series            String?
  
  // Timing
  startTime         DateTime
  endTime           DateTime?
  
  // Status
  status            MatchStatus     @default(UPCOMING)
  
  // Results
  tossWinner        String?
  tossDecision      String?         // bat/field
  matchWinner       String?
  winType           String?         // runs/wickets/tie/no-result
  winMargin         String?
  
  // Scores
  team1Score        String?         // Format: "285/7 (50 overs)"
  team2Score        String?
  
  // Additional Data
  manOfTheMatch     String?
  umpires           Json?
  
  // Betting
  bets              Bet[]
  totalBetsAmount   Decimal         @default(0) @db.Decimal(12, 2)
  totalBetsCount    Int             @default(0)
  
  // Sync
  lastSyncedAt      DateTime?
  syncErrors        Json?
  
  // Metadata
  metadata          Json?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  @@index([status])
  @@index([startTime])
  @@index([tournament])
  @@index([cricketApiId])
  @@map("matches")
}

model Bet {
  id                String          @id @default(uuid())
  
  // User & Match
  userId            String
  user              User            @relation(fields: [userId], references: [id])
  matchId           String
  match             Match           @relation(fields: [matchId], references: [id])
  
  // Bet Details
  betType           BetType
  betOn             String          // Team name, player name, or value depending on bet type
  description       String?         // Human readable bet description
  
  // Financial
  amount            Decimal         @db.Decimal(12, 2)
  odds              Decimal         @db.Decimal(8, 2)
  potentialWin      Decimal         @db.Decimal(12, 2)
  actualWin         Decimal?        @db.Decimal(12, 2)
  
  // Status
  status            BetStatus       @default(PENDING)
  
  // Settlement
  settledAt         DateTime?
  settledBy         String?         // user_id or 'AUTO'
  settlementNote    String?
  
  // Metadata
  ipAddress         String?
  userAgent         String?
  metadata          Json?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  // Commissions
  commissions       Commission[]
  
  @@index([userId])
  @@index([matchId])
  @@index([status])
  @@index([createdAt])
  @@map("bets")
}

model Transaction {
  id                String              @id @default(uuid())
  
  // Reference
  userId            String?
  user              User?               @relation(fields: [userId], references: [id])
  agentId           String?
  agent             Agent?              @relation(fields: [agentId], references: [id])
  
  // Transaction Details
  type              TransactionType
  status            TransactionStatus   @default(PENDING)
  amount            Decimal             @db.Decimal(12, 2)
  
  // Balance Tracking
  balanceBefore     Decimal             @db.Decimal(12, 2)
  balanceAfter      Decimal             @db.Decimal(12, 2)
  
  // Reference
  referenceId       String?             // bet_id, transfer_id, etc.
  referenceType     String?             // 'bet', 'transfer', 'commission'
  
  // Processing
  processedBy       String?             // agent_id or 'SYSTEM'
  processedAt       DateTime?
  
  // Description
  description       String?
  notes             String?
  
  // Metadata
  metadata          Json?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@index([userId])
  @@index([agentId])
  @@index([type])
  @@index([status])
  @@index([createdAt])
  @@map("transactions")
}

model Commission {
  id                String          @id @default(uuid())
  
  // References
  betId             String
  bet               Bet             @relation(fields: [betId], references: [id])
  agentId           String
  agent             Agent           @relation("AgentCommissions", fields: [agentId], references: [id])
  
  // Commission Details
  commissionAmount  Decimal         @db.Decimal(12, 2)
  commissionRate    Decimal         @db.Decimal(5, 2) // Percentage at time of calculation
  basedOnAmount     Decimal         @db.Decimal(12, 2) // Amount commission is calculated on
  
  // Agent Level
  agentLevel        AgentType       // Which level of agent earned this
  
  // Status
  paid              Boolean         @default(false)
  paidAt            DateTime?
  
  // Metadata
  calculatedAt      DateTime        @default(now())
  metadata          Json?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  @@index([betId])
  @@index([agentId])
  @@index([paid])
  @@index([createdAt])
  @@map("commissions")
}

model Configuration {
  id                String          @id @default(uuid())
  key               String          @unique
  value             String
  dataType          String          @default("string") // string, number, boolean, json
  category          String          @default("general") // general, betting, commission, limits
  description       String?
  isEditable        Boolean         @default(true)
  updatedBy         String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  @@index([key])
  @@index([category])
  @@map("configurations")
}

model AuditLog {
  id                String          @id @default(uuid())
  
  // Who
  userId            String?
  userType          String?         // 'user', 'agent', 'admin'
  username          String?
  
  // What
  action            String          // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  resource          String          // 'User', 'Bet', 'Transaction', etc.
  resourceId        String?
  
  // Details
  changes           Json?           // Before/After values
  ipAddress         String?
  userAgent         String?
  
  // When
  createdAt         DateTime        @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
  @@map("audit_logs")
}

model Session {
  id                String          @id @default(uuid())
  userId            String?
  agentId           String?
  token             String          @unique
  refreshToken      String?         @unique
  ipAddress         String?
  userAgent         String?
  expiresAt         DateTime
  createdAt         DateTime        @default(now())
  lastActivityAt    DateTime        @default(now())
  
  @@index([token])
  @@index([userId])
  @@index([agentId])
  @@index([expiresAt])
  @@map("sessions")
}

model Notification {
  id                String          @id @default(uuid())
  userId            String?
  agentId           String?
  
  // Content
  title             String
  message           String
  type              String          // 'info', 'success', 'warning', 'error'
  category          String?         // 'bet', 'transaction', 'system'
  
  // Status
  read              Boolean         @default(false)
  readAt            DateTime?
  
  // Action
  actionUrl         String?
  actionLabel       String?
  
  // Metadata
  metadata          Json?
  createdAt         DateTime        @default(now())
  
  @@index([userId])
  @@index([agentId])
  @@index([read])
  @@index([createdAt])
  @@map("notifications")
}
```

#### 1.2 Initial Migration
```bash
# Generate Prisma Client
npx prisma generate

# Create first migration
npx prisma migrate dev --name init
```

#### 1.3 Seed Data Script
**File:** `backend/prisma/seed.ts`
```typescript
import { PrismaClient, UserRole, UserStatus, AgentType, MatchStatus, MatchType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional - use with caution)
  // await prisma.notification.deleteMany();
  // await prisma.session.deleteMany();
  // await prisma.auditLog.deleteMany();
  // await prisma.commission.deleteMany();
  // await prisma.transaction.deleteMany();
  // await prisma.bet.deleteMany();
  // await prisma.match.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.agent.deleteMany();
  // await prisma.configuration.deleteMany();

  // 1. Create Configurations
  console.log('📝 Creating configurations...');
  const configs = [
    { key: 'PLATFORM_NAME', value: 'Cricket Betting Platform', category: 'general', description: 'Platform display name' },
    { key: 'PLATFORM_COMMISSION', value: '0.2', category: 'commission', description: 'Platform commission percentage' },
    { key: 'AGENT_COMMISSION', value: '1.0', category: 'commission', description: 'Agent commission percentage' },
    { key: 'MASTER_AGENT_COMMISSION', value: '0.5', category: 'commission', description: 'Master Agent commission percentage' },
    { key: 'SUPER_MASTER_COMMISSION', value: '0.3', category: 'commission', description: 'Super Master commission percentage' },
    { key: 'MIN_BET_AMOUNT', value: '10', category: 'limits', description: 'Minimum bet amount' },
    { key: 'MAX_BET_AMOUNT', value: '100000', category: 'limits', description: 'Maximum bet amount' },
    { key: 'DEFAULT_CREDIT_LIMIT', value: '10000', category: 'limits', description: 'Default credit limit for new players' },
    { key: 'MAINTENANCE_MODE', value: 'false', category: 'general', description: 'Maintenance mode status' },
    { key: 'ALLOW_NEW_REGISTRATIONS', value: 'true', category: 'general', description: 'Allow new user registrations' },
  ];

  for (const config of configs) {
    await prisma.configuration.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }

  // 2. Create Super Admin
  console.log('👤 Creating super admin...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'admin@cricketbetting.com',
      password: hashedPassword,
      displayName: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      balance: 0,
      creditLimit: 0,
    },
  });

  // 3. Create Sample Super Master Agent
  console.log('🏢 Creating super master agent...');
  const superMaster = await prisma.agent.create({
    data: {
      username: 'supermaster1',
      email: 'supermaster@example.com',
      phone: '+919999999991',
      password: await bcrypt.hash('SuperMaster@123', 10),
      displayName: 'Super Master Agent 1',
      agentType: AgentType.SUPER_MASTER,
      status: UserStatus.ACTIVE,
      balance: 1000000,
      creditLimit: 5000000,
      riskDeposit: 500000,
      commissionRate: 0.3,
      kycVerified: true,
      kycVerifiedAt: new Date(),
    },
  });

  // 4. Create Sample Master Agent
  console.log('🏪 Creating master agent...');
  const masterAgent = await prisma.agent.create({
    data: {
      username: 'master1',
      email: 'master@example.com',
      phone: '+919999999992',
      password: await bcrypt.hash('Master@123', 10),
      displayName: 'Master Agent 1',
      agentType: AgentType.MASTER,
      status: UserStatus.ACTIVE,
      parentAgentId: superMaster.id,
      balance: 500000,
      creditLimit: 2000000,
      commissionRate: 0.5,
      kycVerified: true,
      kycVerifiedAt: new Date(),
    },
  });

  // 5. Create Sample Regular Agent
  console.log('👨‍💼 Creating regular agent...');
  const regularAgent = await prisma.agent.create({
    data: {
      username: 'agent1',
      email: 'agent@example.com',
      phone: '+919999999993',
      password: await bcrypt.hash('Agent@123', 10),
      displayName: 'Agent 1',
      agentType: AgentType.AGENT,
      status: UserStatus.ACTIVE,
      parentAgentId: masterAgent.id,
      balance: 100000,
      creditLimit: 500000,
      commissionRate: 1.0,
      kycVerified: true,
      kycVerifiedAt: new Date(),
    },
  });

  // 6. Create Sample Players
  console.log('🎮 Creating sample players...');
  const players = [];
  for (let i = 1; i <= 5; i++) {
    const player = await prisma.user.create({
      data: {
        username: `player${i}`,
        email: `player${i}@example.com`,
        phone: `+91999999999${i}`,
        password: await bcrypt.hash('Player@123', 10),
        displayName: `Player ${i}`,
        role: UserRole.PLAYER,
        status: UserStatus.ACTIVE,
        agentId: regularAgent.id,
        balance: 5000 + (i * 1000),
        creditLimit: 10000,
      },
    });
    players.push(player);
  }

  // 7. Create Sample Matches
  console.log('🏏 Creating sample matches...');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const matches = [
    {
      name: 'India vs Australia - 1st T20I',
      shortName: 'IND vs AUS',
      matchType: MatchType.T20,
      venue: 'Wankhede Stadium',
      city: 'Mumbai',
      country: 'India',
      team1: 'India',
      team2: 'Australia',
      tournament: 'India vs Australia T20I Series 2026',
      startTime: tomorrow,
      status: MatchStatus.UPCOMING,
    },
    {
      name: 'Pakistan vs England - 2nd ODI',
      shortName: 'PAK vs ENG',
      matchType: MatchType.ODI,
      venue: 'National Stadium',
      city: 'Karachi',
      country: 'Pakistan',
      team1: 'Pakistan',
      team2: 'England',
      tournament: 'Pakistan vs England ODI Series 2026',
      startTime: nextWeek,
      status: MatchStatus.UPCOMING,
    },
  ];

  for (const matchData of matches) {
    await prisma.match.create({ data: matchData });
  }

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('- Super Admin: superadmin / Admin@123');
  console.log('- Super Master Agent: supermaster1 / SuperMaster@123');
  console.log('- Master Agent: master1 / Master@123');
  console.log('- Regular Agent: agent1 / Agent@123');
  console.log('- Players: player1-5 / Player@123');
  console.log('- Matches: 2 upcoming matches created');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### 1.4 Add Seed Script to Package.json
**Update:** `backend/package.json`
```json
{
  "scripts": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

#### 1.5 Database Utilities
**File:** `backend/src/db/index.ts`
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
```

**File:** `backend/src/db/redis.ts`
```typescript
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
};

export default redisClient;
```

### ✅ Phase 1 Completion Checklist:
- [ ] Prisma schema created with all models (15+ models)
- [ ] All enums defined (UserRole, BetType, etc.)
- [ ] Database relationships properly set up
- [ ] Indexes added for performance
- [ ] Initial migration created and run
- [ ] Seed script created with sample data
- [ ] Seed script executed successfully
- [ ] Database connection utility created
- [ ] Redis connection utility created
- [ ] Can access database via Prisma Studio (`npm run prisma:studio`)

**Validation:**
```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run migration
npm run prisma:migrate

# Run seed
npm run seed

# Open Prisma Studio to verify data
npm run prisma:studio
```

---

## 🔧 PHASE 2: BACKEND API - CORE

**Duration:** 7-10 days  
**Goal:** Build core backend infrastructure, authentication, and basic API

### Tasks:

#### 2.1 Project Structure Setup
```
backend/src/
├── config/           # Configuration files
├── db/              # Database connections
├── middleware/      # Express middleware
├── routes/          # API routes
├── controllers/     # Route controllers
├── services/        # Business logic
├── utils/           # Utility functions
├── validators/      # Request validation schemas
├── types/           # TypeScript types/interfaces
├── constants/       # Constants and enums
└── server.ts        # Entry point
```

#### 2.2 Configuration Files
**File:** `backend/src/config/index.ts`
```typescript
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisPassword: process.env.REDIS_PASSWORD,

  // JWT
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '15'), // minutes

  // Cricket API
  cricketApiKey: process.env.CRICKET_API_KEY || '',
  cricketApiUrl: process.env.CRICKET_API_URL || 'https://api.cricapi.com/v1',

  // Limits
  maxBetAmount: parseFloat(process.env.MAX_BET_AMOUNT || '100000'),
  minBetAmount: parseFloat(process.env.MIN_BET_AMOUNT || '10'),
  defaultCreditLimit: parseFloat(process.env.DEFAULT_CREDIT_LIMIT || '10000'),

  // Commission Rates (%)
  agentCommission: parseFloat(process.env.AGENT_COMMISSION || '1.0'),
  masterAgentCommission: parseFloat(process.env.MASTER_AGENT_COMMISSION || '0.5'),
  superMasterCommission: parseFloat(process.env.SUPER_MASTER_COMMISSION || '0.3'),
  platformCommission: parseFloat(process.env.PLATFORM_COMMISSION || '0.2'),

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

// Validation
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

**File:** `backend/src/config/logger.ts`
```typescript
import winston from 'winston';
import { config } from './index';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'cricket-betting-api' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs to combined.log
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production, log to the console as well
if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}

export default logger;
```

#### 2.3 Utility Functions
**File:** `backend/src/utils/response.ts`
```typescript
import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
}

export const successResponse = <T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: any[]
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: message,
    errors,
  };
  return res.status(statusCode).json(response);
};
```

**File:** `backend/src/utils/asyncHandler.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**File:** `backend/src/utils/jwt.ts`
```typescript
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  id: string;
  username: string;
  role: string;
  type?: 'user' | 'agent';
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiresIn,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.refreshTokenSecret) as TokenPayload;
};
```

**File:** `backend/src/utils/password.ts`
```typescript
import bcrypt from 'bcryptjs';
import { config } from '../config';

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, config.bcryptRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
```

#### 2.4 Middleware
**File:** `backend/src/middleware/errorHandler.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { errorResponse } from '../utils/response';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode);
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return errorResponse(res, 'Database error occurred', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401);
  }

  // Default error
  return errorResponse(res, 'Internal server error', 500);
};
```

**File:** `backend/src/middleware/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './errorHandler';
import { errorResponse } from '../utils/response';
import prisma from '../db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    type: 'user' | 'agent';
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return errorResponse(res, 'No token provided', 401);
    }

    const decoded = verifyToken(token);

    // Verify user/agent still exists and is active
    if (decoded.type === 'agent') {
      const agent = await prisma.agent.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, agentType: true, status: true },
      });

      if (!agent || agent.status !== 'ACTIVE') {
        return errorResponse(res, 'Agent not found or inactive', 401);
      }

      req.user = {
        id: agent.id,
        username: agent.username,
        role: agent.agentType,
        type: 'agent',
      };
    } else {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, role: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        return errorResponse(res, 'User not found or inactive', 401);
      }

      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        type: 'user',
      };
    }

    next();
  } catch (error) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Forbidden: Insufficient permissions', 403);
    }

    next();
  };
};
```

**File:** `backend/src/middleware/validate.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { errorResponse } from '../utils/response';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return errorResponse(res, 'Validation error', 400, errors);
    }

    req.body = value;
    next();
  };
};
```

**File:** `backend/src/middleware/rateLimiter.ts`
```typescript
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### 2.5 Main Server File
**File:** `backend/src/server.ts`
```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import logger from './config/logger';
import { connectRedis } from './db/redis';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Routes (will be created in later phases)
// import authRoutes from './routes/auth.routes';
// import userRoutes from './routes/user.routes';
// import agentRoutes from './routes/agent.routes';
// import matchRoutes from './routes/match.routes';
// import betRoutes from './routes/bet.routes';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/v1/auth', /* authRoutes */ (req, res) => res.json({ message: 'Auth routes coming soon' }));
app.use('/api/v1/users', /* userRoutes */ (req, res) => res.json({ message: 'User routes coming soon' }));
app.use('/api/v1/agents', /* agentRoutes */ (req, res) => res.json({ message: 'Agent routes coming soon' }));
app.use('/api/v1/matches', /* matchRoutes */ (req, res) => res.json({ message: 'Match routes coming soon' }));
app.use('/api/v1/bets', /* betRoutes */ (req, res) => res.json({ message: 'Bet routes coming soon' }));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📍 Environment: ${config.nodeEnv}`);
      logger.info(`🌐 API Base URL: ${config.apiBaseUrl}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
```

#### 2.6 Validation Schemas
**File:** `backend/src/validators/auth.validator.ts`
```typescript
import Joi from 'joi';

export const loginSchema = Joi.object({
  username: Joi.string().required().min(3).max(50),
  password: Joi.string().required().min(6),
  userType: Joi.string().valid('player', 'agent').default('player'),
});

export const registerPlayerSchema = Joi.object({
  username: Joi.string().required().min(3).max(50).alphanum(),
  password: Joi.string().required().min(6).max(100),
  displayName: Joi.string().required().min(2).max(100),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  creditLimit: Joi.number().min(0).default(10000),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().required().min(6).max(100),
});
```

### ✅ Phase 2 Completion Checklist:
- [ ] Project structure created (config, middleware, utils, etc.)
- [ ] Configuration management set up with env validation
- [ ] Logger configured (Winston)
- [ ] Database utilities created (Prisma + Redis)
- [ ] Response utilities created (success/error)
- [ ] Error handling middleware implemented
- [ ] Authentication middleware implemented
- [ ] Validation middleware implemented
- [ ] Rate limiting middleware implemented
- [ ] JWT utilities created
- [ ] Password hashing utilities created
- [ ] Main server file created
- [ ] Health check endpoint working
- [ ] Server starts without errors

**Validation:**
```bash
cd backend

# Build
npm run build

# Start server
npm run dev

# Test health endpoint
curl http://localhost:5000/health
```

---

## 🎲 PHASE 3: BACKEND API - BETTING ENGINE

**Duration:** 7-10 days  
**Goal:** Implement betting functionality, match management, and cricket API integration

### Tasks:

#### 3.1 Cricket API Service
**File:** `backend/src/services/cricketApi.service.ts`
```typescript
import axios from 'axios';
import { config } from '../config';
import logger from '../config/logger';
import redisClient from '../db/redis';

interface CricketMatch {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  teamInfo: any[];
  score: any[];
  series_id: string;
  fantasyEnabled: boolean;
  bbbEnabled: boolean;
  hasSquad: boolean;
  matchStarted: boolean;
  matchEnded: boolean;
}

interface MatchScore {
  matchId: string;
  score: any;
  status: string;
  result: string;
}

class CricketApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.cricketApiUrl;
    this.apiKey = config.cricketApiKey;
  }

  private async makeRequest(endpoint: string, params: any = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        params: {
          apikey: this.apiKey,
          ...params,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Cricket API request failed:', error.message);
      throw new Error('Failed to fetch data from Cricket API');
    }
  }

  async getCurrentMatches(): Promise<CricketMatch[]> {
    const cacheKey = 'cricket:current_matches';

    // Check cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await this.makeRequest('currentMatches');

    // Cache for 2 minutes
    await redisClient.setEx(cacheKey, 120, JSON.stringify(data.data));

    return data.data;
  }

  async getMatchInfo(matchId: string): Promise<any> {
    const cacheKey = `cricket:match:${matchId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await this.makeRequest('match_info', { id: matchId });

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(data.data));

    return data.data;
  }

  async getMatchScore(matchId: string): Promise<MatchScore> {
    const cacheKey = `cricket:score:${matchId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await this.makeRequest('match_scorecard', { id: matchId });

    // Cache for 30 seconds (live scores update frequently)
    await redisClient.setEx(cacheKey, 30, JSON.stringify(data.data));

    return data.data;
  }

  async getUpcomingMatches(): Promise<CricketMatch[]> {
    const data = await this.makeRequest('matches');
    return data.data.filter((match: any) => !match.matchStarted);
  }

  async getLiveMatches(): Promise<CricketMatch[]> {
    const data = await this.makeRequest('matches');
    return data.data.filter((match: any) => match.matchStarted && !match.matchEnded);
  }
}

export default new CricketApiService();
```

#### 3.2 Match Service
**File:** `backend/src/services/match.service.ts`
```typescript
import prisma from '../db';
import { MatchStatus, MatchType } from '@prisma/client';
import cricketApiService from './cricketApi.service';
import logger from '../config/logger';

class MatchService {
  async syncMatches() {
    try {
      const currentMatches = await cricketApiService.getCurrentMatches();

      for (const apiMatch of currentMatches) {
        const existingMatch = await prisma.match.findFirst({
          where: { cricketApiId: apiMatch.id },
        });

        const matchData = {
          cricketApiId: apiMatch.id,
          name: apiMatch.name,
          shortName: `${apiMatch.teams[0]} vs ${apiMatch.teams[1]}`,
          matchType: this.mapMatchType(apiMatch.matchType),
          venue: apiMatch.venue || 'TBA',
          team1: apiMatch.teams[0],
          team2: apiMatch.teams[1],
          tournament: apiMatch.series_id || 'Unknown',
          startTime: new Date(apiMatch.dateTimeGMT),
          status: this.mapMatchStatus(apiMatch),
          lastSyncedAt: new Date(),
        };

        if (existingMatch) {
          await prisma.match.update({
            where: { id: existingMatch.id },
            data: matchData,
          });
        } else {
          await prisma.match.create({
            data: matchData,
          });
        }
      }

      logger.info(`Synced ${currentMatches.length} matches`);
      return { synced: currentMatches.length };
    } catch (error: any) {
      logger.error('Match sync failed:', error.message);
      throw error;
    }
  }

  async updateMatchScores() {
    try {
      // Get all live and upcoming matches
      const matches = await prisma.match.findMany({
        where: {
          status: {
            in: [MatchStatus.LIVE, MatchStatus.UPCOMING],
          },
        },
      });

      let updated = 0;

      for (const match of matches) {
        if (!match.cricketApiId) continue;

        try {
          const scoreData = await cricketApiService.getMatchScore(match.cricketApiId);

          const updateData: any = {
            lastSyncedAt: new Date(),
          };

          if (scoreData.score) {
            updateData.team1Score = scoreData.score[0]?.inning || null;
            updateData.team2Score = scoreData.score[1]?.inning || null;
          }

          if (scoreData.status === 'completed') {
            updateData.status = MatchStatus.COMPLETED;
            updateData.endTime = new Date();

            // Parse result
            if (scoreData.result) {
              updateData.matchWinner = this.extractWinner(scoreData.result);
            }
          } else if (scoreData.status === 'started') {
            updateData.status = MatchStatus.LIVE;
          }

          await prisma.match.update({
            where: { id: match.id },
            data: updateData,
          });

          updated++;
        } catch (error: any) {
          logger.error(`Failed to update match ${match.id}:`, error.message);
        }
      }

      logger.info(`Updated scores for ${updated} matches`);
      return { updated };
    } catch (error: any) {
      logger.error('Score update failed:', error.message);
      throw error;
    }
  }

  async getMatches(filters: {
    status?: MatchStatus;
    matchType?: MatchType;
    tournament?: string;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.matchType) where.matchType = filters.matchType;
    if (filters.tournament) where.tournament = { contains: filters.tournament };

    return await prisma.match.findMany({
      where,
      orderBy: { startTime: 'asc' },
      take: filters.limit || 50,
    });
  }

  async getMatchById(id: string) {
    return await prisma.match.findUnique({
      where: { id },
      include: {
        bets: {
          select: {
            id: true,
            betType: true,
            amount: true,
            status: true,
          },
        },
      },
    });
  }

  private mapMatchType(type: string): MatchType {
    const typeMap: Record<string, MatchType> = {
      test: MatchType.TEST,
      odi: MatchType.ODI,
      t20: MatchType.T20,
      t10: MatchType.T10,
      hundred: MatchType.HUNDRED,
    };

    return typeMap[type.toLowerCase()] || MatchType.T20;
  }

  private mapMatchStatus(match: any): MatchStatus {
    if (match.matchEnded) return MatchStatus.COMPLETED;
    if (match.matchStarted) return MatchStatus.LIVE;
    return MatchStatus.UPCOMING;
  }

  private extractWinner(result: string): string | null {
    // Parse result string like "India won by 7 wickets"
    const match = result.match(/^(\w+)\s+won/i);
    return match ? match[1] : null;
  }
}

export default new MatchService();
```

#### 3.3 Bet Service
**File:** `backend/src/services/bet.service.ts`
```typescript
import prisma from '../db';
import { BetType, BetStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { config } from '../config';
import { Decimal } from '@prisma/client/runtime/library';

interface PlaceBetData {
  userId: string;
  matchId: string;
  betType: BetType;
  betOn: string;
  amount: number;
  odds: number;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

class BetService {
  async placeBet(data: PlaceBetData) {
    const { userId, matchId, betType, betOn, amount, odds, description, ipAddress, userAgent } = data;

    // Validate bet amount
    if (amount < config.minBetAmount) {
      throw new AppError(`Minimum bet amount is ₹${config.minBetAmount}`, 400);
    }

    if (amount > config.maxBetAmount) {
      throw new AppError(`Maximum bet amount is ₹${config.maxBetAmount}`, 400);
    }

    // Use transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // 1. Get user
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true, creditLimit: true, status: true, agentId: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new AppError('User not found or inactive', 404);
      }

      // 2. Check balance
      if (user.balance.toNumber() < amount) {
        throw new AppError('Insufficient balance', 400);
      }

      // 3. Get match
      const match = await tx.match.findUnique({
        where: { id: matchId },
        select: { status: true, startTime: true },
      });

      if (!match) {
        throw new AppError('Match not found', 404);
      }

      if (match.status === 'COMPLETED' || match.status === 'CANCELLED') {
        throw new AppError('Match has ended', 400);
      }

      // For pre-match bets, check if match hasn't started
      if (match.status === 'UPCOMING' && new Date() >= match.startTime) {
        throw new AppError('Match has already started', 400);
      }

      // 4. Calculate potential win
      const potentialWin = amount * odds;

      // 5. Deduct balance
      const newBalance = user.balance.toNumber() - amount;

      await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      });

      // 6. Create bet
      const bet = await tx.bet.create({
        data: {
          userId,
          matchId,
          betType,
          betOn,
          amount,
          odds,
          potentialWin,
          description,
          ipAddress,
          userAgent,
          status: BetStatus.PENDING,
        },
      });

      // 7. Create transaction
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.BET_PLACED,
          status: TransactionStatus.COMPLETED,
          amount,
          balanceBefore: user.balance,
          balanceAfter: newBalance,
          referenceId: bet.id,
          referenceType: 'bet',
          processedBy: 'SYSTEM',
          processedAt: new Date(),
          description: `Bet placed on ${match.status}`,
        },
      });

      // 8. Update match stats
      await tx.match.update({
        where: { id: matchId },
        data: {
          totalBetsAmount: { increment: amount },
          totalBetsCount: { increment: 1 },
        },
      });

      logger.info(`Bet placed: ${bet.id} by user ${userId} for ₹${amount}`);

      return bet;
    });
  }

  async settleBet(betId: string, won: boolean) {
    return await prisma.$transaction(async (tx) => {
      const bet = await tx.bet.findUnique({
        where: { id: betId },
        include: { user: { select: { balance: true, agentId: true } } },
      });

      if (!bet) {
        throw new AppError('Bet not found', 404);
      }

      if (bet.status !== BetStatus.PENDING) {
        throw new AppError('Bet already settled', 400);
      }

      const status = won ? BetStatus.WON : BetStatus.LOST;
      let actualWin = 0;

      // Update bet
      await tx.bet.update({
        where: { id: betId },
        data: {
          status,
          actualWin: won ? bet.potentialWin : 0,
          settledAt: new Date(),
          settledBy: 'AUTO',
        },
      });

      if (won) {
        // Credit user with winnings
        actualWin = bet.potentialWin.toNumber();
        const newBalance = bet.user.balance.toNumber() + actualWin;

        await tx.user.update({
          where: { id: bet.userId },
          data: { balance: newBalance },
        });

        // Create transaction
        await tx.transaction.create({
          data: {
            userId: bet.userId,
            type: TransactionType.BET_WON,
            status: TransactionStatus.COMPLETED,
            amount: actualWin,
            balanceBefore: bet.user.balance,
            balanceAfter: newBalance,
            referenceId: betId,
            referenceType: 'bet',
            processedBy: 'SYSTEM',
            processedAt: new Date(),
            description: 'Bet won',
          },
        });

        // Calculate commissions
        if (bet.user.agentId) {
          await this.calculateCommissions(tx, bet, actualWin);
        }
      }

      logger.info(`Bet settled: ${betId} - ${won ? 'WON' : 'LOST'}`);

      return { betId, status, actualWin };
    });
  }

  private async calculateCommissions(tx: any, bet: any, winAmount: number) {
    // Get agent hierarchy
    const agent = await tx.agent.findUnique({
      where: { id: bet.user.agentId },
      include: {
        parentAgent: {
          include: {
            parentAgent: true,
          },
        },
      },
    });

    if (!agent) return;

    const commissions = [];

    // Agent commission (1%)
    const agentComm = winAmount * (agent.commissionRate.toNumber() / 100);
    commissions.push({
      betId: bet.id,
      agentId: agent.id,
      commissionAmount: agentComm,
      commissionRate: agent.commissionRate,
      basedOnAmount: winAmount,
      agentLevel: agent.agentType,
    });

    // Master agent commission (0.5%)
    if (agent.parentAgent) {
      const masterComm = winAmount * (agent.parentAgent.commissionRate.toNumber() / 100);
      commissions.push({
        betId: bet.id,
        agentId: agent.parentAgent.id,
        commissionAmount: masterComm,
        commissionRate: agent.parentAgent.commissionRate,
        basedOnAmount: winAmount,
        agentLevel: agent.parentAgent.agentType,
      });

      // Super master commission (0.3%)
      if (agent.parentAgent.parentAgent) {
        const superComm = winAmount * (agent.parentAgent.parentAgent.commissionRate.toNumber() / 100);
        commissions.push({
          betId: bet.id,
          agentId: agent.parentAgent.parentAgent.id,
          commissionAmount: superComm,
          commissionRate: agent.parentAgent.parentAgent.commissionRate,
          basedOnAmount: winAmount,
          agentLevel: agent.parentAgent.parentAgent.agentType,
        });
      }
    }

    // Create commission records
    for (const comm of commissions) {
      await tx.commission.create({ data: comm });

      // Update agent's total commission
      await tx.agent.update({
        where: { id: comm.agentId },
        data: {
          totalCommission: { increment: comm.commissionAmount },
        },
      });
    }

    logger.info(`Commissions calculated for bet ${bet.id}: ${commissions.length} agents`);
  }

  async getUserBets(userId: string, filters: { status?: BetStatus; limit?: number }) {
    return await prisma.bet.findMany({
      where: {
        userId,
        ...(filters.status && { status: filters.status }),
      },
      include: {
        match: {
          select: {
            name: true,
            team1: true,
            team2: true,
            startTime: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
    });
  }

  async getBetById(betId: string) {
    return await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        match: true,
        commissions: {
          include: {
            agent: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  async settleMatchBets(matchId: string, result: { winner: string; [key: string]: any }) {
    const bets = await prisma.bet.findMany({
      where: {
        matchId,
        status: BetStatus.PENDING,
      },
    });

    let settled = 0;

    for (const bet of bets) {
      try {
        const won = this.determineBetOutcome(bet, result);
        await this.settleBet(bet.id, won);
        settled++;
      } catch (error: any) {
        logger.error(`Failed to settle bet ${bet.id}:`, error.message);
      }
    }

    logger.info(`Settled ${settled} bets for match ${matchId}`);
    return { settled };
  }

  private determineBetOutcome(bet: any, result: any): boolean {
    switch (bet.betType) {
      case BetType.MATCH_WINNER:
        return bet.betOn === result.winner;
      // Add more bet types as needed
      default:
        return false;
    }
  }
}

export default new BetService();
```

#### 3.4 Match Controller
**File:** `backend/src/controllers/match.controller.ts`
```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import matchService from '../services/match.service';

export const getMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, matchType, tournament, limit } = req.query;

  const matches = await matchService.getMatches({
    status: status as any,
    matchType: matchType as any,
    tournament: tournament as string,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  successResponse(res, 'Matches retrieved successfully', matches);
});

export const getMatchById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const match = await matchService.getMatchById(id);

  if (!match) {
    return errorResponse(res, 'Match not found', 404);
  }

  successResponse(res, 'Match retrieved successfully', match);
});

export const syncMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await matchService.syncMatches();
  successResponse(res, 'Matches synced successfully', result);
});

export const updateScores = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await matchService.updateMatchScores();
  successResponse(res, 'Scores updated successfully', result);
});
```

#### 3.5 Bet Controller
**File:** `backend/src/controllers/bet.controller.ts`
```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import betService from '../services/bet.service';

export const placeBet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { matchId, betType, betOn, amount, odds, description } = req.body;

  const bet = await betService.placeBet({
    userId,
    matchId,
    betType,
    betOn,
    amount: parseFloat(amount),
    odds: parseFloat(odds),
    description,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  successResponse(res, 'Bet placed successfully', bet, 201);
});

export const getUserBets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { status, limit } = req.query;

  const bets = await betService.getUserBets(userId, {
    status: status as any,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  successResponse(res, 'Bets retrieved successfully', bets);
});

export const getBetById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const bet = await betService.getBetById(id);

  if (!bet) {
    return errorResponse(res, 'Bet not found', 404);
  }

  successResponse(res, 'Bet retrieved successfully', bet);
});
```

#### 3.6 Bet Routes
**File:** `backend/src/routes/bet.routes.ts`
```typescript
import { Router } from 'express';
import * as betController from '../controllers/bet.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

// All bet routes require authentication
router.use(authenticate);

// Validation schemas
const placeBetSchema = Joi.object({
  matchId: Joi.string().uuid().required(),
  betType: Joi.string()
    .valid(
      'MATCH_WINNER',
      'TOP_BATSMAN',
      'TOP_BOWLER',
      'TOTAL_RUNS',
      'TOTAL_WICKETS',
      'PLAYER_PERFORMANCE',
      'SESSION',
      'FANCY',
      'OVER_UNDER',
      'PARLAY'
    )
    .required(),
  betOn: Joi.string().required(),
  amount: Joi.number().min(10).max(100000).required(),
  odds: Joi.number().min(1).required(),
  description: Joi.string().optional(),
});

// Routes
router.post('/', validate(placeBetSchema), betController.placeBet);
router.get('/', betController.getUserBets);
router.get('/:id', betController.getBetById);

export default router;
```

#### 3.7 Match Routes
**File:** `backend/src/routes/match.routes.ts`
```typescript
import { Router } from 'express';
import * as matchController from '../controllers/match.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatchById);

// Admin-only routes
router.post('/sync', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), matchController.syncMatches);
router.post('/update-scores', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), matchController.updateScores);

export default router;
```

#### 3.8 Update Server with New Routes
**Update:** `backend/src/server.ts`
```typescript
// Add these imports
import matchRoutes from './routes/match.routes';
import betRoutes from './routes/bet.routes';

// Replace placeholder routes with:
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/bets', betRoutes);
```

#### 3.9 Cron Job for Auto-sync
**File:** `backend/src/jobs/matchSync.job.ts`
```typescript
import cron from 'node-cron';
import matchService from '../services/match.service';
import logger from '../config/logger';

export const startMatchSyncJob = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Running match sync job...');
    try {
      await matchService.syncMatches();
      await matchService.updateMatchScores();
    } catch (error: any) {
      logger.error('Match sync job failed:', error.message);
    }
  });

  logger.info('Match sync job scheduled (every 5 minutes)');
};
```

**Update:** `backend/src/server.ts` to include job
```typescript
import { startMatchSyncJob } from './jobs/matchSync.job';

// In startServer function, after Redis connection:
startMatchSyncJob();
```

### ✅ Phase 3 Completion Checklist:
- [ ] Cricket API service created with caching
- [ ] Match service with sync and score update functions
- [ ] Bet service with place and settle logic
- [ ] Commission calculation implemented
- [ ] Match controller created
- [ ] Bet controller created
- [ ] Match routes created
- [ ] Bet routes created
- [ ] Validation schemas for bets
- [ ] Cron job for auto-sync matches
- [ ] Can place bets via API
- [ ] Can retrieve match list
- [ ] Can sync matches from Cricket API

**Validation:**
```bash
# Test match endpoints
curl http://localhost:5000/api/v1/matches

# Test bet placement (requires auth token)
curl -X POST http://localhost:5000/api/v1/bets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "MATCH_ID",
    "betType": "MATCH_WINNER",
    "betOn": "India",
    "amount": 100,
    "odds": 1.8
  }'
```

---

**[CONTINUING IN NEXT PART DUE TO LENGTH...]**

This roadmap continues through Phase 12. Would you like me to continue with the remaining phases (4-12)?

