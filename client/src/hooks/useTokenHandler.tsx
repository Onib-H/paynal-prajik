import { useEffect } from "react";
import { useUserContext } from "../contexts/AuthContext";
import { authenticateUser } from "../services/Auth";

const useTokenHandler = () => {
  const { setIsAuthenticated, setLoading, setRole, setUserDetails } = useUserContext();

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await authenticateUser();
        if (response.data.isAuthenticated) {
          setIsAuthenticated(true);
          setRole(response.data.role);
          setUserDetails(response.data.user);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error(`Error validating token: ${error}`);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [setIsAuthenticated, setLoading, setRole, setUserDetails]);
}

export default useTokenHandler;