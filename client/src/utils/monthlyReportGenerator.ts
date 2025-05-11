/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from "date-fns";
import '../styles/report-modal.css';
import jsPDF from "jspdf";
import { formatCurrency } from "./formatters";

export interface MonthlyReportData {
  period: string;
  stats: {
    activeBookings: number;
    pendingBookings: number;
    totalBookings: number;
    revenue: number;
    formattedRevenue: string;
    roomRevenue: number;
    venueRevenue: number;
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    checkedInCount: number;
  };
  bookingStatusCounts: {
    reserved: number;
    checked_out: number;
    cancelled: number;
    no_show: number;
    rejected: number;
  };
  areaNames: string[];
  areaRevenueValues: number[];
  areaBookingValues: number[];
  roomNames: string[];
  roomRevenueValues: number[];
  roomBookingValues: number[];
  charts: {
    bookingStatusChart?: HTMLCanvasElement;
    roomRevenueChart?: HTMLCanvasElement;
    areaRevenueChart?: HTMLCanvasElement;
  };
}

export const generateNativePDF = (data: MonthlyReportData): jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const styles = {
    colors: {
      primary: '#2b6cb0',
      secondary: '#4a5568',
      tertiary: '#718096',
      light: '#e2e8f0',
      background: '#f7fafc', 
      white: '#ffffff',
      divider: '#cbd5e0'
    },
    fonts: {
      header: 18,
      subheader: 14,
      sectionTitle: 12,
      normal: 10,
      small: 8
    },
    spacing: {
      margin: 15,
      headerBottom: 10,
      sectionTop: 15,
      sectionBottom: 10,
      paragraphBottom: 5,
      tableRowHeight: 7,
      kpiBoxHeight: 25,
      chartHeight: 70
    }
  };

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - (styles.spacing.margin * 2);

  let y = styles.spacing.margin;

  doc.setFillColor(styles.colors.primary);
  doc.rect(styles.spacing.margin, y, 10, 10, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(styles.fonts.header);
  doc.setTextColor(styles.colors.primary);
  doc.text("Azurea Hotel Management System", styles.spacing.margin + 15, y + 7);
  
  y += 15;
  
  doc.setFontSize(styles.fonts.subheader);
  doc.setTextColor(styles.colors.secondary);
  doc.text(`Monthly Performance Report - ${data.period}`, styles.spacing.margin, y);
  
  doc.setFontSize(styles.fonts.small);
  doc.setTextColor(styles.colors.tertiary);
  const generationDate = `Generated: ${format(new Date(), "PPpp")}`;
  const dateWidth = doc.getStringUnitWidth(generationDate) * styles.fonts.small / doc.internal.scaleFactor;
  doc.text(generationDate, pageWidth - styles.spacing.margin - dateWidth, y);
  
  y += styles.spacing.headerBottom;
  
  drawDivider(doc, y, styles);
  y += styles.spacing.sectionTop;

  y = drawSectionHeader(doc, "Executive Summary", y, styles);
  
  const occupancyRate = ((data.stats.occupiedRooms / data.stats.totalRooms) * 100).toFixed(1) + "%";
  
  const summaryText = `This monthly performance report provides an overview of hotel operations for ${data.period}. The hotel recorded ${data.stats.totalBookings} total bookings with ${data.stats.formattedRevenue} in revenue. The current occupancy rate is ${occupancyRate}.`;
  y = drawParagraph(doc, summaryText, styles.spacing.margin, y, contentWidth, styles);
  
  y += styles.spacing.sectionBottom;
  
  y = drawSectionHeader(doc, "Key Performance Indicators", y, styles);
  
  const kpiSpacing = 5;
  const kpiWidth = (contentWidth - (kpiSpacing * 3)) / 4;
  
  drawKpiBox(doc, "Total Bookings", data.stats.totalBookings.toString(), styles.spacing.margin, y, kpiWidth, styles);
  drawKpiBox(doc, "Active Bookings", data.stats.activeBookings.toString(), styles.spacing.margin + kpiWidth + kpiSpacing, y, kpiWidth, styles);
  drawKpiBox(doc, "Revenue", data.stats.formattedRevenue, styles.spacing.margin + (kpiWidth + kpiSpacing) * 2, y, kpiWidth, styles);
  drawKpiBox(doc, "Occupancy", occupancyRate, styles.spacing.margin + (kpiWidth + kpiSpacing) * 3, y, kpiWidth, styles);
  
  y += styles.spacing.kpiBoxHeight + kpiSpacing;
  
  drawKpiBox(doc, "Pending Bookings", data.stats.pendingBookings.toString(), styles.spacing.margin, y, kpiWidth, styles);
  drawKpiBox(doc, "Checked-in", data.stats.checkedInCount.toString(), styles.spacing.margin + kpiWidth + kpiSpacing, y, kpiWidth, styles);
  drawKpiBox(doc, "Available Rooms", data.stats.availableRooms.toString(), styles.spacing.margin + (kpiWidth + kpiSpacing) * 2, y, kpiWidth, styles);
  drawKpiBox(doc, "Total Rooms", data.stats.totalRooms.toString(), styles.spacing.margin + (kpiWidth + kpiSpacing) * 3, y, kpiWidth, styles);
  
  y += styles.spacing.kpiBoxHeight + styles.spacing.sectionBottom;
  
  drawDivider(doc, y, styles);
  y += styles.spacing.sectionTop;

  y = drawSectionHeader(doc, "Booking Status Distribution", y, styles);
  
  const statusData = [
    { label: "Reserved", value: data.bookingStatusCounts.reserved, color: "#4299e1" },
    { label: "Checked Out", value: data.bookingStatusCounts.checked_out, color: "#48bb78" },
    { label: "Cancelled", value: data.bookingStatusCounts.cancelled, color: "#f56565" },
    { label: "No Show", value: data.bookingStatusCounts.no_show, color: "#ed8936" },
    { label: "Rejected", value: data.bookingStatusCounts.rejected, color: "#9f7aea" }  // Purple
  ];
  
  const barHeight = 12;
  const barSpacing = 5;
  let startY = y + 10;
  
  statusData.forEach((status) => {
    doc.setFillColor(status.color);
    doc.rect(styles.spacing.margin, startY, 8, barHeight, 'F');
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(styles.fonts.normal);
    doc.setTextColor(styles.colors.secondary);
    doc.text(`${status.label}: ${status.value}`, styles.spacing.margin + 12, startY + (barHeight * 0.7));
    
    startY += barHeight + barSpacing;
  });
  
  y = startY + 10;
  
  if (y > pageHeight - 100) {
    doc.addPage();
    y = styles.spacing.margin;
  }
  
  drawDivider(doc, y, styles);
  y += styles.spacing.sectionTop;

  y = drawSectionHeader(doc, "Revenue Analysis", y, styles);
  
  const revenueText = `Total revenue for ${data.period} was ${data.stats.formattedRevenue}, with room bookings contributing ${formatCurrency(data.stats.roomRevenue)} and venue bookings contributing ${formatCurrency(data.stats.venueRevenue)}.`;
  y = drawParagraph(doc, revenueText, styles.spacing.margin, y, contentWidth, styles);
  
  y += 10;

  y = drawTableHeader(doc, "Area Revenue", y, styles);
  
  const areaTableY = y + 5;
  const areaColumnWidths = [contentWidth * 0.5, contentWidth * 0.25, contentWidth * 0.25];
  
  drawTableRow(
    doc, 
    ["Area", "Bookings", "Revenue"], 
    styles.spacing.margin, 
    areaTableY, 
    areaColumnWidths, 
    styles, 
    true
  );
  
  let rowY = areaTableY + styles.spacing.tableRowHeight;
  data.areaNames.forEach((area, index) => {
    if (rowY > pageHeight - 20) {
      doc.addPage();
      rowY = styles.spacing.margin;
      drawTableRow(
        doc, 
        ["Area", "Bookings", "Revenue"], 
        styles.spacing.margin, 
        rowY, 
        areaColumnWidths, 
        styles, 
        true
      );
      rowY += styles.spacing.tableRowHeight;
    }
    
    drawTableRow(
      doc,
      [
        area,
        (data.areaBookingValues[index] || 0).toString(),
        formatCurrency(data.areaRevenueValues[index] || 0)
      ],
      styles.spacing.margin,
      rowY,
      areaColumnWidths,
      styles,
      false,
      index % 2 === 0
    );
    
    rowY += styles.spacing.tableRowHeight;
  });
  
  y = rowY + 15;
  
  if (y > pageHeight - 100) {
    doc.addPage();
    y = styles.spacing.margin;
  }

  y = drawTableHeader(doc, "Room Revenue", y, styles);
  
  const roomTableY = y + 5;
  const roomColumnWidths = [contentWidth * 0.5, contentWidth * 0.25, contentWidth * 0.25];
  
  drawTableRow(
    doc, 
    ["Room", "Bookings", "Revenue"], 
    styles.spacing.margin, 
    roomTableY, 
    roomColumnWidths, 
    styles, 
    true
  );
  
  rowY = roomTableY + styles.spacing.tableRowHeight;
  data.roomNames.forEach((room, index) => {
    if (rowY > pageHeight - 20) {
      doc.addPage();
      rowY = styles.spacing.margin;
      drawTableRow(
        doc, 
        ["Room", "Bookings", "Revenue"], 
        styles.spacing.margin, 
        rowY, 
        roomColumnWidths, 
        styles, 
        true
      );
      rowY += styles.spacing.tableRowHeight;
    }
    
    drawTableRow(
      doc,
      [
        room,
        (data.roomBookingValues[index] || 0).toString(),
        formatCurrency(data.roomRevenueValues[index] || 0)
      ],
      styles.spacing.margin,
      rowY,
      roomColumnWidths,
      styles,
      false,
      index % 2 === 0
    );
    
    rowY += styles.spacing.tableRowHeight;
  });
  
  y = rowY + 15;
  
  if (y > pageHeight - 50) {
    doc.addPage();
    y = styles.spacing.margin;
  }
  
  drawDivider(doc, y, styles);
  y += styles.spacing.sectionTop;

  y = drawSectionHeader(doc, "Summary", y, styles);
  
  const finalSummary = `This report summarizes ${data.period} hotel performance with total revenue of ${data.stats.formattedRevenue}. We had ${data.stats.totalBookings} bookings (${data.stats.activeBookings} active, ${data.stats.pendingBookings} pending) and ${occupancyRate} occupancy rate. Room revenue was ${formatCurrency(data.stats.roomRevenue)} and venue revenue was ${formatCurrency(data.stats.venueRevenue)}.`;
  y = drawParagraph(doc, finalSummary, styles.spacing.margin, y, contentWidth, styles);
  
  addFooter(doc, `Azurea Hotel - ${data.period} Report`, styles);
  
  return doc;
};

