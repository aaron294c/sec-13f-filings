import { useState, useEffect } from 'react';
import { Container } from '../components/Container';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/Table';
import api from '../lib/api';
import { formatCurrency, formatNumber, formatPercentage } from '../lib/utils';

export function GrandPortfolioPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('consensus'); // consensus, value, conviction, emerging, fading

  useEffect(() => {
    loadGrandPortfolio();
  }, []);

  async function loadGrandPortfolio() {
    try {
      setLoading(true);
      const result = await api.getGrandPortfolio();
      setData(result);
    } catch (err) {
      console.error('Error loading grand portfolio:', err);
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
            <p className="text-gray-600 dark:text-gray-400">Loading grand portfolio data...</p>
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
              Error loading data: {error}
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!data) return null;

  const { period, stats, consensus_holdings, top_by_value, top_conviction, emerging_consensus, fading_consensus } = data;

  const tabs = [
    { id: 'consensus', label: 'Most Consensus', count: consensus_holdings?.length || 0 },
    { id: 'value', label: 'Highest Value', count: top_by_value?.length || 0 },
    { id: 'conviction', label: 'Top Conviction', count: top_conviction?.length || 0 },
    { id: 'emerging', label: 'Emerging', count: emerging_consensus?.length || 0 },
    { id: 'fading', label: 'Fading', count: fading_consensus?.length || 0 }
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'consensus': return consensus_holdings || [];
      case 'value': return top_by_value || [];
      case 'conviction': return top_conviction || [];
      case 'emerging': return emerging_consensus || [];
      case 'fading': return fading_consensus || [];
      default: return [];
    }
  };

  const currentData = getCurrentData();

  return (
    <Container className="py-8">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Grand Portfolio
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Consensus holdings across all {period.manager_count} superinvestors
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total_managers}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Superinvestors
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.total_unique_stocks)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Unique Stocks
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.total_value)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total Value
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.avg_stocks_per_manager, 1)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Avg Stocks/Manager
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-75">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Holdings Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {tabs.find(t => t.id === activeTab)?.label} Holdings
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeTab === 'consensus' && 'Stocks owned by the most superinvestors'}
              {activeTab === 'value' && 'Stocks with highest aggregate dollar value'}
              {activeTab === 'conviction' && 'Stocks with highest individual position sizes'}
              {activeTab === 'emerging' && 'Stocks gaining popularity among superinvestors'}
              {activeTab === 'fading' && 'Stocks losing popularity among superinvestors'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Company</TableHead>
                    {(activeTab === 'consensus' || activeTab === 'value' || activeTab === 'conviction') && (
                      <>
                        <TableHead className="text-right">Owners</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                      </>
                    )}
                    {activeTab === 'conviction' && (
                      <TableHead className="text-right">Max Position %</TableHead>
                    )}
                    {(activeTab === 'consensus' || activeTab === 'value') && (
                      <TableHead className="text-right">Avg Position %</TableHead>
                    )}
                    {(activeTab === 'emerging' || activeTab === 'fading') && (
                      <>
                        <TableHead className="text-right">Current Owners</TableHead>
                        <TableHead className="text-right">Previous Owners</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((holding, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        #{idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-semibold text-gray-900 dark:text-white">
                          {holding.ticker}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-900 dark:text-white">
                          {holding.issuer_name}
                        </div>
                      </TableCell>

                      {(activeTab === 'consensus' || activeTab === 'value' || activeTab === 'conviction') && (
                        <>
                          <TableCell className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {holding.owner_count}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatPercentage((holding.owner_count / period.manager_count) * 100, 1)} of managers
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-900 dark:text-white">
                            {formatCurrency(holding.total_value)}
                          </TableCell>
                        </>
                      )}

                      {activeTab === 'conviction' && (
                        <TableCell className="text-right">
                          <div className="font-semibold text-primary-600 dark:text-primary-400">
                            {formatPercentage(holding.max_position_pct, 2)}
                          </div>
                        </TableCell>
                      )}

                      {(activeTab === 'consensus' || activeTab === 'value') && (
                        <TableCell className="text-right">
                          <div className="text-gray-600 dark:text-gray-400">
                            {formatPercentage(holding.avg_position_pct, 2)}
                          </div>
                        </TableCell>
                      )}

                      {(activeTab === 'emerging' || activeTab === 'fading') && (
                        <>
                          <TableCell className="text-right font-medium text-gray-900 dark:text-white">
                            {holding.current_owners}
                          </TableCell>
                          <TableCell className="text-right text-gray-600 dark:text-gray-400">
                            {holding.previous_owners}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`font-semibold ${
                              activeTab === 'emerging'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {activeTab === 'emerging' ? '+' : '-'}{holding.owner_change}
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
