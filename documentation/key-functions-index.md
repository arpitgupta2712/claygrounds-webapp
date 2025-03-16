# ClayGrounds Key Functions Index

This document provides an index of key functions organized by category to help understand the application flow and quickly locate specific functionality.

## Authentication & Authorization

### AuthContext.jsx
- `AuthProvider()` - Main authentication provider component
- `useAuth()` - Custom hook to access authentication context
- `signInWithGoogle()` - Initiates Google OAuth flow
- `signOut()` - Handles user logout
- `devSignIn()` - Development mode authentication bypass
- `hasLocationAccess()` - Checks if user has access to a specific location

### ProtectedRoute.jsx
- `ProtectedRoute()` - Protects routes from unauthenticated access

### LoginPage.jsx
- `handleGoogleSignIn()` - Handles Google authentication process
- `handleDevLogin()` - Handles development mode login

## State Management

### AppContext.jsx
- `AppProvider()` - Main application state provider
- `useApp()` - Custom hook to access application context
- `setBookingsData()` - Sets booking data in global state
- `setFilteredData()` - Sets filtered booking data
- `setCurrentPage()` - Updates current pagination page
- `setCurrentView()` - Changes current view (table, category, etc.)
- `setSelectedYear()` - Changes selected financial year
- `setActiveFilters()` - Updates active filtering criteria
- `setCategoryType()` - Sets current category type for views
- `setSelectedCategory()` - Sets selected category within a type
- `setSort()` - Sets sorting field and direction
- `batchUpdate()` - Batch updates multiple state properties

### ErrorContext.jsx
- `ErrorProvider()` - Error state management provider
- `useError()` - Custom hook to access error context
- `addError()` - Adds error to tracking system
- `removeError()` - Removes specific error
- `clearErrors()` - Clears all errors
- `markErrorsRead()` - Marks errors as read
- `getErrorsBySeverity()` - Filters errors by severity level
- `getErrorsByCategory()` - Filters errors by category
- `hasCriticalErrors()` - Checks for critical errors

## Data Management

### useBookings.jsx
- `useBookings()` - Main hook for booking data operations
- `loadBookings()` - Loads booking data for specific year
- `groupData()` - Groups data by specified parameter
- `applyFilter()` - Applies filtering to booking data
- `clearFilters()` - Clears all active filters
- `applySorting()` - Applies sorting to booking data
- `refreshData()` - Forces refresh of booking data

### useFilters.jsx
- `useFilters()` - Hook for filter management
- `getLocations()` - Gets unique locations for filter dropdown
- `handleFilterTypeChange()` - Handles filter type change
- `handleApplyFilter()` - Applies selected filters
- `handleResetFilter()` - Resets all filters
- `isInputVisible()` - Determines if specific filter input should be visible
- `getTextPlaceholder()` - Gets placeholder text for filter inputs
- `initFromActiveFilters()` - Initializes filter UI from active filters

## Error Handling

### useErrorHandler.js
- `useErrorHandler()` - Hook for component error handling
- `handleError()` - Handles and tracks errors
- `handleAsync()` - Handles async operations with error tracking
- `createErrorBoundaryHandler()` - Creates handlers for error boundaries

### useErrorTracker.jsx
- `useErrorTracker()` - Hook for error tracking system
- `trackError()` - Tracks and categorizes errors
- `ErrorMessage()` - Error message display component
- `ErrorDisplay()` - Error display component

### errorService.js
- `registerHandler()` - Registers handler for specific error category
- `subscribe()` - Subscribes to error events
- `handleError()` - Handles and logs errors
- `handleNetworkError()` - Specialized handling for network errors
- `handleApiError()` - Specialized handling for API errors
- `handleValidationError()` - Specialized handling for validation errors
- `formatErrorMessage()` - Formats error message for display

## Data Services

### dataService.js
- `parseCSVData()` - Parses and validates CSV data
- `processData()` - Processes and cleans parsed data
- `loadBookings()` - Loads booking data with caching
- `refreshCache()` - Refreshes data cache
- `clearCache()` - Clears all cached data

### filterService.js
- `applyFilters()` - Applies filters to booking data
- `filterByDate()` - Filters data by specific date
- `filterByDateRange()` - Filters data by date range
- `filterByField()` - Filters data by specific field value
- `filterByCustomer()` - Filters data by customer name
- `filterByBalance()` - Filters data by balance status
- `filterByBookingRef()` - Filters data by booking reference
- `filterByPhone()` - Filters data by phone number
- `clearCache()` - Clears filter cache
- `applyMultipleFilters()` - Applies multiple filters at once