const drawDivider = (doc: jsPDF, y: number, styles: any): void => {
  doc.setDrawColor(styles.colors.divider);
  doc.setLineWidth(0.5);
  doc.line(styles.spacing.margin, y, doc.internal.pageSize.width - styles.spacing.margin, y);
};

const drawSectionHeader = (doc: jsPDF, title: string, y: number, styles: any): number => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(styles.fonts.subheader);
  doc.setTextColor(styles.colors.primary);
  doc.text(title, styles.spacing.margin, y);
  
  doc.setDrawColor(styles.colors.primary);
  doc.setLineWidth(0.3);
  doc.line(styles.spacing.margin, y + 1, styles.spacing.margin + doc.getStringUnitWidth(title) * styles.fonts.subheader / doc.internal.scaleFactor, y + 1);
  
  return y + 8;
};

const drawTableHeader = (doc: jsPDF, title: string, y: number, styles: any): number => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(styles.fonts.sectionTitle);
  doc.setTextColor(styles.colors.secondary);
  doc.text(title, styles.spacing.margin, y);
  
  return y;
};

const drawParagraph = (doc: jsPDF, text: string, x: number, y: number, width: number, styles: any): number => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(styles.fonts.normal);
  doc.setTextColor(styles.colors.secondary);
  
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  
  return y + (lines.length * styles.fonts.normal * 0.3527) + styles.spacing.paragraphBottom;
};

