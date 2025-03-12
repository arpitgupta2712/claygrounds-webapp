# ClayGrounds - Sports Facility Booking Management System

## Overview
ClayGrounds is a comprehensive booking management system designed for sports facilities and recreational venues. The application helps facility managers track, organize, and analyze bookings across different locations, sports types, time periods, and booking sources. With an intuitive dashboard and versatile data visualization options, ClayGrounds simplifies the management of complex booking data.

## Key Features

### Authentication
- Secure login system built with Supabase authentication
- Protected routes to ensure only authorized users can access the application
- Session management and persistence

### Dashboard
- Central control center providing quick access to all views
- Real-time statistics and performance metrics
- Customizable view options for different data perspectives

### Data Visualization & Analysis
- **Multiple View Types**:
  - Table View: Complete booking listings with sorting and filtering
  - Category Views: Data segmentation by location, month, sport, status, and source
  - Summary Views: Aggregated statistics and performance metrics
- **Interactive Charts**: Visual representation of booking trends and patterns
- **PDF Reporting**: Export capabilities using jsPDF and jsPDF-autotable

### Facility Management
- Facility creation and management (17 locations currently configured)
- Performance tracking across multiple venues
- Comparative analysis between facilities

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
- **Custom Hooks**: Specialized hooks for bookings, filters, and error handling

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
│
├── src/
│   ├── components/        # UI components
│   │   ├── auth/          # Authentication components
│   │   │   ├── LoginPage.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── common/        # Shared components
│   │   │   └── ErrorBoundary.jsx
│   │   ├── dashboard/     # Dashboard components
│   │   │   └── Dashboard.jsx
│   │   ├── category/      # Category-based views
│   │   ├── summary/       # Data summary components
│   │   └── table/         # Table view components
│   │
│   ├── context/           # React Context providers
│   │   ├── AuthContext.jsx  # User authentication context
│   │   └── AppContext.jsx   # Application state context
│   │
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and data services
│   ├── utils/             # Utility functions
│   │
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles and Tailwind imports
│
├── configuration files    # Various config files for build tools
│   ├── vite.config.js     # Vite configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── eslint.config.js   # ESLint rules
│   ├── postcss.config.js  # PostCSS plugins
│   └── netlify.toml       # Netlify deployment settings
│
└── package.json          # Dependencies and scripts
```

## Architecture

### Application Flow
1. **Authentication**: Users log in via Supabase auth system
2. **Route Protection**: ProtectedRoute component ensures authenticated access
3. **Data Fetching**: Services layer manages API interactions with Supabase
4. **State Management**: Context providers distribute data to components
5. **Rendering**: Component hierarchy renders appropriate views
6. **Interaction**: User actions trigger state updates and re-renders

### Component Design Patterns
- **Composition**: Components are composed of smaller, reusable parts
- **Container/Presentation**: Logic separation between data handling and UI rendering
- **Render Props**: Flexible component customization where needed
- **Error Boundaries**: Graceful failure handling via ErrorBoundary component

### CSS Architecture
- **Theme Configuration**: Custom color palette defined in tailwind.config.js
- **Responsive Design**: Mobile-first approach with defined breakpoints
- **Design Tokens**: Consistent use of colors, spacing, and typography
- **Custom Animations**: Defined animation keyframes for enhanced UX
- **Extended Utilities**: Additional Tailwind utilities for project-specific needs

## Setup & Development

### Prerequisites
- Node.js (v14.x or higher)
- npm (v6.x or higher)

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

3. Start the development server
   ```
   npm run dev
   ```

4. The application will be available at http://localhost:3000

### Building for Production
```
npm run build
```
This creates a production-ready build in the `dist` directory.

### Preview Production Build
```
npm run preview
```

## Environment Variables

The application requires the following environment variables:

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous API key

## Deployment

The application is configured for seamless deployment to Netlify:

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Custom Headers**: Security headers are pre-configured in netlify.toml
4. **Redirects**: SPA routing handled via custom redirects

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.