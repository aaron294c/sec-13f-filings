import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { debounce } from '../lib/utils';
import api from '../lib/api';

export function SearchBar({ placeholder = 'Search managers or CUSIPs...', autoFocus = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ managers: [], cusips: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Debounced search
  const searchDebounced = useRef(
    debounce(async (searchQuery) => {
      if (searchQuery.length < 2) {
        setResults({ managers: [], cusips: [] });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await api.autocomplete(searchQuery);
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 250)
  ).current;

  useEffect(() => {
    searchDebounced(query);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allResults = [
    ...results.managers.map(m => ({ type: 'manager', ...m })),
    ...results.cusips.map(c => ({ type: 'cusip', ...c })),
  ];

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = allResults[selectedIndex];
      handleSelect(selected);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelect = (item) => {
    if (item.type === 'manager') {
      navigate(item.path);
    } else if (item.type === 'cusip') {
      navigate(item.path);
    }
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative w-full max-w-2xl" ref={dropdownRef}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-4 py-3 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      {isOpen && allResults.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-slide-down">
          {results.managers.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                Managers
              </div>
              {results.managers.map((manager, index) => {
                const globalIndex = index;
                return (
                  <button
                    key={manager.cik}
                    onClick={() => handleSelect({ type: 'manager', ...manager })}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150 ${
                      selectedIndex === globalIndex ? 'bg-gray-100 dark:bg-gray-750' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{manager.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">CIK: {manager.cik}</div>
                  </button>
                );
              })}
            </div>
          )}
          {results.cusips.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                Securities (CUSIP)
              </div>
              {results.cusips.map((cusip, index) => {
                const globalIndex = results.managers.length + index;
                return (
                  <button
                    key={cusip.cusip}
                    onClick={() => handleSelect({ type: 'cusip', ...cusip })}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150 ${
                      selectedIndex === globalIndex ? 'bg-gray-100 dark:bg-gray-750' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{cusip.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{cusip.cusip}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
