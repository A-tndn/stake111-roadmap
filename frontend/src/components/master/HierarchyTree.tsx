'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Users, User, Crown, Shield } from 'lucide-react';

interface TreeNode {
  id: string;
  username: string;
  displayName: string;
  agentType?: string;
  role?: string;
  status?: string;
  balance?: number;
  playersCount?: number;
  subAgents?: TreeNode[];
  players?: TreeNode[];
}

interface HierarchyTreeProps {
  data: TreeNode[];
  onNodeClick?: (node: TreeNode) => void;
}

const roleColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  SUPER_MASTER: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Crown },
  MASTER: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Shield },
  AGENT: { bg: 'bg-green-100', text: 'text-green-800', icon: Users },
  PLAYER: { bg: 'bg-muted', text: 'text-foreground', icon: User },
};

function TreeNodeItem({ node, depth = 0, onNodeClick }: { node: TreeNode; depth?: number; onNodeClick?: (node: TreeNode) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const type = node.agentType || node.role || 'PLAYER';
  const colors = roleColors[type] || roleColors.PLAYER;
  const Icon = colors.icon;
  const hasChildren = (node.subAgents && node.subAgents.length > 0) || (node.players && node.players.length > 0);

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition hover:bg-muted',
          depth > 0 && 'ml-6'
        )}
        onClick={() => onNodeClick?.(node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-0.5 hover:bg-muted/70 rounded"
          >
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', colors.bg)}>
          <Icon className={cn('w-4 h-4', colors.text)} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{node.displayName || node.username}</p>
          <p className="text-[10px] text-muted-foreground">@{node.username}</p>
        </div>

        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase', colors.bg, colors.text)}>
          {type.replace('_', ' ')}
        </span>

        {node.status && (
          <span className={cn(
            'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
            node.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {node.status}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="border-l-2 border-border ml-5">
          {node.subAgents?.map((child) => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} onNodeClick={onNodeClick} />
          ))}
          {node.players?.map((player) => (
            <TreeNodeItem key={player.id} node={{ ...player, role: 'PLAYER' }} depth={depth + 1} onNodeClick={onNodeClick} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HierarchyTree({ data, onNodeClick }: HierarchyTreeProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No hierarchy data available
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {data.map((node) => (
        <TreeNodeItem key={node.id} node={node} onNodeClick={onNodeClick} />
      ))}
    </div>
  );
}
