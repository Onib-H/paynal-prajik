import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../contexts/AuthContext";
import { googleAuth } from "../services/Auth";

const GoogleButton = () => {
    const { setIsAuthenticated, setUserDetails, setRole, setProfileImage } = useUserContext();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSuccess = async (response: any) => {
        try {
            setIsLoading(true);
            setError("");

            if (!response.code) {
                setError("Failed to get authorization code from Google");
                setIsLoading(false);
                return;
            }

            const authResponse = await googleAuth(response.code);

            if (authResponse.data.success) {
                // If user exists and doesn't require verification, proceed with login
                if (!authResponse.data.requires_verification) {
                    if (authResponse.data.user) {
                        setUserDetails(authResponse.data.user);
                        setRole(authResponse.data.user.role || "guest");
                        if (authResponse.data.user.profile_image) {
                            setProfileImage(authResponse.data.user.profile_image);
                        }
                    }

                    setIsAuthenticated(true);
                    navigate("/");
                } else {
                    // If OTP verification is required, redirect to registration flow
                    navigate("/registration", {
                        state: {
                            email: authResponse.data.email,
                            password: authResponse.data.password,
                            isGoogleAuth: true
                        }
                    });
                }
            } else {
                setError(authResponse.data.error || "Authentication failed");
            }
        } catch (error: any) {
            console.error("Google login error:", error);
            setError(error.response?.data?.error || "Failed to authenticate with Google");
        } finally {
            setIsLoading(false);
        }
    };

    const login = useGoogleLogin({
        onSuccess: handleSuccess,
        onError: (errorResponse) => {
            console.error("Google OAuth Error:", errorResponse);
            setError("Google authentication failed");
            setIsLoading(false);
        },
        flow: 'auth-code',
        redirect_uri: import.meta.env.VITE_REDIRECT_URI
    });

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={() => {
                    setIsLoading(true);
                    login();
                }}
                disabled={isLoading}
                type="button"
                className={`pt-2 pb-2 pl-8 pr-8 rounded-full text-white bg-gradient-to-br from-purple-500 to-blue-500 cursor-pointer flex items-center justify-center ${isLoading ? 'opacity-70' : ''}`}
            >
                {isLoading ? (
                    <>
                        <span className="animate-spin mr-2">◌</span>
                        Processing...
                    </>
                ) : (
                    <>
                        <FontAwesomeIcon icon={faGoogle} className="mr-2" />
                        Google
                    </>
                )}
            </button>
            {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
        </div>
    );
};

export default GoogleButton;