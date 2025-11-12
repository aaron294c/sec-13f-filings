import clsx from 'clsx';

/**
 * Utility function for conditional className joining
 * Combines clsx with Tailwind support
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Format numbers as currency
 */
export function formatCurrency(value, options = {}) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  });
  return formatter.format(value);
}

/**
 * Format large numbers with abbreviations (K, M, B, T)
 */
export function formatNumber(num, decimals = 1) {
  if (num === null || num === undefined) return 'N/A';

  const absNum = Math.abs(num);

  if (absNum >= 1e12) return (num / 1e12).toFixed(decimals) + 'T';
  if (absNum >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
  if (absNum >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
  if (absNum >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';

  return num.toLocaleString('en-US');
}

/**
 * Format dates
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });

  return formatter.format(date);
}

/**
 * Format quarter strings (e.g., "2024Q1" -> "Q1 2024")
 */
export function formatQuarter(quarter) {
  if (!quarter) return 'N/A';
  const match = quarter.match(/(\d{4})Q(\d)/);
  if (!match) return quarter;
  return `Q${match[2]} ${match[1]}`;
}

/**
 * Debounce function for search inputs
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get change percentage
 */
export function getChangePercentage(oldValue, newValue) {
  if (!oldValue || oldValue === 0) return null;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}
