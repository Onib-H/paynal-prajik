import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { FC, Suspense, useEffect, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import Modal from "../../components/Modal";
import { menuItems } from "../../constants/AdminMenuSidebar";
import { useUserContext } from "../../contexts/AuthContext";
import { fetchAdminProfile } from "../../services/Admin";
import { logout } from "../../services/Auth";
import AdminProfile from "./AdminProfile";
import hotelLogo from "../../assets/hotel_logo.png";

const AdminDetailSkeleton = React.lazy(
  () => import("../../motions/skeletons/AdminDetailSkeleton")
);

interface AdminData {
  name: string;
  role: string;
  profile_pic: string;
}

const AdminSidebar: FC<{ role: string }> = ({ role }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, setRole } = useUserContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const [admin, setAdmin] = useState<AdminData>({
    name: "",
    role: "",
    profile_pic: "",
  });

  const modalCancel = () => setIsModalOpen(!isModalOpen);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await logout();
      if (response.status === 200) {
        setIsAuthenticated(false);
        setRole("");
        navigate("/");
      }
      setLoading(false);
    } catch (error) {
      console.error(`Failed to logout: ${error}`);
    }
  };

  useEffect(() => {
    const adminProfile = async () => {
      try {
        const response = await fetchAdminProfile();
        setAdmin(response.data.data);
      } catch (error) {
        console.error(`Failed to fetch admin profile: ${error}`);
      }
    };
    adminProfile();
  }, []);

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
      <aside
        className={`fixed top-0 left-0 flex flex-col p-4 bg-white text-black h-full transition-all duration-300  ${
          isSidebarOpen ? "min-w-[300px]" : "w-[100px] items-center"
        }`}
      >
        {/* Header section with toggle icon */}
        <div
          className={`border-b border-purple-200 pb-4 mb-4 flex items-center w-full ${
            isSidebarOpen ? "justify-between" : "justify-center"
          }`}
        >
          {isSidebarOpen && (
            <Link to="/" className="flex items-center space-y-1">
              <img
                loading="lazy"
                src={hotelLogo}
                alt="Hotel Logo"
                className="h-16 w-auto object-contain relative right-7"
              />
            </Link>
          )}
          <i
            className="fa fa-bars text-3xl cursor-pointer"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          ></i>
        </div>

        {/* Admin profile */}
        <div
          className={`p-2 pb-4 mb-4 bg-purple-100 rounded-md shadow-sm shadow-purple-300 w-full ${
            !isSidebarOpen ? "flex justify-center" : ""
          }`}
        >
          <Suspense fallback={<AdminDetailSkeleton />}>
            {admin ? (
              <AdminProfile
                admin={admin}
                hideName={!isSidebarOpen} // Pass prop to hide name
              />
            ) : (
              <AdminDetailSkeleton />
            )}
          </Suspense>
        </div>

        {/* Menu items */}
        <div className={`flex-grow overflow-y-auto p-2 w-full`}>
          <ul className="space-y-4">
            {filteredMenuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.link}
                  end={item.link === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center justify-baseline rounded-md cursor-pointer ${
                      isActive
                        ? "border-r-3 border-purple-600 bg-purple-100/80 text-purple-700 font-bold"
                        : "hover:bg-purple-100/80 transition-colors duration-300"
                    } ${
                      !isSidebarOpen ? "justify-center space-x-0" : "space-x-2"
                    }`
                  }
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="p-2 w-5 h-5 text-xl text-left"
                  />
                  {isSidebarOpen && (
                    <span className="text-md">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Logout button */}
        <div className="px-3 py-4 w-full">
          <button
            onClick={() => setIsModalOpen(true)}
            className={`w-full flex items-center ${
              !isSidebarOpen ? "justify-center" : "space-x-3"
            } py-2 px-3 rounded-md transition-all duration-300 text-red-600 hover:bg-black/15 cursor-pointer`}
          >
            <i className="fa fa-sign-out-alt font-light"></i>
            {isSidebarOpen && (
              <span className="font-bold uppercase">Log Out</span>
            )}
          </button>
        </div>
      </aside>

      <Modal
        isOpen={isModalOpen}
        icon="fas fa-sign-out-alt"
        title="Log Out"
        description="Are you sure you want to log out?"
        cancel={modalCancel}
        onConfirm={handleLogout}
        loading={loading}
        className={`bg-red-600 text-white hover:bg-red-700 font-bold uppercase text-sm px-6 py-3 rounded-md shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-300 cursor-pointer ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        confirmText={
          loading ? (
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
