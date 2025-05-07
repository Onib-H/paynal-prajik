/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { formatCurrency } from "./formatters";

interface MonthlyReportData {
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

// Helper functions for the PDF
const drawTitle = (doc: jsPDF, text: string, y: number): number => {
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(text, 105, y, { align: "center" });
  return y + 10;
};

const drawSectionHeader = (doc: jsPDF, text: string, y: number): number => {
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 5, 180, 10, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(text, 20, y);
  return y + 10;
};

const drawText = (doc: jsPDF, text: string, y: number, x = 20): number => {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(text, x, y);
  return y + 5;
};

const drawDescriptionText = (doc: jsPDF, text: string, y: number): number => {
  const maxWidth = 170;
  const lines = doc.splitTextToSize(text, maxWidth);

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);

  lines.forEach((line: string) => {
    doc.text(line, 20, y);
    y += 5;
  });

  doc.setTextColor(0, 0, 0);
  return y + 2;
};

const drawDivider = (doc: jsPDF, y: number): number => {
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, 195, y);
  return y + 5;
};

const drawKPI = (
  doc: jsPDF,
  title: string,
  value: string | number,
  x: number,
  y: number,
  width = 40
): number => {
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(x, y, width, 25, 3, 3, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(title, x + 5, y + 8);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(value.toString(), x + 5, y + 18);

  return y + 30;
};

const addChartImage = async (
  doc: jsPDF,
  chartElement: HTMLElement | null,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<number> => {
  if (!chartElement) {
    return y + 5;
  }

  try {
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", x, y, width, height);
    return y + height + 10;
  } catch (error) {
    console.error("Error converting chart to image:", error);
    return y + 5;
  }
};

const drawDataTable = (
  doc: jsPDF,
  headers: string[],
  data: (string | number)[][],
  y: number,
  columnWidths?: number[]
): number => {
  const startX = 20;
  const rowHeight = 8;
  const widths = columnWidths || headers.map(() => 160 / headers.length);

  doc.setFillColor(230, 230, 230);
  doc.rect(
    startX,
    y - 6,
    widths.reduce((a, b) => a + b, 0),
    rowHeight,
    "F"
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  let currentX = startX;
  headers.forEach((header, index) => {
    doc.text(header, currentX + 2, y);
    currentX += widths[index];
  });

  y += rowHeight;

  doc.setFont("helvetica", "normal");
  data.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(
        startX,
        y - 6,
        widths.reduce((a, b) => a + b, 0),
        rowHeight,
        "F"
      );
    }

    currentX = startX;
    row.forEach((cell, cellIndex) => {
      doc.text(cell.toString(), currentX + 2, y);
      currentX += widths[cellIndex];
    });

    y += rowHeight;
  });

  return y + 5;
};

