import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../context/AppContext';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import { dataUtils } from '../../utils/dataUtils';
import { statsService } from '../../services/statsService';
import { ASSETS } from '../../utils/assets';
import { ptSansFontData, initFonts } from '../../utils/fonts';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import StatsCard from '../summary/StatsCard';

/**
 * Generate plain text report with location statistics
 * @param {Object} stats - Location statistics
 * @param {string} locationName - Name of the location
 * @param {string} year - Selected year
 * @returns {string} Formatted report text
 */
function generateReport(stats, locationName, year) {
  const report = [];
  
  // Header
  report.push(`${locationName} Statistics Report`);
  // ... rest of function (unchanged)
}

/**
 * Generate modern styled PDF report with optimized page breaks and spacing
 * @param {Object} stats - Location statistics
 * @param {string} locationName - Name of the location
 * @param {string} year - Selected year
 */
function generatePDF(stats, locationName, year) {
  console.log('[LocationReport] Generating PDF with stats:', {
    hasMonthlyPayments: !!stats.monthlyPayments,
    monthlyPaymentsLength: stats.monthlyPayments?.length,
    hasTopCustomers: !!stats.topCustomers,
    topCustomersLength: stats.topCustomers?.length,
    totalCollection: stats.totalCollection,
    year
  });

  // Create PDF with A4 format and refined margins
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    margins: { top: 15, bottom: 15, left: 15, right: 15 }
  });
  
  // Initialize fonts
  const fontsInitialized = initFonts(doc);
  const fontFamily = fontsInitialized ? 'PT Sans' : 'helvetica';
  
  console.log(`[LocationReport] Generating PDF with font "${fontFamily}" (fonts initialized: ${fontsInitialized})`);
  
  // Theme colors (matching Tailwind theme exactly)
  const theme = {
    primary: {
      default: hexToRgb('#4F6D7A'),    // Slate blue - primary
      light: hexToRgb('#56A3A6'),      // Teal - accent
      dark: hexToRgb('#2D3E50'),       // Deep navy
      ultraLight: hexToRgb('#E1EBEF'),  // Very light teal for backgrounds
    },
    text: {
      dark: hexToRgb('#2D3E50'),       // Deep navy for headings
      medium: hexToRgb('#394F61'),     // Medium slate for body
      light: hexToRgb('#6C7A89')       // Subtle gray for secondary
    },
    background: {
      default: hexToRgb('#F8FAFC'),    // Clean off-white
      light: hexToRgb('#FFFFFF'),      // Pure white
      accent: hexToRgb('#F0F4F8')      // Subtle light blue
    },
    accent: {
      success: hexToRgb('#66BB6A'),    // Green for success states
      warning: hexToRgb('#FFCA28'),    // Amber for warnings
      error: hexToRgb('#EF5350'),      // Soft red for errors
      info: hexToRgb('#42A5F5')        // Blue for information
    }
  };

  // Helper function to convert hex to RGB array
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }

  // A4 page constants
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margins = { left: 15, right: 15, top: 15, bottom: 20 };
  const contentWidth = pageWidth - margins.left - margins.right;
  const contentHeight = pageHeight - margins.top - margins.bottom;
  const startX = margins.left;
  let y = margins.top + 10; // Starting Y position with small offset

  // Function to check if adding content would overflow the page
  const ensureSpace = (requiredSpace, forcePage = false) => {
    const remainingSpace = pageHeight - margins.bottom - y;
    if (forcePage || remainingSpace < requiredSpace) {
      doc.addPage();
      y = margins.top;
      
      // Add subtle header to the new page
      doc.setFillColor(theme.primary.ultraLight[0], theme.primary.ultraLight[1], theme.primary.ultraLight[2]);
      doc.rect(0, 0, 15, pageWidth, 'F');
      doc.setDrawColor(theme.primary.light[0], theme.primary.light[1], theme.primary.light[2]);
      doc.setLineWidth(0.3);
      doc.line(0, 15, pageWidth, 15);
      
      // Add page title
      doc.setFontSize(12);
      doc.setFont(fontFamily, 'bold');
      doc.setTextColor(theme.primary.dark[0], theme.primary.dark[1], theme.primary.dark[2]);
      doc.text(`${locationName} Statistics Report (Continued)`, startX, 10);
      
      return true;
    }
    return false;
  };

  // Top header area - light background
  doc.setFillColor(theme.primary.ultraLight[0], theme.primary.ultraLight[1], theme.primary.ultraLight[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setDrawColor(theme.primary.light[0], theme.primary.light[1], theme.primary.light[2]);
  doc.setLineWidth(0.3);
  doc.line(0, 35, pageWidth, 35);
  
  // Add logo
  try {
    doc.addImage(ASSETS.LOGO, 'PNG', 20, 10, 20, 20, undefined, 'FAST');
  } catch (error) {
    console.warn('[LocationReport] Failed to add logo:', error);
    // Fallback to circle if image fails
    doc.setFillColor(theme.primary.default[0], theme.primary.default[1], theme.primary.default[2]);
    doc.circle(30, 20, 10, 'F');
  }
  
  // Title area
  doc.setFontSize(22);
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(theme.primary.dark[0], theme.primary.dark[1], theme.primary.dark[2]);
  doc.text(`${locationName} Statistics Report`, 50, 22);
  
  // Year subtitle
  doc.setFontSize(12);
  doc.setFont(fontFamily, 'normal');
  doc.setTextColor(theme.text.medium[0], theme.text.medium[1], theme.text.medium[2]);
  doc.text(`Year: ${year.substring(0, 4)}-${year.substring(4, 6)}`, 50, 30);
  
  // Starting position for content (after the header)
  y = 45;

  // Helper function to draw a section card
  const drawSectionCard = (title, startY, height, cardType = 'normal') => {
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(startX, startY, contentWidth, height, 3, 3, 'FD');
    
    // Card header
    let headerColor;
    switch(cardType) {
      case 'financial': 
        headerColor = theme.primary.default;
        break;
      case 'bookings': 
        headerColor = theme.primary.light;
        break;
      case 'payments': 
        headerColor = theme.primary.dark;
        break;
      default: 
        headerColor = theme.primary.default;
    }
    
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.roundedRect(startX, startY, contentWidth, 8, 3, 3, 'F');
    
    // Card title
    doc.setFontSize(13);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, startX + 5, startY + 5.5);
    
    return startY + 12; // Return Y position for content to start
  };

  // Helper function for stat cards
  const drawStatCard = (x, y, width, label, value, description = null) => {
    const cardHeight = description ? 22 : 18;
    const padding = 3;
    
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, width, cardHeight, 2, 2, 'FD');
    
    // Label
    doc.setFontSize(8);
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(theme.text.light[0], theme.text.light[1], theme.text.light[2]);
    doc.text(label, x + padding, y + padding + 3);
    
    // Value
    doc.setFontSize(11);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(theme.primary.default[0], theme.primary.default[1], theme.primary.default[2]);
    doc.text(value, x + padding, y + padding + 11);
    
    // Description
    if (description) {
      doc.setFontSize(8);
      doc.setFont(fontFamily, 'normal');
      doc.setTextColor(theme.text.light[0], theme.text.light[1], theme.text.light[2]);
      doc.text(description, x + padding, y + padding + 18);
    }
    
    return cardHeight;
  };

  // ---------- FINANCIAL OVERVIEW ----------
  const financialCardHeight = 45;
  let contentY = drawSectionCard('Financial Overview', y, financialCardHeight, 'financial');
  
  // Create a grid of 3 stat cards
  const cardWidth = (contentWidth - 6) / 3;
  drawStatCard(startX + 1, contentY, cardWidth - 1, 'Total Collection', 
    `₹${dataUtils.formatNumber(stats.totalCollection)}`, 'Total revenue collected');
  
  drawStatCard(startX + cardWidth + 2, contentY, cardWidth - 1, 'Outstanding Balance', 
    `₹${dataUtils.formatNumber(stats.totalOutstanding)}`, 'Pending payments');
  
  drawStatCard(startX + (cardWidth * 2) + 3, contentY, cardWidth - 1, 'Average Booking Value', 
    `₹${dataUtils.formatNumber(stats.avgBookingValue)}`, 'Revenue per booking');
  
  y += financialCardHeight + 10;

  // ---------- BOOKING METRICS ----------
  ensureSpace(50);
  const bookingCardHeight = 45;
  contentY = drawSectionCard('Booking Metrics', y, bookingCardHeight, 'bookings');
  
  // Create a grid of 2x2 stat cards
  const halfCardWidth = (contentWidth - 4) / 2;
  
  drawStatCard(startX + 1, contentY, halfCardWidth - 1, 'Total Bookings', 
    dataUtils.formatNumber(stats.totalBookings), `${stats.totalSlots} total slots`);
  
  drawStatCard(startX + halfCardWidth + 2, contentY, halfCardWidth - 1, 'Unique Customers', 
    dataUtils.formatNumber(stats.uniqueCustomers));
  
  y += bookingCardHeight + 10;

  // ---------- PAYMENT METHODS ----------
  ensureSpace(50);
  const paymentCardHeight = 45;
  contentY = drawSectionCard('Payment Methods', y, paymentCardHeight, 'payments');
  
  drawStatCard(startX + 1, contentY, cardWidth - 1, 'Cash Payments', 
    `₹${dataUtils.formatNumber(stats.cashAmount)}`, `${stats.cashPercentage.toFixed(1)}%`);
  
  drawStatCard(startX + cardWidth + 2, contentY, cardWidth - 1, 'Bank Payments', 
    `₹${dataUtils.formatNumber(stats.bankAmount)}`, `${stats.bankPercentage.toFixed(1)}%`);
  
  drawStatCard(startX + (cardWidth * 2) + 3, contentY, cardWidth - 1, 'Hudle Payments', 
    `₹${dataUtils.formatNumber(stats.hudleAmount)}`, `${stats.hudlePercentage.toFixed(1)}%`);
  
  y += paymentCardHeight + 10;

  // ---------- MONTHLY PAYMENT BREAKDOWN ----------
  if (stats.monthlyPayments && stats.monthlyPayments.length > 0) {
    ensureSpace(80);
    
    // Table headers and data
    const headers = [['Month', 'Cash', 'Bank', 'Hudle', 'Total']];
    
    const data = stats.monthlyPayments.map(monthData => [
      `${monthData.month} ${monthData.year}`,
      `₹${dataUtils.formatNumber(monthData.cashAmount)}`,
      `₹${dataUtils.formatNumber(monthData.bankAmount)}`,
      `₹${dataUtils.formatNumber(monthData.hudleAmount)}`,
      `₹${dataUtils.formatNumber(monthData.totalAmount)}`
    ]);
    
    // Add totals row
    data.push([
      `Total (${year.substring(0, 4)}-${year.substring(4, 6)})`,
      `₹${dataUtils.formatNumber(stats.cashAmount)}`,
      `₹${dataUtils.formatNumber(stats.bankAmount)}`,
      `₹${dataUtils.formatNumber(stats.hudleAmount)}`,
      `₹${dataUtils.formatNumber(stats.totalCollection)}`
    ]);
    
    // Add table
    autoTable(doc, {
      startY: y,
      head: headers,
      body: data,
      theme: 'grid',
      styles: {
        font: fontFamily,
        fontSize: 9,
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: [220, 220, 220],
        textColor: [60, 60, 60]
      },
      headStyles: {
        fillColor: theme.primary.default,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        4: { fontStyle: 'bold' }
      },
      margin: { left: startX, right: startX }
    });
    
    y = doc.lastAutoTable.finalY + 10;
  }

  // ---------- TOP CUSTOMERS ----------
  if (stats.topCustomers && stats.topCustomers.length > 0) {
    ensureSpace(60);
    const customerCardHeight = stats.topCustomers.length * 25 + 10;
    contentY = drawSectionCard('Top Customers', y, customerCardHeight, 'normal');
    
    stats.topCustomers.forEach((customer, index) => {
      const customerY = contentY + (index * 20);
      drawStatCard(startX + 2, customerY, contentWidth - 4, 
        `Top Customer #${index + 1}`, 
        customer.name,
        `${customer.bookingCount} bookings • ₹${dataUtils.formatNumber(customer.totalCollection)} • ${customer.phone}`
      );
    });
  }

  // Add footer with page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`, 
      pageWidth / 2, 
      pageHeight - 10, 
      { align: 'center' }
    );
  }
  
  // Save the PDF
  const fileName = `${locationName.toLowerCase().replace(/\s+/g, '-')}-report-${year}.pdf`;
  doc.save(fileName);
  
  console.log(`[LocationReport] PDF generated and saved as ${fileName}`);
}

