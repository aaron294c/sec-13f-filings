# SEC 13F Filings - Premium Frontend Documentation

## Overview

This is a complete frontend reimagining of the SEC 13F Filings application, built with **Apple-level UX/UI precision**. The frontend is a full Single Page Application (SPA) built with React 18, while maintaining **100% compatibility** with the existing Rails backend API.

## Technology Stack

### Core Framework
- **React 18.2.0** - Modern React with automatic JSX transform
- **React Router DOM 6.22.0** - Client-side routing
- **Webpacker 5.2.1** - Asset bundling (integrated with Rails)

### Styling & Design
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Sass 1.70.0** - CSS preprocessor for custom styles
- **@fontsource/inter** - Premium Inter font family
- **Custom Design System** - Comprehensive design tokens and variables

### UI Components & Animation
- **Framer Motion 11.0.3** - Smooth, performant animations
- **Headless UI 1.7.18** - Unstyled, accessible UI components
- **Heroicons 2.1.1** - Beautiful hand-crafted SVG icons
- **clsx** - Utility for conditional className joining

### State & API
- **Custom API Client** - Maintains backend compatibility
- **React Context** - Theme management (dark/light mode)
- **Local Storage** - Theme persistence

---

## Architecture

### Directory Structure

```
app/javascript/
├── packs/
│   └── application.js          # Webpack entry point
├── src/
│   ├── components/             # Atomic UI components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Table.jsx
│   │   ├── Container.jsx
│   │   ├── Navigation.jsx
│   │   └── SearchBar.jsx
│   ├── contexts/               # React contexts
│   │   └── ThemeContext.jsx
│   ├── pages/                  # Page components
│   │   ├── HomePage.jsx
│   │   └── ManagersPage.jsx
│   ├── lib/                    # Utilities & API
│   │   ├── api.js
│   │   └── utils.js
│   ├── App.jsx                 # Root component
│   └── index.jsx               # React mount point
└── stylesheets/
    ├── design-system.css       # Design tokens & variables
    ├── application.scss        # Main styles
    └── tailwind.config.js      # Tailwind configuration
```

### Component Architecture

The application follows **Atomic Design** principles:

1. **Atoms** - Button, Input, basic elements
2. **Molecules** - Card, SearchBar, composite components
3. **Organisms** - Navigation, Table, complex components
4. **Templates** - Layout components
5. **Pages** - Full page views

---

## Design System

### Color Palette

#### Primary (Indigo)
- **Primary 600** (`#4f46e5`) - Main brand color
- Used for: CTAs, links, focus states
- Shades: 50-900 for various states

#### Secondary (Teal/Sage)
- **Secondary 600** (`#0d9488`) - Accent color
- Used for: Secondary actions, highlights

#### Neutral (Gray)
- **Gray Scale** - 50-900
- Used for: Text, borders, backgrounds

#### Semantic Colors
- **Success**: Green (`#10b981`)
- **Warning**: Amber (`#f59e0b`)
- **Error**: Red (`#ef4444`)
- **Info**: Blue (`#3b82f6`)

### Typography

#### Font Family
- **Sans**: Inter (400, 500, 600, 700)
- **Mono**: SF Mono, Monaco, Fira Code

#### Type Scale (Modular Scale)
```css
--text-xs: 0.75rem    /* 12px */
--text-sm: 0.875rem   /* 14px */
--text-base: 1rem     /* 16px */
--text-lg: 1.125rem   /* 18px */
--text-xl: 1.25rem    /* 20px */
--text-2xl: 1.5rem    /* 24px */
--text-3xl: 1.875rem  /* 30px */
--text-4xl: 2.25rem   /* 36px */
--text-5xl: 3rem      /* 48px */
--text-6xl: 3.75rem   /* 60px */
```

### Spacing (8-Point Grid)

All spacing uses multiples of 4px or 8px:
```css
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-4: 1rem       /* 16px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
```

### Shadows (Multi-Layer Soft Shadows)

```css
--shadow-sm: Subtle elevation
--shadow-md: Default cards
--shadow-lg: Modals, dropdowns
--shadow-xl: Popovers, tooltips
--shadow-2xl: Hero elements
```

### Border Radius

```css
--radius-sm: 0.25rem   /* 4px */
--radius-md: 0.5rem    /* 8px */
--radius-lg: 0.75rem   /* 12px */
--radius-xl: 1rem      /* 16px */
--radius-2xl: 1.5rem   /* 24px */
--radius-full: 9999px
```

