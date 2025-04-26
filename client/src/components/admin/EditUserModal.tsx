/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, motion } from "framer-motion";
import { FC, memo, useEffect } from "react";
import { IUserFormModalProps, IUser } from "../../types/UsersAdmin";
import { useForm } from "react-hook-form";

const EditUserModal: FC<IUserFormModalProps> = ({ isOpen, cancel, onSave, userData, loading = false }) => {
    const { register, handleSubmit, formState: { errors }, reset, watch, setError, clearErrors } = useForm<IUser>({
        mode: "onBlur",
        defaultValues: {
            id: userData?.id || 0,
            first_name: userData?.first_name || "",
            last_name: userData?.last_name || "",
            email: userData?.email || "",
            password: "",
            confirm_password: "",
            role: userData?.role || "guest",
            profile_image: userData?.profile_image,
        }
    });

    const password = watch("password");

    useEffect(() => {
        if (userData) {
            reset({
                id: userData.id || 0,
                first_name: userData.first_name || "",
                last_name: userData.last_name || "",
                email: userData.email || "",
                password: "",
                confirm_password: "",
                role: userData.role || "guest",
                profile_image: userData.profile_image,
            });
        }
    }, [userData, reset]);

    const onSubmit = async (data: IUser) => {
        try {
            const submitData = userData?.id && !data.password ? {
                ...data,
                password: undefined,
                confirm_password: undefined
            } : data;

            await onSave(submitData);
        } catch (error: any) {
            const errorData = error.response?.data?.error;
            if (error) {
                Object.entries(errorData).forEach(([key, message]) => {
                    setError(key as keyof IUser, {
                        type: "server",
                        message: message as string,
                    });
                });
            } else {
                setError('root', {
                    type: "manual",
                    message: "An error occured"
                })
            }
        }
    }

    useEffect(() => {
        const handleKeyDown = (evt: KeyboardEvent) => {
            if (evt.key === "Escape") {
                cancel();
            }
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [cancel, isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
                    >
                        <motion.h2
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl font-semibold mb-4"
                        >
                            {userData?.id ? "Edit User" : "Add New User"}
                        </motion.h2>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="space-y-4">
                                {errors.root && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-3 bg-red-100 text-red-700 rounded-md text-sm"
                                    >
                                        {errors.root.message}
                                    </motion.div>
                                )}

                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        {...register("first_name", {
                                            required: "First name is required",
                                            onChange: () => clearErrors("first_name")
                                        })}
                                        className={`w-full p-2 border rounded-md ${errors.first_name ? "border-red-500" : "border-gray-300"}`}
                                        disabled={loading}
                                    />
                                    {errors.first_name && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-1 text-xs text-red-500"
                                        >
                                            {errors.first_name.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        {...register("last_name", {
                                            required: "Last name is required",
                                            onChange: () => clearErrors("last_name")
                                        })}
                                        className={`w-full p-2 border rounded-md ${errors.last_name ? "border-red-500" : "border-gray-300"}`}
                                        disabled={loading}
                                    />
                                    {errors.last_name && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-1 text-xs text-red-500"
                                        >
                                            {errors.last_name.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 }}
                                >
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "Please enter a valid email address"
                                            },
                                            onChange: () => clearErrors("email")
                                        })}
                                        className={`w-full p-2 border rounded-md ${errors.email ? "border-red-500" : "border-gray-300"}`}
                                        disabled={loading}
                                    />
                                    {errors.email && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-1 text-xs text-red-500"
                                        >
                                            {errors.email.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password {userData?.id && "(leave blank to keep current)"}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        {...register("password", {
                                            validate: value => !userData?.id || value ? (value?.length >= 8 || "Password must be at least 8 characters") : true
                                        })}
                                        className={`w-full p-2 border rounded-md ${errors.password ? "border-red-500" : "border-gray-300"}`}
                                        disabled={loading}
                                    />
                                    {errors.password && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-1 text-xs text-red-500"
                                        >
                                            {errors.password.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.35 }}
                                >
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        {...register("confirm_password", {
                                            validate: value => value === password || "Password do not match"
                                        })}
                                        className={`w-full p-2 border rounded-md ${errors.confirm_password ? "border-red-500" : "border-gray-300"}`}
                                        disabled={loading}
                                    />
                                    {errors.confirm_password && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-1 text-xs text-red-500"
                                        >
                                            {errors.confirm_password.message}
                                        </motion.p>
                                    )}
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                                className="mt-6 flex justify-end space-x-3"
                            >
                                <motion.button
                                    type="button"
                                    onClick={cancel}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    disabled={loading}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                    disabled={loading}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {loading ? "Saving..." : "Save"}
                                </motion.button>
                            </motion.div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default memo(EditUserModal); 