/**
 * LocationReport component for displaying location-specific statistics and reports
 *
 * @param {string} props.locationId The location ID to display statistics for
 * @param {string} props.locationName The location name to display
 */
function LocationReport({ locationId, locationName }) {
  const [locationStats, setLocationStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedYear } = useApp();
  const { trackError } = useErrorTracker();

  // Load location-specific stats
  useEffect(() => {
    let mounted = true;
    
    async function loadLocationStats() {
      if (!locationId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.debug(`[LocationReport] Loading statistics for location: ${locationId} (${locationName})`);
        const stats = await statsService.getLocationStats(locationId);
        
        // Only update state if component is still mounted
        if (!mounted) return;
        
        if (!stats) {
          console.warn(`[LocationReport] No statistics found for location: ${locationName}`);
          setError(`No statistics available for ${locationName}. This could be because there are no bookings for this location or there was an error loading the data.`);
          setLocationStats(null);
          return;
        }
        
        setLocationStats(stats);
      } catch (err) {
        // Only update state if component is still mounted
        if (!mounted) return;
        
        console.error('[LocationReport] Error loading location stats:', err);
        setError(`Failed to load location statistics: ${err.message}`);
        trackError(
          err,
          'LocationReport.loadStats',
          ErrorSeverity.ERROR,
          ErrorCategory.DATA,
          { locationId, locationName }
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    
    loadLocationStats();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      mounted = false;
    };
  }, [locationId, locationName, trackError]);

  // Handle export to PDF
  const handleExportPDF = () => {
    if (!locationStats) return;
    generatePDF(locationStats, locationName, selectedYear);
  };

  // Handle export to text report
  const handleExportText = () => {
    if (!locationStats) return;
    const report = generateReport(locationStats, locationName, selectedYear);
    // Implementation for saving or displaying text report
    console.log(report);
  };

  if (isLoading) {
    return <Loading message={`Loading statistics for ${locationName}...`} />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Data"
        message={error}
        icon="error"
      />
    );
  }

  if (!locationStats) {
    return (
      <EmptyState
        title="No Data Available"
        message={`No statistics available for ${locationName}`}
        icon="empty"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">{locationName} Report</h2>
        <div className="space-x-2">
          <button 
            onClick={handleExportPDF}
            className="btn bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded"
          >
            Export PDF
          </button>
          <button
            onClick={handleExportText}
            className="btn border border-primary text-primary hover:bg-gray-100 px-4 py-2 rounded"
          >
            Export Text
          </button>
        </div>
      </div>

      {/* Financial Statistics */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Total Collection"
            value={locationStats.totalCollection}
            type="currency"
          />
          <StatsCard
            title="Outstanding Balance"
            value={locationStats.totalOutstanding}
            type="currency"
          />
          <StatsCard
            title="Average Booking Value"
            value={locationStats.avgBookingValue}
            type="currency"
          />
        </div>
      </div>

      {/* Booking Statistics */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Booking Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Total Bookings"
            value={locationStats.totalBookings}
            type="number"
          />
          <StatsCard
            title="Total Slots Booked"
            value={locationStats.totalSlots}
            type="number"
          />
          <StatsCard
            title="Unique Customers"
            value={locationStats.uniqueCustomers}
            type="number"
          />
          <StatsCard
            title="Confirmed bookings"
            value={locationStats.completionRate}
            type="percentage"
          />
          <StatsCard
            title="Average Slots per Booking"
            value={locationStats.avgSlotsPerBooking}
            type="number"
          />
          <StatsCard
            title="Online Bookings"
            value={locationStats.onlineBookingPercentage}
            type="percentage"
          />
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Payment Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Cash Payments"
            value={locationStats.cashAmount}
            type="currency"
            children={<span className="text-sm text-gray-500">{locationStats.cashPercentage.toFixed(1)}% (Cash)</span>}
          />
          <StatsCard
            title="Bank Payments"
            value={locationStats.bankAmount}
            type="currency"
            children={<span className="text-sm text-gray-500">{locationStats.bankPercentage.toFixed(1)}% (UPI + Bank Transfer)</span>}
          />
          <StatsCard
            title="Hudle Payments"
            value={locationStats.hudleAmount}
            type="currency"
            children={<span className="text-sm text-gray-500">{locationStats.hudlePercentage.toFixed(1)}% (App, QR, Pass & Wallet)</span>}
          />
        </div>
      </div>

      {/* Time Distribution */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Booking Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatsCard
            title="Peak Hours"
            value={locationStats.timeDistribution.peakHours}
            type="number"
            children={<span className="text-sm text-gray-500">{locationStats.timeDistribution.peakHoursPercentage}% (6:00 PM - 11:00 PM)</span>}
          />
          <StatsCard
            title="Non-Peak Hours"
            value={locationStats.timeDistribution.nonPeakHours}
            type="number"
            children={<span className="text-sm text-gray-500">{locationStats.timeDistribution.nonPeakHoursPercentage}% (11:00 PM - 6:00 PM)</span>}
          />
        </div>
      </div>

      {/* Top Customers */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Top Customers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locationStats.topCustomers.map((customer, index) => (
            <StatsCard
              key={customer.id}
              title={`Top Customer #${index + 1}`}
              value={customer.name}
              type="text"
              children={
                <div className="text-sm text-gray-500">
                  <div>Phone: {customer.phone}</div>
                  <div>{customer.bookingCount} bookings • ₹{dataUtils.formatNumber(customer.totalCollection)}</div>
                </div>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

LocationReport.propTypes = {
  locationId: PropTypes.string.isRequired,
  locationName: PropTypes.string.isRequired
};

export default LocationReport; 