### Animations

#### Timing
- **Default**: 200ms (micro-interactions)
- **Standard**: 300ms (transitions)
- **Slow**: 500ms (page transitions)

#### Easing
- **Apple Easing**: `cubic-bezier(0.25, 0.1, 0.25, 1)`
- Used for all animations to match Apple's smooth feel

#### Built-in Animations
- `fade-in` - Opacity transition
- `slide-up` - Upward slide with fade
- `slide-down` - Downward slide with fade
- `scale-in` - Scale effect with fade

---

## Dark Mode

### Implementation

Dark mode is implemented using:
1. **CSS Variables** - Theme-aware color tokens
2. **React Context** - Theme state management
3. **Local Storage** - Persistence across sessions
4. **System Preference** - Respects OS preference

### Usage

```jsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### Dark Mode Classes

Tailwind's dark mode variant is enabled:
```jsx
<div className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-white">
    Text that adapts to theme
  </p>
</div>
```

---

## Component Library

### Button

Full-featured button with variants, sizes, loading states, and icons.

```jsx
import { Button } from '../components/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

<Button variant="primary" size="md" icon={PlusIcon}>
  Add Item
</Button>

// Variants: primary, secondary, outline, ghost, destructive
// Sizes: sm, md, lg
```

**Features:**
- Hover scale animation (1.02)
- Tap scale animation (0.98)
- Loading spinner
- Icon support (left/right)
- Disabled states
- Full accessibility

### Input

Text input with label, error states, helper text, and icon support.

```jsx
import { Input } from '../components/Input';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

<Input
  label="Search"
  placeholder="Enter search term..."
  icon={MagnifyingGlassIcon}
  helperText="Min 3 characters"
  error={errors.search}
/>
```

**Features:**
- Label and helper text
- Error states with ARIA
- Icon support
- Focus ring (primary-500)
- Dark mode support

### Card

Container component with header, content, and footer sections.

```jsx
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';

<Card hover>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Your content here
  </CardContent>
</Card>
```

**Features:**
- Fade-in animation on mount
- Optional hover effect
- Border and shadow
- Dark mode support

### Table

Fully styled table components for data display.

```jsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/Table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Value</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow hover onClick={() => {}}>
      <TableCell>Data</TableCell>
      <TableCell>123</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Features:**
- Hover effects
- Dark mode support
- Responsive overflow
- Click handlers

### SearchBar

Autocomplete search with keyboard navigation.

```jsx
import { SearchBar } from '../components/SearchBar';

<SearchBar
  placeholder="Search..."
  autoFocus
/>
```

**Features:**
- Debounced search (250ms)
- Keyboard navigation (↑↓, Enter, Esc)
- Loading states
- Dropdown results
- Click outside to close
- Framer Motion animations

---

## API Integration

### API Client

The `api.js` client maintains **100% compatibility** with existing backend endpoints.

```javascript
import api from '../lib/api';

// Autocomplete search
const results = await api.autocomplete('Berkshire');

// Get filing
const filing = await api.getFiling(externalId);

// Compare filings
const comparison = await api.compareFilings(id1, id2);

// Get CUSIP holders
const holders = await api.getCusipHolders(cusip, year, quarter);
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `autocomplete(query)` | `/data/autocomplete?q=` | Search managers/CUSIPs |
| `getFiling(id)` | `/data/13f/:id` | Get filing (aggregated) |
| `getFilingDetailed(id)` | `/data/13f/:id/detailed` | Get detailed filing |
| `compareFilings(id, otherId)` | `/data/13f/:id/compare/:otherId` | Compare two filings |
| `getCusipHolders(cusip, year, quarter)` | `/data/cusip/:cusip/:year/:quarter` | Get all holders |
| `getManagerCusipHistory(cik, cusip)` | `/data/manager/:cik/cusip/:cusip` | Get manager history |

---

## Utilities

### Class Name Utility

```javascript
import { cn } from '../lib/utils';

const className = cn(
  'base-class',
  condition && 'conditional-class',
  { 'object-key': booleanValue }
);
```

### Number Formatting

```javascript
import { formatCurrency, formatNumber, formatPercentage } from '../lib/utils';

formatCurrency(1234567);        // "$1,234,567"
formatNumber(1234567);           // "1.2M"
formatPercentage(15.5, 2);       // "+15.50%"
```

### Date Formatting

```javascript
import { formatDate, formatQuarter } from '../lib/utils';

