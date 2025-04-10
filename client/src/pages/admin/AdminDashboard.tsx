/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from "chart.js";
import { useRef, useState } from "react";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import MonthlyReportView from "../../components/admin/MonthlyReportView";
import StatCard from "../../components/admin/StatCard";
import DashboardSkeleton from "../../motions/skeletons/AdminDashboardSkeleton";
import { fetchBookingStatusCounts, fetchStats } from "../../services/Admin";
import '../../styles/print.css';
import { prepareReportData } from "../../utils/reports";
import Error from "../_ErrorBoundary";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const getDaysInMonth = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${day}`;
  });
};

const generateDailyData = (max: number, min: number, trend: 'up' | 'down' | 'stable' = 'stable', volatility = 0.2) => {
  const daysInMonth = getDaysInMonth().length;
  const range = max - min;

  return Array.from({ length: daysInMonth }, (_, i) => {
    let base;
    if (trend === 'up') {
      base = min + (range * i / daysInMonth);
    } else if (trend === 'down') {
      base = max - (range * i / daysInMonth);
    } else {
      base = min + range / 2;
    }

    const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);
    return Math.round(base * randomFactor);
  });
};

const generateDailyPercentages = (max: number, min: number) => {
  const daysInMonth = getDaysInMonth().length;
  return Array.from({ length: daysInMonth }, () => {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  });
};

const AdminDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const { data: bookingStatusData, isLoading: bookingStatusLoading } = useQuery({
    queryKey: ['bookingStatusCounts'],
    queryFn: fetchBookingStatusCounts,
  });

  const revenueChartRef = useRef<HTMLCanvasElement | null>(null);
  const bookingTrendsChartRef = useRef<HTMLCanvasElement | null>(null);
  const bookingStatusChartRef = useRef<HTMLCanvasElement | null>(null);
  const roomOccupancyChartRef = useRef<HTMLCanvasElement | null>(null);

  const [showReportView, setShowReportView] = useState(false);

  if (isLoading || bookingStatusLoading) return <DashboardSkeleton />;
  if (error) return <Error />;

  const stats = {
    activeBookings: data?.active_bookings || 0,
    pendingBookings: data?.pending_bookings || 0,
    unpaidBookings: data?.unpaid_bookings || 0,
    checkedInCount: data?.checked_in_count || 0,
    availableRooms: data?.available_rooms || 0,
    totalRooms: data?.total_rooms || 0,
    occupiedRooms: data?.occupied_rooms || 0,
    maintenanceRooms: data?.maintenance_rooms || 0,
    upcomingReservations: data?.upcoming_reservations || 0,
    totalBookings: data?.total_bookings || 0,
    revenue: data?.revenue || 0,
    roomRevenue: data?.room_revenue || 0,
    venueRevenue: data?.venue_revenue || 0,
    formattedRevenue: data?.formatted_revenue || "₱0.00",
    formattedRoomRevenue: data?.formatted_room_revenue || "₱0.00",
    formattedVenueRevenue: data?.formatted_venue_revenue || "₱0.00"
  }

  const bookingStatusCounts = {
    pending: bookingStatusData?.pending || 0,
    reserved: bookingStatusData?.reserved || 0,
    checked_in: bookingStatusData?.checked_in || 0,
    checked_out: bookingStatusData?.checked_out || 0,
    cancelled: bookingStatusData?.cancelled || 0,
    no_show: bookingStatusData?.no_show || 0,
    rejected: bookingStatusData?.rejected || 0
  };

  const daysInMonth = getDaysInMonth();
  const dailyRevenueData = generateDailyData(stats.revenue / 20, stats.revenue / 40, 'up');
  const dailyBookingsData = generateDailyData(Math.max(5, stats.totalBookings / 15), 0, 'stable');
  const dailyOccupancyRates = generateDailyPercentages(95, 55);
  const dailyCheckIns = generateDailyData(Math.max(3, stats.checkedInCount / 15), 0, 'stable');
  const dailyCheckOuts = dailyCheckIns.map(val => Math.round(val * 0.9));
  const dailyCancellations = generateDailyData(Math.max(2, bookingStatusCounts.cancelled / 20), 0, 'stable');

  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Family'];
  const roomTypeOccupancy = roomTypes.map(() => Math.floor(Math.random() * stats.totalRooms / 4));
  const roomTypeAvailable = roomTypes.map((_, i) => Math.floor(stats.totalRooms / 4) - roomTypeOccupancy[i]);

  const roomIds = Array.from({ length: Math.min(8, stats.totalRooms) }, (_, i) => `Room ${i + 1}`);
  const roomRevenues = roomIds.map(() => Math.floor(Math.random() * (stats.roomRevenue / roomIds.length) * 1.5));
  const roomBookingCounts = roomIds.map(() => Math.floor(Math.random() * 10) + 1);

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    },
    maintainAspectRatio: false
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    },
    maintainAspectRatio: false
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value * 100) / total);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  const revenueLineData = {
    labels: daysInMonth,
    datasets: [
      {
        label: 'Daily Revenue (₱)',
        data: dailyRevenueData,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const bookingTrendsData = {
    labels: daysInMonth,
    datasets: [
      {
        label: 'New Bookings',
        data: dailyBookingsData,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const occupancyRateData = {
    labels: daysInMonth,
    datasets: [
      {
        label: 'Occupancy Rate (%)',
        data: dailyOccupancyRates,
        borderColor: '#FFC107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const checkInOutData = {
    labels: daysInMonth,
    datasets: [
      {
        label: 'Check-ins',
        data: dailyCheckIns,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: false,
        tension: 0.3
      },
      {
        label: 'Check-outs',
        data: dailyCheckOuts,
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        fill: false,
        tension: 0.3
      }
    ]
  };

  const cancellationData = {
    labels: daysInMonth,
    datasets: [
      {
        label: 'Cancellations',
        data: dailyCancellations,
        borderColor: '#FF5722',
        backgroundColor: 'rgba(255, 87, 34, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const roomTypeOccupancyData = {
    labels: roomTypes,
    datasets: [
      {
        label: 'Occupied',
        data: roomTypeOccupancy,
        backgroundColor: '#2196F3',
      },
      {
        label: 'Available',
        data: roomTypeAvailable,
        backgroundColor: '#4CAF50',
      }
    ]
  };

  const roomRevenueData = {
    labels: roomIds,
    datasets: [
      {
        label: 'Revenue (₱)',
        data: roomRevenues,
        backgroundColor: '#9C27B0',
      }
    ]
  };

  const roomBookingCountData = {
    labels: roomIds,
    datasets: [
      {
        label: 'Booking Count',
        data: roomBookingCounts,
        backgroundColor: '#FF9800',
      }
    ]
  };

  const bookingStatusChartData = {
    labels: ['Pending', 'Reserved', 'Checked In', 'Checked Out', 'Cancelled', 'No Show', 'Rejected'],
    datasets: [
      {
        data: [
          bookingStatusCounts.pending,
          bookingStatusCounts.reserved,
          bookingStatusCounts.checked_in,
          bookingStatusCounts.checked_out,
          bookingStatusCounts.cancelled,
          bookingStatusCounts.no_show,
          bookingStatusCounts.rejected
        ],
        backgroundColor: [
          "#FFC107",
          "#2196F3",
          "#4CAF50",
          "#9E9E9E",
          "#F44336",
          "#9C27B0",
          "#FF5722"
        ],
      }
    ]
  };

  const cancellationBreakdownData = {
    labels: ['Cancelled', 'Rejected', 'No Show'],
    datasets: [
      {
        data: [
          bookingStatusCounts.cancelled,
          bookingStatusCounts.rejected,
          bookingStatusCounts.no_show
        ],
        backgroundColor: [
          "#F44336",
          "#FF5722",
          "#9C27B0"
        ],
      }
    ]
  };

  const revenueContributionData = {
    labels: roomIds,
    datasets: [
      {
        data: roomRevenues,
        backgroundColor: [
          '#3F51B5', '#4CAF50', '#FFC107', '#F44336',
          '#9C27B0', '#00BCD4', '#FF9800', '#795548'
        ],
      }
    ]
  };

  const roomBookingDistributionData = {
    labels: roomIds,
    datasets: [
      {
        data: roomBookingCounts,
        backgroundColor: [
          '#3F51B5', '#4CAF50', '#FFC107', '#F44336',
          '#9C27B0', '#00BCD4', '#FF9800', '#795548'
        ],
      }
    ]
  };

  const handleGenerateReport = () => setShowReportView(true);
  const handleCloseReport = () => setShowReportView(false);

  const renderReport = () => {
    if (!showReportView) return null;

    return (
      <MonthlyReportView
        reportData={prepareReportData(data, bookingStatusData)}
        onClose={handleCloseReport}
        chartOptions={{
          line: lineOptions,
          bar: barOptions,
          pie: pieOptions
        }}
        chartData={{
          revenueData: revenueLineData,
          bookingTrendsData: bookingTrendsData,
          bookingStatusData: bookingStatusChartData,
          roomOccupancyData: roomTypeOccupancyData,
          revenueContributionData: revenueContributionData,
          roomBookingDistributionData: roomBookingDistributionData
        }}
      />
    );
  };

  return (
    <div className="h-[calc(100vh-25px)] p-3 overflow-y-auto container mx-auto">
      {renderReport()}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Admin Dashboard (Monthly Report)</h1>
        <button
          onClick={handleGenerateReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center cursor-pointer transition-colors duration-300"
          title="Generate a monthly report using HTML/CSS"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Monthly Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Bookings" value={stats.totalBookings} borderColor="border-blue-500" />
        <StatCard title="Active Bookings" value={stats.activeBookings} borderColor="border-green-500" />
        <StatCard title="Total Revenue" value={stats.formattedRevenue} borderColor="border-orange-500" />
        <StatCard title="Occupancy Rate" value={`${Math.round((stats.totalRooms > 0 ? (data?.occupied_rooms || 0) / stats.totalRooms : 0) * 100)}%`} borderColor="border-purple-500" />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Monthly Trends</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Revenue Trends</h3>
            <div className="h-64">
              <Line
                data={revenueLineData}
                options={lineOptions}
                ref={(ref) => {
                  if (ref) {
                    revenueChartRef.current = ref.canvas;
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Booking Trends</h3>
            <div className="h-64">
              <Line
                data={bookingTrendsData}
                options={lineOptions}
                ref={(ref) => {
                  if (ref) {
                    bookingTrendsChartRef.current = ref.canvas;
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Occupancy Rate</h3>
            <div className="h-64">
              <Line data={occupancyRateData} options={lineOptions} />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Check-ins & Check-outs</h3>
            <div className="h-64">
              <Line data={checkInOutData} options={lineOptions} />
          </div>
        </div>

          <div className="bg-white shadow-lg rounded-lg p-4 md:col-span-2">
            <h3 className="text-lg font-medium mb-2 text-center">Cancellation Trends</h3>
            <div className="h-64">
              <Line data={cancellationData} options={lineOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Comparative Analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Room Occupancy by Type</h3>
            <div className="h-64">
              <Bar
                data={roomTypeOccupancyData}
                options={barOptions}
                ref={(ref) => {
                  if (ref) {
                    roomOccupancyChartRef.current = ref.canvas;
                }
              }}
            />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Revenue by Room</h3>
            <div className="h-64">
              <Bar data={roomRevenueData} options={barOptions} />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Bookings by Room</h3>
            <div className="h-64">
              <Bar data={roomBookingCountData} options={barOptions} />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Booking Status Distribution</h3>
            <div className="h-64">
              <Bar data={bookingStatusChartData} options={barOptions} />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4 md:col-span-2">
            <h3 className="text-lg font-medium mb-2 text-center">Cancellation Breakdown</h3>
            <div className="h-64">
              <Bar data={cancellationBreakdownData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Proportional Insights</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Revenue by Room</h3>
            <div className="h-64">
              <Pie data={revenueContributionData} options={pieOptions} />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Booking Status</h3>
            <div className="h-64">
              <Doughnut
                data={bookingStatusChartData}
                options={pieOptions}
                ref={(ref) => {
                  if (ref) {
                    bookingStatusChartRef.current = ref.canvas;
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Bookings by Room</h3>
            <div className="h-64">
              <Pie data={roomBookingDistributionData} options={pieOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
