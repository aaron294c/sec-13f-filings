import { cn } from '../lib/utils';

export function Card({
  children,
  className,
  hover = false,
  padding = true,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        'shadow-sm transition-all duration-200',
        'animate-fade-in',
        hover && 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer',
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('border-b border-gray-200 dark:border-gray-700 pb-4 mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-xl font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }) {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-gray-400 mt-1', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn('border-t border-gray-200 dark:border-gray-700 pt-4 mt-4', className)}>
      {children}
    </div>
  );
}
