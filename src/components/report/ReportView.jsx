import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../context/AppContext';
import { useBookings } from '../../hooks/useBookings';
import { useErrorTracker } from '../../hooks/useErrorTracker';
import { ErrorSeverity, ErrorCategory } from '../../utils/errorTypes';
import { dataUtils } from '../../utils/dataUtils';
import { statsService } from '../../services/statsService';
import { ASSETS } from '../../utils/assets';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import { ptSansFontData, initFonts } from '../../utils/fonts';

/**
 * StatCard component for displaying individual statistics
 */
function StatCard({ title, value, description, tooltip }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h4 className="text-sm font-medium text-gray-500 mb-2">{title}</h4>
      {tooltip ? (
        <div className="relative group">
          <div className="text-2xl font-bold text-primary mb-1 cursor-pointer">{value}</div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      ) : (
        <div className="text-2xl font-bold text-primary mb-1">{value}</div>
      )}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string,
  tooltip: PropTypes.string
};

/**
 * Generate plain text report with location statistics
 * @param {Object} stats - Location statistics
 * @param {string} facilityName - Name of the location
 * @param {string} year - Selected year
 * @returns {string} Formatted report text
 */
function generateReport(stats, facilityName, year) {
  const report = [];
  
  // Header
  report.push(`${facilityName} Statistics Report`);
  report.push(`Year: ${year.substring(0, 4)}-${year.substring(4, 6)}`);
  report.push(`Generated: ${new Date().toLocaleString()}`);
  report.push(``);

  // Financial Overview
  report.push('FINANCIAL OVERVIEW');
  report.push('-'.repeat(30));
  report.push(`Total Collection: ₹${dataUtils.formatNumber(stats.totalCollection)}`);
  report.push(`Outstanding Balance: ₹${dataUtils.formatNumber(stats.totalOutstanding)}`);
  report.push(`Average Booking Value: ₹${dataUtils.formatNumber(stats.avgBookingValue)}`);
  report.push('');

  // Booking Metrics
  report.push('BOOKING METRICS');
  report.push('-'.repeat(30));
  report.push(`Total Bookings: ${dataUtils.formatNumber(stats.totalBookings)}`);
  report.push(`Total Slots: ${dataUtils.formatNumber(stats.totalSlots)}`);
  report.push(`Unique Customers: ${dataUtils.formatNumber(stats.uniqueCustomers)}`);
  report.push(`Completion Rate: ${Math.round(stats.completionRate)}%`);
  report.push(`Average Slots per Booking: ${dataUtils.formatNumber(stats.avgSlotsPerBooking)}`);
  report.push(`Online Bookings: ${Math.round(stats.onlineBookingPercentage)}% (${dataUtils.formatNumber(stats.onlineBookings)} bookings)`);
  report.push('');

  // Payment Methods
  report.push('PAYMENT METHODS');
  report.push('-'.repeat(30));
  report.push(`Cash Payments: ₹${dataUtils.formatNumber(stats.cashAmount)} (${stats.cashPercentage}%)`);
  report.push(`Bank Payments: ₹${dataUtils.formatNumber(stats.bankAmount)} (${stats.bankPercentage}%)`);
  report.push(`Hudle Payments: ₹${dataUtils.formatNumber(stats.hudleAmount)} (${stats.hudlePercentage}%)`);
  report.push('');

  // Monthly Payment Breakdown
  report.push('MONTHLY PAYMENT BREAKDOWN');
  report.push('-'.repeat(30));
  report.push('Month\tYear\tCash\tBank\tHudle\tTotal');
  report.push('-'.repeat(70));
  stats.monthlyPayments.forEach(monthData => {
    report.push(
      `${monthData.month}\t${monthData.year}\t₹${dataUtils.formatNumber(monthData.cashAmount)} (${monthData.cashPercentage}%)\t` +
      `₹${dataUtils.formatNumber(monthData.bankAmount)} (${monthData.bankPercentage}%)\t` +
      `₹${dataUtils.formatNumber(monthData.hudleAmount)} (${monthData.hudlePercentage}%)\t` +
      `₹${dataUtils.formatNumber(monthData.totalAmount)}`
    );
  });
  report.push('-'.repeat(70));
  report.push(
    `Total\t${year.substring(0, 4)}-${year.substring(4, 6)}\t` +
    `₹${dataUtils.formatNumber(stats.cashAmount)} (${stats.cashPercentage}%)\t` +
    `₹${dataUtils.formatNumber(stats.bankAmount)} (${stats.bankPercentage}%)\t` +
    `₹${dataUtils.formatNumber(stats.hudleAmount)} (${stats.hudlePercentage}%)\t` +
    `₹${dataUtils.formatNumber(stats.totalCollection)}`
  );
  report.push('');

  // Time Distribution
  report.push('BOOKING DISTRIBUTION');
  report.push('-'.repeat(30));
  report.push(`Peak Hours (6:00 PM - 11:00 PM): ${dataUtils.formatNumber(stats.timeDistribution.peakHours)} bookings (${stats.timeDistribution.peakHoursPercentage}%)`);
  report.push(`Non-Peak Hours (11:00 PM - 6:00 PM): ${dataUtils.formatNumber(stats.timeDistribution.nonPeakHours)} bookings (${stats.timeDistribution.nonPeakHoursPercentage}%)`);
  report.push('');

  // Top Customers
  report.push('TOP CUSTOMERS');
  report.push('-'.repeat(30));
  stats.topCustomers.forEach((customer, index) => {
    report.push(`${index + 1}. ${customer.name}`);
    report.push(`   Phone: ${customer.phone}`);
    report.push(`   Bookings: ${customer.bookingCount}`);
    report.push(`   Total Spent: ₹${dataUtils.formatNumber(customer.totalCollection)}`);
    if (index < stats.topCustomers.length - 1) report.push('');
  });

  return report.join('\n');
}

