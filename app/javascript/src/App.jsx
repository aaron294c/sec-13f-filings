import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { ManagersPage } from './pages/ManagersPage';
import { ManagerDetailPage } from './pages/ManagerDetailPage';
import { FilingDetailPage } from './pages/FilingDetailPage';
import { CusipDetailPage } from './pages/CusipDetailPage';
import { RecentFilingsPage } from './pages/RecentFilingsPage';
import { SuperinvestorsPage } from './pages/SuperinvestorsPage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/managers" element={<ManagersPage />} />
            <Route path="/newest" element={<RecentFilingsPage />} />
            <Route path="/superinvestors" element={<SuperinvestorsPage />} />

            {/* Manager routes */}
            <Route path="/manager/:cik" element={<ManagerDetailPage />} />

            {/* Filing routes */}
            <Route path="/13f/:externalId" element={<FilingDetailPage />} />

            {/* CUSIP routes */}
            <Route path="/cusip/:cusip" element={<CusipDetailPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
