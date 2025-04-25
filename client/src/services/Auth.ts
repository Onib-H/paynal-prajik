import { API } from "./_axios";

export const authenticateUser = async () => {
  try {
    const response = await API.get("/auth/user", {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    console.error(`Failed to authenticate user: ${error}`);
    throw error;
  }
};

export const googleAuth = async (code: string) => {
  try {
    const response = await API.post("/auth/google-auth", 
      { code },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error) {
    console.error(`Failed to google login: ${error}`);
    throw error;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await API.post("/auth/login", { email, password }, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    console.error(`Failed to login: ${error}`);
    throw error;
  }
};

export const sendRegisterOtp = async (
  email: string,
  password: string,
  confirm_password: string
) => {
  try {
    const response = await API.post("/auth/register", { email, password, confirm_password }, {
      headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error) {
    console.error(`Failed to send register OTP: ${error}`);
    throw error;
  }
};

export const verifyOtp = async (email: string, password: string, otp: string) => {
  try {
    const response = await API.post("/auth/verify", {
        email: email,
        password: password,
        otp: otp,
      }, {
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    console.error(`Failed to verify OTP: ${error}`);
    throw error;
  }
};

export const completeRegistration = async (
  email: string,
  password: string,
  first_name: string,
  last_name: string
) => {
  try {
    const response = await API.post(
      "/auth/complete_reg",
      {
        email: email,
        password: password,
        first_name: first_name,
        last_name: last_name,
      },
      {
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    console.error(`Failed to complete registration: ${error}`);
    throw error;
  }
};

export const resendOtp = async (email: string) => {
  try {
    const response = await API.post(
      "/auth/resend_otp",
      {
        email: email,
      },
      {
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    console.error(`Failed to resend OTP: ${error}`);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await API.post(
      "/auth/logout",
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    console.error(`Failed to logout: ${error}`);
    throw error;
  }
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  try {
    const response = await API.post(
      "/auth/change_password",
      {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      },
      {
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    console.error(`Failed to change password: ${error}`);
    throw error;
  }
};

export const resetPassword = async (email: string, newPassword: string, confirmPassword: string) => {
  try {
    const response = await API.post("/auth/reset_password", {
        email: email,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }, {
        withCredentials: true,
      });
    return response;
  } catch (error) {
    console.error(`Failed to reset password: ${error}`);
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await API.post("/auth/forgot_password", {
        email: email,
      }, {
        withCredentials: true,
      });
    return response;
  } catch (error) {
    console.error(`Failed to reset password: ${error}`);
    throw error;
  }
};

export const verifyResetOtp = async (email: string, otp: string) => {
  try {
    const response = await API.post("/auth/verify_reset_otp", {
        email: email,
        otp: otp,
      }, {
        withCredentials: true,
      });
    return response;
  } catch (error) {
    console.error(`Failed to verify reset OTP: ${error}`);
    throw error;
  }
};