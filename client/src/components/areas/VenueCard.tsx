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
  image,
  description,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserContext();
  const { canBook, maxLimit } = useBookingLimit();

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!isAuthenticated) {
      navigate(`/venues/${id}?showLogin=true`);
      return;
    }

    if (!canBook) return;
    navigate(`/venue-booking/${id}`);
  };

  const truncatedDescription = description && description.length > 50
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
          <p className="text-gray-600 text-sm line-clamp-2">
            {truncatedDescription}
          </p>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <span className="font-semibold text-2xl font-montserrat">
            {priceRange}
          </span>
          <button
            className={`${buttonClass} text-sm text-white px-3 py-2 rounded-lg font-montserrat transition flex items-center gap-1 cursor-pointer`}
            onClick={handleBookNow}
            title={buttonTitle}
            disabled={!isAuthenticated || !canBook}
          >
            {isAuthenticated && !canBook ? <AlertCircle size={16} /> : <Book size={16} />} <span>Book</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
