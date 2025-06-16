import { AlertCircle, Book, Eye } from "lucide-react";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../contexts/AuthContext";
import { useBookingLimit } from "../../contexts/BookingLimitContext";
import { AreaCardProps } from "../../types/AreaClient";
import { formatDiscountedPrice, parsePriceValue } from "../../utils/formatters";

const VenueCard: FC<AreaCardProps> = ({ id, title, priceRange, image, description, discount_percent }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserContext();
  const { canBook, maxLimit } = useBookingLimit();

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/areas/${id}?showLogin=true`);
      return;
    }
    if (!canBook) return;
    navigate(`/area-booking/${id}`);
  };

  const truncatedDescription =
    description && description.length > 65
      ? `${description.substring(0, 65)}...`
      : description || "No description available.";

  const buttonClass = isAuthenticated
    ? canBook
      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-purple-100 hover:shadow-purple-200 cursor-pointer"
      : "bg-gray-400 cursor-not-allowed"
    : "bg-gray-400 cursor-not-allowed";

  const buttonTitle = isAuthenticated
    ? canBook
      ? "Book this venue"
      : `Limit of ${maxLimit} bookings per day reached`
    : "Login required to book";

  // Discounted price logic
  const priceValue = parsePriceValue(priceRange);
  const hasDiscount = discount_percent && discount_percent > 0;
  const discountedPrice = hasDiscount ? formatDiscountedPrice(priceValue, discount_percent) : null;
  const originalPrice = formatDiscountedPrice(priceValue, 0);

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-lg bg-white flex flex-col cursor-pointer group h-full transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
      onClick={() => navigate(`/areas/${id}`)}
    >
      {/* Discount badge top-right */}
      {hasDiscount && (
        <span className="absolute top-3 right-3 z-20 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
          -{discount_percent}% OFF
        </span>
      )}
      {/* Image container with elegant overlay */}
      <div className="relative w-full h-48 overflow-hidden group">
        <img
          loading="lazy"
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Subtle interactive overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/60 via-blue-800/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          {/* Simple "View Details" text that slides up */}
          <div className="transform translate-y-5 group-hover:translate-y-0 transition-transform duration-300 flex flex-col items-center">
            <div className="flex items-center gap-2 text-white font-medium">
              <Eye className="w-5 h-5 text-violet-200" />
              <span className="text-lg text-white">View Details</span>
            </div>
            <div className="w-8 h-0.5 bg-blue-300 mt-2 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Card content with subtle animation */}
      <div className="flex flex-col flex-1 p-5 transition-all duration-300 group-hover:bg-gray-50">
        <div className="mb-3">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
              {title}
            </h1>
            <span className="text-lg font-semibold text-purple-600 flex flex-row items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="line-through text-gray-400 text-base">{originalPrice}</span>
                  <span className="text-xl font-bold text-purple-700">{discountedPrice}</span>
                </>
              ) : (
                <span className="text-xl font-bold text-purple-700">{originalPrice}</span>
              )}
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {truncatedDescription}
        </p>

        <div className="mt-auto w-full pt-4 border-t border-gray-100 group-hover:border-purple-200 transition-colors">
          <button
            className={`${buttonClass} w-full text-center text-white text-sm px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden`}
            onClick={handleBookNow}
            title={buttonTitle}
            disabled={!isAuthenticated || !canBook}
          >
            {/* Animated background layer */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Button content */}
            {isAuthenticated && !canBook ? (
              <AlertCircle size={18} className="shrink-0" />
            ) : (
              <Book size={18} className="shrink-0" />
            )}
            <span className="font-semibold uppercase tracking-wide">Book Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
