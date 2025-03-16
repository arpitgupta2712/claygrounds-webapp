# ClayGrounds - Sports Location Booking Management System

## Overview
ClayGrounds is a comprehensive booking management system designed for sports locations and recreational venues. The application helps location managers track, organize, and analyze bookings across different locations, sports types, time periods, and booking sources. With an intuitive dashboard and versatile data visualization options, ClayGrounds simplifies the management of complex booking data with support for financial year-based reporting.

## Key Features

### Authentication
- Secure login system built with Supabase authentication
- Protected routes to ensure only authorized users can access the application
- Session management and persistence
- Role-based access control for different user types

### Dashboard
- Central control center providing quick access to all views
- Real-time statistics and performance metrics by location
- Financial year-based data organization (e.g., 2024-25)
- Customizable view options for different data perspectives

### Data Visualization & Analysis
- **Multiple View Types**:
  - Table View: Complete booking listings with sorting and filtering
  - Category Views: Data segmentation by location, month, sport, status, and source
  - Summary Views: Aggregated statistics and performance metrics
  - Financial Reports: Year-wise and month-wise booking analysis
- **Interactive Charts**: Visual representation of booking trends and patterns using Chart.js
- **PDF Reporting**: 
  - Comprehensive PDF exports using jsPDF and jsPDF-autotable
  - Location-wise booking reports
  - Financial year-based statistics
  - Monthly revenue analysis
  - Custom date range reports

### Location Management
- Location-based organization system (17 locations currently configured)
- Performance tracking across multiple venues
- Comparative analysis between locations
- Location-specific reporting and statistics
- Role-based access to location data

### Financial Management
- Financial year-based data organization
- Monthly revenue tracking and reporting
- Date-wise booking analysis
- Custom date range filtering
- Advanced financial reporting capabilities
- Payment mode analysis (Cash, Bank Transfer, Hudle)

### Responsive Design
- Mobile-first approach with optimized layouts for all devices
- Breakpoints for mobile, tablet, desktop, and ultrawide monitors
- Consistent user experience across all screen sizes using Tailwind's responsive utilities

## Technology Stack

### Frontend Framework
- **React 18**: Component-based UI architecture with hooks pattern
- **React Router v7**: Navigation and routing system
- **Vite**: Fast build tool and development server with HMR optimization

### State Management
- **React Context API**: Global state management via AuthContext, AppContext, and ErrorContext
- **Custom Hooks**: 
  - useBookings: Booking data management
  - useFilters: Advanced filtering system
  - useErrorTracker: Error handling and logging
  - useToast: Notification system

### Data Processing
- **Date Handling**: Custom date utilities for DD/MM/YYYY format
- **Financial Year Logic**: Specialized processing for financial year data
- **Data Aggregation**: Advanced statistics calculation
- **PDF Generation**: Custom PDF layout and generation system
- **CSV Parsing**: PapaParse for data import and processing

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Custom Animations**: Enhanced user experience with subtle transitions and effects
- **PT Sans Font**: Clean, readable typography optimized for data-heavy interfaces

### Data Management
- **Supabase**: Backend-as-a-Service platform for database operations and authentication
- **PapaParse**: CSV parsing and manipulation
- **Local Storage**: Persistent preferences and session handling

### Visualization
- **Chart.js**: Interactive data visualization
- **React-ChartJS-2**: React wrapper for Chart.js
- **jsPDF**: PDF generation for reports
- **jsPDF-autotable**: Enhanced table support for PDF reports

### Development & Testing
- **ESLint**: Code quality and consistency
- **Performance Monitoring**: Custom development tools for monitoring performance metrics
- **Error Tracking**: Comprehensive error logging and tracking system

### Deployment
- **Netlify**: Continuous deployment with custom configuration
- **Custom security headers**: Enhanced application security via Netlify configuration
- **Environment-specific settings**: Development, staging, and production configurations

## Project Structure

