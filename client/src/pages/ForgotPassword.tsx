import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, verifyResetOtp, resetPassword } from '../services/Auth';
import { useUserContext } from "../contexts/AuthContext";

type Step = 'email' | 'otp' | 'newPassword';

const ForgotPassword: FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setIsAuthenticated } = useUserContext();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    try {
      const response = await forgotPassword(email);
      if (response.status === 200) {
        setError(null);
        setStep('otp');
      } else {
        setError(response.data.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('OTP is required.');
      return;
    }
    setLoading(true);
    try {
      const response = await verifyResetOtp(email, otp);
      if (response.status === 200) {
        setError(null);
        setStep('newPassword');
      } else {
        setError(response.data.error || 'Failed to verify OTP.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords must match and cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const response = await resetPassword(email, newPassword, confirmPassword);
      if (response.status === 200) {
        setError(null);
        setIsAuthenticated(true);
        navigate('/');
      } else {
        setError(response.data.error || 'Password reset failed.');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email.trim()) {
      setError('Email is required to resend OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await forgotPassword(email);
      if (response.status === 200) {
        setError(null);
      } else {
        setError(response.data.error || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* Step Progress Indicator */}
        <div className="flex justify-between mb-6">
          <div className={`flex-1 text-center ${step === 'email' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
            Email
          </div>
          <div className={`flex-1 text-center ${step === 'otp' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
            OTP
          </div>
          <div className={`flex-1 text-center ${step === 'newPassword' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
            Reset
          </div>
        </div>

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="transition duration-500 ease-in-out">
            <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
            {error && <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">{error}</div>}
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="transition duration-500 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Enter OTP</h2>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-sm text-blue-500 hover:underline"
              >
                Back
              </button>
            </div>
            {error && <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">{error}</div>}
            <div className="mb-4">
              <label htmlFor="otp" className="block text-gray-700 mb-1">One-Time Password</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
              />
            </div>
            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={resendOtp}
                disabled={loading}
                className="text-sm text-blue-500 hover:underline"
              >
                Resend OTP
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        {step === 'newPassword' && (
          <form onSubmit={handleNewPasswordSubmit} className="transition duration-500 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Reset Password</h2>
              <button
                type="button"
                onClick={() => setStep('otp')}
                className="text-sm text-blue-500 hover:underline"
              >
                Back
              </button>
            </div>
            {error && <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">{error}</div>}
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
