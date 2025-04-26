/* eslint-disable @typescript-eslint/no-explicit-any */
import { faEye, faEyeSlash, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendRegisterOtp } from "../services/Auth";
import GoogleButton from "./GoogleButton";
import Notification from "./Notification";
import TermsModal from "./TermsModal";
import { SubmitHandler, useForm } from "react-hook-form";
import logo from "../assets/logo.png";

interface SignupModalProps {
  toggleRegisterModal: () => void;
  openLoginModal: () => void;
  onSuccessfulSignup?: () => void;
}

interface SignupFormInputs {
  email: string;
  password: string;
  confirmPassword: string;
  termsAgreed?: boolean;
}

const SignupModal: FC<SignupModalProps> = ({ toggleRegisterModal, openLoginModal, onSuccessfulSignup }) => {
  const navigate = useNavigate();

  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    icon: string;
  } | null>(null);

  const { register, handleSubmit, formState: { errors }, setError, getValues, watch, setValue } = useForm<SignupFormInputs>({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      termsAgreed: false
    }
  });

  const password = watch("password");

  const togglePassword = () => setPasswordVisible(!passwordVisible);
  const toggleConfirmPassword = () => setConfirmPasswordVisible(!confirmPasswordVisible);

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
    mutationFn: async (formData: SignupFormInputs) => {
      return await sendRegisterOtp(formData.email, formData.password, formData.confirmPassword);
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

        const formValues = getValues();
        navigate("/registration", { state: { email: formValues.email, password } });
      }
    },
    onError: (error: any) => {
      console.error(`Failed to register: ${error}`);
      const { data, status } = error.response;
      if (!error.response) {
        setError("root", { message: data.error.general });
      } else {
        if (status === 500) {
          const message = data.error;
          setError("root", { message: message })
        } else if (data.error) {
          if (data.error.email) setError("email", { message: data.error.email });
          if (data.error.password) setError("password", { message: data.error.password });
          if (data.error.confirm_password) setError("confirmPassword", { message: data.error.confirm_password });
          if (data.error.general) setError("root", { message: data.error.general, type: "500" });
        }
      }
    }
  });

  const onSubmit: SubmitHandler<SignupFormInputs> = (data) => {
    registerMutation(data);
  };

  return (
    <>
      <AnimatePresence mode="popLayout">
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
              className="absolute top-3 right-3 z-40 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              onClick={toggleRegisterModal}
            >
              <i className="fa fa-x"></i>
            </motion.button>

            <div className="p-7 space-y-4 md:space-y-6 sm:p-9">
              <motion.img
                src={logo}
                alt={logo}
                loading="lazy"
                className="w-16 h-16 mx-auto mb-2"
                variants={formItemVariants}
                custom={0}
              />
              
              <motion.h1
                className="text-3xl text-center font-bold text-gray-800 mb-2 tracking-wide"
                variants={formItemVariants}
                custom={0}
              >
                Register to <span className="text-purple-600">Azurea</span>
              </motion.h1>

              <motion.div
                className="border-b-2 border-gray-300 my-4 origin-center"
                variants={formItemVariants}
                custom={2}
              ></motion.div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                <motion.div
                  className="mb-3"
                  variants={formItemVariants}
                  custom={3}
                >
                  <label
                    htmlFor="email"
                    className="text-lg font-semibold text-gray-700 tracking-tighter"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-3 top-3 z-20 text-gray-600"></i>
                    <motion.input
                      type="email"
                      id="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: "Invalid email address"
                        }
                      })}
                      className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-sm mt-1 focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 pl-9"
                      placeholder="email@gmail.com"
                    />
                    {errors.email && (
                      <motion.p
                        className="text-red-600 text-sm mt-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors.email.message}
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
                    className="text-lg font-semibold text-gray-700 tracking-tighter"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <i className="fa-solid fa-lock absolute left-3 top-4 z-20 text-gray-600"></i>
                    <motion.input
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters"
                        }
                      })}
                      className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-sm mt-1 focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 pl-9"
                      placeholder="Enter your password"
                    />
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={togglePassword}
                      className="absolute right-3 bottom-2 cursor-pointer text-gray-800"
                    >
                      <FontAwesomeIcon
                        icon={passwordVisible ? faEyeSlash : faEye}
                        size="lg"
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
                      {errors.password.message}
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
                    className="text-lg font-semibold text-gray-700 tracking-tighter"
                  >
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <i className="fa-solid fa-lock absolute left-3 top-4 z-20 text-gray-600"></i>
                    <motion.input
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      {...register("confirmPassword", {
                        required: "Confirm Password is required",
                        validate: value => value === watch("password") || "Passwords do not match"
                      })}
                      type={confirmPasswordVisible ? "text" : "password"}
                      className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-md mt-1 focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 pl-9"
                    />
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleConfirmPassword}
                      className="absolute right-3 bottom-2 cursor-pointer text-gray-800"
                    >
                      <FontAwesomeIcon
                        icon={confirmPasswordVisible ? faEyeSlash : faEye}
                        size="lg"
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
                      {errors.confirmPassword.message}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  className="mb-4"
                  variants={formItemVariants}
                  custom={6}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="termsAgreed"
                      checked={watch("termsAgreed")}
                      onClick={() => setShowTermsModal(true)}
                      readOnly
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="termsAgreed" className="ml-2 text-md text-gray-700">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-purple-600 hover:underline"
                      >
                        Terms and Conditions
                      </button>
                    </label>
                  </div>
                </motion.div>

                <motion.button
                  variants={formItemVariants}
                  custom={6}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading}
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
                  <GoogleButton
                    text="Sign up with Google"
                    requireTermsAgreement={true}
                  />
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
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAgree={() => {
          setValue("termsAgreed", true);
          setShowTermsModal(false);
        }}
      />
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
