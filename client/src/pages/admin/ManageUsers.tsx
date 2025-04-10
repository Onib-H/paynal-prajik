import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, PencilIcon, Plus, TrashIcon, UserRound } from "lucide-react";
import { FC, useCallback, useState } from "react";
import { toast } from "react-toastify";
import DefaultProfilePic from "../../assets/Default_pfp.jpg";
import EditUserModal, { IUser } from "../../components/admin/EditUserModal";
import Modal from "../../components/Modal";
import EventLoader from "../../motions/loaders/EventLoader";
import DashboardSkeleton from "../../motions/skeletons/AdminDashboardSkeleton";
import { archiveUser, fetchAllUsers, manageUser } from "../../services/Admin";

const VALID_EMAIL_PROVIDERS = [
  "gmail.com", "yahoo.com", "yahoo.com.ph", "outlook.com", "hotmail.com",
  "aol.com", "icloud.com", "live.com", "msn.com", "hotmail.co.uk",
  "ymail.com", "googlemail.com"
];

interface CreateUserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: string;
}

const ManageUsers: FC = () => {
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editModal, setEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateUserFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "admin",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<IUser[]>({
    queryKey: ["users"],
    queryFn: fetchAllUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
      manageUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      setEditModal(false);
      setIsSubmitting(false);
    },
    onError: (error: Error | { response?: { data?: { error?: string } } }) => {
      const errorResponse = error as { response?: { data?: { error?: string } } };
      toast.error(errorResponse.response?.data?.error || "Failed to update user");
      setIsSubmitting(false);
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload: FormData) => manageUser(0, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      setShowCreateModal(false);
      setIsSubmitting(false);
      setCreateFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        role: "admin",
      });
    },
    onError: (error: Error | { response?: { data?: { email?: string; password?: string; error?: string } } }) => {
      const errorResponse = error as { response?: { data?: { email?: string; password?: string; error?: string } } };
      const errorData = errorResponse.response?.data || {};

      if (errorData.email) {
        setFormErrors(prev => ({ ...prev, email: errorData.email }));
      }
      if (errorData.password) {
        setFormErrors(prev => ({ ...prev, password: errorData.password }));
      }

      toast.error(errorData.error || "Failed to create user");
      setIsSubmitting(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => archiveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User archived successfully");
      setShowDeleteModal(false);
      setIsSubmitting(false);
    },
    onError: (error: Error | { response?: { data?: { error?: string } } }) => {
      const errorResponse = error as { response?: { data?: { error?: string } } };
      toast.error(errorResponse.response?.data?.error || "Failed to archive user");
      setIsSubmitting(false);
    }
  });

  const handleEdit = useCallback((user: IUser) => {
    setSelectedUser(user);
    setEditModal(true);
  }, []);

  const handleDelete = useCallback((user: IUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await deleteMutation.mutateAsync(selectedUser.id);
    } catch (error) {
      console.error("Error archiving user:", error);
      setIsSubmitting(false);
    }
  }, [deleteMutation, selectedUser]);

  const handleSaveUser = useCallback(async (user: IUser) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("first_name", user.first_name);
    formData.append("last_name", user.last_name);
    formData.append("email", user.email);
    formData.append("role", user.role || "guest");

    if (user.password) {
      formData.append("password", user.password);
    }

    await updateMutation.mutateAsync({ id: user.id, payload: formData });
  }, [updateMutation]);

  const handleCreateUser = useCallback(async () => {
    setFormErrors({});

    if (!createFormData.email) {
      setFormErrors(prev => ({ ...prev, email: "Email is required" }));
      return;
    }

    if (!createFormData.email.includes('@')) {
      setFormErrors(prev => ({ ...prev, email: "Invalid email address" }));
      return;
    }

    const domain = createFormData.email.split('@')[1];
    if (!domain || !VALID_EMAIL_PROVIDERS.includes(domain)) {
      setFormErrors(prev => ({
        ...prev,
        email: `Invalid email domain. ${domain || ''} is not a valid email provider.`
      }));
      return;
    }

    if (!createFormData.password) {
      setFormErrors(prev => ({ ...prev, password: "Password is required" }));
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[@$!%*?&])(?=.*\d)(?!.*\s).{6,}$/;
    if (!passwordRegex.test(createFormData.password)) {
      setFormErrors(prev => ({
        ...prev,
        password: "Password must contain at least one uppercase letter, one special character, one number, and no spaces."
      }));
      return;
    }

    if (createFormData.password !== createFormData.confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return;
    }

    if (!createFormData.firstName) {
      setFormErrors(prev => ({ ...prev, firstName: "First name is required" }));
      return;
    }

    if (!createFormData.lastName) {
      setFormErrors(prev => ({ ...prev, lastName: "Last name is required" }));
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("first_name", createFormData.firstName);
    formData.append("last_name", createFormData.lastName);
    formData.append("email", createFormData.email);
    formData.append("password", createFormData.password);
    formData.append("role", "admin");

    const fetchDefaultImage = async () => {
      try {
        const response = await fetch(DefaultProfilePic);
        const blob = await response.blob();
        const file = new File([blob], "default_profile.jpg", { type: "image/jpeg" });
        formData.append("profile_image", file);
      } catch (error) {
        console.error("Error loading default profile image:", error);
      }
    };

    try {
      await fetchDefaultImage();
      await createMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }, [createFormData, createMutation]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [formErrors]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-[calc(100vh-25px)] p-3 md:p-3 overflow-y-auto container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Manage Admins</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors duration-300"
        >
          <Plus size={20} className="mr-2" /> Create User
        </button>
      </div>

      {users && users.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-10">
          <p className="text-5xl font-bold text-gray-700">🚫 No Users Found</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users && users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={user.profile_image || DefaultProfilePic}
                      alt={`${user.first_name}'s profile`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">{user.first_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">{user.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`p-2 inline-flex text-md leading-5 font-semibold rounded-full 
                      ${user.role.toUpperCase() === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role.toUpperCase() === 'staff' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'}`}>
                      {user.role.toUpperCase() || 'guest'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md font-medium text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 cursor-pointer rounded-md mr-2 transition-colors duration-300"
                        title="Edit User"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="bg-red-600 hover:bg-red-700 text-white p-3 cursor-pointer rounded-md transition-colors duration-300"
                        title="Archive User"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mx-4"
            >
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-semibold mb-4"
              >
                Create New User
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-gray-600 mb-4"
              >
                All users created will have admin role by default.
              </motion.p>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-2.5 text-gray-500" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={createFormData.email}
                      onChange={handleInputChange}
                      className={`pl-10 w-full border-2 p-2 rounded-md ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </div>
                  {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={createFormData.password}
                    onChange={handleInputChange}
                    className={`w-full border-2 p-2 rounded-md ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="••••••••"
                  />
                  {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    Password must have at least 6 characters, one uppercase letter, one number, and one special character
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={createFormData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full border-2 p-2 rounded-md ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="••••••••"
                  />
                  {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-2.5 text-gray-500" size={18} />
                      <input
                        type="text"
                        name="firstName"
                        value={createFormData.firstName}
                        onChange={handleInputChange}
                        className={`pl-10 w-full border-2 p-2 rounded-md ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </div>
                    {formErrors.firstName && <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={createFormData.lastName}
                      onChange={handleInputChange}
                      className={`w-full border-2 p-2 rounded-md ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.lastName && <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>}
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-end space-x-2 mt-6"
              >
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors duration-300"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleCreateUser}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal - Using existing EditUserModal component */}
      <EditUserModal
        isOpen={editModal}
        cancel={() => {
          setEditModal(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
        userData={selectedUser}
        loading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <Modal
            isOpen={showDeleteModal}
            icon="fas fa-exclamation-triangle"
            title="Delete User"
            description={`Are you sure you want to delete this admin account? This action cannot be undone.`}
            cancel={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            onConfirm={confirmDeleteUser}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300 cursor-pointer uppercase font-semibold"
            confirmText={isSubmitting ? "Deleting..." : "Delete"}
            cancelText="Cancel"
            loading={isSubmitting}
          />
        )}
      </AnimatePresence>

      {isSubmitting && <EventLoader text="Processing Request" />}
    </div>
  );
};

export default ManageUsers;
