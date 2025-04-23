/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Title, Tooltip } from "chart.js";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import MonthlyReportView from "../../components/admin/MonthlyReportView";
import StatCard from "../../components/admin/StatCard";
import DashboardSkeleton from "../../motions/skeletons/AdminDashboardSkeleton";
import { fetchBookingStatusCounts, fetchDailyBookings, fetchDailyCancellations, fetchDailyCheckInsCheckOuts, fetchDailyNoShowsRejected, fetchMonthlyRevenue, fetchRoomBookings, fetchRoomRevenue, fetchStats } from "../../services/Admin";
import "../../styles/print.css";
import { prepareReportData } from "../../utils/reports";
import Error from "../_ErrorBoundary";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, ArcElement, PointElement, Title, Tooltip, Legend, Filler);

const getDaysInMonth = (month: number, year: number, limitToCurrentDay = false) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDate = new Date();

  const maxDay =
    limitToCurrentDay &&
      month === currentDate.getMonth() &&
      year === currentDate.getFullYear()
      ? currentDate.getDate()
      : daysInMonth;

  return Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1;
    return `${day}`;
  });
};

const formatMonthYear = (month: number, year: number) => {
  return new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const AdminDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showReportView, setShowReportView] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const isCurrentMonth =
    selectedMonth === new Date().getMonth() &&
    selectedYear === new Date().getFullYear();
  const formattedMonthYear = formatMonthYear(selectedMonth, selectedYear);

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["stats", selectedMonth, selectedYear],
    queryFn: async () => {
      const statsData = await fetchStats({
        month: selectedMonth + 1,
        year: selectedYear,
      });

      if (!statsData.daily_revenue) {
        statsData.daily_revenue = getDaysInMonth(
          selectedMonth,
          selectedYear,
          true
        ).map(() => 0);
      }

      return statsData;
    },
  });

  const { data: bookingStatusData, isLoading: bookingStatusLoading } = useQuery(
    {
      queryKey: ["bookingStatusCounts", selectedMonth, selectedYear],
      queryFn: () =>
        fetchBookingStatusCounts({
          month: selectedMonth + 1,
          year: selectedYear,
        }),
    }
  );

  const { data: dailyBookingsResponse, isLoading: bookingsDataLoading } = useQuery({
    queryKey: ["dailyBookings", selectedMonth, selectedYear],
    queryFn: () =>
      fetchDailyBookings({
        month: selectedMonth + 1,
        year: selectedYear,
      }),
  });

  // const { data: dailyOccupancyResponse, isLoading: occupancyDataLoading } = useQuery({
  //   queryKey: ["dailyOccupancy", selectedMonth, selectedYear],
  //   queryFn: () =>
  //     fetchDailyOccupancy({
  //       month: selectedMonth + 1,
  //       year: selectedYear,
  //     }),
  // });

  const { data: checkinCheckoutData, isLoading: checkinsDataLoading } = useQuery({
    queryKey: ["dailyCheckInsCheckOuts", selectedMonth, selectedYear],
    queryFn: () =>
      fetchDailyCheckInsCheckOuts({
        month: selectedMonth + 1,
        year: selectedYear,
      }),
  });

  const { data: dailyCancellationsResponse, isLoading: cancellationsDataLoading } = useQuery({
    queryKey: ["dailyCancellations", selectedMonth, selectedYear],
    queryFn: () =>
      fetchDailyCancellations({
        month: selectedMonth + 1,
        year: selectedYear,
      }),
  });

  const { data: dailyNoShowsRejectedResponse, isLoading: noShowsRejectedDataLoading } = useQuery({
    queryKey: ["dailyNoShowsRejected", selectedMonth, selectedYear],
    queryFn: () =>
      fetchDailyNoShowsRejected({
        month: selectedMonth + 1,
        year: selectedYear,
      }),
  });

  const { data: roomRevenueResponse, isLoading: roomRevenueLoading } = useQuery({
    queryKey: ["roomRevenue", selectedMonth, selectedYear],
    queryFn: () =>
      fetchRoomRevenue({
        month: selectedMonth + 1,
        year: selectedYear,
      }),
  });

  const { data: roomBookingsResponse, isLoading: roomBookingsLoading } = useQuery({
    queryKey: ["roomBookings", selectedMonth, selectedYear],
    queryFn: () =>
      fetchRoomBookings({
        month: selectedMonth + 1,
        year: selectedYear,
      }),
  });

  const { data: monthlyRevenueData, isLoading: monthlyRevenueLoading } = useQuery({
    queryKey: ["monthlyRevenue", selectedMonth, selectedYear],
    queryFn: () =>
      fetchMonthlyRevenue({
        month: selectedMonth + 1,
        year: selectedYear,
      }),
  });

  useEffect(() => {
    if (
      !isLoading &&
      !bookingStatusLoading &&
      data &&
      bookingStatusData &&
      monthlyRevenueData
    ) {
      const modifiedData = {
        ...data,
        revenue: monthlyRevenueData.revenue,
        formatted_revenue: monthlyRevenueData.formatted_revenue,
      };

      const prepared = prepareReportData(
        modifiedData,
        bookingStatusData,
        selectedMonth,
        selectedYear
      );
      setReportData(prepared);
    }
  }, [
    data,
    bookingStatusData,
    monthlyRevenueData,
    selectedMonth,
    selectedYear,
    isLoading,
    bookingStatusLoading,
  ]);

  const revenueChartRef = useRef<HTMLCanvasElement | null>(null);
  const bookingTrendsChartRef = useRef<HTMLCanvasElement | null>(null);
  const bookingStatusChartRef = useRef<HTMLCanvasElement | null>(null);

  if (
    isLoading ||
    bookingStatusLoading ||
    bookingsDataLoading ||
    // occupancyDataLoading ||
    checkinsDataLoading ||
    cancellationsDataLoading ||
    roomRevenueLoading ||
    roomBookingsLoading ||
    noShowsRejectedDataLoading ||
    monthlyRevenueLoading
  )
    return <DashboardSkeleton />;
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
    formattedVenueRevenue: data?.formatted_venue_revenue || "₱0.00",
    revenueMonth: selectedMonth + 1,
    revenueYear: selectedYear,
  };

  const bookingStatusCounts = {
    pending: bookingStatusData?.pending || 0,
    reserved: bookingStatusData?.reserved || 0,
    checked_in: bookingStatusData?.checked_in || 0,
    checked_out: bookingStatusData?.checked_out || 0,
    cancelled: bookingStatusData?.cancelled || 0,
    no_show: bookingStatusData?.no_show || 0,
    rejected: bookingStatusData?.rejected || 0,
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear, true);

  const limitArrayToCurrentDay = (dataArray: any[] | undefined) => {
    if (!dataArray) return daysInMonth.map(() => 0);
    return dataArray.slice(0, daysInMonth.length);
  };

  const dailyRevenueData = limitArrayToCurrentDay(data?.daily_revenue);
  const dailyBookingsData = limitArrayToCurrentDay(dailyBookingsResponse?.data);
  // const dailyOccupancyRates = limitArrayToCurrentDay(dailyOccupancyResponse?.data);
  const dailyCheckIns = limitArrayToCurrentDay(checkinCheckoutData?.checkins);
  const dailyCheckOuts = limitArrayToCurrentDay(checkinCheckoutData?.checkouts);
  const dailyCancellations = limitArrayToCurrentDay(dailyCancellationsResponse?.data);
  const dailyNoShows = limitArrayToCurrentDay(dailyNoShowsRejectedResponse?.no_shows);
  const dailyRejected = limitArrayToCurrentDay(dailyNoShowsRejectedResponse?.rejected);

  const roomNames = roomRevenueResponse?.room_names || [];
  const roomRevenueValues = roomRevenueResponse?.revenue_data || [];
  const roomBookingValues = roomBookingsResponse?.booking_counts || [];

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.raw || 0;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    maintainAspectRatio: false,
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    maintainAspectRatio: false,
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          boxWidth: 15,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = Math.round((value * 100) / total);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  const revenueLineData = {
    labels: daysInMonth,
    datasets: [
      {
        label: "Daily Revenue (₱)",
        data: dailyRevenueData,
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const bookingTrendsData = {
    labels: daysInMonth,
    datasets: [
      {
        label: "New Bookings",
        data: dailyBookingsData,
        borderColor: "#2196F3",
        backgroundColor: "rgba(33, 150, 243, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // const occupancyRateData = {
  //   labels: daysInMonth,
  //   datasets: [
  //     {
  //       label: 'Occupancy Rate (%)',
  //       data: dailyOccupancyRates,
  //       borderColor: '#FFC107',
  //       backgroundColor: 'rgba(255, 193, 7, 0.1)',
  //       fill: true,
  //       tension: 0.3
  //     }
  //   ]
  // };

  const checkInOutData = {
    labels: daysInMonth,
    datasets: [
      {
        label: "Check-ins",
        data: dailyCheckIns,
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        fill: false,
        tension: 0.3,
      },
      {
        label: "Check-outs",
        data: dailyCheckOuts,
        borderColor: "#F44336",
        backgroundColor: "rgba(244, 67, 54, 0.1)",
        fill: false,
        tension: 0.3,
      },
    ],
  };

  const cancellationData = {
    labels: daysInMonth,
    datasets: [
      {
        label: "Cancellations",
        data: dailyCancellations,
        borderColor: "#FF9800",
        backgroundColor: "rgba(255, 152, 0, 0.2)",
        fill: true,
        tension: 0.3,
        borderWidth: 3,
      },
      {
        label: "No Show",
        data: dailyNoShows,
        borderColor: "#673AB7",
        backgroundColor: "rgba(103, 58, 183, 0.2)",
        fill: true,
        tension: 0.3,
        borderWidth: 3,
      },
      {
        label: "Rejected",
        data: dailyRejected,
        borderColor: "#E91E63",
        backgroundColor: "rgba(233, 30, 99, 0.2)",
        fill: true,
        tension: 0.3,
        borderWidth: 3,
      },
    ],
  };

  const roomRevenueData = {
    labels: roomNames,
    datasets: [
      {
        label: "Revenue (₱)",
        data: roomRevenueValues,
        backgroundColor: "#9C27B0",
      },
    ],
  };

  const roomBookingCountData = {
    labels: roomNames,
    datasets: [
      {
        label: "Booking Count",
        data: roomBookingValues,
        backgroundColor: "#FF9800",
      },
    ],
  };

  const bookingStatusChartData = {
    labels: [
      "Pending",
      "Reserved",
      "Checked In",
      "Checked Out",
      "Cancelled",
      "No Show",
      "Rejected",
    ],
    datasets: [
      {
        data: [
          bookingStatusCounts.pending,
          bookingStatusCounts.reserved,
          bookingStatusCounts.checked_in,
          bookingStatusCounts.checked_out,
          bookingStatusCounts.cancelled,
          bookingStatusCounts.no_show,
          bookingStatusCounts.rejected,
        ],
        backgroundColor: [
          "#FFC107",
          "#2196F3",
          "#4CAF50",
          "#9E9E9E",
          "#F44336",
          "#9C27B0",
          "#FF5722",
        ],
      },
    ],
  };

  const roomBookingDistributionData = {
    labels: roomNames,
    datasets: [
      {
        data: roomBookingValues,
        backgroundColor: [
          "#3F51B5",
          "#4CAF50",
          "#FFC107",
          "#F44336",
          "#9C27B0",
          "#00BCD4",
          "#FF9800",
          "#795548",
        ],
      },
    ],
  };

  const revenueContributionData = {
    labels: roomNames,
    datasets: [
      {
        data: roomRevenueValues,
        backgroundColor: [
          "#3F51B5",
          "#4CAF50",
          "#FFC107",
          "#F44336",
          "#9C27B0",
          "#00BCD4",
          "#FF9800",
          "#795548",
        ],
      },
    ],
  };

  const handleGenerateReport = () => {
    if (reportData) setShowReportView(true);
  };

  const handleCloseReport = () => setShowReportView(false);

  const renderReport = () => {
    if (!showReportView || !reportData) return null;

    return (
      <MonthlyReportView
        reportData={reportData}
        onClose={handleCloseReport}
        chartOptions={{
          line: lineOptions,
          bar: barOptions,
          pie: pieOptions,
        }}
        chartData={{
          revenueData: revenueLineData,
          bookingTrendsData: bookingTrendsData,
          bookingStatusData: bookingStatusChartData,
          revenueContributionData: revenueContributionData,
          roomBookingDistributionData: roomBookingDistributionData,
        }}
      />
    );
  };

  return (
    <div className="p-3 container mx-auto">
      {renderReport()}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="flex items-center space-x-4">
          {/* Month selection controls */}
          <div className="flex items-center bg-white rounded-lg shadow-sm">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-l-lg"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="px-4 py-2 font-medium">
              {formattedMonthYear}
              {isCurrentMonth && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Current
                </span>
              )}
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-r-lg"
              disabled={isCurrentMonth}
              aria-label="Next month"
            >
              <ChevronRight
                size={20}
                className={isCurrentMonth ? "text-gray-300" : ""}
              />
            </button>
          </div>

          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center cursor-pointer transition-colors duration-300"
            title="Generate a monthly report using HTML/CSS"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Generate Monthly Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Bookings"
          value={stats.activeBookings}
          borderColor="border-green-500"
        />
        {/* <StatCard
          title="Pending Bookings"
          value={stats.pendingBookings}
          borderColor="border-yellow-500"
        /> */}
        <StatCard
          title="Checked-in Guests"
          value={stats.checkedInCount}
          borderColor="border-indigo-500"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          borderColor="border-blue-500"
        />
        {/* <StatCard
          title="Occupancy Rate"
          value={`${Math.round(
            (stats.totalRooms > 0
              ? stats.occupiedRooms / stats.totalRooms
              : 0) * 100
          )}%`}
          borderColor="border-purple-500"
        /> */}
        <StatCard
          title="Monthly Revenue"
          value={monthlyRevenueData?.formatted_revenue || "₱0.00"}
          borderColor="border-orange-500"
          tooltip={`Revenue from checked-in and checked-out bookings for ${formattedMonthYear}`}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Monthly Trends - {formattedMonthYear}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">
              Revenue Trends
            </h3>
            <div className="h-64">
              <Line
                data={revenueLineData}
                options={{
                  ...lineOptions,
                  plugins: {
                    ...lineOptions.plugins,
                    tooltip: {
                      ...lineOptions.plugins?.tooltip,
                      callbacks: {
                        label: function (context: any) {
                          let label = context.dataset.label || "";
                          if (label) {
                            label += ": ";
                          }
                          if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(context.parsed.y);
                          }
                          return label;
                        },
                      },
                    },
                    title: {
                      display: true,
                      text: `Daily Revenue - ${formattedMonthYear}`,
                      font: {
                        size: 16,
                      },
                    },
                  },
                }}
                ref={(ref) => {
                  if (ref) {
                    revenueChartRef.current = ref.canvas;
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">
              Booking Trends
            </h3>
            <div className="h-64">
              <Line
                data={bookingTrendsData}
                options={{
                  ...lineOptions,
                  plugins: {
                    ...lineOptions.plugins,
                    title: {
                      display: true,
                      text: `Daily Bookings - ${formattedMonthYear}`,
                      font: {
                        size: 16,
                      },
                    },
                  },
                }}
                ref={(ref) => {
                  if (ref) {
                    bookingTrendsChartRef.current = ref.canvas;
                  }
                }}
              />
            </div>
          </div>

          {/* <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">Occupancy Rate</h3>
            <div className="h-64">
              <Line
                data={occupancyRateData}
                options={{
                  ...lineOptions,
                  plugins: {
                    ...lineOptions.plugins,
                    tooltip: {
                      ...lineOptions.plugins?.tooltip,
                      callbacks: {
                        label: function (context: any) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += `${context.parsed.y.toFixed(1)}%`;
                          }
                          return label;
                        }
                      }
                    },
                    title: {
                      display: true,
                      text: `Daily Occupancy Rates - ${formattedMonthYear}`,
                      font: {
                        size: 16
                      }
                    }
                  }
                }}
              />
            </div>
          </div> */}

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">
              Check-ins & Check-outs
            </h3>
            <div className="h-64">
              <Line
                data={checkInOutData}
                options={{
                  ...lineOptions,
                  plugins: {
                    ...lineOptions.plugins,
                    title: {
                      display: true,
                      text: `Daily Check-ins & Check-outs - ${formattedMonthYear}`,
                      font: {
                        size: 16,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Key Business Insights - {formattedMonthYear}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">
              Revenue by Room
            </h3>
            <div className="h-64">
              <Bar data={roomRevenueData} options={barOptions} />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">
              Bookings by Room
            </h3>
            <div className="h-64">
              <Bar data={roomBookingCountData} options={barOptions} />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-center">
              Booking Status Distribution
            </h3>
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
            <h3 className="text-lg font-medium mb-2 text-center">
              Cancellation Trends
            </h3>
            <div className="h-64">
              <Line
                data={cancellationData}
                options={{
                  ...lineOptions,
                  plugins: {
                    ...lineOptions.plugins,
                    legend: {
                      position: "top",
                      labels: {
                        usePointStyle: true,
                        boxWidth: 10,
                        padding: 20,
                      },
                    },
                    title: {
                      display: true,
                      text: `Booking Cancellations - ${formattedMonthYear}`,
                      font: {
                        size: 16,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
