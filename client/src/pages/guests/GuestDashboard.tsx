/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Hotel, MessageSquare } from "lucide-react";
import { FC } from "react";
import { useUserContext } from "../../contexts/AuthContext";
import LoadingHydrate from "../../motions/loaders/LoadingHydrate";
import { getGuestBookings, getGuestDetails } from "../../services/Guest";

const GuestDashboard: FC = () => {
  const { userDetails } = useUserContext();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["guest", userDetails?.id],
    queryFn: () => getGuestDetails(userDetails?.id as string),
    enabled: !!userDetails?.id,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["guestBookings", userDetails?.id],
    queryFn: () => getGuestBookings(userDetails?.id as string, 1, 10),
    enabled: !!userDetails?.id,
  });

  if (profileLoading || bookingsLoading) return <LoadingHydrate />;

  const statsCards = [
    {
      title: "Total Bookings",
      value: bookings?.data?.length || 0,
      icon: <Hotel size={24} className="text-blue-500" />,
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Upcoming Stays",
      value: bookings?.data?.filter((booking: any) =>
        new Date(booking.check_in_date) > new Date()
      ).length || 0,
      icon: <Calendar size={24} className="text-green-500" />,
      color: "bg-green-100 text-green-800",
    },
    {
      title: "Reviews Given",
      value: profile?.data?.reviews_count || 0,
      icon: <MessageSquare size={24} className="text-purple-500" />,
      color: "bg-purple-100 text-purple-800",
    },
    {
      title: "Days Until Next Stay",
      value: calculateDaysUntilNextStay(bookings?.data),
      icon: <Clock size={24} className="text-amber-500" />,
      color: "bg-amber-100 text-amber-800",
    },
  ];

  // Format recent bookings for display
  const recentBookings = bookings?.data?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {profile?.data?.first_name}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.color.split(' ')[0]}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
        </div>
        <div className="p-6">
          {recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings.map((booking: any) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              loading="lazy"
                              src={booking.room_image || "https://placehold.co/100"}
                              alt={booking.room_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{booking.room_name}</div>
                            <div className="text-sm text-gray-500">{booking.room_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.check_in_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.check_out_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${booking.total_amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No bookings found. Why not book a room today?
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function calculateDaysUntilNextStay(bookings: any[]): number | string {
  if (!bookings || bookings.length === 0) return "N/A";

  const today = new Date();
  const upcomingBookings = bookings
    .filter(booking => new Date(booking.check_in_date) > today)
    .sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());

  if (upcomingBookings.length === 0) return "N/A";

  const nextBooking = upcomingBookings[0];
  const nextStayDate = new Date(nextBooking.check_in_date);
  const diffTime = nextStayDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default GuestDashboard;