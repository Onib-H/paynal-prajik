import { Book } from "lucide-react";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../contexts/AuthContext";

interface RoomCardProps {
  id: string | number;
  name: string;
  image: string;
  title: string;
  capacity: string;
  price: string;
  description: string;
}

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

  const truncatedDescription = description && description.length > 65
    ? `${description.substring(0, 65)}...`
    : description || "No description available.";

  return (
    <div
      className="rounded-lg overflow-hidden shadow-md bg-white flex flex-col transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      onClick={() => navigate(`/rooms/${id}`)}
    >
      <img
        loading="lazy"
        src={image}
        alt={title}
        className="w-full h-48 object-cover"
      />
      <div className="flex flex-col flex-1 p-4">
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">{name}</h1>
          </div>
        </div>

        {/* Description with 50 character limit */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {truncatedDescription}
        </p>

        <div className="mt-auto pt-4 border-t border-gray-200 flex items-center justify-between font-montserrat">
          <span className="text-xl font-semibold text-gray-900">{price}</span>
          <button
            className={`${isAuthenticated
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
              } text-white text-sm px-3 py-2 rounded-md transition-colors flex items-center gap-1 cursor-pointer`}
            onClick={handleReserveClick}
            title={
              isAuthenticated ? "Book this room" : "Login required to book"
            }
          >
            <Book size={16} /> <span>Book</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
