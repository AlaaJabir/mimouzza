import React from 'react';
import { OrderStatus } from '../../../convex/schema';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'default',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-900 text-white',
    secondary: 'bg-slate-100 text-slate-800',
    outline: 'border border-slate-300 text-slate-700 bg-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const config: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
    NEW: { label: 'جديد / New', variant: 'warning' },
    CONFIRMED: { label: 'مؤكد / Confirmed', variant: 'info' },
    PROCESSING: { label: 'قيد التجهيز / Processing', variant: 'secondary' },
    SHIPPED: { label: 'تم الشحن / Shipped', variant: 'info' },
    DELIVERED: { label: 'تم التسليم / Delivered', variant: 'success' },
    CANCELLED: { label: 'ملغي / Cancelled', variant: 'danger' },
  };

  const current = config[status] || { label: status, variant: 'secondary' };

  return (
    <Badge variant={current.variant} className={className}>
      {current.label}
    </Badge>
  );
};
