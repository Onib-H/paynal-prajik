import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGoogleLogin } from "@react-oauth/google";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../contexts/AuthContext";
import { googleAuth } from "../services/Auth";
import { motion } from "framer-motion";

const GoogleButton: FC<{ text: string }> = ({ text }) => {
    const { setIsAuthenticated, setUserDetails, setRole, setProfileImage } = useUserContext();
    const navigate = useNavigate();

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

    const handleSuccess = async (response: any) => {
        try {
            if (!response.code) return;
            const authResponse = await googleAuth(response.code);

            if (authResponse.data.success) {
                if (!authResponse.data.requires_verification) {
                    if (authResponse.data.user) {
                        if (authResponse.data.access_token) {
                            localStorage.setItem('access_token', authResponse.data.access_token);
                        }
                        if (authResponse.data.refresh_token) {
                            localStorage.setItem('refresh_token', authResponse.data.refresh_token);
                        }

                        setUserDetails({
                            ...authResponse.data.user,
                            id: authResponse.data.user.id,
                            role: authResponse.data.user.role || "guest"
                        });

                        setRole(authResponse.data.user.role || "guest");
                        if (authResponse.data.user.profile_image) {
                            setProfileImage(authResponse.data.user.profile_image);
                        }
                    }

                    setIsAuthenticated(true);
                    window.location.href = '/';
                } else {
                    navigate("/registration", {
                        state: {
                            email: authResponse.data.email,
                            password: authResponse.data.password,
                            isGoogleAuth: true
                        }
                    });
                }
            }
        } catch (error: any) {
            console.error("Google login error:", error);
        }
    };

    const login = useGoogleLogin({
        onSuccess: handleSuccess,
        onError: (errorResponse) => {
            console.error("Google OAuth Error:", errorResponse);
        },
        flow: 'auth-code',
        redirect_uri: import.meta.env.VITE_REDIRECT_URI
    });

    return (
        <div className="flex flex-col items-center">
            <motion.button
                variants={formItemVariants}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={login}
                type="button"
                className="pt-2 pb-2 pl-8 pr-8 rounded-full text-white bg-purple-700 hover:bg-purple-800 cursor-pointer flex items-center justify-center transition-colors duration-300"
            >
                <FontAwesomeIcon icon={faGoogle} className="mr-2" />
                {text}
            </motion.button>
        </div>
    );
};

export default GoogleButton;