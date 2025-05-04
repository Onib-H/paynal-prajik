/* eslint-disable @typescript-eslint/no-explicit-any */
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { useMutation } from "@tanstack/react-query";
import { menuItems } from "../../constants/AdminMenuSidebar";
import { useUserContext } from "../../contexts/AuthContext";
import { logout } from "../../services/Auth";
import hotelLogo from "../../assets/hotel_logo.png";
import { webSocketAdminActives, WebSocketEvent } from "../../services/websockets";
import useWebSockets from "../../hooks/useWebSockets";
import { useQuery } from "@tanstack/react-query";

const AdminSidebar: FC = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, setRole, userDetails } = useUserContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBookingCount, setActiveBookingCount] = useState<number>(0);

  const modalCancel = () => setIsModalOpen(false);

  const { mutate: logoutMutation, isPending: logoutLoading } = useMutation({
    mutationFn: logout,
    onSuccess: (response) => {
      if (response.status === 200) {
        setIsAuthenticated(false);
        setRole("");
        navigate("/");
      }
    },
    onError: (error) => {
      console.error(`Failed to logout: ${error}`);
    },
  });

  const handleLogout = () => logoutMutation();

  const { send } = useWebSockets(webSocketAdminActives, userDetails?.id, {
    active_count_update: (data: WebSocketEvent) => {
      if (data.type === "active_count_update") {
        setActiveBookingCount(data.count);
      }
    }
  });

  const fetchActiveBookings = async (send: (message: any) => void): Promise<number> => {
    return new Promise((resolve) => {
      send({ type: "get_active_count" });
      resolve(activeBookingCount);
    });
  };

  const { refetch } = useQuery({
    queryKey: ["activeBookings"],
    queryFn: () => fetchActiveBookings(send),
    enabled: !!userDetails?.id,
    refetchInterval: 10000, 
    refetchIntervalInBackground: true,
    initialData: activeBookingCount,
  });

  useEffect(() => {
    if (userDetails?.id) refetch();
  }, [userDetails?.id, refetch]);

  const updatedMenuItems = menuItems.map(item => {
    if (item.label === "Manage Bookings") {
      return {
        ...item,
        label: (
          <div className="flex items-end justify-end w-full">
            <span>Manage Bookings</span>
            {activeBookingCount > 0 && (
              <span className="ml-14 bg-purple-600 font-semibold text-white rounded-full px-2 py-1 text-xs">
                {activeBookingCount}
              </span>
            )}
          </div>
        )
      }
    }
    return item;
  });

  return (
    <>
      <aside className="fixed top-0 left-0 flex flex-col p-4 bg-white text-black h-full transition-all duration-300 min-w-[300px]">
        {/* Header section with hotel logo */}
        <div className="border-b border-purple-200 pb-4 flex items-center justify-between w-full">
          <img
            loading="lazy"
            src={hotelLogo}
            alt="Hotel Logo"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Menu items */}
        <div className="flex-grow overflow-y-auto p-2 w-full">
          <ul className="space-y-4">
            {updatedMenuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.link}
                  end={item.link === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 rounded-md cursor-pointer ${isActive
                      ? "border-r-4 border-purple-600 bg-purple-100/80 text-purple-700 font-bold"
                      : "hover:bg-purple-100/80 transition-colors duration-300"
                    } py-2 px-3`
                  }
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="w-5 h-5 text-xl"
                  />
                  <span className="text-md">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Logout button */}
        <div className="px-3 py-4 w-full">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex justify-center items-center space-x-2 p-3 rounded-md transition-all duration-300 text-red-600 hover:bg-black/15 cursor-pointer"
          >
            <i className="fa fa-sign-out-alt font-light"></i>
            <span className="font-semibold text-xl uppercase">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Modal */}
      <Modal
        isOpen={isModalOpen}
        icon="fas fa-sign-out-alt"
        title="Log Out"
        description="Are you sure you want to log out?"
        cancel={modalCancel}
        onConfirm={handleLogout}
        loading={logoutLoading}
        className={`bg-red-600 hover:bg-red-700 font-bold uppercase text-white px-4 py-2 rounded-md shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-300 cursor-pointer ${logoutLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        confirmText={
          logoutLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Logging
              out...
            </>
          ) : (
            "Log Out"
          )
        }
        cancelText="Cancel"
      />
    </>
  );
};

export default AdminSidebar;
