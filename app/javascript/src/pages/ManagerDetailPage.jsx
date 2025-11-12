import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/Table';
import { Button } from '../components/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';
import { formatCurrency, formatDate, formatNumber } from '../lib/utils';

export function ManagerDetailPage() {
  const { cik } = useParams();
  const [filings, setFilings] = useState([]);
  const [manager, setManager] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadManagerData() {
      try {
        console.log('[ManagerDetailPage] Loading data for CIK:', cik);
        setIsLoading(true);
        setError(null);

        const data = await api.getManagerFilings(cik, currentPage, 50);
        console.log('[ManagerDetailPage] Received data:', data);

        setManager(data.manager);
        setFilings(data.filings);
        setPagination(data.pagination);
      } catch (err) {
        console.error('[ManagerDetailPage] Error loading manager:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (cik) {
      loadManagerData();
    }
  }, [cik, currentPage]);

  if (isLoading && !manager) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Container className="py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Loading manager details...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Container className="py-12">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Container className="py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/managers">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Managers
            </Button>
          </Link>
        </div>

        {/* Manager Header */}
        {manager && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-3xl">{manager.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">CIK</p>
                  <p className="text-lg font-medium font-mono text-gray-900 dark:text-white">{manager.cik}</p>
                </div>
                {manager.location && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Location</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{manager.location}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filings Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>13F Filings ({pagination?.total_count || 0})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {filings.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Filed</TableHead>
                        <TableHead>Form</TableHead>
                        <TableHead className="text-right">Holdings</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filings.map((filing) => (
                        <TableRow key={filing.external_id} hover>
                          <TableCell>
                            <Link
                              to={filing.path}
                              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                            >
                              Q{filing.report_quarter} {filing.report_year}
                            </Link>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {filing.date_filed ? formatDate(filing.date_filed) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {filing.form_type}
                              </span>
                              {filing.amendment_type && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                                  {filing.amendment_type}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-gray-600 dark:text-gray-400">
                            {filing.holdings_count ? formatNumber(filing.holdings_count) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {filing.holdings_value ? formatCurrency(filing.holdings_value) : '-'}
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
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
                        disabled={currentPage === pagination.total_pages || isLoading}
                      >
                        Next
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Page {pagination.current_page} of {pagination.total_pages}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No filings found for this manager</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
