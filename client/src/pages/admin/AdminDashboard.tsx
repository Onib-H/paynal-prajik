/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { ArcElement, Chart, Legend, Tooltip } from "chart.js";
import { format, getDay, isAfter, isSameDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useState } from "react";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Doughnut } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import MonthlyReportView from "../../components/admin/MonthlyReportView";
import StatCard from "../../components/admin/StatCard";
import DashboardSkeleton from "../../motions/skeletons/AdminDashboardSkeleton";
import { fetchBookingStatusCounts, fetchDailyBookings, fetchDailyCancellations, fetchDailyNoShowsRejected, fetchDailyRevenue, fetchMonthlyRevenue, fetchRoomBookings, fetchRoomRevenue, fetchStats } from "../../services/Admin";
import "../../styles/print.css";
import { formatCurrency, formatMonthYear, getDaysInMonth } from "../../utils/formatters";
import { prepareReportData } from "../../utils/reports";
import Error from "../_ErrorBoundary";

Chart.register(ArcElement, Tooltip, Legend);

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const AdminDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>("month");
  const [showReportView, setShowReportView] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);

  const today = new Date();
  const selectedMonth = selectedDate.getMonth() + 1;
  const selectedYear = selectedDate.getFullYear();
  const formattedMonthYear = formatMonthYear(selectedMonth - 1, selectedYear);

  const { data, isLoading, error } = useQuery({
    queryKey: ["stats", selectedMonth, selectedYear],
    queryFn: () => fetchStats({
      month: selectedMonth,
      year: selectedYear,
    }),
  });

  const { data: dailyRevenueData } = useQuery({
    queryKey: ['dailyRevenue', selectedMonth, selectedYear],
    queryFn: () => fetchDailyRevenue({
      month: selectedMonth,
      year: selectedYear,
    }),
    select: (data) => data.data || [],
  });

  const { data: bookingStatusData } = useQuery({
    queryKey: ["bookingStatusCounts", selectedMonth, selectedYear],
    queryFn: () => fetchBookingStatusCounts({
      month: selectedMonth,
      year: selectedYear,
    }),
  });

  const { data: dailyBookingsResponse, isLoading: bookingsDataLoading } = useQuery({
    queryKey: ["dailyBookings", selectedMonth, selectedYear],
    queryFn: () => fetchDailyBookings({
      month: selectedMonth,
      year: selectedYear,
    }),
  });

  const { data: dailyCancellationsResponse, isLoading: cancellationsDataLoading } = useQuery({
    queryKey: ["dailyCancellations", selectedMonth, selectedYear],
    queryFn: () => fetchDailyCancellations({
      month: selectedMonth,
      year: selectedYear,
    }),
  });

  const { data: dailyNoShowsRejectedResponse, isLoading: noShowsRejectedDataLoading } = useQuery({
    queryKey: ["dailyNoShowsRejected", selectedMonth, selectedYear],
    queryFn: () => fetchDailyNoShowsRejected({
      month: selectedMonth,
      year: selectedYear,
    }),
  });

  const { data: roomRevenueResponse } = useQuery({
    queryKey: ["roomRevenue", selectedMonth, selectedYear],
    queryFn: () => fetchRoomRevenue({
      month: selectedMonth,
      year: selectedYear,
    }),
  });

  const { data: roomBookingsResponse } = useQuery({
    queryKey: ["roomBookings", selectedMonth, selectedYear],
    queryFn: () => fetchRoomBookings({
      month: selectedMonth,
      year: selectedYear,
    }),
  });

  const { data: monthlyRevenueData } = useQuery({
    queryKey: ["monthlyRevenue", selectedMonth, selectedYear],
    queryFn: () => fetchMonthlyRevenue({
      month: selectedMonth,
      year: selectedYear,
    }),
    staleTime: 10 * 60 * 1000,
  });

  const calendarEventsQuery = useQuery({
    queryKey: ['calendarEvents', selectedMonth, selectedYear, dailyRevenueData, dailyBookingsResponse, dailyCancellationsResponse, dailyNoShowsRejectedResponse],
    queryFn: async () => {
      const daysInMonthArray = getDaysInMonth(selectedMonth, selectedYear, true);
      const events: any[] = [];

      const dailyRevenueValues = dailyRevenueData || [];
      const dailyBookingsData = dailyBookingsResponse?.data || [];
      const dailyCancellations = dailyCancellationsResponse?.data || [];
      const dailyNoShows = dailyNoShowsRejectedResponse?.no_shows || [];
      const dailyRejected = dailyNoShowsRejectedResponse?.rejected || [];

      daysInMonthArray.forEach((day, index) => {
        const dayNumber = parseInt(day.toString(), 10);
        if (isNaN(dayNumber)) return;

        const currentDate = new Date(selectedYear, selectedMonth - 1, dayNumber);

        events.push({
          id: `revenue-${index}`,
          title: `Revenue: ${formatCurrency(dailyRevenueValues[index] || 0)}`,
          start: currentDate,
          end: currentDate,
          allDay: true,
          resource: {
            type: 'revenue',
            value: dailyRevenueValues[index] || 0,
            bookings: dailyBookingsData[index] || 0,
            cancellations: dailyCancellations[index] || 0,
            noShows: dailyNoShows[index] || 0,
            rejected: dailyRejected[index] || 0
          }
        })
      });

      return events;
    },
    enabled: !!(
      !isLoading &&
      !bookingsDataLoading &&
      !cancellationsDataLoading &&
      !noShowsRejectedDataLoading &&
      dailyRevenueData
    )
  });

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
    revenue: monthlyRevenueData?.revenue || data?.revenue || 0,
    roomRevenue: data?.room_revenue || 0,
    venueRevenue: data?.venue_revenue || 0,
    formattedRevenue: data?.formatted_revenue,
    formattedRoomRevenue: data?.formatted_room_revenue,
    formattedVenueRevenue: data?.formatted_venue_revenue,
    revenueMonth: selectedMonth,
    revenueYear: selectedYear,
  };

  const bookingStatusCounts = {
    reserved: bookingStatusData?.reserved || 0,
    checked_out: bookingStatusData?.checked_out || 0,
    cancelled: bookingStatusData?.cancelled || 0,
    no_show: bookingStatusData?.no_show || 0,
    rejected: bookingStatusData?.rejected || 0,
  };

  const roomNames = roomRevenueResponse?.room_names || [];
  const roomRevenueValues = roomRevenueResponse?.revenue_data || [];
  const roomBookingValues = roomBookingsResponse?.booking_counts || [];

  const handleGenerateReport = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear, true);
    const dailyRevenueValues = dailyRevenueData?.data || [];
    const dailyBookingsData = dailyBookingsResponse?.data || [];

    const revenueLineData = {
      labels: daysInMonth,
      datasets: [
        {
          label: "Daily Revenue (₱)",
          data: dailyRevenueValues,
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
            bookingStatusCounts.reserved,
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

    const roomRevenueData = {
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

    const reportDataObj = prepareReportData({
      period: formattedMonthYear,
      stats: {
        ...stats,
        occupancyRate: `${Math.round((stats.occupiedRooms / stats.totalRooms) * 100)}%`,
      },
      bookingStatusCounts,
      roomData: {
        names: roomNames,
        bookings: roomBookingValues,
        revenue: roomRevenueValues,
      },
    });

    setReportData({
      ...reportDataObj,
      chartData: {
        revenueLineData,
        bookingTrendsData,
        bookingStatusChartData,
        roomRevenueData,
        roomBookingDistributionData,
      }
    });
    setShowReportView(true);
  };

  const handleCloseReport = () => setShowReportView(false);

  const handleViewChange = (newView: string) => {
    setView(newView as 'month' | 'week' | 'day');
  };

  const handleNavigate = (date: Date) => {
    if (isAfter(date, today) && !isSameDay(date, today)) {
      return;
    }
    setSelectedDate(date);
  };

  const handleDateChange = (date: Date) => {
    if (isAfter(date, today) && !isSameDay(date, today)) {
      return;
    }
    setSelectedDate(date);
  };

  const EventComponent = ({ event }: { event: any }) => {
    const resource = event.resource;

    return (
      <div className="flex flex-col p-1 text-xs overflow-hidden h-full">
        <div className="font-semibold">{event.title}</div>
        {resource.type === 'revenue' && (
          <>
            <div>Bookings: {resource.bookings}</div>
            <div>Cancellations: {resource.cancellations}</div>
            {(resource.noShows > 0 || resource.rejected > 0) && (
              <div>No Shows: {resource.noShows} | Rejected: {resource.rejected}</div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderReport = () => {
    if (!showReportView || !reportData) return null;

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
          revenueData: reportData.chartData.revenueLineData,
          bookingTrendsData: reportData.chartData.bookingTrendsData,
          bookingStatusData: reportData.chartData.bookingStatusChartData,
          revenueContributionData: reportData.chartData.roomRevenueData,
          roomBookingDistributionData: reportData.chartData.roomBookingDistributionData,
        }}
      />
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error || calendarEventsQuery.error) return <Error />;

  return (
    <div className="p-3 container mx-auto">
      {renderReport()}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="flex items-center space-x-4">
          {/* Date Picker for selecting specific dates */}
          <div className="flex items-center bg-white rounded-lg shadow-sm">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              maxDate={today}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              className="px-4 py-2 rounded-lg border-0 focus:outline-none text-center"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded ${view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Day
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

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Active Bookings"
          value={stats.activeBookings}
          borderColor="border-green-500"
        />
        <StatCard
          title="Pending Bookings"
          value={stats.pendingBookings}
          borderColor="border-yellow-500"
        />
        <StatCard
          title="Total Monthly Bookings"
          value={stats.totalBookings}
          borderColor="border-blue-500"
        />
        <StatCard
          title="Monthly Revenue"
          value={stats.formattedRevenue}
          borderColor="border-orange-500"
          tooltip={`Revenue from checked-in and checked-out bookings for ${formattedMonthYear}`}
        />
      </div>

      <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          {view === 'month' ? 'Monthly' : view === 'week' ? 'Weekly' : 'Daily'} Calendar - {formattedMonthYear}
        </h2>

        <div className="h-[700px]">
          <Calendar
            localizer={localizer}
            events={calendarEventsQuery.data || []}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            date={selectedDate}
            components={{
              event: EventComponent
            }}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            popup
            eventPropGetter={(event) => {
              const { type } = event.resource || {};
              let backgroundColor = '#4CAF50';

              if (type === 'revenue' && event.resource.value === 0) {
                backgroundColor = '#E0E0E0';
              }

              return {
                style: {
                  backgroundColor,
                  borderRadius: '4px',
                  color: '#fff',
                  border: 'none',
                }
              };
            }}
            max={new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Revenue by Room Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-4 text-center">
            Revenue by Room - {formattedMonthYear}
          </h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {roomNames.map((room: string, index: number) => {
              const revenue = roomRevenueValues[index] || 0;

              return (
                <motion.div
                  key={`room-${index}`}
                  variants={itemVariants}
                  className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-gray-700">{room}</p>
                    <p className="text-sm text-gray-500">
                      {roomBookingValues[index] || 0} bookings
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg text-blue-600">
                      {formatCurrency(revenue)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Booking Status Distribution Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-4 text-center">
            Booking Status Distribution - {formattedMonthYear}
          </h3>
          <div className="h-80 relative">
            <Doughnut
              data={{
                labels: [
                  'Reserved',
                  'Checked Out',
                  'Cancelled',
                  'No Show',
                  'Rejected',
                ],
                datasets: [
                  {
                    data: [
                      bookingStatusCounts.reserved,
                      bookingStatusCounts.checked_out,
                      bookingStatusCounts.cancelled,
                      bookingStatusCounts.no_show,
                      bookingStatusCounts.rejected,
                    ],
                    backgroundColor: [
                      '#FFC107',
                      '#2196F3',
                      '#4CAF50',
                      '#9E9E9E',
                      '#F44336',
                      '#9C27B0',
                      '#FF5722',
                    ],
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 15,
                      padding: 15,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((Number(value) * 100) / Number(total)).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
                maintainAspectRatio: false,
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
