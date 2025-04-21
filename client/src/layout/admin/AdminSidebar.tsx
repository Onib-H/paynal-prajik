import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, Suspense, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { menuItems } from "../../constants/AdminMenuSidebar";
import { useUserContext } from "../../contexts/AuthContext";
import { fetchAdminProfile } from "../../services/Admin";
import { logout } from "../../services/Auth";
import AdminProfile from "./AdminProfile";
import hotelLogo from "../../assets/hotel_logo.png";

const AdminSidebar: FC = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, role, setRole } = useUserContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const modalCancel = () => setIsModalOpen(false);

  const { data: adminData, isLoading: profileLoading } = useQuery({
    queryKey: ["adminProfile"],
    queryFn: async () => {
      const response = await fetchAdminProfile();
      return response.data.data;
    },
  });

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

  const filteredMenuItems = menuItems.filter((item) => {
    if (role.toLowerCase() === "staff") {
      if (
        item.label === "Dashboard" ||
        item.label === "Manage Staff" ||
        item.label === "Reports"
      ) {
        return false;
      }
    }
    return true;
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

        {/* Admin profile */}
        <div className="p-2 mb-4 bg-purple-100 rounded-md shadow-sm shadow-purple-300 w-full">
          <Suspense fallback={<div>Loading...</div>}>
            {profileLoading ? (
              <div>Loading...</div>
            ) : (
              adminData && <AdminProfile admin={adminData} />
            )}
          </Suspense>
        </div>

        {/* Menu items */}
        <div className="flex-grow overflow-y-auto p-2 w-full">
          <ul className="space-y-4">
            {filteredMenuItems.map((item, index) => (
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
            className="w-full flex items-center space-x-3 py-2 px-3 rounded-md transition-all duration-300 text-red-600 hover:bg-black/15 cursor-pointer"
          >
            <i className="fa fa-sign-out-alt font-light"></i>
            <span className="font-bold uppercase">Log Out</span>
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
        className={`bg-red-600 text-white hover:bg-red-700 font-bold uppercase text-sm px-6 py-3 rounded-md shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-300 cursor-pointer ${logoutLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
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
