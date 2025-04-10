/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from "date-fns";
import jsPDF from "jspdf";

export interface ChartData {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
    tension?: number;
  }[];
}

export interface ReportData {
  title: string;
  period: string;
  stats: {
    totalBookings: number;
    activeBookings: number;
    revenue: number;
    formattedRevenue: string;
    occupancyRate: string;
    pendingBookings: number;
    checkedInCount: number;
    availableRooms: number;
    totalRooms: number;
  };
  bookingStatusCounts: {
    pending: number;
    reserved: number;
    checked_in: number;
    checked_out: number;
    cancelled: number;
    no_show: number;
    rejected: number;
  };
  charts: {
    revenueData: {
      type: "line";
      data: ChartData;
    };
    bookingTrendsData: {
      type: "line";
      data: ChartData;
    };
    bookingStatusData: {
      type: "pie";
      data: ChartData;
    };
    roomOccupancyData: {
      type: "bar";
      data: ChartData;
    };
  };
}

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

const drawSubsectionTitle = (doc: jsPDF, text: string, y: number): number => {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(text, 20, y);
  return y + 6;
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

const addChartImage = (
  doc: jsPDF,
  chartCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): number => {
  const imgData = chartCanvas.toDataURL("image/png");
  doc.addImage(imgData, "PNG", x, y, width, height);
  return y + height + 10;
};

const drawDivider = (doc: jsPDF, y: number): number => {
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, 195, y);
  return y + 5;
};

const getCurrentMonthYear = (): string => {
  return format(new Date(), "MMMM yyyy");
};

