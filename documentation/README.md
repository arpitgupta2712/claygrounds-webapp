# ClayGrounds - Sports Location Booking Management System

## Overview
ClayGrounds is a comprehensive booking management system designed for sports locations and recreational venues. The application helps location managers track, organize, and analyze bookings across different locations, sports types, time periods, and booking sources. With an intuitive dashboard and versatile data visualization options, ClayGrounds simplifies the management of complex booking data with support for financial year-based reporting.

## Key Features

### Authentication
- Secure login system built with Supabase authentication
- Protected routes to ensure only authorized users can access the application
- Session management and persistence

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
- **Interactive Charts**: Visual representation of booking trends and patterns
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

### Financial Management
- Financial year-based data organization
- Monthly revenue tracking
- Date-wise booking analysis
- Custom date range filtering
- Advanced financial reporting capabilities

### Responsive Design
- Mobile-first approach with optimized layouts for all devices
- Breakpoints for mobile, tablet, desktop, and ultrawide monitors
- Consistent user experience across all screen sizes using Tailwind's responsive utilities

## Technology Stack

### Frontend Framework
- **React 18**: Component-based UI architecture with hooks pattern
- **React Router v7**: Navigation and routing system
- **Vite**: Fast build tool and development server

### State Management
- **React Context API**: Global state management via AuthContext and AppContext
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

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Custom Animations**: Enhanced user experience with subtle transitions and effects
- **PT Sans Font**: Clean, readable typography optimized for data-heavy interfaces

### Data Management
- **Supabase**: Backend-as-a-Service platform for database operations
- **PapaParse**: CSV parsing and manipulation
- **Local Storage**: Persistent preferences and session handling

### Deployment
- **Netlify**: Continuous deployment with custom configuration
- **Custom security headers**: Enhanced application security via Netlify configuration

## Project Structure

```
claygrounds-webapp/
│
├── public/                # Static assets
│   └── mock-data/        # Sample CSV data files
│
├── src/
│   ├── components/       
│   │   ├── auth/         # Authentication components
│   │   ├── common/       # Shared components
│   │   ├── dashboard/    # Dashboard and navigation
│   │   ├── category/     # Category-based views
│   │   ├── payments/     # Payment analysis views
│   │   ├── report/       # PDF report generation
│   │   ├── summary/      # Statistics components
│   │   └── table/        # Data table components
│   │
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and data services
│   ├── utils/            # Utility functions
│   │   ├── dateUtils.js  # Date handling
│   │   ├── formatUtils.js # Data formatting
│   │   └── constants.js  # Application constants
│   │
│   ├── locations.json    # Location configuration
│   └── main.jsx         # Application entry
│
└── configuration files   # Build and deployment configs
```

## Architecture

### Application Flow
1. **Authentication**: Users log in via Supabase auth system
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

### Data Flow
- **Input Processing**: CSV data validation and parsing
- **Date Handling**: Standardized DD/MM/YYYY format
- **Financial Logic**: Year categorization and calculations
- **Location Management**: Centralized location configuration
- **Report Generation**: PDF creation and formatting

### CSS Architecture
- **Theme Configuration**: Custom color palette and typography
- **Responsive Design**: Mobile-first approach
- **Component-Specific Styles**: Modular CSS organization
- **Custom Animations**: Enhanced user interactions
- **Print Styles**: PDF-optimized layouts

## Setup & Development

### Prerequisites
- Node.js (v16.x or higher)
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
```

### Required Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous API key
- `VITE_APP_VERSION`: Current application version
- `VITE_FINANCIAL_YEAR`: Current financial year for data processing

## Deployment

The application is configured for deployment on Netlify:

### Netlify Configuration
1. **Build Settings**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Node Version: 16.x

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