```
claygrounds-webapp/
│
├── public/                # Static assets and mock data
│   ├── images/            # Application images and logo
│   └── mock-data/         # Sample CSV data files
│
├── src/
│   ├── components/       
│   │   ├── auth/          # Authentication components
│   │   │   ├── LoginPage.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── common/        # Shared components
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── ScrollToTop.jsx
│   │   ├── dashboard/     # Dashboard and navigation
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Navigation.jsx
│   │   ├── category/      # Category-based views
│   │   │   ├── CategoryView.jsx
│   │   │   ├── CategoryList.jsx
│   │   │   └── CategoryCard.jsx
│   │   ├── payments/      # Payment analysis views
│   │   │   ├── PaymentsView.jsx
│   │   │   ├── DailyView.jsx
│   │   │   └── MonthlyView.jsx
│   │   ├── reports/       # PDF report generation
│   │   │   ├── GlobalReport.jsx
│   │   │   └── LocationReport.jsx
│   │   ├── summary/       # Statistics components
│   │   │   ├── SummaryStats.jsx
│   │   │   └── StatsCard.jsx
│   │   ├── table/         # Data table components
│   │   │   ├── BookingTable.jsx
│   │   │   ├── TableView.jsx
│   │   │   └── TablePagination.jsx
│   │   ├── visualizations/ # Chart components
│   │   │   ├── BaseChart.jsx
│   │   │   ├── PaymentDistribution.jsx
│   │   │   ├── StatusDistribution.jsx
│   │   │   └── SourceDistribution.jsx
│   │   └── error/         # Error handling components
│   │       └── ErrorDashboard.jsx
│   │
│   ├── context/           # React Context providers
│   │   ├── AppContext.jsx # Application state management
│   │   ├── AuthContext.jsx # Authentication state
│   │   └── ErrorContext.jsx # Error handling state
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── useBookings.jsx
│   │   ├── useErrorHandler.js
│   │   ├── useErrorTracker.jsx
│   │   ├── useFilters.jsx
│   │   └── useToast.jsx
│   │
│   ├── services/          # API and data services
│   │   ├── dataService.js  # Data loading and processing
│   │   ├── statsService.js # Statistical calculations
│   │   ├── filterService.js # Data filtering
│   │   ├── sortService.js  # Data sorting
│   │   ├── groupingService.js # Data grouping
│   │   ├── supabase.js    # Supabase client configuration
│   │   └── errorService.js # Error handling service
│   │
│   ├── utils/             # Utility functions
│   │   ├── dateUtils.js   # Date handling functions
│   │   ├── dataUtils.js   # Data manipulation utilities
│   │   ├── formatUtils.js # Data formatting utilities
│   │   ├── constants.js   # Application constants
│   │   ├── errorTypes.js  # Error type definitions
│   │   └── devOptimizations.js # Development optimizations
│   │
│   ├── vite/              # Vite configuration
│   │   └── devOptimizations.js
│   │
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Application entry point
│   ├── index.css          # Global CSS styles
│   ├── locations.json     # Location configuration data
│   └── routes.js          # Route configuration
│
├── netlify.toml           # Netlify deployment configuration
├── package.json           # Project dependencies and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── eslint.config.js       # ESLint configuration
├── postcss.config.js      # PostCSS configuration
└── backup.sh              # Backup script for the project
```

## Architecture

### Application Flow
1. **Authentication**: Users log in via Supabase auth system (Google OAuth)
2. **Route Protection**: ProtectedRoute component ensures authenticated access
3. **Data Processing**: 
   - CSV data parsing and validation
   - Financial year categorization
   - Date format standardization (DD/MM/YYYY)
4. **State Management**: Context providers distribute data to components
5. **View Generation**: 
   - Location-based filtering
   - Financial year organization
   - PDF report generation
6. **User Interaction**: Real-time updates and filtering

### Component Design Patterns
- **Composition**: Components are composed of smaller, reusable parts
- **Container/Presentation**: Logic separation between data handling and UI rendering
- **Custom Hooks**: Specialized hooks for business logic
- **Error Boundaries**: Graceful failure handling with error tracking
- **Toast Notifications**: User feedback system
- **Memoization**: Performance optimizations with React.memo and useMemo

