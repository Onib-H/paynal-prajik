import { useCallback } from "react";
import { useUserContext } from "../contexts/AuthContext";

/**
 * For managing user roles in the application.
 * It provides a way to toggle between "admin" and "guest" roles.
 * @returns
 * - `role`: The current user role ("admin" or "guest").
 * - `changeRole`: Function to toggle the role between "admin" and "guest".
 * - `changeRoleFromRegister`: Function to set the role to "guest" after registration.
 */
const useUserRole = () => {
  const { role, setRole } = useUserContext();

  const changeRole = useCallback(() => {
    const newRole = role === "admin" ? "guest" : "admin";
    setRole(newRole);
  }, [role, setRole]);

  const changeRoleFromRegister = () => setRole("guest");

  return { role, changeRole, changeRoleFromRegister };
};

export default useUserRole;