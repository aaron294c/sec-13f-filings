import { cn } from '../lib/utils';

export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className={cn('min-w-full divide-y divide-gray-200 dark:divide-gray-700', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return (
    <thead className="bg-gray-50 dark:bg-gray-900">
      {children}
    </thead>
  );
}

export function TableBody({ children }) {
  return (
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {children}
    </tbody>
  );
}

export function TableRow({ children, hover = true, onClick, className }) {
  return (
    <tr
      className={cn(
        'transition-colors duration-150',
        hover && 'hover:bg-gray-50 dark:hover:bg-gray-750',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }) {
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100', className)}>
      {children}
    </td>
  );
}