### Data Flow
- **Input Processing**: CSV data validation and parsing
- **Date Handling**: Standardized DD/MM/YYYY format
- **Financial Logic**: Year categorization and calculations
- **Location Management**: Centralized location configuration
- **Report Generation**: PDF creation and formatting
- **Error Tracking**: Comprehensive error logging and tracking

### CSS Architecture
- **Theme Configuration**: Custom color palette and typography
- **Responsive Design**: Mobile-first approach
- **Component-Specific Styles**: Modular CSS organization
- **Custom Animations**: Enhanced user interactions
- **Print Styles**: PDF-optimized layouts

## Performance Optimizations
- **React Memoization**: Preventing unnecessary renders with useMemo and React.memo
- **List Virtualization**: Optimized rendering of large data sets with @tanstack/react-virtual
- **Data Caching**: Minimizing redundant data processing
- **Code Splitting**: Lazy loading of components
- **Development Mode Monitoring**: Real-time performance tracking

## Error Handling System
- **Error Boundaries**: Component-level error isolation
- **Global Error Tracking**: Centralized error logging
- **Error Dashboard**: Visualization and analysis of application errors
- **Severity Levels**: Prioritization of errors (info, warning, error, critical)
- **Error Categories**: Classification by type (UI, data, network, auth)
- **Toast Notifications**: User-friendly error messages

## Setup & Development

### Prerequisites
- Node.js (v18.x or higher)
- npm (v8.x or higher)
- Git for version control

### Installation
1. Clone the repository
   ```
   git clone https://github.com/your-organization/claygrounds-webapp.git
   cd claygrounds-webapp
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment variables
   Create a `.env` file with required variables (see Environment Variables section)

4. Start the development server
   ```
   npm run dev
   ```

### Building for Production
```
npm run build
```

### Preview Production Build
```
npm run preview
```

## Environment Variables

Create a `.env` file with these variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_VERSION=1.0.0
VITE_FINANCIAL_YEAR=2024-25
VITE_APP_ENV=development
VITE_SITE_URL=http://localhost:3000
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEBUG_LOGGING=true
```

### Required Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous API key
- `VITE_APP_VERSION`: Current application version
- `VITE_FINANCIAL_YEAR`: Current financial year for data processing
- `VITE_APP_ENV`: Application environment (development, production)
- `VITE_SITE_URL`: Base URL for the application
- `VITE_ENABLE_MOCK_DATA`: Enable mock data for development
- `VITE_ENABLE_DEBUG_LOGGING`: Enable detailed debug logging

## Deployment

The application is configured for deployment on Netlify:

### Netlify Configuration
1. **Build Settings**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Node Version: 18.x

2. **Environment Variables**:
   - Configure all required environment variables in Netlify dashboard
   - Ensure financial year settings are correctly set

3. **Security Headers**:
   ```toml
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-XSS-Protection = "1; mode=block"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
       Content-Security-Policy = "frame-ancestors 'none'"
   ```

4. **Redirects**:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Deployment Process
1. Push changes to the main branch
2. Netlify automatically triggers build
3. Build process includes:
   - Environment variable validation
   - Dependency installation
   - Build compilation
   - Asset optimization
4. Deployment to production URL

## Future Enhancements
Check out [ClayGrounds Future Scope](./docs/claygrounds-future-scope.md) for planned enhancements and feature roadmap.

## Contributing

### Development Guidelines
1. **Code Style**:
   - Follow ESLint configuration
   - Use Prettier for formatting
   - Follow component naming conventions

2. **Git Workflow**:
   - Create feature branches from main
   - Use conventional commits
   - Keep commits focused and atomic

3. **Testing**:
   - Test new features thoroughly
   - Verify PDF generation
   - Check responsive layouts
   - Validate date handling

### Contribution Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Pull Request Guidelines
- Provide clear description of changes
- Include screenshots for UI changes
- List any new dependencies
- Update documentation as needed

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or raise an issue in the repository.
