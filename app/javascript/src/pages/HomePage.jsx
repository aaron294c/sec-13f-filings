import { Container } from '../components/Container';
import { SearchBar } from '../components/SearchBar';
import { Card, CardContent, CardDescription, CardTitle } from '../components/Card';
import { ChartBarIcon, DocumentMagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const features = [
  {
    icon: ChartBarIcon,
    title: 'Track Institutional Holdings',
    description: 'Monitor what the biggest investment managers are buying and selling each quarter.',
  },
  {
    icon: DocumentMagnifyingGlassIcon,
    title: 'Analyze Filings',
    description: 'Deep dive into 13F filings with detailed breakdowns and historical comparisons.',
  },
  {
    icon: UserGroupIcon,
    title: 'Follow Top Managers',
    description: 'Keep tabs on legendary investors like Berkshire Hathaway, Bridgewater, and more.',
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Container className="py-20">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            SEC 13F Filings
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
            Search and analyze quarterly holdings reports from institutional investment managers.
          </p>

          {/* Search Bar */}
          <div className="flex justify-center mb-8">
            <SearchBar autoFocus placeholder="Search for a manager or CUSIP..." />
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Try searching for &quot;Berkshire Hathaway&quot;, &quot;Bridgewater&quot;, or a CUSIP
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card hover className="h-full">
                <CardContent className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <CardTitle className="mb-2">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* About Section */}
        <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                What are 13F filings?
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Form 13F is a quarterly report filed by institutional investment managers with at least $100 million in
                  assets under management. The form discloses their equity holdings, providing transparency into the
                  investment decisions of some of the world&apos;s most successful investors.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  This site makes it easy to search, browse, and analyze these public filings, which are submitted to the
                  SEC 45 days after the end of each quarter.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
