import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container } from '../components/Container';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/Table';
import api from '../lib/api';
import { formatCurrency, formatNumber, formatPercentage } from '../lib/utils';

export function ManagerPortfolioPage() {
  const { cik } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, new, increased, decreased, sold

  useEffect(() => {
    loadPortfolio();
  }, [cik]);

  async function loadPortfolio() {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getManagerPortfolio(cik);
      setData(result);
    } catch (err) {
      console.error('Error loading manager portfolio:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">Loading portfolio...</p>
          </div>
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
              Error loading portfolio: {error}
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!data) return null;

  const { manager, holdings, summary } = data;

  // Filter holdings based on activity
  const filteredHoldings = holdings.filter(h => {
    if (filter === 'all') return true;
    return h.activity === filter;
  });

  // Activity badge component
  const ActivityBadge = ({ activity }) => {
    const styles = {
      new: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      increased: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      decreased: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      sold: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      unchanged: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    const icons = {
      new: '🟢',
      increased: '🔵',
      decreased: '🟡',
      sold: '🔴',
      unchanged: '⚪'
    };

    const labels = {
      new: 'New',
      increased: 'Added',
      decreased: 'Reduced',
      sold: 'Sold',
      unchanged: 'Unchanged'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${styles[activity]}`}>
        <span className="mr-1">{icons[activity]}</span>
        {labels[activity]}
      </span>
    );
  };

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {manager.name}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">Portfolio Value:</span>{' '}
            <span className="text-gray-900 dark:text-white font-semibold">
              {formatCurrency(manager.portfolio_value)}
            </span>
          </div>
          <div>
            <span className="font-medium">Holdings:</span>{' '}
            <span className="text-gray-900 dark:text-white font-semibold">
              {manager.holdings_count}
            </span>
          </div>
          <div>
            <span className="font-medium">Report Date:</span>{' '}
            <span className="text-gray-900 dark:text-white font-semibold">
              {new Date(manager.report_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div>
            <span className="font-medium">Filed:</span>{' '}
            <span className="text-gray-900 dark:text-white font-semibold">
              {new Date(manager.date_filed).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('new')}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl mb-1">🟢</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.new_positions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">New</div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('increased')}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl mb-1">🔵</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.increased_positions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Added</div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('decreased')}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl mb-1">🟡</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {summary.decreased_positions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Reduced</div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('sold')}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl mb-1">🔴</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.sold_positions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sold</div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('unchanged')}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl mb-1">⚪</div>
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {summary.unchanged_positions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Unchanged</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', label: 'All Holdings', count: holdings.length },
              { id: 'new', label: 'New', count: summary.new_positions },
              { id: 'increased', label: 'Added', count: summary.increased_positions },
              { id: 'decreased', label: 'Reduced', count: summary.decreased_positions },
              { id: 'sold', label: 'Sold', count: summary.sold_positions }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${filter === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' ? 'All Holdings' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Positions`}
            {' '}({filteredHoldings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredHoldings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No {filter} positions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">% Portfolio</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead>Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHoldings.map((holding, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{holding.ticker}</TableCell>
                    <TableCell>{holding.issuer_name}</TableCell>
                    <TableCell className="text-right">
                      {holding.activity === 'sold' ? (
                        <span className="text-gray-400 dark:text-gray-600">
                          {formatNumber(holding.prev_shares)}
                        </span>
                      ) : (
                        formatNumber(holding.shares)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {holding.activity === 'sold' ? (
                        <span className="text-gray-400 dark:text-gray-600">
                          {formatCurrency(holding.prev_value)}
                        </span>
                      ) : (
                        formatCurrency(holding.value)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {holding.percent_of_portfolio > 0 ? (
                        formatPercentage(holding.percent_of_portfolio)
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {holding.change_percent !== undefined && holding.change_percent !== null ? (
                        <span className={
                          holding.change_percent > 0
                            ? 'text-green-600 dark:text-green-400'
                            : holding.change_percent < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }>
                          {holding.change_percent > 0 ? '+' : ''}
                          {formatPercentage(holding.change_percent)}
                        </span>
                      ) : holding.activity === 'new' ? (
                        <span className="text-green-600 dark:text-green-400">New</span>
                      ) : holding.activity === 'sold' ? (
                        <span className="text-red-600 dark:text-red-400">-100%</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ActivityBadge activity={holding.activity} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