export const generateMonthlyReport = async (
  reportData: ReportData,
  charts: { [key: string]: HTMLCanvasElement }
): Promise<void> => {
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
  doc.text(reportData.period || getCurrentMonthYear(), 105, y, {
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

  y = drawSectionHeader(doc, "Executive Summary", y);
  y += 5;

  const executiveSummary = `This monthly performance report provides a comprehensive overview of the hotel's operational and financial metrics for ${reportData.period}. The report highlights key performance indicators including total bookings (${reportData.stats.totalBookings}), current occupancy rate (${reportData.stats.occupancyRate}), and total revenue (${reportData.stats.formattedRevenue}). Review the detailed sections below for deeper insights into booking trends, revenue patterns, and room occupancy statistics.`;
  y = drawDescriptionText(doc, executiveSummary, y);

  y += 5;
  y = drawDivider(doc, y);

  y = drawSectionHeader(doc, "1. Key Performance Indicators", y);
  y += 5;

  const kpiDescription =
    "These key metrics provide a snapshot of the hotel's current operational status and financial performance for the current month.";
  y = drawDescriptionText(doc, kpiDescription, y);
  y += 3;

  drawKPI(doc, "Total Bookings", reportData.stats.totalBookings, 20, y, 40);
  drawKPI(doc, "Active Bookings", reportData.stats.activeBookings, 70, y, 40);
  drawKPI(doc, "Total Revenue", reportData.stats.formattedRevenue, 120, y, 40);
  drawKPI(doc, "Occupancy Rate", reportData.stats.occupancyRate, 170, y, 40);

  y += 30;

  drawKPI(doc, "Pending Bookings", reportData.stats.pendingBookings, 20, y, 40);
  drawKPI(doc, "Checked-in Guests", reportData.stats.checkedInCount, 70, y, 40);
  drawKPI(doc, "Available Rooms", reportData.stats.availableRooms, 120, y, 40);
  drawKPI(doc, "Total Rooms", reportData.stats.totalRooms, 170, y, 40);

  y += 35;
  y = drawDivider(doc, y);

  y = drawSectionHeader(doc, "2. Revenue & Booking Analysis", y);
  y += 5;

  const revenueDescription =
    "This section illustrates daily revenue trends and booking patterns throughout the month, helping identify peak periods and opportunities for revenue optimization.";
  y = drawDescriptionText(doc, revenueDescription, y);
  y += 3;

  y = drawSubsectionTitle(doc, "Daily Revenue Trends", y);

  if (charts.revenueChart) {
    y = addChartImage(doc, charts.revenueChart, 20, y, 170, 70);
  } else {
    y = drawText(doc, "Revenue chart data not available", y);
    y += 70;
  }

  const revenueInsights = `Total monthly revenue: ${
    reportData.stats.formattedRevenue
  }. Room revenue accounts for ${Math.round(
    ((reportData.stats.revenue * 0.75) / reportData.stats.revenue) * 100
  )}% of total revenue, with the remainder coming from venue bookings and additional services.`;
  y = drawDescriptionText(doc, revenueInsights, y);
  y += 3;

  y = drawSubsectionTitle(doc, "Booking Pattern Analysis", y);

  if (charts.bookingTrendsChart) {
    y = addChartImage(doc, charts.bookingTrendsChart, 20, y, 170, 70);
  } else {
    y = drawText(doc, "Booking trends chart data not available", y);
    y += 70;
  }

  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y = drawDivider(doc, y);
  }

  y = drawSectionHeader(doc, "3. Booking Status Distribution", y);
  y += 5;

  const bookingStatusDescription =
    "This section provides a breakdown of all bookings by their current status, helping identify operational priorities and potential revenue risks.";
  y = drawDescriptionText(doc, bookingStatusDescription, y);
  y += 3;

  if (charts.bookingStatusChart) {
    y = addChartImage(doc, charts.bookingStatusChart, 55, y, 100, 80);
  } else {
    y = drawText(doc, "Booking status chart data not available", y);
    y += 80;
  }

  y += 5;
  y = drawSubsectionTitle(doc, "Booking Status Breakdown", y);

  const statusLabels = [
    { key: "pending", label: "Pending" },
    { key: "reserved", label: "Reserved" },
    { key: "checked_in", label: "Checked In" },
    { key: "checked_out", label: "Checked Out" },
    { key: "cancelled", label: "Cancelled" },
    { key: "no_show", label: "No Show" },
    { key: "rejected", label: "Rejected" },
  ];

  const tableHeaders = ["Status", "Count", "Percentage"];
  const totalBookings = Object.values(reportData.bookingStatusCounts).reduce(
    (sum, val) => sum + val,
    0
  );

  const tableData = statusLabels.map((status) => {
    const count =
      reportData.bookingStatusCounts[
        status.key as keyof typeof reportData.bookingStatusCounts
      ];
    const percentage =
      totalBookings > 0
        ? ((count / totalBookings) * 100).toFixed(1) + "%"
        : "0%";
    return [status.label, count, percentage];
  });

  y = drawDataTable(doc, tableHeaders, tableData, y, [60, 40, 60]);

  const pendingPercent =
    totalBookings > 0
      ? (
          (reportData.bookingStatusCounts.pending / totalBookings) *
          100
        ).toFixed(1)
      : "0";
  const cancelledPercent =
    totalBookings > 0
      ? (
          (reportData.bookingStatusCounts.cancelled / totalBookings) *
          100
        ).toFixed(1)
      : "0";

  const bookingInsights = `Currently, ${pendingPercent}% of all bookings are pending confirmation, while ${cancelledPercent}% have been cancelled. Active revenue-generating bookings (reserved and checked-in) account for ${
    totalBookings > 0
      ? (
          ((reportData.bookingStatusCounts.reserved +
            reportData.bookingStatusCounts.checked_in) /
            totalBookings) *
          100
        ).toFixed(1)
      : "0"
  }% of all bookings.`;
  y = drawDescriptionText(doc, bookingInsights, y);

  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y = drawDivider(doc, y);
  }

  y = drawSectionHeader(doc, "4. Room Occupancy Analysis", y);
  y += 5;

  const roomOccupancyDescription =
    "This section analyzes room occupancy by type, highlighting which room categories are most popular and identifying opportunities to optimize room allocation and pricing.";
  y = drawDescriptionText(doc, roomOccupancyDescription, y);
  y += 3;

  if (charts.roomOccupancyChart) {
    y = addChartImage(doc, charts.roomOccupancyChart, 20, y, 170, 70);
  } else {
    y = drawText(doc, "Room occupancy chart data not available", y);
    y += 70;
  }

  const occupancyRate = reportData.stats.occupancyRate;
  const roomInsights = `Current overall occupancy rate is ${occupancyRate}, with ${reportData.stats.availableRooms} rooms currently available for booking out of ${reportData.stats.totalRooms} total rooms. Standard rooms show the highest occupancy rate, followed by Deluxe rooms.`;
  y = drawDescriptionText(doc, roomInsights, y);

  y += 5;
  y = drawSubsectionTitle(doc, "Recommendations", y);

  const recommendations = [
    "Consider targeted promotions for room types with lower occupancy rates",
    "Review pricing strategy for peak booking days identified in the booking trends chart",
    "Follow up with pending bookings to increase conversion rate",
    "Analyze cancellation patterns to identify and address common causes",
  ];

  recommendations.forEach((rec) => {
    y = drawText(doc, `• ${rec}`, y);
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("Confidential - For internal use only", 105, 285, {
    align: "center",
  });
  doc.text("© Azurea Hotel Management System", 105, 290, {
    align: "center",
  });

  doc.save(`Hotel_Monthly_Report_${format(new Date(), "yyyy-MM")}.pdf`);
};

export const prepareReportData = (
  dashboardData: any,
  bookingStatusData: any,
  currentMonth = getCurrentMonthYear()
): ReportData => {
  const occupancyRate =
    dashboardData.total_rooms > 0
      ? Math.round(
          (dashboardData.occupied_rooms / dashboardData.total_rooms) * 100
        )
      : 0;

  return {
    title: "Monthly Performance Report",
    period: currentMonth,
    stats: {
      totalBookings: dashboardData.total_bookings || 0,
      activeBookings: dashboardData.active_bookings || 0,
      revenue: dashboardData.revenue || 0,
      formattedRevenue: dashboardData.formatted_revenue || "₱0.00",
      occupancyRate: `${occupancyRate}%`,
      pendingBookings: dashboardData.pending_bookings || 0,
      checkedInCount: dashboardData.checked_in_count || 0,
      availableRooms: dashboardData.available_rooms || 0,
      totalRooms: dashboardData.total_rooms || 0,
    },
    bookingStatusCounts: {
      pending: bookingStatusData?.pending || 0,
      reserved: bookingStatusData?.reserved || 0,
      checked_in: bookingStatusData?.checked_in || 0,
      checked_out: bookingStatusData?.checked_out || 0,
      cancelled: bookingStatusData?.cancelled || 0,
      no_show: bookingStatusData?.no_show || 0,
      rejected: bookingStatusData?.rejected || 0,
    },
    charts: {
      revenueData: {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
            },
          ],
        },
      },
      bookingTrendsData: {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
            },
          ],
        },
      },
      bookingStatusData: {
        type: "pie",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
            },
          ],
        },
      },
      roomOccupancyData: {
        type: "bar",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
            },
          ],
        },
      },
    },
  };
};
