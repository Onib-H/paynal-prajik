/* eslint-disable @typescript-eslint/no-explicit-any */
import { faEye, faEyeSlash, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { FC, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendRegisterOtp } from "../services/Auth";
import GoogleButton from "./GoogleButton";
import Notification from "./Notification";

interface SignupModalProps {
  toggleRegisterModal: () => void;
  openLoginModal: () => void;
  onSuccessfulSignup?: () => void;
}

const SignupModal: FC<SignupModalProps> = ({ toggleRegisterModal, openLoginModal, onSuccessfulSignup }) => {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    icon: string;
  } | null>(null);

  const navigate = useNavigate();

  const togglePassword = () => setPasswordVisible(!passwordVisible);
  const toggleConfirmPassword = () =>
    setConfirmPasswordVisible(!confirmPasswordVisible);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value);

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

  const { mutate: registerMutation, isPending: loading } = useMutation({
    mutationFn: async () => {
      return await sendRegisterOtp(email, password, confirmPassword)
    },
    onSuccess: (response) => {
      if (response.status === 200) {
        setNotification({
          message: "OTP sent successfully! Please check your email.",
          type: "success",
          icon: "fas fa-check-circle",
        });

        if (onSuccessfulSignup) {
          localStorage.setItem('pendingBookingCallback', 'true');
          localStorage.setItem('bookingReturnUrl', window.location.pathname + window.location.search);
        }

        navigate("/registration", { state: { email, password } });
      }
    },
    onError: (error: any) => {
      console.error(`Failed to register: ${error}`);
      if (!error.response) {
        setErrors({ general: "Something went wrong. Please try again later." });
      } else {
        const { data, status } = error.response;
        if (status === 500) {
          setErrors({ general: "Something went wrong. Please try again later." });
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            email: data.email || "",
            password: data.password || "",
            general: data.message || "",
          }));
        }
      }
    }
  });

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    registerMutation();
  };

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
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-3 right-3 z-40 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={toggleRegisterModal}
            >
              <i className="fa fa-x"></i>
            </motion.button>

            <div className="p-7 space-y-4 md:space-y-6 sm:p-9">
              <motion.h1
                className="text-3xl text-center font-bold text-gray-800 mb-2 tracking-wide"
                variants={formItemVariants}
                custom={0}
              >
                Register to <span className="text-purple-600">Azurea</span>
              </motion.h1>
              <motion.h3
                className="text-normal text-center text-gray-500 tracking-wide mb-4"
                variants={formItemVariants}
                custom={1}
              >
                Azurea Hotel Management System
              </motion.h3>

              <motion.div
                className="border-b-2 border-gray-300 mb-4 origin-center"
                variants={formItemVariants}
                custom={2}
              ></motion.div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4 md:space-y-6">
                <motion.div
                  className="mb-3"
                  variants={formItemVariants}
                  custom={3}
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
                  custom={4}
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
                      onChange={handlePasswordChange}
                      required
                      className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-sm mt-1 focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 pl-9"
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
                </motion.div>

                <motion.div
                  className="mb-4 relative"
                  variants={formItemVariants}
                  custom={5}
                >
                  <label
                    htmlFor="confirmPassword"
                    className="text-md font-semibold text-gray-700 tracking-tighter"
                  >
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <i className="fa-solid fa-lock absolute left-3 top-4 z-20 text-gray-600"></i>
                    <motion.input
                      placeholder="Confirm your password"
                      id="confirmPassword"
                      onChange={handleConfirmPasswordChange}
                      required
                      type={confirmPasswordVisible ? "text" : "password"}
                      className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-md mt-1 focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 pl-9"
                      whileFocus={{
                        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)",
                        borderColor: "#3b82f6"
                      }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleConfirmPassword}
                      className="absolute right-3 cursor-pointer text-gray-800"
                    >
                      <FontAwesomeIcon
                        icon={confirmPasswordVisible ? faEyeSlash : faEye}
                      />
                    </motion.div>
                  </div>
                  {errors.confirmPassword && (
                    <motion.p
                      className="text-red-600 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </motion.div>

                <motion.button
                  variants={formItemVariants}
                  custom={6}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!email || !password || !confirmPassword || loading}
                  className={`w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-800 cursor-pointer transition-colors duration-300 flex items-center justify-center ${loading ? "bg-purple-700/30 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faSpinner} className="mr-2" />{" "}
                      Registering...
                    </div>
                  ) : (
                    "Register"
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
                  <GoogleButton text="Sign up with Google" />
                </motion.div>
              </form>

              <motion.div
                className="mt-6 text-center"
                variants={formItemVariants}
                custom={8}
              >
                <span className="text-gray-600">Already have an account? </span>
                <motion.button
                  onClick={() => {
                    toggleRegisterModal();
                    openLoginModal();
                  }}
                  className="text-purple-500 font-bold cursor-pointer hover:text-purple-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login here
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

export default SignupModal;
