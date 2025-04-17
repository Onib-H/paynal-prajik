import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { AlertCircle, Book } from "lucide-react";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../contexts/AuthContext";
import { useBookingLimit } from "../../contexts/BookingLimitContext";

interface AreaCardProps {
  id: number;
  title: string;
  priceRange: string;
  capacity: number;
  image: string;
  description: string;
}

const VenueCard: FC<AreaCardProps> = ({
  id,
  title,
  priceRange,
  capacity,
  image,
  description,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserContext();
  const { canBook, maxLimit } = useBookingLimit();

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents triggering the card click event

    if (!isAuthenticated) {
      navigate(`/venues/${id}?showLogin=true`);
      return;
    }

    if (!canBook) {
      // Don't navigate if booking limit reached
      return;
    }

    navigate(`/venue-booking/${id}`);
  };

  // Truncate description to 50 characters
  const truncatedDescription =
    description && description.length > 50
      ? `${description.substring(0, 50)}...`
      : description || "No description available.";

  const buttonClass = isAuthenticated
    ? canBook
      ? "bg-green-600 hover:bg-green-700"
      : "bg-gray-400 cursor-not-allowed"
    : "bg-gray-400 cursor-not-allowed";

  const buttonTitle = isAuthenticated
    ? canBook
      ? "Book this venue"
      : `Limit of ${maxLimit} bookings per day reached`
    : "Login required to book";

  return (
    <div
      className="rounded-lg overflow-hidden shadow-md bg-white flex flex-col transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      onClick={() => navigate(`/venues/${id}`)}
    >
      <motion.img
        loading="lazy"
        src={image}
        alt={title}
        className="w-full h-64 object-cover"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{title}</h3>
          </div>

          {/* Description with 50 character limit */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {truncatedDescription}
          </p>

          <div className="flex justify-between items-center text-sm mt-4 text-gray-700">
            <span className="font-medium flex items-center gap-1">
              <FontAwesomeIcon icon={faUsers} className="text-blue-500" />{" "}
              {capacity} pax
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-purple-200">
          <span className="font-semibold text-lg font-montserrat">
            {priceRange}
          </span>
          <button
            className={`${
              isAuthenticated
                ? "bg-purple-600 hover:bg-purple-700 cursor-pointer"
                : "bg-gray-400 cursor-not-allowed"
            } text-sm text-white px-3 py-2 rounded-lg font-montserrat transition flex items-center gap-1 `}
            onClick={handleBookNow}
            title={buttonTitle}
            disabled={!isAuthenticated || !canBook}
          >
            {isAuthenticated && !canBook ? (
              <AlertCircle size={16} />
            ) : (
              <Book size={16} />
            )}{" "}
            <span>Book</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
