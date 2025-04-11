/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { FC, FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import { useUserContext } from "../contexts/AuthContext";
import { completeRegistration, resendOtp, verifyOtp } from "../services/Auth";

const RegistrationFlow: FC = () => {
    const [otp, setOTP] = useState<string[]>(Array(6).fill(""));
    const [resendDisabled, setResendDisabled] = useState<boolean>(true);
    const [timer, setTimer] = useState<number>(120);
    const [otpError, setOtpError] = useState<string>("");
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const [notification, setNotification] = useState<{
        message: string;
        type: "success" | "error" | "info" | "warning";
        icon: string;
    } | null>(null);
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");

    const location = useLocation();
    const navigate = useNavigate();

    const { setIsAuthenticated, setUserDetails } = useUserContext();
    const { email, password, isGoogleAuth } = (location.state as {
        email: string;
        password: string;
        isGoogleAuth?: boolean;
    }) || {};

    useEffect(() => {
        if (!email || !password) {
            navigate("/");
        }
    }, [email, password, navigate]);

    useEffect(() => {
        if (isGoogleAuth && location.state) {
            const state = location.state as any;
            if (state.firstName) {
                setFirstName(state.firstName);
            }
            if (state.lastName) {
                setLastName(state.lastName);
            }
        }
    }, [isGoogleAuth, location.state]);

    const handleOTPChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value.slice(0, 1);
        setOTP(newOtp);
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOTPKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-input-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const resendOTP = async () => {
        setResendDisabled(true);
        setTimer(120);
        try {
            await resendOtp(email);
            setOTP(Array(6).fill(""));
        } catch (error) {
            console.error(`Failed to resend OTP: ${error}`);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (resendDisabled && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        setResendDisabled(false);
                        if (interval) clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendDisabled, timer]);

    const handleOTPSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setOtpError("");

        let hasErrors = false;
        if (!isGoogleAuth) {
            if (!firstName.trim()) {
                hasErrors = true;
            }
            if (!lastName.trim()) {
                hasErrors = true;
            }
            if (hasErrors) {
                return;
            }
        }

        setIsVerifying(true);
        const otpCode = otp.join("");
        if (otpCode.length !== 6) {
            setOtpError("Please enter a valid 6-digit OTP");
            setIsVerifying(false);
            return;
        }

        try {
            const response = await verifyOtp(email, password, otpCode);
            if (response.status === 200) {
                if (!isGoogleAuth) {
                    try {
                        await completeRegistration(
                            email,
                            password,
                            firstName,
                            lastName,
                        );
                    } catch (error: any) {
                        setOtpError(error.response?.data?.error || "Failed to complete registration. Please try again.");
                        setIsVerifying(false);
                        return;
                    }
                }

                if (response.data.user && response.data.user.id) {
                    if (response.data.access_token) {
                        localStorage.setItem('access_token', response.data.access_token);
                    }
                    if (response.data.refresh_token) {
                        localStorage.setItem('refresh_token', response.data.refresh_token);
                    }

                    setIsAuthenticated(true);
                    setUserDetails({
                        ...response.data.user,
                        id: response.data.user.id,
                        role: response.data.user.role || 'guest'
                    });

                    setNotification({
                        message: "Registration completed successfully! Redirecting...",
                        type: "success",
                        icon: "fas fa-check-circle"
                    });

                    setTimeout(() => {
                        const hasPendingBooking = localStorage.getItem('pendingBookingCallback');
                        const returnUrl = localStorage.getItem('bookingReturnUrl');

                        if (hasPendingBooking) {
                            sessionStorage.setItem('redirectAfterReload', returnUrl || '/');
                            localStorage.removeItem('pendingBookingCallback');
                            if (returnUrl) {
                                localStorage.removeItem('bookingReturnUrl');
                            }
                        }

                        window.location.href = '/';
                    }, 1500);
                } else {
                    setOtpError("Registration successful but user data is incomplete. Please try logging in.");
                }
            }
        } catch (error: any) {
            if (error.response) {
                const { data, status } = error.response;
                switch (status) {
                    case 400:
                    case 404:
                    case 500:
                        setOtpError(data.error || "Something went wrong. Please try again later.");
                        break;
                    default:
                        setOtpError("Something went wrong. Please try again later.");
                        break;
                }
            } else {
                setOtpError("Something went wrong. Please try again later.");
            }
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white w-full max-w-md rounded-lg shadow-md p-6"
            >
                <div className="flex flex-col items-center mb-6">
                    <div className="text-4xl mb-4 text-blue-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 8V8a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold mb-1 text-center">
                        {isGoogleAuth
                            ? "Complete Your Google Registration"
                            : "Complete Your Registration"}
                    </h2>
                    <p className="text-gray-500 text-center max-w-xs">
                        {isGoogleAuth
                            ? "Please confirm your information and enter the 6-digit verification code sent to your email."
                            : "Please enter your information and the 6-digit verification code sent to your email."}
                    </p>
                </div>
                {otpError && (
                    <div className="bg-red-100 text-red-700 p-2 mb-4 text-center rounded">
                        {otpError}
                    </div>
                )}
                <form onSubmit={handleOTPSubmit}>
                    <div className="flex justify-center gap-2 mb-4">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-input-${index}`}
                                type="text"
                                maxLength={1}
                                className="w-12 h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl"
                                value={digit}
                                onChange={(e) => handleOTPChange(e.target.value, index)}
                                onKeyDown={(e) => handleOTPKeyDown(e, index)}
                            />
                        ))}
                    </div>
                    <div className="text-center mb-4">
                        <a href="#" className="text-sm text-blue-500 hover:underline mr-2">
                            Change Email
                        </a>
                        |
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (!resendDisabled) {
                                    resendOTP();
                                }
                            }}
                            className={`text-sm ml-2 ${resendDisabled ? "text-gray-400 cursor-not-allowed" : "text-blue-500 hover:underline"}`}
                        >
                            Resend Code
                        </a>
                        {resendDisabled && (
                            <span className="text-xs text-gray-500 ml-2">({timer}s)</span>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isVerifying}
                        className={`w-full bg-blue-500 text-white py-2 rounded-md cursor-pointer hover:bg-blue-600 transition-colors ${isVerifying ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {isVerifying ? "Processing..." : "Complete Registration"}
                    </button>
                </form>
            </motion.div>
            {notification && (
                <Notification
                    icon={notification.icon}
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    );
};

export default RegistrationFlow;
