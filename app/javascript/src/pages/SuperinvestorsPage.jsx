import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Container } from '../components/Container';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/Table';
import api from '../lib/api';
import { formatCurrency, formatNumber, formatPercentage } from '../lib/utils';

export function SuperinvestorsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState('q3'); // 'q2' or 'q3'
  const [isManagerListExpanded, setIsManagerListExpanded] = useState(false);

  useEffect(() => {
    loadSuperinvestorStats();
  }, []);

  async function loadSuperinvestorStats() {
    try {
      setLoading(true);
      const result = await api.getSuperinvestorStats();
      setData(result);
    } catch (err) {
      console.error('Error loading superinvestor stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500 dark:text-gray-400">Loading superinvestor data...</div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-8">
        <Card>
          <CardContent>
            <div className="text-red-600 dark:text-red-400">
              Error loading data: {error}
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!data) return null;

  const { periods, q2_data, q3_data } = data;
  const currentData = selectedQuarter === 'q3' ? q3_data : q2_data;
  const currentPeriod = selectedQuarter === 'q3' ? periods.current : periods.comparison;
  const superinvestors = currentData?.superinvestors || [];
  const stats = {
    top_owned: currentData?.stats?.top_owned || [],
    top_by_pct: currentData?.stats?.top_by_pct || [],
    big_bets: currentData?.stats?.big_bets || [],
    top_buys_1q: currentData?.stats?.top_buys_1q || [],
    top_buys_1q_pct: currentData?.stats?.top_buys_1q_pct || [],
    top_sells_1q: currentData?.stats?.top_sells_1q || [],
    top_sells_1q_pct: currentData?.stats?.top_sells_1q_pct || [],
    top_buys_2q: currentData?.stats?.top_buys_2q || [],
    top_buys_2q_pct: currentData?.stats?.top_buys_2q_pct || []
  };

  // Helper to render change indicator
  const renderChange = (stock, field) => {
    if (selectedQuarter !== 'q3') return null;
    if (stock.is_new) {
      return <span className="text-xs text-blue-500 dark:text-blue-400 ml-2">NEW</span>;
    }
    const change = stock[field];
    if (!change) return null;

    const isPositive = change > 0;
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const sign = isPositive ? '+' : '';

    return (
      <span className={`text-xs ${color} ml-2`}>
        ({sign}{change.toFixed(field.includes('pct') ? 2 : 0)})
      </span>
    );
  };

  return (
    <Container className="py-8">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Superinvestor Portfolio Stats
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Aggregated holdings data across top institutional investors
          </p>
        </div>

        {/* Quarter Selector */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <button
              onClick={() => setSelectedQuarter('q3')}
              className={`px-6 py-3 rounded-l-lg font-medium transition-colors ${
                selectedQuarter === 'q3'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Q{periods.current.quarter} {periods.current.year}
              <span className="ml-2 text-xs opacity-75">({periods.current.manager_count} managers)</span>
            </button>
            <button
              onClick={() => setSelectedQuarter('q2')}
              className={`px-6 py-3 rounded-r-lg font-medium transition-colors ${
                selectedQuarter === 'q2'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Q{periods.comparison.quarter} {periods.comparison.year}
              <span className="ml-2 text-xs opacity-75">({periods.comparison.manager_count} managers)</span>
            </button>
          </div>
          {selectedQuarter === 'q3' && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Showing Q3 vs Q2 comparison (changes shown in parentheses)
            </p>
          )}
        </div>

        {/* Superinvestors List - Collapsible */}
        <Card className="mb-8">
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setIsManagerListExpanded(!isManagerListExpanded)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Featured Superinvestors ({superinvestors.length})</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Click to {isManagerListExpanded ? 'collapse' : 'expand'} the full list
                </p>
              </div>
              {isManagerListExpanded ? (
                <ChevronUpIcon className="h-6 w-6 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </CardHeader>
          {isManagerListExpanded && (
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manager</TableHead>
                      <TableHead className="text-right">Portfolio Value</TableHead>
                      <TableHead className="text-right">No. of Stocks</TableHead>
                      <TableHead>Top 10 Holdings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {superinvestors.map((si) => (
                      <TableRow
                        key={si.cik}
                        hover
                        onClick={() => window.location.href = `/manager/${si.cik}`}
                        className="cursor-pointer"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {si.investor}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {si.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {si.portfolio_value ? formatCurrency(si.portfolio_value) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {si.num_stocks || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {si.top_holdings.slice(0, 10).map((ticker, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {ticker}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Most Owned */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Most Owned Stocks</CardTitle>
              {selectedQuarter === 'q2' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Change vs Q1 shown in parentheses
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_owned.map((stock, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {stock.ticker}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stock.issuer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {stock.ownership_count} managers
                        {renderChange(stock, 'ownership_change')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 10 By Percentage */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Stocks by %</CardTitle>
              {selectedQuarter === 'q2' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Weighted by portfolio allocation
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_by_pct.map((stock, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {stock.ticker}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stock.issuer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {parseFloat(stock.weighted_pct).toFixed(1)}%
                        {renderChange(stock, 'pct_change')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stock.ownership_count} managers
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Big Bets */}
          <Card>
            <CardHeader>
              <CardTitle>Top "Big Bets"</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Highest individual portfolio allocations
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.big_bets.map((stock, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {stock.ticker}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stock.issuer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {parseFloat(stock.max_pct).toFixed(2)}%
                        {renderChange(stock, 'max_pct_change')}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-400">
                        {stock.ownership_count} owner(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Buys Last Quarter */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Buys Last Qtr</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                By absolute value change
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_buys_1q.map((stock, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {stock.ticker}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stock.issuer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        +{formatCurrency(stock.value_change)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stock.ownership_count} buyer(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Buys Last Quarter by % */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Buys Last Qtr by %</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                By percentage change
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_buys_1q_pct.map((stock, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {stock.ticker}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stock.issuer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        +{parseFloat(stock.pct_change).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stock.ownership_count} buyer(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Buys Last 2 Quarters */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Buys Last 2 Qtrs</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                By absolute value change
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_buys_2q.map((stock, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {stock.ticker}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stock.issuer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        +{formatCurrency(stock.value_change)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stock.ownership_count} buyer(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Buys Last 2 Quarters by % */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Buys Last 2 Qtrs by %</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                By percentage change
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_buys_2q_pct.map((stock, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {stock.ticker}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stock.issuer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        +{parseFloat(stock.pct_change).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stock.ownership_count} buyer(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Sells Last Quarter */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Sells Last Quarter</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                By absolute value decrease
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_sells_1q.map((stock, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {stock.ticker}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stock.issuer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                        -{formatCurrency(stock.value_change)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stock.ownership_count} seller(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Sells Last Quarter by % */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Sells Last Quarter by %</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                By percentage decrease
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_sells_1q_pct.map((stock, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {stock.ticker}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stock.issuer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                        -{parseFloat(stock.pct_change).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stock.ownership_count} seller(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