/**
 * Generate modern styled PDF report with optimized page breaks and spacing
 * @param {Object} stats - Location statistics
 * @param {string} facilityName - Name of the location
 * @param {string} year - Selected year
 */
function generatePDF(stats, facilityName, year) {
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
  
  console.log(`[ReportView] Generating PDF with font "${fontFamily}" (fonts initialized: ${fontsInitialized})`);
  
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

  // A4 page constants - more precise measurements for better spacing
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margins = { left: 15, right: 15, top: 15, bottom: 20 };
  const contentWidth = pageWidth - margins.left - margins.right;
  const contentHeight = pageHeight - margins.top - margins.bottom;
  const startX = margins.left;
  let y = margins.top + 10; // Starting Y position with small offset
  
  // Constants for spacing and sizing
  const cardMargin = 7;  // Space between cards
  const sectionMargin = 10; // Space between sections
  
  // Function to check if adding content would overflow the page and add a new page if needed
  const ensureSpace = (requiredSpace, forcePage = false) => {
    const remainingSpace = pageHeight - margins.bottom - y;
    if (forcePage || remainingSpace < requiredSpace) {
      doc.addPage();
      y = margins.top;
      
      // Add subtle header to the new page
      doc.setFillColor(theme.primary.ultraLight[0], theme.primary.ultraLight[1], theme.primary.ultraLight[2]);
      doc.rect(0, 0, pageWidth, 15, 'F');
      doc.setDrawColor(theme.primary.light[0], theme.primary.light[1], theme.primary.light[2]);
      doc.setLineWidth(0.3);
      doc.line(0, 15, pageWidth, 15);
      
      // Add page title
      doc.setFontSize(12);
      doc.setFont(fontFamily, 'bold');
      doc.setTextColor(theme.primary.dark[0], theme.primary.dark[1], theme.primary.dark[2]);
      doc.text(`${facilityName} Statistics Report (Continued)`, startX, 10);
      
      y = margins.top;
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
    console.warn('[ReportView] Failed to add logo:', error);
    // Fallback to circle if image fails
    doc.setFillColor(theme.primary.default[0], theme.primary.default[1], theme.primary.default[2]);
    doc.circle(30, 20, 10, 'F');
  }
  
  // Title area
  doc.setFontSize(22);
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(theme.primary.dark[0], theme.primary.dark[1], theme.primary.dark[2]);
  doc.text(`${facilityName} Statistics Report`, 50, 22);
  
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
    doc.setDrawColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.roundedRect(startX, startY, contentWidth, 8, 3, 3, 'D');
    
    // Card title
    doc.setFontSize(13);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, startX + 5, startY + 5.5);
    
    return startY + 12; // Return Y position for content to start
  };
  
  // Helper function for stat cards - with refined sizing
  const drawStatCard = (x, y, width, label, value, description = null) => {
    const cardHeight = description ? 22 : 18; // Reduced heights for more compact cards
    const padding = 3;  // Reduced padding for more compact look
    
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, width, cardHeight, 2, 2, 'FD');
    
    // Top label
    doc.setFontSize(8);
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(theme.text.light[0], theme.text.light[1], theme.text.light[2]);
    doc.text(label, x + padding, y + padding + 3);  // Adjusted Y position
    
    // Value
    doc.setFontSize(14);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(theme.primary.default[0], theme.primary.default[1], theme.primary.default[2]);
    doc.text(value, x + padding, y + padding + 11);  // Adjusted position
    
    // Description (if provided)
    if (description) {
      doc.setFontSize(8);
      doc.setFont(fontFamily, 'normal');
      doc.setTextColor(theme.text.light[0], theme.text.light[1], theme.text.light[2]);
      doc.text(description, x + padding, y + padding + 18);  // Adjusted position
    }
    
    return cardHeight; // Return just card height for better spacing control
  };
  
  // ---------- PAGE 1: BOOKING METRICS ----------
  // More precise calculation of section heights
  const bookingCardHeight = 62; // Reduced from 70
  let contentY = drawSectionCard('Booking Metrics', y, bookingCardHeight, 'bookings');
  
  // Create a grid of 2x2 stat cards in the bookings section
  const bookingCardY = contentY;
  const halfCardWidth = (contentWidth - 4) / 2; // Reduced gap between cards
  
  // First row
  drawStatCard(startX + 1, bookingCardY, halfCardWidth - 1, 'Total Bookings', 
    dataUtils.formatNumber(stats.totalBookings), 'Number of bookings');
  
  drawStatCard(startX + halfCardWidth + 2, bookingCardY, halfCardWidth - 1, 'Total Slots', 
    dataUtils.formatNumber(stats.totalSlots), 'Total slots booked');
  
  // Second row - adjust Y position precisely
  drawStatCard(startX + 1, bookingCardY + 25, halfCardWidth - 1, 'Unique Customers', 
    dataUtils.formatNumber(stats.uniqueCustomers), 'Individual customers');
  
  drawStatCard(startX + halfCardWidth + 2, bookingCardY + 25, halfCardWidth - 1, 'Completion Rate', 
    `${Math.round(stats.completionRate)}%`, 'Confirmed bookings');
  
  y += bookingCardHeight + cardMargin;

  // ---------- BOOKING DISTRIBUTION SECTION ----------
  const distributionCardHeight = 38; // Reduced height
  ensureSpace(distributionCardHeight + sectionMargin);
  contentY = drawSectionCard('Booking Distribution', y, distributionCardHeight, 'bookings');
  
  // Create a grid of 2 stat cards in the distribution section
  const distributionCardY = contentY;
  
  drawStatCard(startX + 1, distributionCardY, halfCardWidth - 1, 'Peak Hours (6:00 PM - 11:00 PM)', 
    `${dataUtils.formatNumber(stats.timeDistribution.peakHours)} bookings`, 
    `${stats.timeDistribution.peakHoursPercentage}% of total bookings`);
  
  drawStatCard(startX + halfCardWidth + 2, distributionCardY, halfCardWidth - 1, 'Non-Peak Hours (11:00 PM - 6:00 PM)', 
    `${dataUtils.formatNumber(stats.timeDistribution.nonPeakHours)} bookings`, 
    `${stats.timeDistribution.nonPeakHoursPercentage}% of total bookings`);
  
  y += distributionCardHeight + cardMargin;

  // ---------- ONLINE VS OFFLINE SECTION ----------
  const onlineOfflineHeight = 38; // Keep same height as distribution section
  ensureSpace(onlineOfflineHeight + sectionMargin);
  contentY = drawSectionCard('Online vs Offline Bookings', y, onlineOfflineHeight, 'bookings');
  
  // Calculate online vs offline statistics
  const onlineBookings = stats.onlineBookings;
  const offlineBookings = stats.totalBookings - onlineBookings;
  const onlinePercentage = stats.onlineBookingPercentage;
  const offlinePercentage = 100 - onlinePercentage;
  
  // Create a grid of 2 stat cards in the online/offline section
  const onlineOfflineCardY = contentY;
  
  drawStatCard(startX + 1, onlineOfflineCardY, halfCardWidth - 1, 'Online Bookings', 
    `${dataUtils.formatNumber(onlineBookings)} bookings`, 
    `${onlinePercentage.toFixed(1)}% of total bookings`);
  
  drawStatCard(startX + halfCardWidth + 2, onlineOfflineCardY, halfCardWidth - 1, 'Offline Bookings', 
    `${dataUtils.formatNumber(offlineBookings)} bookings`, 
    `${offlinePercentage.toFixed(1)}% of total bookings`);

  y += distributionCardHeight + cardMargin;

   // ---------- TOP CUSTOMERS ----------

  // Top Customers Section - calculate exact height needed
  const customerCardHeight = 15; // Height of each customer card
  const customerSpacing = 3; // Space between customer cards
  const topCustomersHeight = (stats.topCustomers.length * (customerCardHeight + customerSpacing)) + 12;
  
  contentY = drawSectionCard('Top Customers', y, topCustomersHeight, 'bookings');
  
  // Draw top customer cards - more compact layout
  stats.topCustomers.forEach((customer, index) => {
    const customerY = contentY + (index * (customerCardHeight + customerSpacing));
    
    // Customer card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(245, 245, 245);
    doc.setLineWidth(0.2);
    doc.roundedRect(startX + 2, customerY, contentWidth - 4, customerCardHeight, 2, 2, 'FD');
    
    // Number indicator - smaller circle
    doc.setFillColor(theme.primary.light[0], theme.primary.light[1], theme.primary.light[2]);
    doc.circle(startX + 12, customerY + customerCardHeight/2, 6, 'F');
    doc.setFontSize(12);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${index + 1}`, startX + 12, customerY + customerCardHeight/2 + 1, null, null, 'center');
    
    // Customer name - positioned for optimal spacing
    doc.setFontSize(11); // Slightly smaller
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(theme.text.dark[0], theme.text.dark[1], theme.text.dark[2]);
    doc.text(customer.name, startX + 22, customerY + 5);
    
    // Phone number - positioned on the same line as bookings for space efficiency
    doc.setFontSize(8);
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(theme.text.medium[0], theme.text.medium[1], theme.text.medium[2]);
    doc.text(`Phone: ${customer.phone}`, startX + 22, customerY + 10);
    
    // Bookings count
    doc.setFontSize(8);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(theme.primary.default[0], theme.primary.default[1], theme.primary.default[2]);
    doc.text(`${customer.bookingCount} bookings`, startX + 100, customerY + 8);
    
    // Revenue amount - right aligned
    doc.setFontSize(11);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(theme.primary.light[0], theme.primary.light[1], theme.primary.light[2]);
    doc.text(`₹${dataUtils.formatNumber(customer.totalCollection)}`, startX + contentWidth - 6, customerY + 8, { align: 'right' });
  });

  
  // ---------- PAGE 2: FINANCIAL SECTIONS ----------
  // Always start page 2 with financial overview
  doc.addPage();
  y = margins.top;

  // Financial Overview Section
  const financialCardHeight = 38; // Reduced height
  contentY = drawSectionCard('Financial Overview', y, financialCardHeight, 'financial');
  
  // Create a grid of 3 stat cards in the financial section
  const cardWidth = (contentWidth - 6) / 3; // 3 cards with smaller gaps
  const financialCardY = contentY;
  
  drawStatCard(startX + 1, financialCardY, cardWidth - 1, 'Total Collection', 
    `₹${dataUtils.formatNumber(stats.totalCollection)}`, 'Total revenue collected');
  
  drawStatCard(startX + cardWidth + 2, financialCardY, cardWidth - 1, 'Outstanding Balance', 
    `₹${dataUtils.formatNumber(stats.totalOutstanding)}`, 'Pending payments');
  
  drawStatCard(startX + (cardWidth * 2) + 3, financialCardY, cardWidth - 1, 'Average Booking Value', 
    `₹${dataUtils.formatNumber(stats.avgBookingValue)}`, 'Revenue per booking');
  
  y += financialCardHeight + cardMargin + 5;

  // Monthly Payment Breakdown Table - calculate height based on data
  // Estimate row height as 8mm per row plus headers
  const estimatedRowHeight = 8;
  const tableHeight = (stats.monthlyPayments.length + 2) * estimatedRowHeight; // +2 for header and total rows
  
  contentY = drawSectionCard('Monthly Payment Breakdown', y, tableHeight, 'normal');
  
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
  
  // Add table - optimized for compact display
  autoTable(doc, {
    startY: contentY,
    head: headers,
    body: data,
    theme: 'grid',
    styles: {
      font: fontFamily,
      fontSize: 9,
      cellPadding: 2, // Reduced padding
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
      textColor: [60, 60, 60],
      valign: 'middle',
      halign: 'center'
    },
    headStyles: {
      fillColor: theme.primary.default,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    footStyles: {
      fillColor: theme.primary.default,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      4: { fontStyle: 'bold' }
    },
    margin: { left: startX, right: startX },
    tableWidth: contentWidth,
    didParseCell: function(data) {
      // Style the total row
      if (data.row.index === data.table.body.length - 1) {
        data.cell.styles.fillColor = theme.primary.default;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  y = doc.lastAutoTable.finalY + cardMargin;

  // Payment Method Distribution - visual bar
  const paymentPercentagesHeight = 32; // Further reduced height
  ensureSpace(paymentPercentagesHeight + sectionMargin);
  contentY = drawSectionCard('Payment Method Distribution', y, paymentPercentagesHeight, 'normal');
  
  // Draw percentage bars for payment methods
  const percentageBarY = contentY + 3; // Reduced offset
  const percentageBarHeight = 8; // Reduced height
  const barWidth = contentWidth - 4;
  
  // Background for percentage bar
  doc.setFillColor(240, 240, 240);
  doc.rect(startX + 2, percentageBarY, barWidth, percentageBarHeight, 'F');
  
  // Calculate widths for each payment type
  const cashWidth = (stats.cashPercentage / 100) * barWidth;
  const bankWidth = (stats.bankPercentage / 100) * barWidth;
  const hudleWidth = (stats.hudlePercentage / 100) * barWidth;
  
  // Draw bars for each payment type
  let currentX = startX + 2;
  
  // Cash bar
  doc.setFillColor(theme.primary.default[0], theme.primary.default[1], theme.primary.default[2]);
  doc.rect(currentX, percentageBarY, cashWidth, percentageBarHeight, 'F');
  
  // Bank bar
  currentX += cashWidth;
  doc.setFillColor(theme.primary.light[0], theme.primary.light[1], theme.primary.light[2]);
  doc.rect(currentX, percentageBarY, bankWidth, percentageBarHeight, 'F');
  
  // Hudle bar
  currentX += bankWidth;
  doc.setFillColor(theme.primary.dark[0], theme.primary.dark[1], theme.primary.dark[2]);
  doc.rect(currentX, percentageBarY, hudleWidth, percentageBarHeight, 'F');
  
  // Add labels directly in/under the bars based on size
  const labelY = percentageBarY + percentageBarHeight + 5; // Positioned closer to bar
  
  // Payment method labels
  doc.setFontSize(8);
  doc.setFont(fontFamily, 'bold');
  
  // Cash label
  const cashLabelX = startX + 2 + (cashWidth / 2);
  doc.setTextColor(theme.primary.default[0], theme.primary.default[1], theme.primary.default[2]);
  doc.text(`Cash: ${stats.cashPercentage.toFixed(1)}%`, cashLabelX, labelY, { align: 'center' });
  
  // Bank label
  const bankLabelX = startX + 2 + cashWidth + (bankWidth / 2);
  doc.setTextColor(theme.primary.light[0], theme.primary.light[1], theme.primary.light[2]);
  doc.text(`Bank: ${stats.bankPercentage.toFixed(1)}%`, bankLabelX, labelY, { align: 'center' });
  
  // Hudle label
  const hudleLabelX = startX + 2 + cashWidth + bankWidth + (hudleWidth / 2);
  doc.setTextColor(theme.primary.dark[0], theme.primary.dark[1], theme.primary.dark[2]);
  doc.text(`Hudle: ${stats.hudlePercentage.toFixed(1)}%`, hudleLabelX, labelY, { align: 'center' });

 

  // Add footer with page numbers to all pages
  const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(startX, pageHeight - 15, pageWidth - startX, pageHeight - 15);
      
      // App name (left)
      doc.setFontSize(8);
      doc.setFont(fontFamily, 'normal');
      doc.setTextColor(theme.primary.default[0], theme.primary.default[1], theme.primary.default[2]);
      doc.text('ClayGrounds Management System', startX, pageHeight - 8);
      
      // Page numbers (center)
      doc.setFontSize(8);
      doc.setFont(fontFamily, 'normal');
      doc.setTextColor(theme.text.light[0], theme.text.light[1], theme.text.light[2]);
      doc.text(
        `Page ${i} of ${pageCount}`, 
        pageWidth / 2, 
        pageHeight - 8, 
        { align: 'center' }
      );
      
      // Generated timestamp (right)
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      doc.text(
        `Generated on ${dateStr} at ${timeStr}`, 
        pageWidth - startX, 
        pageHeight - 8, 
        { align: 'right' }
      );
    }
  };
  
  // Add footer to all pages
  addFooter(doc);
  
  // Save the PDF
  const fileName = `${facilityName.toLowerCase().replace(/\s+/g, '-')}-report-${year}.pdf`;
  doc.save(fileName);
  
  console.log(`[ReportView] PDF generated and saved as ${fileName}`);
}

/**
 * ReportView component for displaying location-specific statistics
 *
 * @param {string} props.facilityId The location ID to display statistics for
 * @param {string} props.facilityName The location name to display
 */
function ReportView({ facilityId, facilityName }) {
  const { selectedYear, bookingsData, isLoading } = useApp();
  const { trackError } = useErrorTracker();
  const [locationData, setLocationData] = useState([]);
  const [locationStats, setLocationStats] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Filter bookings for the selected location
  useEffect(() => {
    if (!bookingsData || !facilityId) return;

    try {
      console.log(`[ReportView] Filtering data for location: ${facilityName} (${facilityId})`);
      
      // Filter bookings for this location
      const filteredData = bookingsData.filter(booking => 
        booking.Location === facilityName
      );
      
      setLocationData(filteredData);
      console.log(`[ReportView] Filtered ${filteredData.length} bookings for location`);
    } catch (error) {
      console.error('[ReportView] Error filtering location data:', error);
      trackError(
        error,
        'ReportView.filterLocationData',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
    }
  }, [bookingsData, facilityId, facilityName, trackError]);

  // Calculate statistics for the location
  useEffect(() => {
    if (!locationData.length) return;

    try {
      console.log(`[ReportView] Calculating statistics for ${facilityName}`);
      
      // Calculate basic statistics
      const stats = {
        totalBookings: locationData.length,
        totalCollection: dataUtils.sum(locationData, 'Total Paid'),
        totalOutstanding: dataUtils.sum(locationData, 'Balance'),
        totalSlots: dataUtils.sum(locationData, 'Number of slots'),
        uniqueCustomers: new Set(locationData.map(b => b.Phone)).size,
        avgBookingValue: 0,
        avgSlotsPerBooking: 0,
        completionRate: 0,
        onlineBookings: 0,
        onlineBookingPercentage: 0,
        
        // Payment Methods
        cashAmount: dataUtils.sum(locationData, 'Cash'),
        bankAmount: dataUtils.sum(locationData, 'UPI') + dataUtils.sum(locationData, 'Bank Transfer'),
        hudleAmount: dataUtils.sum(locationData, 'Hudle App') + 
                    dataUtils.sum(locationData, 'Hudle QR') + 
                    dataUtils.sum(locationData, 'Hudle Discount') + 
                    dataUtils.sum(locationData, 'Hudle Pass') + 
                    dataUtils.sum(locationData, 'Venue Wallet') + 
                    dataUtils.sum(locationData, 'Hudle Wallet')
      };

      // Calculate payment percentages
      const totalPayments = stats.cashAmount + stats.bankAmount + stats.hudleAmount;
      if (totalPayments > 0) {
        stats.cashPercentage = (stats.cashAmount / totalPayments) * 100;
        stats.bankPercentage = (stats.bankAmount / totalPayments) * 100;
        stats.hudlePercentage = (stats.hudleAmount / totalPayments) * 100;
      }

      // Calculate averages
      stats.avgBookingValue = Math.round(stats.totalCollection / stats.totalBookings / 100) * 100;
      stats.avgSlotsPerBooking = Math.round(stats.totalSlots / stats.totalBookings);

      // Calculate completion rate
      const completedBookings = locationData.filter(b => b.Status === 'Confirmed').length;
      stats.completionRate = (completedBookings / stats.totalBookings) * 100;

      // Calculate online bookings
      stats.onlineBookings = locationData.filter(b => b.Source === 'Online').length;
      stats.onlineBookingPercentage = (stats.onlineBookings / stats.totalBookings) * 100;

      // Calculate time distribution
      const timeDistribution = statsService.calculateTimeDistribution(locationData);
      stats.timeDistribution = timeDistribution;

      // Calculate top customers
      stats.topCustomers = statsService.calculateTopCustomers(locationData, 'revenue', 3);

      // Calculate monthly payments
      stats.monthlyPayments = statsService.calculateMonthlyPayments(locationData);
      
      setLocationStats(stats);
      console.log('[ReportView] Location statistics calculated:', stats);
    } catch (error) {
      console.error('[ReportView] Error calculating location statistics:', error);
      trackError(
        error,
        'ReportView.calculateLocationStats',
        ErrorSeverity.ERROR,
        ErrorCategory.DATA
      );
    }
  }, [locationData, facilityName, trackError]);

  // Function to handle report export
  const handleExport = (format = 'txt') => {
    if (!locationStats) return;
    
    if (format === 'txt') {
      const reportText = generateReport(locationStats, facilityName, selectedYear);
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${facilityName.toLowerCase().replace(/\s+/g, '-')}-report-${selectedYear}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      generatePDF(locationStats, facilityName, selectedYear);
    }
    
    setShowExportDropdown(false);
  };

  // Show loading state
  if (isLoading) {
    return <Loading message={`Loading data for ${facilityName}...`} />;
  }

  // Show empty state if no data
  if (!locationData.length) {
    return (
      <EmptyState
        title="No Data Available"
        message={`There is no booking data available for ${facilityName} in the selected year.`}
        icon="empty"
      />
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">{facilityName} Statistics</h2>
          <p className="text-text-light">
            Year: {selectedYear.substring(0, 4)}-{selectedYear.substring(4, 6)} • 
            {locationData.length} bookings
          </p>
        </div>
        {locationStats && (
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Export Report</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                <button
                  onClick={() => handleExport('txt')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span>Export as Text</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span>Export as PDF</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Basic Statistics */}
      {locationStats && (
        <div className="space-y-8">
          {/* Financial Statistics */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Financial Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Total Collection"
                value={`₹${dataUtils.formatNumber(locationStats.totalCollection)}`}
              />
              <StatCard
                title="Outstanding Balance"
                value={`₹${dataUtils.formatNumber(locationStats.totalOutstanding)}`}
              />
              <StatCard
                title="Average Booking Value"
                value={`₹${dataUtils.formatNumber(locationStats.avgBookingValue)}`}
              />
            </div>
          </div>

          {/* Booking Statistics */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Booking Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Total Bookings"
                value={dataUtils.formatNumber(locationStats.totalBookings)}
              />
              <StatCard
                title="Total Slots Booked"
                value={dataUtils.formatNumber(locationStats.totalSlots)}
              />
              <StatCard
                title="Unique Customers"
                value={dataUtils.formatNumber(locationStats.uniqueCustomers)}
              />
              <StatCard
                title="Confirmed bookings"
                value={`${Math.round(locationStats.completionRate)}%`}
              />
              <StatCard
                title="Average Slots per Booking"
                value={dataUtils.formatNumber(locationStats.avgSlotsPerBooking)}
              />
              <StatCard
                title="Online Bookings"
                value={`${Math.round(locationStats.onlineBookingPercentage)}%`}
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Payment Methods</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Cash Payments"
                value={dataUtils.formatCurrency(locationStats.cashAmount)}
                description={`${locationStats.cashPercentage.toFixed(1)}% (Cash)`}
              />
              <StatCard
                title="Bank Payments"
                value={dataUtils.formatCurrency(locationStats.bankAmount)}
                description={`${locationStats.bankPercentage.toFixed(1)}% (UPI + Bank Transfer)`}
              />
              <StatCard
                title="Hudle Payments"
                value={dataUtils.formatCurrency(locationStats.hudleAmount)}
                description={`${locationStats.hudlePercentage.toFixed(1)}% (App, QR, Pass & Wallet)`}
              />
            </div>
          </div>

          {/* Time Distribution */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Booking Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Peak Hours"
                value={dataUtils.formatNumber(locationStats.timeDistribution.peakHours)}
                description={`${locationStats.timeDistribution.peakHoursPercentage}% (6:00 PM - 11:00 PM)`}
              />
              <StatCard
                title="Non-Peak Hours"
                value={dataUtils.formatNumber(locationStats.timeDistribution.nonPeakHours)}
                description={`${locationStats.timeDistribution.nonPeakHoursPercentage}% (11:00 PM - 6:00 PM)`}
              />
            </div>
          </div>

          {/* Monthly Payment Breakdown */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Monthly Payment Breakdown</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-primary">
                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                      Month
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                      Year
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                      Cash
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                      Bank
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                      Hudle
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locationStats.monthlyPayments.map((monthData, index) => (
                    <tr key={monthData.month} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary">
                        {monthData.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {monthData.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        ₹{dataUtils.formatNumber(monthData.cashAmount)}
                        <span className="text-gray-500 text-xs ml-1">({monthData.cashPercentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        ₹{dataUtils.formatNumber(monthData.bankAmount)}
                        <span className="text-gray-500 text-xs ml-1">({monthData.bankPercentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        ₹{dataUtils.formatNumber(monthData.hudleAmount)}
                        <span className="text-gray-500 text-xs ml-1">({monthData.hudlePercentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-primary">
                        ₹{dataUtils.formatNumber(monthData.totalAmount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-primary bg-opacity-10 font-medium">
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary uppercase">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary">
                      {selectedYear.substring(0, 4)}-{selectedYear.substring(4, 6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary">
                      ₹{dataUtils.formatNumber(locationStats.cashAmount)}
                      <span className="text-gray-500 text-xs ml-1">({locationStats.cashPercentage.toFixed(1)}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary">
                      ₹{dataUtils.formatNumber(locationStats.bankAmount)}
                      <span className="text-gray-500 text-xs ml-1">({locationStats.bankPercentage.toFixed(1)}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-primary">
                      ₹{dataUtils.formatNumber(locationStats.hudleAmount)}
                      <span className="text-gray-500 text-xs ml-1">({locationStats.hudlePercentage.toFixed(1)}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-primary">
                      ₹{dataUtils.formatNumber(locationStats.totalCollection)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Customers */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Top Customers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locationStats.topCustomers.map((customer, index) => (
                <StatCard
                  key={customer.id}
                  title={`Top Customer #${index + 1}`}
                  value={customer.name}
                  tooltip={`Phone: ${customer.phone}`}
                  description={`${customer.bookingCount} bookings • ₹${dataUtils.formatNumber(customer.totalCollection)}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReportView.propTypes = {
  facilityId: PropTypes.string.isRequired,
  facilityName: PropTypes.string.isRequired
};

export default ReportView;