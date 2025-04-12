import {
  faChevronDown,
  faCircleUser,
  faRightToBracket,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import DefaultImg from "../assets/Default_pfp.jpg";
import hotelLogo from "../assets/hotel_logo.png";
import Dropdown from "../components/Dropdown";
import LoginModal from "../components/LoginModal";
import Modal from "../components/Modal";
import Notification from "../components/Notification";
import SignupModal from "../components/SignupModal";
import { navLinks } from "../constants/Navbar";
import { useUserContext } from "../contexts/AuthContext";
import SlotNavButton from "../motions/CustomNavbar";
import { logout } from "../services/Auth";
import { getGuestDetails } from "../services/Guest";

const Navbar: FC = () => {
  const [loginModal, setLoginModal] = useState(false);
  const [registerModal, setRegisterModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    icon: string;
  } | null>(null);

  const navigate = useNavigate();

  const {
    isAuthenticated,
    profileImage,
    userDetails,
    setProfileImage,
    clearAuthState,
  } = useUserContext();

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      const response = await logout();
      console.log("Logout response:", response.status);

      clearAuthState();
      setIsModalOpen(false);

      navigate("/", { replace: true });
    } catch (error) {
      console.error(`Failed to logout: ${error}`);
      setNotification({
        message: "Error during logout, but session cleared",
        type: "warning",
        icon: "fas fa-exclamation-triangle",
      });
    } finally {
      setLoading(false);
    }
  }, [clearAuthState, navigate]);

  const toggleLoginModal = useCallback(
    () => setLoginModal((prev) => !prev),
    []
  );
  const toggleRegisterModal = useCallback(
    () => setRegisterModal((prev) => !prev),
    []
  );

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (loginModal) setLoginModal(false);
        if (registerModal) setRegisterModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loginModal, registerModal]);

  useEffect(() => {
    if (isAuthenticated) {
      setLoginModal(false);
      setRegisterModal(false);
    }
  }, [isAuthenticated, setProfileImage]);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (isAuthenticated && userDetails?.id) {
        try {
          const data = await getGuestDetails(userDetails.id);
          setProfileImage(data.data.profile_image);
        } catch (err) {
          console.error(`Failed to fetch user profile for Navbar: ${err}`);
        }
      }
    };
    fetchProfileImage();
  }, [isAuthenticated, userDetails?.id, setProfileImage]);

  return (
    <>
      {notification && (
        <Notification
          icon={notification.icon}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <nav className="fixed top-0 left-0 w-full z-40 transition-all duration-75 bg-gray-300 shadow-sm text-semibold font-playfair">
        <div className="container mx-auto flex items-center justify-between h-16 sm:h-18 md:h-20 px-4 sm:px-6 lg:px-10">
          {/* Left Section */}
          <div className="flex items-center">
            <Link to="/">
              <img
                loading="lazy"
                src={hotelLogo}
                alt="Hotel Logo"
                className="h-8 sm:h-10 w-auto cursor-pointer"
              />
            </Link>
          </div>

          {/* Center Section */}
          <div className="hidden lg:flex ">
            <ul className="flex space-x-6 xl:space-x-8">
              {navLinks.map((link, index) => (
                <SlotNavButton
                  key={index}
                  to={link.link}
                  className="text-black hover:text-purple-600"
                >
                  <i className={link.icon}></i> {link.text}
                </SlotNavButton>
              ))}
            </ul>
          </div>

          {/* Right Section */}
          <div className="hidden lg:flex items-center">
            {!isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <button
                  className="py-2 px-3 text-base font-bold border-2 rounded-md hover:border-violet-600 hover:text-violet-600 transition duration-300 focus:ring-2 focus:ring-violet-400 active:scale-95 cursor-pointer"
                  onClick={toggleLoginModal}
                >
                  <FontAwesomeIcon icon={faRightToBracket} /> Login
                </button>

                <button
                  className="py-2 px-3 text-base font-bold border-2 rounded-md hover:border-violet-600 hover:text-violet-600 transition duration-300 focus:ring-2 focus:ring-violet-400 active:scale-95 cursor-pointer"
                  onClick={toggleRegisterModal}
                >
                  Register
                </button>
              </div>
            ) : (
              <Dropdown
                options={[
                  {
                    label: "Account",
                    onClick: () => navigate(`/guest/${userDetails?.id}`),
                    icon: <FontAwesomeIcon icon={faCircleUser} />,
                  },
                  {
                    label: "Log Out",
                    onClick: () => setIsModalOpen(true),
                    icon: <FontAwesomeIcon icon={faRightToBracket} />,
                  },
                ]}
                position="bottom"
              >
                <div className="flex items-center bg-gray-50 rounded-full px-2 py-1">
                  <img
                    loading="lazy"
                    src={profileImage || DefaultImg}
                    alt="Profile"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="ml-2 text-gray-700"
                  />
                </div>
              </Dropdown>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center">
            <button onClick={toggleMenu} className="text-2xl p-2">
              <i className="fa fa-bars"></i>
            </button>
          </div>

          {menuOpen && (
            <div className="lg:hidden">
              <div
                className="fixed inset-0 bg-black/30 z-40"
                onClick={closeMenu}
              ></div>
              <ul className="fixed top-0 right-0 w-full h-screen md:w-3/5 sm:w-4/5 bg-white shadow-md text-black z-50 flex flex-col">
                <div className="flex justify-between items-center pt-4 p-3 bg-gray-200">
                  <Link to="/">
                    <img
                      loading="lazy"
                      src={hotelLogo}
                      alt="Hotel Logo"
                      className="h-8 w-auto cursor-pointer block sm:hidden md:hidden"
                    />
                  </Link>
                  <button onClick={closeMenu}>
                    <i className="fa fa-times text-3xl mr-3 sm:mr-0 "></i>
                  </button>
                </div>
                <li className="p-4 text-black/70">
                  <i className="fa fa-bars text-black/70 mr-3"></i> Navigation
                </li>
                {navLinks.map((link, index) => (
                  <li
                    key={index}
                    className="p-4 mx-7 hover:bg-purple-200 hover:text-purple-700 rounded-md cursor-pointer"
                    onClick={closeMenu}
                  >
                    <NavLink
                      to={link.link}
                      className={({ isActive }) =>
                        `flex items-center ${
                          isActive ? "text-purple-600 font-bold" : ""
                        }`
                      }
                    >
                      <i className={`mr-3 ${link.icon}`}></i> {link.text}
                    </NavLink>
                  </li>
                ))}
                {!isAuthenticated ? (
                  <>
                    <li
                      className="p-4 border-t-2 mt-3 mx-7 border-gray-200 hover:bg-purple-200 hover:text-purple-700 rounded-md cursor-pointer"
                      onClick={toggleLoginModal}
                    >
                      <i className="fa-regular fa-user mr-3"></i> Login
                    </li>
                    <li
                      className="p-4 mx-7 hover:bg-purple-200 hover:text-purple-700 rounded-md cursor-pointer"
                      onClick={toggleRegisterModal}
                    >
                      <i className="fa fa-user-plus mr-1"></i> Sign Up
                    </li>
                  </>
                ) : (
                  <>
                    <li
                      className="p-4 mx-7 hover:bg-purple-200 hover:text-purple-700 rounded-md cursor-pointer"
                      onClick={() => navigate(`/guest/${userDetails?.id}`)}
                    >
                      <i className="fa fa-user-circle mr-3"></i> Account
                    </li>
                    <li
                      className="p-4 mx-7 hover:bg-purple-200 hover:text-purple-700 rounded-md cursor-pointer"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <i className="fa fa-sign-out-alt mr-3"></i> Log Out
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {loginModal && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <LoginModal
            toggleLoginModal={toggleLoginModal}
            openSignupModal={toggleRegisterModal}
          />
        </div>
      )}
      {registerModal && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <SignupModal
            toggleRegisterModal={toggleRegisterModal}
            openLoginModal={toggleLoginModal}
          />
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        icon="fa fa-sign-out-alt"
        title="Log Out"
        description="Are you sure you want to log out?"
        cancel={() => setIsModalOpen(!isModalOpen)}
        onConfirm={handleLogout}
        className={`bg-red-600 text-white active:bg-red-700 font-bold uppercase px-4 py-2 cursor-pointer rounded-md shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 transition-all duration-150 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        loading={loading}
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

export default Navbar;
