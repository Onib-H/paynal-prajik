import { FC } from "react";

const BookingStatusBadge: FC<{ status: string }> = ({ status }) => {
    let bgColor = "";
    const formattedStatus = status.toUpperCase();

    switch (status.toLowerCase()) {
        case "pending":
            bgColor = "bg-yellow-100 text-yellow-800";
            break;
        case "reserved":
            bgColor = "bg-green-100 text-green-800";
            break;
        case "confirmed":
            bgColor = "bg-green-100 text-green-800";
            break;
        case "checked_in":
            bgColor = "bg-blue-100 text-blue-800";
            break;
        case "checked_out":
            bgColor = "bg-gray-100 text-gray-800";
            break;
        case "cancelled":
            bgColor = "bg-red-100 text-red-800";
            break;
        case "rejected":
            bgColor = "bg-red-100 text-red-800";
            break;
        case "no_show":
            bgColor = "bg-purple-100 text-purple-800";
            break;
        default:
            bgColor = "bg-gray-100 text-gray-800";
    }

    return (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${bgColor}`}>
            {formattedStatus.replace("_", " ")}
        </span>
    );
};

export default BookingStatusBadge;