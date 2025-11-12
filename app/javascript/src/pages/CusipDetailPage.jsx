import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Container } from '../components/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/Table';
import { Button } from '../components/Button';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';
import { formatCurrency, formatNumber, formatQuarter } from '../lib/utils';

export function CusipDetailPage() {
  const { cusip } = useParams();
  const [searchParams] = useSearchParams();
  const year = searchParams.get('year') || new Date().getFullYear();
  const quarter = searchParams.get('quarter') || Math.floor((new Date().getMonth() / 3)) || 1;

  const [holders, setHolders] = useState([]);
  const [cusipInfo, setCusipInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCusipData() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await api.getCusipHolders(cusip, year, quarter);

        setCusipInfo(data.cusip_info || { cusip });
        setHolders(data.data || []);
      } catch (err) {
        console.error('Error loading CUSIP data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (cusip) {
      loadCusipData();
    }
  }, [cusip, year, quarter]);

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
              <p className="text-gray-600 dark:text-gray-400">Loading CUSIP holders...</p>
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

  const totalShares = holders.reduce((sum, h) => sum + (parseFloat(h.shares) || 0), 0);
  const totalValue = holders.reduce((sum, h) => sum + (parseFloat(h.value) || 0), 0);

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

        {/* CUSIP Header */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">CUSIP Holders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">CUSIP</p>
                <p className="text-lg font-medium font-mono text-gray-900 dark:text-white">{cusip}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Security</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {cusipInfo?.name || 'Loading...'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Period</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Q{quarter} {year}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Holders</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {holders.length}
                </p>
              </div>
            </div>

            {totalValue > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Shares Held</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {formatNumber(totalShares)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Value</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(totalValue)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Holders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Institutional Holders ({holders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {holders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manager</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holders.map((holder, index) => (
                      <TableRow key={index} hover>
                        <TableCell className="font-medium">
                          {holder.manager_name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {holder.shares ? formatNumber(holder.shares) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {holder.value ? formatCurrency(holder.value) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalShares > 0
                            ? `${((parseFloat(holder.shares) / totalShares) * 100).toFixed(2)}%`
                            : 'N/A'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No holders found for this period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
