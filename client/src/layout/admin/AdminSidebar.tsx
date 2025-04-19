import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, Suspense, lazy, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { menuItems } from "../../constants/AdminMenuSidebar";
import { useUserContext } from "../../contexts/AuthContext";
import { fetchAdminProfile } from "../../services/Admin";
import { logout } from "../../services/Auth";
import AdminProfile from "./AdminProfile";

const AdminDetailSkeleton = lazy(() => import("../../motions/skeletons/AdminDetailSkeleton"));

const AdminSidebar: FC<{ role: string }> = ({ role }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { setIsAuthenticated, setRole } = useUserContext();
  const navigate = useNavigate();

  const modalCancel = () => setIsModalOpen(!isModalOpen);

  const { data: adminData, isLoading: profileLoading } = useQuery({
    queryKey: ['adminProfile'],
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
      console.error(`Failed to error: ${error}`);
    }
  })
  
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
      <aside className="min-h-screen flex flex-col p-4 bg-white text-black w-2xs">
        <div className="p-2">
          <Suspense fallback={<AdminDetailSkeleton />}>
            {profileLoading ? <AdminDetailSkeleton /> : adminData && <AdminProfile admin={adminData} />}
          </Suspense>
        </div>
        <div className="flex-grow overflow-y-auto p-2">
          <ul className="space-y-4">
            {filteredMenuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.link}
                  end={item.link === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 justify-baseline rounded-md cursor-pointer ${isActive
                      ? "border-r-3 border-purple-600 bg-purple-100/80 text-purple-700 font-bold"
                      : "hover:bg-purple-100/80 transition-colors duration-300"
                    }`
                  }
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="p-2 w-5 h-5 text-xl text-left"
                  />{" "}
                  <span className="text-md">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-3 py-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center space-x-3 py-2 px-3 rounded-md transition-all duration-300 text-red-600 hover:bg-black/15 cursor-pointer"
          >
            <i className="fa fa-sign-out-alt font-light"></i>
            <span className="font-bold uppercase">Log Out</span>
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
        loading={logoutLoading}
        className={`bg-red-600 text-white hover:bg-red-700 font-bold uppercase text-sm px-6 py-3 rounded-md shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-300 cursor-pointer ${logoutLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        confirmText={
          logoutLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Logging out...
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
