import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/Table';
import { Button } from '../components/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';

export function ManagersPage() {
  const [managers, setManagers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadManagers() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getManagers(currentPage, 50, searchQuery);
        setManagers(data.managers);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error loading managers:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadManagers();
  }, [currentPage, searchQuery]);

  if (isLoading && managers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Container className="py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Loading managers...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Container className="py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Institutional Managers</CardTitle>
                {pagination && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total_count)} of {pagination.total_count.toLocaleString()} managers
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Box */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search managers by name (e.g., Berkshire, BlackRock, Ackman)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">Error: {error}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manager Name</TableHead>
                    <TableHead>CIK</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((manager) => (
                    <TableRow key={manager.cik} hover>
                      <TableCell>
                        <Link
                          to={manager.path}
                          className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                        >
                          {manager.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {manager.cik}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {manager.location || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
                    disabled={currentPage === pagination.total_pages || isLoading}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.current_page} of {pagination.total_pages}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
