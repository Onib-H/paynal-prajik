/* eslint-disable @typescript-eslint/no-explicit-any */
import { faEye, faEyeSlash, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { FC, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../contexts/AuthContext";
import { login } from "../services/Auth";
import GoogleButton from "./GoogleButton";
import Notification from "./Notification";
import { useMutation } from "@tanstack/react-query";

interface LoginProps {
  toggleLoginModal: () => void;
  openSignupModal: () => void;
  onSuccessfulLogin?: () => void;
  bookingInProgress?: boolean;
}

const LoginModal: FC<LoginProps> = ({ toggleLoginModal, openSignupModal, onSuccessfulLogin, bookingInProgress = false }) => {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    icon: string;
  } | null>(null);

  const navigate = useNavigate();
  const { setIsAuthenticated, setRole, setUserDetails, setProfileImage } = useUserContext();

  const togglePassword = () => setPasswordVisible(!passwordVisible);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3, delay: 0.1 } }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 40,
      rotateX: 20,
      transformPerspective: 1000
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 200,
        duration: 0.4
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 40,
      rotateX: 10,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const formItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 + custom * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  const { mutate: loginMutation, isPending: loading } = useMutation({
    mutationFn: async () => {
      return await login(email, password);
    },
    onSuccess: (response) => {
      if (response.status === 200) {
        const { user } = response.data;
        setUserDetails(user);
        setProfileImage(user.profile_image || "");
        setIsAuthenticated(true);
        setRole(user.role || "guest");

        setNotification({
          message: bookingInProgress ? "Logged in successfully, completing your booking..." : "Logged in successfully",
          type: "success",
          icon: "fas fa-chcek-circle"
        });

        if (onSuccessfulLogin) {
          toggleLoginModal();
          onSuccessfulLogin();
          return;
        }

        if (user.role === "admin") navigate("/admin");
        else navigate("/guest/bookings");
      }
    },
    onError: (error: any) => {
      console.error(`Failed to login: ${error}`);
      const errData = error.response?.data;
      if (errData && errData.error) {
        const message = errData.error;
        if (message.toLowerCase().includes("user does not exist")) {
          setErrors({ email: message });
        } else if (message.toLowerCase().includes("password")) {
          setErrors({ password: message });
        } else {
          setErrors({ general: message });
        }
      } else {
        setErrors({ general: "An error occured" });
      }
    }
  });

  const loginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    loginMutation();
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.section
          className="relative z-20 min-h-screen flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
        >
          <motion.div
            className="relative z-30 w-full max-w-md bg-white rounded-xl border border-gray-200 sm:max-w-md xl:p-2 dark:border-gray-700 shadow-2xl backdrop-blur-sm"
            variants={modalVariants}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-3 right-3 z-40 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={toggleLoginModal}
            >
              <i className="fa fa-x"></i>
            </motion.button>

            <div className="p-7 space-y-4 md:space-y-6 sm:p-9">
              <motion.h1
                className="text-3xl text-center font-bold text-gray-800 mb-2 tracking-wide"
                variants={formItemVariants}
                custom={0}
              >
                Welcome to <span className="text-purple-600">Azurea</span>
              </motion.h1>

              <motion.h3
                className="text-normal text-center text-gray-500 tracking-wide mb-4"
                variants={formItemVariants}
                custom={1}
              >
                Azurea Hotel Management System
              </motion.h3>

              {bookingInProgress && (
                <motion.div
                  className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4"
                  variants={formItemVariants}
                  custom={2}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <h4 className="font-semibold text-blue-700 mb-1">Login Required to Complete Booking</h4>
                  <p className="text-sm text-blue-600">
                    Please log in to your account to complete your booking. Don't worry, all your booking information has been saved.
                  </p>
                </motion.div>
              )}

              <motion.div
                className="border-b-2 border-gray-300 mb-4 origin-center"
                variants={formItemVariants}
                custom={3}
              ></motion.div>

              <form onSubmit={loginSubmit} className="space-y-4 md:space-y-6">
                <motion.div
                  className="mb-3"
                  variants={formItemVariants}
                  custom={4}
                >
                  <label
                    htmlFor="email"
                    className="text-md font-semibold text-gray-700 tracking-tighter"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-3 top-3 z-20 text-gray-600"></i>
                    <motion.input
                      type="email"
                      id="email"
                      value={email}
                      placeholder="email@gmail.com"
                      onChange={handleEmailChange}
                      className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-sm mt-1 focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 pl-9"
                      required
                      whileFocus={{
                        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)",
                        borderColor: "#3b82f6"
                      }}
                    />
                    {errors.email && (
                      <motion.p
                        className="text-red-600 text-sm mt-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  className="mb-2 relative"
                  variants={formItemVariants}
                  custom={5}
                >
                  <label
                    htmlFor="password"
                    className="text-md font-semibold text-gray-700 tracking-tighter"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <i className="fa-solid fa-lock absolute left-3 top-4 z-20 text-gray-600"></i>
                    <motion.input
                      placeholder="Enter your password"
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={handlePasswordChange}
                      className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-sm mt-1 focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 pl-9"
                      required
                      whileFocus={{
                        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)",
                        borderColor: "#3b82f6"
                      }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={togglePassword}
                      className="absolute right-3 cursor-pointer text-gray-800"
                    >
                      <FontAwesomeIcon
                        icon={passwordVisible ? faEyeSlash : faEye}
                      />
                    </motion.div>
                  </div>
                  {errors.password && (
                    <motion.p
                      className="text-red-600 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {errors.password}
                    </motion.p>
                  )}
                  <div className="py-2">
                    <motion.div
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Link
                        to="/forgot-password"
                        className="text-md font-semibold text-purple-500 hover:text-purple-700 hover:underline tracking-tighter transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
                <motion.button
                  variants={formItemVariants}
                  custom={6}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!email || !password || loading}
                  className={`w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-800 cursor-pointer transition-all duration-300 flex items-center justify-center ${loading ? "bg-purple-700/30 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faSpinner} className="mr-2" spin />{" "}
                      Logging in...
                    </div>
                  ) : (
                    bookingInProgress ? "Login & Complete Booking" : "Login"
                  )}
                </motion.button>

                <motion.div
                  className="mt-4"
                  variants={formItemVariants}
                  custom={7}
                >
                  <div className="flex items-center justify-center my-2">
                    <hr className="w-full border-gray-300" />
                    <span className="px-3 text-gray-500 text-sm">OR</span>
                    <hr className="w-full border-gray-300" />
                  </div>
                  <GoogleButton text="Login with Google" />
                </motion.div>
              </form>
              <motion.div
                className="mt-6 text-center"
                variants={formItemVariants}
                custom={8}
              >
                <span className="text-gray-600">Don't have an account? </span>
                <motion.button
                  onClick={() => {
                    toggleLoginModal();
                    openSignupModal();
                  }}
                  className="text-purple-500 cursor-pointer font-bold hover:text-purple-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Register here
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>
      </AnimatePresence>
      {notification && (
        <Notification
          icon={notification.icon}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

export default LoginModal;
