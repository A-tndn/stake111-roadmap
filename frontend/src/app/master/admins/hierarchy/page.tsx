'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { masterService } from '@/services/master.service';
import HierarchyTree from '@/components/master/HierarchyTree';
import { GitBranch } from 'lucide-react';

export default function HierarchyPage() {
  const router = useRouter();
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHierarchy(); }, []);

  const loadHierarchy = async () => {
    try {
      const res: any = await masterService.getAdminHierarchy();
      const data = res?.data?.hierarchy || res?.data || [];
      setHierarchy(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load hierarchy', err); }
    finally { setLoading(false); }
  };

  const handleNodeClick = (node: any) => {
    if (node.role === 'PLAYER') return;
    router.push(`/master/admins/${node.id}`);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <GitBranch className="w-5 h-5 text-brand-gold" /> Agent Hierarchy
      </h2>

      <div className="bg-card rounded-xl shadow-sm border p-4">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading hierarchy...</div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
              {[
                { label: 'Super Master', color: 'bg-yellow-100 text-yellow-800' },
                { label: 'Master', color: 'bg-blue-100 text-blue-800' },
                { label: 'Agent', color: 'bg-green-100 text-green-800' },
                { label: 'Player', color: 'bg-muted text-foreground' },
              ].map(({ label, color }) => (
                <span key={label} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>
                  {label}
                </span>
              ))}
            </div>
            <HierarchyTree data={hierarchy} onNodeClick={handleNodeClick} />
          </>
        )}
      </div>
    </div>
  );
}