### statsService.js
- `calculateSummaryStats()` - Calculates summary statistics for booking data
- `calculateCategoryStats()` - Calculates statistics for specific category
- `calculateAverage()` - Calculates average for specified fields
- `calculateCompletionRate()` - Calculates booking completion rate
- `calculateRevenueByPaymentMethod()` - Calculates revenue by payment method
- `calculateTimeDistribution()` - Calculates booking distribution by time of day
- `calculateTopCustomers()` - Calculates top customers by metric
- `calculateMonthlyPayments()` - Calculates monthly payment statistics
- `getLocationStats()` - Gets statistics for specific location
- `clearCacheForYear()` - Clears cache for specific year
- `clearCache()` - Clears statistics cache

### groupingService.js
- `groupByDate()` - Groups bookings by date
- `groupByLocation()` - Groups bookings by location
- `groupBySource()` - Groups bookings by source
- `groupBySport()` - Groups bookings by sport
- `groupByStatus()` - Groups bookings by status
- `groupByPaymentMode()` - Groups bookings by payment mode
- `getGroupStats()` - Gets statistics for grouped bookings

### sortService.js
- `sortData()` - Sorts data based on field and direction
- `getNextSortDirection()` - Gets next sort direction based on current state
- `sortByMultipleFields()` - Sorts data by multiple fields
- `detectFieldType()` - Determines data type of a field from sample data

## Utility Functions

### dateUtils.js
- `parseDate()` - Parses date string to Date object
- `formatDate()` - Formats Date object to string
- `isDateInRange()` - Checks if date is within range
- `getMonthName()` - Gets month name from date
- `daysDifference()` - Gets days difference between dates
- `isToday()` - Checks if date is today
- `formatDisplayDate()` - Formats date for display
- `getFiscalQuarter()` - Gets fiscal year quarter from date
- `getFinancialYear()` - Gets financial year string from date
- `isInFinancialYear()` - Checks if date is in financial year
- `getFinancialYearDates()` - Gets start and end dates of financial year

### dataUtils.js
- `getUniqueValues()` - Gets unique values from array
- `groupBy()` - Groups data by field
- `sum()` - Calculates sum of field values
- `average()` - Calculates average of field values
- `mostFrequent()` - Finds most frequent value in field
- `search()` - Filters data by search term
- `sortBy()` - Sorts data by field
- `min()` - Gets minimum value from field
- `max()` - Gets maximum value from field
- `valueDistribution()` - Creates frequency distribution of values
- `formatNumber()` - Formats number with commas
- `formatCurrency()` - Formats currency value
- `formatPercentage()` - Formats percentage value

### formatUtils.js
(inferred from usage - file not directly visible in provided code)
- `currency()` - Formats value as currency
- `number()` - Formats value as number
- `percentage()` - Formats value as percentage
- `formatDateForDisplay()` - Formats date for display

## Report Generation

### LocationReport.jsx
- `generateReport()` - Generates plain text report with location statistics
- `generatePDF()` - Generates PDF report with location statistics
- `handleExport()` - Handles report export
- `handleExportPDF()` - Handles PDF export
- `handleExportText()` - Handles text report export

### GlobalReport.jsx
- Similar report generation functions for global statistics

## Component Functions

### Dashboard.jsx
- `Dashboard()` - Main dashboard component
- `DashboardFallback()` - Error fallback for dashboard

### TableView.jsx
- `TableView()` - Table view component
- `handleRowClick()` - Handles table row click
- `handleHeaderClick()` - Handles table header click for sorting
- `handlePageChange()` - Handles pagination change
- `handleCloseModal()` - Closes booking detail modal

### BookingTable.jsx
- `BookingTable()` - Booking table component
- `formatCellContent()` - Formats cell content based on field type
- `handleHeaderClick()` - Handles header click for sorting
- `handleRowClick()` - Handles row click with error handling

### CategoryView.jsx
- `CategoryView()` - Category view component
- `prepareChartData()` - Prepares chart data for visualization
- `handleChartClick()` - Handles chart click events

### PaymentsView.jsx
- `PaymentsView()` - Payments view component
- `preparePaymentData()` - Prepares payment data for display
- `handlePaymentAction()` - Handles payment-related actions
- `handleChartClick()` - Handles chart click events

### VisualizationDashboard.jsx
- `VisualizationDashboard()` - Visualization dashboard component

## Development Tools

### PerformanceMonitor.jsx
- `PerformanceMonitor()` - Development performance monitoring tool
- `formatTime()` - Formats time measurement
- `getPerformanceIndicator()` - Gets performance indicator based on thresholds
- `formatBytes()` - Formats byte measurements
- `getMemoryOptimizationSuggestions()` - Generates memory optimization suggestions
