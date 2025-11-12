import { forwardRef } from 'react';
import { cn } from '../lib/utils';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'block w-full rounded-lg border transition-all duration-200',
            'px-4 py-2.5 text-base',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            'dark:bg-gray-800 dark:text-white dark:border-gray-700',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600',
            Icon && 'pl-10',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'input-error' : helperText ? 'input-helper' : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id="input-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id="input-helper" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