formatDate('2024-03-31');        // "March 31, 2024"
formatQuarter('2024Q1');         // "Q1 2024"
```

---

## Accessibility (WCAG AA+)

### Focus Management
- All interactive elements have visible focus rings
- Focus rings use `:focus-visible` for keyboard-only display
- Tab order follows logical flow

### ARIA Attributes
- Proper `aria-label` on icon buttons
- `aria-describedby` for form errors/helpers
- `aria-invalid` on error inputs
- `aria-hidden` on decorative icons

### Keyboard Navigation
- Full keyboard support in SearchBar (↑↓, Enter, Esc)
- All buttons and links are keyboard accessible
- Modal/dropdown management with Escape key

### Color Contrast
- All text meets WCAG AA standards
- Enhanced contrast in dark mode
- Semantic colors for status (success/error/warning)

### Screen Reader Support
- Semantic HTML (nav, main, header, article)
- Hidden text for icon-only buttons
- Loading states announced

---

## Performance

### Optimizations

1. **Code Splitting**
   - React Router lazy loading (add as needed)
   - Dynamic imports for heavy components

2. **Animation Performance**
   - Framer Motion uses `transform` and `opacity` only
   - GPU-accelerated animations
   - `will-change` hints where appropriate

3. **Bundle Size**
   - Tree-shaking enabled
   - Tailwind purge removes unused CSS
   - Modern build targets

4. **Network**
   - Debounced search (250ms)
   - Request caching (browser)
   - Backend caching (unchanged)

---

## Development Workflow

### Running the Development Server

```bash
# Start Rails server
bin/rails server

# Start Webpack dev server (separate terminal)
bin/webpack-dev-server

# Or use foreman
foreman start
```

### Building for Production

```bash
# Compile assets
bin/rails assets:precompile

# Or just Webpack
bin/webpack
```

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route to `src/App.jsx`
3. Add navigation link to `src/components/Navigation.jsx` (if needed)

Example:
```jsx
// src/pages/NewPage.jsx
export function NewPage() {
  return <div>New Page Content</div>;
}

// src/App.jsx
import { NewPage } from './pages/NewPage';

<Routes>
  <Route path="/new" element={<NewPage />} />
</Routes>
```

### Creating New Components

Follow the atomic design pattern:

```jsx
// src/components/MyComponent.jsx
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export function MyComponent({ className, children, ...props }) {
  return (
    <motion.div
      className={cn('base-classes', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

---

## Extending the Design System

### Adding New Colors

1. Update `design-system.css`:
```css
:root {
  --color-custom-500: #yourcolor;
}
```

2. Update `tailwind.config.js`:
```javascript
colors: {
  custom: {
    500: '#yourcolor',
  },
}
```

### Adding New Animations

1. Add keyframes to `tailwind.config.js`:
```javascript
keyframes: {
  myAnimation: {
    '0%': { /* start */ },
    '100%': { /* end */ },
  },
},
animation: {
  'my-animation': 'myAnimation 300ms ease-out',
},
```

2. Use in components:
```jsx
<div className="animate-my-animation">
  Content
</div>
```

---

## Troubleshooting

### Webpack Compilation Errors

```bash
# Clear cache and rebuild
rm -rf node_modules tmp/cache
npm install
bin/webpack
```

### Dark Mode Not Working

Check that the `data-theme` attribute is set on `<html>`:
```javascript
// In ThemeContext.jsx
document.documentElement.setAttribute('data-theme', theme);
```

### Styles Not Applying

Ensure Tailwind purge paths include your files:
```javascript
// tailwind.config.js
content: [
  './app/javascript/**/*.{js,jsx}',
  './app/views/**/*.html.erb',
],
```

---

## Production Checklist

- [ ] All animations smooth (60 FPS)
- [ ] Dark mode works correctly
- [ ] All API endpoints tested
- [ ] Accessibility audit passed
- [ ] Responsive on mobile/tablet
- [ ] No console errors
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Error boundaries implemented
- [ ] Loading states everywhere
- [ ] SEO meta tags (if needed)

---

## Credits

**Design System**: Inspired by Apple's Human Interface Guidelines
**Icons**: Heroicons by Tailwind Labs
**Fonts**: Inter by Rasmus Andersson
**Animations**: Framer Motion by Framer

---

## License

Same as the main SEC 13F Filings project.