// Generate HTML for preview
export const generateReportPreviewHTML = (data: MonthlyReportData): string => {
  const occupancyRate =
    ((data.stats.occupiedRooms / data.stats.totalRooms) * 100).toFixed(1) + "%";

  return `
    <div class="print-container">
      <div class="print-header">
        <div class="print-title">Azurea Hotel Management System</div>
        <div class="print-subtitle">Monthly Performance Report</div>
        <div class="print-period">${data.period}</div>
        <div class="print-date">Generated on: ${format(
          new Date(),
          "PPpp"
        )}</div>
      </div>
      
      <div class="print-section">
        <div class="print-section-header">Executive Summary</div>
        <div class="print-description">
          This monthly performance report provides a comprehensive overview of the hotel's operational and financial metrics for ${
            data.period
          }. 
          The report highlights key performance indicators including total bookings (${
            data.stats.totalBookings
          }), 
          current occupancy rate (${occupancyRate}), and total revenue (${
    data.stats.formattedRevenue
  }). 
          Review the detailed sections below for deeper insights into booking trends, revenue patterns, and room occupancy statistics.
        </div>
      </div>
      
      <div class="print-divider"></div>
      
      <div class="print-section">
        <div class="print-section-header">Key Performance Indicators</div>
        <div class="print-description">
          These key metrics provide a snapshot of the hotel's current operational status and financial performance for the current month.
        </div>
        
        <div class="print-kpi-grid">
          <div class="print-kpi-card">
            <div class="print-kpi-title">Total Bookings</div>
            <div class="print-kpi-value">${data.stats.totalBookings}</div>
          </div>
          <div class="print-kpi-card">
            <div class="print-kpi-title">Active Bookings</div>
            <div class="print-kpi-value">${data.stats.activeBookings}</div>
          </div>
          <div class="print-kpi-card">
            <div class="print-kpi-title">Total Revenue</div>
            <div class="print-kpi-value">${data.stats.formattedRevenue}</div>
          </div>
          <div class="print-kpi-card">
            <div class="print-kpi-title">Occupancy Rate</div>
            <div class="print-kpi-value">${occupancyRate}</div>
          </div>
        </div>
        
        <div class="print-kpi-grid">
          <div class="print-kpi-card">
            <div class="print-kpi-title">Pending Bookings</div>
            <div class="print-kpi-value">${data.stats.pendingBookings}</div>
          </div>
          <div class="print-kpi-card">
            <div class="print-kpi-title">Checked-in Guests</div>
            <div class="print-kpi-value">${data.stats.checkedInCount}</div>
          </div>
          <div class="print-kpi-card">
            <div class="print-kpi-title">Available Rooms</div>
            <div class="print-kpi-value">${data.stats.availableRooms}</div>
          </div>
          <div class="print-kpi-card">
            <div class="print-kpi-title">Total Rooms</div>
            <div class="print-kpi-value">${data.stats.totalRooms}</div>
          </div>
        </div>
      </div>
      
      <div class="print-divider"></div>
      
      <div class="print-section">
        <div class="print-section-header">Booking Status Distribution</div>
        <div id="bookingStatusChart" class="print-chart-container"></div>
      </div>
      
      <div class="print-divider"></div>
      
      <div class="print-section">
        <div class="print-section-header">Revenue Analysis</div>
        
        <div class="print-grid">
          <div>
            <h4>Area Revenue</h4>
            <div id="areaRevenueChart" class="print-chart-container"></div>
            <table class="print-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${data.areaNames
                  .map(
                    (area, index) => `
                  <tr>
                    <td>${area}</td>
                    <td>${data.areaBookingValues[index] || 0}</td>
                    <td>${formatCurrency(
                      data.areaRevenueValues[index] || 0
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <div>
            <h4>Room Revenue</h4>
            <div id="roomRevenueChart" class="print-chart-container"></div>
            <table class="print-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${data.roomNames
                  .map(
                    (room, index) => `
                  <tr>
                    <td>${room}</td>
                    <td>${data.roomBookingValues[index] || 0}</td>
                    <td>${formatCurrency(
                      data.roomRevenueValues[index] || 0
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="print-divider"></div>
      
      <div class="print-section">
        <div class="print-section-header">Summary</div>
        <div class="print-description">
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
        </div>
      </div>
    </div>
  `;
};

// Generate PDF
export const generateMonthlyReportPDF = async (
  data: MonthlyReportData
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, "F");

  let y = 15;
  doc.setTextColor(33, 150, 243);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Azurea Hotel Management System", 105, y, { align: "center" });

  y += 10;
  doc.setTextColor(0, 0, 0);
  y = drawTitle(doc, "Monthly Performance Report", y);

  y += 5;
  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.text(data.period, 105, y, {
    align: "center",
  });

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${format(new Date(), "PPpp")}`, 105, y, {
    align: "center",
  });

  y += 15;

  // Executive Summary
  y = drawSectionHeader(doc, "Executive Summary", y);
  y += 5;

  const occupancyRate =
    ((data.stats.occupiedRooms / data.stats.totalRooms) * 100).toFixed(1) + "%";

  const executiveSummary = `This monthly performance report provides a comprehensive overview of the hotel's operational and financial metrics for ${data.period}. The report highlights key performance indicators including total bookings (${data.stats.totalBookings}), current occupancy rate (${occupancyRate}), and total revenue (${data.stats.formattedRevenue}). Review the detailed sections below for deeper insights into booking trends, revenue patterns, and room occupancy statistics.`;
  y = drawDescriptionText(doc, executiveSummary, y);

  y += 5;
  y = drawDivider(doc, y);

  // KPI Section
  y = drawSectionHeader(doc, "Key Performance Indicators", y);
  y += 5;

  const kpiDescription =
    "These key metrics provide a snapshot of the hotel's current operational status and financial performance for the current month.";
  y = drawDescriptionText(doc, kpiDescription, y);
  y += 3;

  // First row of KPIs
  drawKPI(doc, "Total Bookings", data.stats.totalBookings, 20, y, 40);
  drawKPI(doc, "Active Bookings", data.stats.activeBookings, 70, y, 40);
  drawKPI(doc, "Total Revenue", data.stats.formattedRevenue, 120, y, 40);
  drawKPI(doc, "Occupancy Rate", occupancyRate, 170, y, 40);

  y += 30;

  // Second row of KPIs
  drawKPI(doc, "Pending Bookings", data.stats.pendingBookings, 20, y, 40);
  drawKPI(doc, "Checked-in Guests", data.stats.checkedInCount, 70, y, 40);
  drawKPI(doc, "Available Rooms", data.stats.availableRooms, 120, y, 40);
  drawKPI(doc, "Total Rooms", data.stats.totalRooms, 170, y, 40);

  y += 35;
  y = drawDivider(doc, y);

  // Booking Status Distribution
  y = drawSectionHeader(doc, "Booking Status Distribution", y);
  y += 5;

  if (data.charts.bookingStatusChart) {
    const canvas = await html2canvas(data.charts.bookingStatusChart, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", 35, y, 140, 70);
    y += 75;
  } else {
    y = drawText(doc, "Booking status chart data not available", y);
    y += 10;
  }

  y += 5;
  y = drawDivider(doc, y);

  // Revenue Analysis
  y = drawSectionHeader(doc, "Revenue Analysis", y);
  y += 5;

  // Area Revenue
  y = drawSectionHeader(doc, "Area Revenue", y);
  y += 5;

  if (data.charts.areaRevenueChart) {
    const canvas = await html2canvas(data.charts.areaRevenueChart, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", 35, y, 140, 60);
    y += 65;
  }

  // Area Revenue Table
  const areaHeaders = ["Area", "Bookings", "Revenue"];
  const areaData = data.areaNames.map((area, index) => [
    area,
    data.areaBookingValues[index] || 0,
    formatCurrency(data.areaRevenueValues[index] || 0),
  ]);

  if (areaData.length > 0) {
    y = drawDataTable(doc, areaHeaders, areaData, y, [80, 40, 40]);
  } else {
    y = drawText(doc, "No area revenue data available", y);
    y += 10;
  }

  // Add a new page if needed
  if (y > 240) {
    doc.addPage();
    y = 20;
  } else {
    y += 10;
  }

  // Room Revenue
  y = drawSectionHeader(doc, "Room Revenue", y);
  y += 5;

  if (data.charts.roomRevenueChart) {
    const canvas = await html2canvas(data.charts.roomRevenueChart, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", 35, y, 140, 60);
    y += 65;
  }

  // Room Revenue Table
  const roomHeaders = ["Room", "Bookings", "Revenue"];
  const roomData = data.roomNames.map((room, index) => [
    room,
    data.roomBookingValues[index] || 0,
    formatCurrency(data.roomRevenueValues[index] || 0),
  ]);

  if (roomData.length > 0) {
    y = drawDataTable(doc, roomHeaders, roomData, y, [80, 40, 40]);
  } else {
    y = drawText(doc, "No room revenue data available", y);
    y += 10;
  }

  y += 10;
  y = drawDivider(doc, y);

  // Summary
  y = drawSectionHeader(doc, "Summary", y);
  y += 5;

  const summaryText = `This report summarizes the hotel's performance for ${
    data.period
  }. The total revenue for this period was ${
    data.stats.formattedRevenue
  }, with room bookings contributing ${formatCurrency(
    data.stats.roomRevenue
  )} and venue bookings contributing ${formatCurrency(
    data.stats.venueRevenue
  )}. There were a total of ${data.stats.totalBookings} bookings, with ${
    data.stats.activeBookings
  } currently active and ${
    data.stats.pendingBookings
  } pending. The hotel's occupancy rate stands at ${occupancyRate}.`;
  y = drawDescriptionText(doc, summaryText, y);

  return doc;
};

// Function to prepare report data from the dashboard
export const prepareMonthlyReportData = (
  dashboardData: any
): MonthlyReportData => {
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
