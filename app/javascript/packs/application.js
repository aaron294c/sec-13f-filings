/**
 * Premium React Frontend for SEC 13F Filings
 *
 * This is the main entry point for the React application.
 * All backend APIs remain completely untouched.
 */

import Rails from '@rails/ujs';
Rails.start();

// Fonts are loaded via Google Fonts CDN (see application.html.erb)

// Import styles (includes Tailwind + Design System)
import '../stylesheets/application.scss';

// Import and mount React app
import '../src/index.jsx';

// Images context
const images = require.context('../images', true);
