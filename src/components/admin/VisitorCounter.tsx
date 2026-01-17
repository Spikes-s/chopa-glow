import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
}

export const VisitorCounter = () => {
  const [stats, setStats] = useState<VisitorStats>({
    totalVisits: 0,
    uniqueVisitors: 0,
    todayVisits: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total visits
        const { count: totalVisits } = await supabase
          .from('page_visits')
          .select('*', { count: 'exact', head: true });

        // Get unique visitors (by visitor_id)
        const { data: uniqueData } = await supabase
          .from('page_visits')
          .select('visitor_id')
          .not('visitor_id', 'is', null);

        const uniqueVisitorIds = new Set(uniqueData?.map(v => v.visitor_id) || []);

        // Get today's visits
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: todayVisits } = await supabase
          .from('page_visits')
          .select('*', { count: 'exact', head: true })
          .gte('visited_at', today.toISOString());

        setStats({
          totalVisits: totalVisits || 0,
          uniqueVisitors: uniqueVisitorIds.size,
          todayVisits: todayVisits || 0,
        });
      } catch (error) {
        console.error('Failed to fetch visitor stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg animate-pulse">
        <div className="w-4 h-4 bg-muted rounded" />
        <div className="w-16 h-4 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg cursor-help">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {stats.totalVisits.toLocaleString()}
            </span>
            <Badge variant="secondary" className="text-xs">
              Total
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Total page views</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/10 border border-secondary/20 rounded-lg cursor-help">
            <Users className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-foreground">
              {stats.uniqueVisitors.toLocaleString()}
            </span>
            <Badge variant="outline" className="text-xs">
              Unique
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Unique visitors</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/20 rounded-lg cursor-help">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">
              {stats.todayVisits.toLocaleString()}
            </span>
            <Badge variant="outline" className="text-xs bg-accent/10">
              Today
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Visits today</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