const drawKpiBox = (doc: jsPDF, title: string, value: string, x: number, y: number, width: number, styles: any): void => {
  doc.setFillColor(styles.colors.background);
  doc.roundedRect(x, y, width, styles.spacing.kpiBoxHeight, 2, 2, 'F');
  
  doc.setDrawColor(styles.colors.light);
  doc.roundedRect(x, y, width, styles.spacing.kpiBoxHeight, 2, 2, 'S');
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(styles.fonts.small);
  doc.setTextColor(styles.colors.tertiary);
  doc.text(title, x + 3, y + 6);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(styles.fonts.sectionTitle);
  doc.setTextColor(styles.colors.primary);
  doc.text(value, x + 3, y + 17);
};

const drawTableRow = (
  doc: jsPDF, 
  columns: string[], 
  x: number, 
  y: number, 
  columnWidths: number[],
  styles: any,
  isHeader: boolean = false,
  alternateRow: boolean = false
): void => {
  if (isHeader) {
    doc.setFillColor(styles.colors.light);
    doc.rect(x, y - 5, columnWidths.reduce((a, b) => a + b, 0), styles.spacing.tableRowHeight, 'F');
  } else if (alternateRow) {
    doc.setFillColor(styles.colors.background);
    doc.rect(x, y - 5, columnWidths.reduce((a, b) => a + b, 0), styles.spacing.tableRowHeight, 'F');
  }
  
  if (isHeader) {
    doc.setFont("helvetica", "bold");
  } else {
    doc.setFont("helvetica", "normal");
  }
  
  doc.setFontSize(styles.fonts.normal);
  doc.setTextColor(styles.colors.secondary);
  
  let currentX = x;
  columns.forEach((text, index) => {
    const cellX = (index >= 1) ? currentX + columnWidths[index] - doc.getStringUnitWidth(text) * styles.fonts.normal / doc.internal.scaleFactor - 3 : currentX + 3;
    doc.text(text, cellX, y);
    currentX += columnWidths[index];
  });
};

