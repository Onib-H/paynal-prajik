/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Calendar, CheckCircle, Edit, Eye, EyeOff, ImageUp, Key, Mail, Save, User, X } from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserContext } from "../../contexts/AuthContext";
import { changePassword } from "../../services/Auth";
import { getGuestDetails, updateGuestDetails, updateProfileImage } from "../../services/Guest";

interface FormFields {
  first_name: string;
  last_name: string;
  email: string;
}

interface PasswordFields {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const GuestProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userDetails, profileImage, setProfileImage } = useUserContext();

  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState<FormFields>({
    first_name: '',
    last_name: '',
    email: ''
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordFields>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["guest", id],
    queryFn: () => getGuestDetails(id as string),
    enabled: !!id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: FormFields) => {
      const updateData = [
        data.first_name,
        data.last_name,
        data.email
      ];
      return updateGuestDetails(id as string, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest", id] });
      setEditMode(false);
      setUpdateSuccess("Profile updated successfully!");
      setUpdateSuccess(null);
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
      setUpdateError("Failed to update profile. Please try again.");
      setUpdateError(null);
    }
  });

  const imageUploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("profile_image", file);
      return updateProfileImage(formData);
    },
    onSuccess: (response) => {
      if (response?.data?.profile_image) {
        setProfileImage(response.data.profile_image);
      }
      queryClient.invalidateQueries({ queryKey: ["guest", id] });
      setUploadError(null);
    },
    onError: (error) => {
      console.error("Failed to upload image:", error);
      setUploadError("Failed to upload image. Please try again.");
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFields) => {
      return changePassword(data.oldPassword, data.newPassword, data.confirmPassword);
    },
    onSuccess: () => {
      setPasswordSuccess("Password changed successfully!");
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordModal(false);
      setPasswordSuccess(null);
    },
    onError: (error: any) => {
      setPasswordError(error.response?.data?.message || "Failed to change password. Please try again.")
    }
  });

  useEffect(() => {
    if (userDetails && (!id || id !== userDetails.id.toString())) {
      navigate(`/guest/${userDetails.id}`);
    }
  }, [userDetails, id, navigate]);

  useEffect(() => {
    if (profile?.data) {
      setFormData({
        first_name: profile.data.first_name || '',
        last_name: profile.data.last_name || '',
        email: profile.data.email || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setPasswordError(null);
  };

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();

    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      setUpdateError("All fields are required. Please fill them out.");
      setUpdateError(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setUpdateError("Please enter a valid email address.");
      setUpdateError(null);
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'long' });
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New password and confirm password don't match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setUploadError("Image size should be less than 2MB");
        return;
      }
      imageUploadMutation.mutate(file);
    }
  }, [imageUploadMutation]);

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const guestData = profile?.data;
  const displayImage = guestData?.profile_image || profileImage || "/default-avatar.png";

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-16 w-16 border-4 border-purple-200 border-t-purple-600 rounded-full mb-4"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 font-medium"
        >
          Loading your profile...
        </motion.p>
      </div>
    );
  }

  if (profileError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto bg-red-50 p-6 rounded-xl shadow-md text-red-800 mt-10"
      >
        <h3 className="font-bold text-xl mb-3 flex items-center">
          <AlertCircle className="mr-2" /> Error loading profile
        </h3>
        <p>We couldn't load your profile information. Please try again later.</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-4xl mx-auto px-4 py-10"
    >
      {/* Success notification */}
      <AnimatePresence>
        {updateSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-md z-50 flex items-center"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            <p>{updateSuccess}</p>
          </motion.div>
        )}
        {updateError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-md z-50 flex items-center"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{updateError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile header/card */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden mb-8"
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-36 sm:h-56" />
        <div className="px-6 sm:px-8 pb-8 pt-0 -mt-16 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-end">
              {/* Profile Image with animation */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative rounded-full border-4 border-white bg-white shadow-lg overflow-hidden h-32 w-32 mb-4 sm:mb-0 sm:mr-6"
              >
                <img
                  src={displayImage}
                  alt={guestData?.first_name}
                  className="h-full w-full object-cover"
                />
                <motion.label
                  whileHover={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
                >
                  {imageUploadMutation.isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="h-8 w-8 border-2 border-white/20 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <ImageUp size={28} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </>
                  )}
                </motion.label>
              </motion.div>

              {/* Name and email */}
              <div className="text-center sm:text-left mb-4 sm:mb-0">
                <motion.h1
                  variants={itemVariants}
                  className="text-2xl sm:text-3xl font-bold text-gray-900"
                >
                  {guestData?.first_name} {guestData?.last_name}
                </motion.h1>
                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-center sm:justify-start mt-2 text-gray-600"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{guestData?.email}</span>
                </motion.div>
                {uploadError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded-md"
                  >
                    {uploadError}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Edit button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditMode(!editMode)}
              className={`
                flex items-center justify-center px-4 py-2 rounded-full 
                ${editMode
                  ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                  : "bg-purple-600 text-white hover:bg-purple-700"
                } 
                shadow-md transition-all duration-200 mt-4 sm:mt-0
              `}
            >
              {editMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        variants={itemVariants}
        className="mb-6 bg-white rounded-xl shadow-md p-1 flex"
      >
        <motion.button
          whileHover={{ backgroundColor: activeTab === "personal" ? "" : "#f9fafb" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab("personal")}
          className={`flex-1 py-3 rounded-lg flex items-center justify-center transition-colors ${activeTab === "personal" ? "bg-purple-100 text-purple-700" : "text-gray-600"
            }`}
        >
          <User className="h-4 w-4 mr-2" />
          <span className="font-medium">Personal Info</span>
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: activeTab === "account" ? "" : "#f9fafb" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab("account")}
          className={`flex-1 py-3 rounded-lg flex items-center justify-center transition-colors ${activeTab === "account" ? "bg-purple-100 text-purple-700" : "text-gray-600"
            }`}
        >
          <Key className="h-4 w-4 mr-2" />
          <span className="font-medium">Account & Security</span>
        </motion.button>
      </motion.div>

      {/* Tab content */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-md overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {activeTab === "personal" && (
            <motion.div
              key="personal"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeInVariants}
            >
              <form onSubmit={handleSaveProfile} className="p-6">
                <h3 className="text-lg font-semibold flex items-center border-b border-gray-200 pb-3 mb-6">
                  <User className="h-5 w-5 mr-2 text-purple-500" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <motion.input
                      whileFocus={{ boxShadow: "0 0 0 2px rgba(147, 51, 234, 0.3)" }}
                      type="text"
                      name="first_name"
                      disabled={!editMode}
                      className={`w-full px-3 py-2 border rounded-lg transition-all ${editMode
                        ? "bg-white border-purple-300 focus:border-purple-500 focus:outline-none"
                        : "bg-gray-50 border-gray-200"
                        }`}
                      value={formData.first_name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <motion.input
                      whileFocus={{ boxShadow: "0 0 0 2px rgba(147, 51, 234, 0.3)" }}
                      type="text"
                      name="last_name"
                      disabled={!editMode}
                      className={`w-full px-3 py-2 border rounded-lg transition-all ${editMode
                        ? "bg-white border-purple-300 focus:border-purple-500 focus:outline-none"
                        : "bg-gray-50 border-gray-200"
                        }`}
                      value={formData.last_name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <motion.input
                      whileFocus={{ boxShadow: "0 0 0 2px rgba(147, 51, 234, 0.3)" }}
                      type="email"
                      name="email"
                      disabled={!editMode}
                      className={`w-full px-3 py-2 border rounded-lg transition-all ${editMode
                        ? "bg-white border-purple-300 focus:border-purple-500 focus:outline-none"
                        : "bg-gray-50 border-gray-200"
                        }`}
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {editMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end mt-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="mr-3 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={updateProfileMutation.isPending}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 4px 6px -1px rgba(147, 51, 234, 0.2)" }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-70"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <span className="flex items-center">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                          />
                          Saving...
                        </span>
                      ) : 'Save Changes'}
                    </motion.button>
                  </motion.div>
                )}
              </form>
            </motion.div>
          )}

          {activeTab === "account" && (
            <motion.div
              key="account"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeInVariants}
              className="p-6"
            >
              <h3 className="text-lg font-semibold flex items-center border-b border-gray-200 pb-3 mb-6">
                <Key className="h-5 w-5 mr-2 text-purple-500" />
                Account & Security
              </h3>

              <div className="space-y-5">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Username</span>
                      <span className="text-gray-600">{guestData?.username}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Member Since</span>
                      <span className="text-gray-600">
                        {formatDate(guestData?.date_joined)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Password</span>
                      <span className="text-gray-600">••••••••</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowPasswordModal(true)}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition shadow-sm"
                  >
                    Change
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Key className="h-5 w-5 mr-2" /> Change Password
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  className="text-white bg-white/20 hover:bg-white/30 p-1.5 rounded-full"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="p-6">
                <AnimatePresence>
                  {passwordError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-start overflow-hidden"
                    >
                      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{passwordError}</p>
                    </motion.div>
                  )}

                  {passwordSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-lg flex items-start overflow-hidden"
                    >
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{passwordSuccess}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleChangePassword}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <motion.input
                          whileFocus={{ boxShadow: "0 0 0 2px rgba(147, 51, 234, 0.3)" }}
                          type={showPassword.old ? "text" : "password"}
                          id="oldPassword"
                          name="oldPassword"
                          value={passwordData.oldPassword}
                          onChange={handlePasswordChange}
                          required
                          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                          onClick={() => togglePasswordVisibility('old')}
                        >
                          {showPassword.old ? <EyeOff size={18} /> : <Eye size={18} />}
                        </motion.button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <motion.input
                          whileFocus={{ boxShadow: "0 0 0 2px rgba(147, 51, 234, 0.3)" }}
                          type={showPassword.new ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </motion.button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <motion.input
                          whileFocus={{ boxShadow: "0 0 0 2px rgba(147, 51, 234, 0.3)" }}
                          type={showPassword.confirm ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="mr-3 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={changePasswordMutation.isPending}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 4px 6px -1px rgba(147, 51, 234, 0.2)" }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:bg-purple-400"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? (
                        <span className="flex items-center">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                          />
                          Updating...
                        </span>
                      ) : 'Change Password'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GuestProfile;