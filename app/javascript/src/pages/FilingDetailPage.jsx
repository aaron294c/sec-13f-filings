import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/Table';
import { Button } from '../components/Button';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';
import { formatCurrency, formatNumber, formatPercentage } from '../lib/utils';

export function FilingDetailPage() {
  const { externalId } = useParams();
  const [filing, setFiling] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('aggregated'); // 'aggregated' or 'detailed'

  useEffect(() => {
    async function loadFiling() {
      try {
        setIsLoading(true);
        setError(null);

        const data = viewMode === 'detailed'
          ? await api.getFilingDetailed(externalId)
          : await api.getFiling(externalId);

        setFiling(data.filing || {});
        setHoldings(data.data || []);
      } catch (err) {
        console.error('Error loading filing:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (externalId) {
      loadFiling();
    }
  }, [externalId, viewMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Container className="py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Loading filing details...</p>
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
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </Link>
        </div>

        {/* Filing Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl">13F Filing Details</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'aggregated' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('aggregated')}
                >
                  Aggregated
                </Button>
                <Button
                  variant={viewMode === 'detailed' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('detailed')}
                >
                  Detailed
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Manager</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {filing.manager_name || 'Loading...'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Period</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {filing.period || 'Loading...'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Value</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {filing.total_value ? formatCurrency(filing.total_value) : 'Loading...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Holdings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Holdings ({holdings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Security</TableHead>
                      <TableHead>CUSIP</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">% of Portfolio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.map((holding, index) => (
                      <TableRow key={index} hover>
                        <TableCell className="font-medium">
                          {holding.issuer_name || 'N/A'}
                          {holding.class_title && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              {holding.class_title}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {holding.cusip || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {holding.shares ? formatNumber(holding.shares) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {holding.value ? formatCurrency(holding.value) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {holding.pct ? `${holding.pct}%` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No holdings found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