const addFooter = (doc: jsPDF, text: string, styles: any): void => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    doc.setDrawColor(styles.colors.light);
    doc.setLineWidth(0.5);
    doc.line(styles.spacing.margin, pageHeight - 10, pageWidth - styles.spacing.margin, pageHeight - 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(styles.fonts.small);
    doc.setTextColor(styles.colors.tertiary);
    doc.text(text, styles.spacing.margin, pageHeight - 5);
    
    const pageText = `Page ${i} of ${pageCount}`;
    const pageTextWidth = doc.getStringUnitWidth(pageText) * styles.fonts.small / doc.internal.scaleFactor;
    doc.text(pageText, pageWidth - styles.spacing.margin - pageTextWidth, pageHeight - 5);
  }
};

export const generateReportPreviewHTML = (data: MonthlyReportData): string => {
  const occupancyRate = ((data.stats.occupiedRooms / data.stats.totalRooms) * 100).toFixed(1) + "%";
  let bookingStatusChartHTML = '<div>Booking status chart data not available</p></div>';

  try {
    if (data.charts.bookingStatusChart) {
      try {
        bookingStatusChartHTML = `<img src="${data.charts.bookingStatusChart.toDataURL()}" style="max-width: 100%; max-height: 300px; margin: 0 auto;" />`;
      } catch (err) {
        console.error(`Failed to convert booking status chart: ${err}`);
        throw err;
      }
    }
  } catch (error) {
    console.error(`Error processing charts: ${error}`);
    throw error;
  }

  const html = `
    <div class="report-root">
      <header class="report-header">
        <h1 class="report-title">Azurea Hotel Management System</h1>
        <h2 class="report-period">Monthly Performance Report - ${data.period}</h2>
        <h3 class="report-period">Generated on: ${format(
          new Date(),
          "PPpp"
        )}</h3>
      </header>
      
      <section class="report-section">
        <h1 class="report-section-title">Executive Summary</h1>
        <p class="report-description">
          This monthly performance report provides a comprehensive overview of the hotel's operational and financial metrics for ${
            data.period
          }. 
          The report highlights key performance indicators including total bookings (${
            data.stats.totalBookings
          }), 
          current occupancy rate (${occupancyRate}), and total revenue (${
    data.stats.formattedRevenue
  }). 
        </p>
      </section>
      
      <div class="report-divider"></div>
      
      <section class="report-section">
        <h1 class="report-section-title">Key Performance Indicators</h1>
        <p class="report-description">
          These key metrics provide a snapshot of the hotel's current operational status and financial performance for the current month.
        </p>
        
        <div class="report-grid">
          <div class="report-kpi">
            <h1 class="report-kpi-title">Total Bookings</h1>
            <h4 class="report-kpi-value">${data.stats.totalBookings}</h4>
          </div>
          <div class="report-kpi">
            <h1 class="report-kpi-title">Total Revenue</h1>
            <h4 class="report-kpi-value">${data.stats.formattedRevenue}</h4>
          </div>
        </div>
        
        <div class="report-grid">
          <div class="report-kpi">
            <h1 class="report-kpi-title">Available Rooms</h1>
            <h4 class="report-kpi-value">${data.stats.availableRooms}</h4>
          </div>
          <div class="report-kpi">
            <h1 class="report-kpi-title">Total Rooms</h1>
            <h4 class="report-kpi-value">${data.stats.totalRooms}</h4>
          </div>
        </div>
      </section>
      
      <div class="report-divider"></div>
      
      <section class="report-section">
        <h3 class="report-section-title">Booking Status Distribution</h3>
        <div id="booking-status-chart" class="print-chart-container">
          ${bookingStatusChartHTML}
        </div>
      </section>
      
      <div class="report-divider"></div>
      
      <section class="report-section">
        <h3 class="report-section-title">Revenue Analysis</h3>
        
        <div class="report-grid">
          <div>
            <h4 class="report-section-title">Area Revenue</h4>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${data.areaNames.map((area, index) => `
                  <tr>
                    <td>${area}</td>
                    <td>${data.areaBookingValues[index] || 0}</td>
                    <td>${formatCurrency(
                      data.areaRevenueValues[index] || 0
                    )}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          
          <div>
            <h4 class="report-section-title">Room Revenue</h4>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${data.roomNames.map((room, index) => `
                  <tr>
                    <td>${room}</td>
                    <td>${data.roomBookingValues[index] || 0}</td>
                    <td>${formatCurrency(
                      data.roomRevenueValues[index] || 0
                    )}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      <div class="report-divider"></div>
      
      <section class="report-section">
        <h1 class="report-description">
          This report summarizes the hotel's performance for ${
            data.period
          }. The total revenue for this period was ${
    data.stats.formattedRevenue
  },
          with room bookings contributing ${formatCurrency(
            data.stats.roomRevenue
          )} and venue bookings contributing ${formatCurrency(
    data.stats.venueRevenue
  )}.
          There were a total of ${data.stats.totalBookings} bookings, with ${
    data.stats.activeBookings
  } currently active and ${data.stats.pendingBookings} pending.
          The hotel's occupancy rate stands at ${occupancyRate}.
        </p>
      </section>
    </div>
  `;

  return html;
};

export const prepareMonthlyReportData = (dashboardData: any): MonthlyReportData => {
  return {
    period: dashboardData.formattedMonthYear,
    stats: {
      activeBookings: dashboardData.stats.activeBookings,
      pendingBookings: dashboardData.stats.pendingBookings,
      totalBookings: dashboardData.stats.totalBookings,
      revenue: dashboardData.stats.revenue,
      formattedRevenue: dashboardData.stats.formattedRevenue,
      roomRevenue: dashboardData.stats.roomRevenue,
      venueRevenue: dashboardData.stats.venueRevenue,
      totalRooms: dashboardData.stats.totalRooms,
      availableRooms: dashboardData.stats.availableRooms,
      occupiedRooms: dashboardData.stats.occupiedRooms,
      maintenanceRooms: dashboardData.stats.maintenanceRooms,
      checkedInCount: dashboardData.stats.checkedInCount,
    },
    bookingStatusCounts: dashboardData.bookingStatusCounts,
    areaNames: dashboardData.areaNames,
    areaRevenueValues: dashboardData.areaRevenueValues,
    areaBookingValues: dashboardData.areaBookingValues,
    roomNames: dashboardData.roomNames,
    roomRevenueValues: dashboardData.roomRevenueValues,
    roomBookingValues: dashboardData.roomBookingValues,
    charts: {
      bookingStatusChart: null,
      roomRevenueChart: null,
      areaRevenueChart: null,
    },
  };
};
