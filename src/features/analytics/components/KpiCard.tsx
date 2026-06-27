import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
}

export const KpiCardSkeleton = ({ index = 0 }: { index?: number }) => (
  <Card
    className="bg-card border-border hover:border-primary/30 transition-colors"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </CardContent>
  </Card>
);

export const KpiCard = ({ title, value, change, changeType = 'neutral', icon: Icon }: KpiCardProps) => {
  const changeColorClass =
    changeType === 'positive'
      ? 'text-status-completed'
      : changeType === 'negative'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${changeColorClass}`}>
                {changeType === 'positive' && <ArrowUpRight className="w-4 h-4" />}
                {changeType === 'negative' && <ArrowDownRight className="w-4 h-4" />}
                {change}
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
