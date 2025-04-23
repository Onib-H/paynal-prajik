import { Book, Eye, Star, MapPin, Users } from "lucide-react";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../contexts/AuthContext";
import { RoomCardProps } from "../../types/RoomClient";

const RoomCard: FC<RoomCardProps> = ({
  id,
  name,
  image,
  title,
  price,
  description,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserContext();

  const handleReserveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthenticated) {
      navigate(`/booking/${id}`);
    } else {
      navigate(`/rooms/${id}?showLogin=true`);
    }
  };

  const truncatedDescription =
    description && description.length > 65
      ? `${description.substring(0, 65)}...`
      : description || "No description available.";

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-lg bg-white flex flex-col cursor-pointer group h-full transition-all duration-500"
      onClick={() => navigate(`/rooms/${id}`)}
    >
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

        {/* Discrete corner indicator */}
        <div className="absolute top-3 right-3 bg-white/90 text-blue-600 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Eye className="w-3 h-3" />
        </div>

        {/* Animated border indicator */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/50 transition-all duration-500 rounded-xl pointer-events-none"></div>
      </div>
      {/* Card content with subtle animation */}
      <div className="flex flex-col flex-1 p-5 transition-all duration-300 group-hover:bg-gray-50">
        <div className="mb-3">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
              {name}
            </h1>
            <span className="text-lg font-semibold text-purple-600">
              {price}
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {truncatedDescription}
        </p>

        <div className="mt-auto pt-4 border-t border-gray-100 group-hover:border-purple-200 transition-colors flex items-center justify-between">
          <button
            className={`${
              isAuthenticated
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-purple-100 hover:shadow-purple-200 cursor-pointer"
                : "bg-gray-400 cursor-not-allowed"
            } text-white text-sm px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2`}
            onClick={handleReserveClick}
            title={
              isAuthenticated ? "Book this room" : "Login required to book"
            }
          >
            <Book size={16} /> <span>Book Now</span>
          </button>

          <button
            className="text-sm text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/rooms/${id}`);
            }}
          >
            <Eye size={16} /> View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
