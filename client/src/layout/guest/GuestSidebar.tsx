import { Ban, Calendar, Home, User } from "lucide-react";
import { FC } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUserContext } from "../../contexts/AuthContext";

const menuItems = [
  { icon: <User size={18} />, label: "My Profile", link: "/guest/:id" },
  { icon: <Calendar size={18} />, label: "Bookings", link: "/guest/bookings" },
  { icon: <Ban size={18} />, label: "Cancellations", link: "/guest/cancellations" },
];

const GuestSidebar: FC = () => {
  const navigate = useNavigate();
  const { userDetails } = useUserContext();

  return (
    <aside className="w-68 min-h-screen flex flex-col bg-white shadow-md border-r border-gray-200 overflow-hidden">
      <div className="px-3 py-4 border-b border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center space-x-2 p-2 rounded-md text-purple-600 hover:bg-purple-100 cursor-pointer hover:text-purple-600 transition-colors duration-200"
        >
          <Home size={25} className="mr-2" />
          <span className="text-md">Go To Homepage</span>
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-grow overflow-y-auto py-4 px-3">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.link.replace(':id', userDetails?.id?.toString() || '')}
                end={item.link.includes(':id')}
                className={({ isActive }) => `
                  block w-full
                  ${isActive ? 'text-purple-700 font-bold' : ''}
                `}
              >
                {({ isActive }) => (
                  <div className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${isActive
                    ? "border-r-4 border-purple-600 bg-purple-100/80 text-purple-700 font-bold"
                    : "hover:bg-purple-100/80"
                    }`}>
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-md">{item.label}</span>
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default GuestSidebar;