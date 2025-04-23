import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGuestNotifications } from "../../services/Guest";
import { useUserContext } from "../../contexts/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Notification {
    id: string;
    message: string;
    type: string;
    booking_id: string;
    is_read: boolean;
    created_at: string;
}

const GuestNotifications: FC = () => {
    const { isAuthenticated } = useUserContext();
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ['guestNotifications'],
        queryFn: getGuestNotifications,
        enabled: isAuthenticated,
    });

    const handleClick = (notification: Notification) => {
        navigate(`/guest/bookings?bookingId=${notification.booking_id}`);
    };

    return (
        <div className="max-w-md p-4">
            <h2 className="text-xl font-bold mb-4">Notifications</h2>
            <div className="space-y-3">
                {data?.data.notifications.map((notification: Notification) => (
                    <div
                        key={notification.id}
                        onClick={() => handleClick(notification)}
                        className={`p-3 rounded-lg cursor-pointer ${!notification.is_read ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-gray-50'}`}
                    >
                        <p className="text-sm text-gray-700">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                    </div>
                ))}
                {data?.data.notifications.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No notifications</p>
                )}
            </div>
        </div>
    );
};

export default GuestNotifications;