import { cn } from '@/components/ui/utils';

type VipBadgeProps = {
  className?: string;
  size?: 'sm' | 'xs';
};

const sizeStyles: Record<NonNullable<VipBadgeProps['size']>, string> = {
  sm: 'px-2.5 py-0.5 text-[10px]',
  xs: 'px-2 py-0.5 text-[9px]',
};

export function VipBadge({ className, size = 'sm' }: VipBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 clip-tactical border border-[#D4A536] bg-[#D4A536]/10 text-[#D4A536] font-mono-technical uppercase tracking-[0.2em]',
        sizeStyles[size],
        className,
      )}
    >
      VIP
    </span>
  );
}
