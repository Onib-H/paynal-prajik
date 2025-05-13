/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { authenticateUser } from "../services/Auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
    id: number;
    username: string;
    email: string;
    profile_image?: string;
    is_verified?: string;
    last_booking_date?: string | null;
    role?: string;
}

interface UserContextType {
    isAuthenticated: boolean;
    userDetails: User | null;
    sessionExpired: boolean;
    role?: string;
    isLoading: boolean;
    profileImage?: string;
    setIsAuthenticated: (value: boolean) => void;
    setUserDetails: (value: User | null) => void;
    setSessionExpired: (value: boolean) => void;
    setRole: (value: string) => void;
    setProfileImage?: (value: string) => void;
    clearAuthState: () => void;
}

const UserContext = createContext<UserContextType | any>(null);

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [userDetails, setUserDetails] = useState<User | null>(null);
    const [sessionExpired, setSessionExpired] = useState<boolean>(false);
    const [role, setRole] = useState<string>("");
    const [profileImage, setProfileImage] = useState<string>("");

    const queryClient = useQueryClient();
    
    const clearAuthState = useCallback(() => {
        setIsAuthenticated(false);
        setUserDetails(null);
        setSessionExpired(false);
        setRole("");
        setProfileImage("");

        queryClient.invalidateQueries({ queryKey: ['userAuth'] });
    }, [queryClient]);

    const { isLoading } = useQuery({
        queryKey: ['userAuth'],
        queryFn: async () => {
            try {
                const res = await authenticateUser();
                if (
                    res &&
                    res.data &&
                    res.data.isAuthenticated === true &&
                    res.data.user &&
                    res.data.user.id
                ) {
                    setIsAuthenticated(true);
                    setUserDetails(res.data.user);
                    setProfileImage(res.data.user.profile_image || "");
                    setRole(res.data.role || "");
                } else {
                    clearAuthState();
                }
                return res.data;
            } catch (error) {
                clearAuthState();
                throw error;
            }
        },
        retry: 1,
        refetchOnWindowFocus: true,
        staleTime: 0,
    });

    const contextValue = useMemo(() => ({
        isAuthenticated,
        userDetails,
        sessionExpired,
        role,
        isLoading,
        profileImage,
        setIsAuthenticated,
        setUserDetails,
        setSessionExpired,
        setRole,
        setProfileImage,
        clearAuthState,
    }), [
        isAuthenticated,
        userDetails,
        sessionExpired,
        role,
        isLoading,
        profileImage,
        clearAuthState,
    ]);

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    )
}

export const useUserContext = () => {
    return useContext(UserContext);
}