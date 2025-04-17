import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, FC, FormEvent, memo, useCallback, useEffect, useState } from "react";

export interface IUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    confirm_password: string;
}

interface IUserFormModalProps {
    isOpen: boolean;
    cancel: () => void;
    onSave: (user: IUser) => Promise<void>;
    userData?: IUser | null;
    loading?: boolean;
}

const EditUserModal: FC<IUserFormModalProps> = ({
    isOpen,
    cancel,
    onSave,
    userData,
    loading = false,
}) => {
    const [formState, setFormState] = useState<IUser>({
        id: userData?.id || 0,
        first_name: userData?.first_name || "",
        last_name: userData?.last_name || "",
        email: userData?.email || "",
        password: "",
        confirm_password: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormState({
            id: userData?.id || 0,
            first_name: userData?.first_name || "",
            last_name: userData?.last_name || "",
            email: userData?.email || "",
            password: "",
            confirm_password: "",
        });
        setErrors({});
    }, [userData]);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (formState.password && formState.password !== formState.confirm_password) {
            setErrors({ confirm_password: "Passwords do not match" });
            return;
        }
        try {
            const { ...payload } = formState;
            await onSave(payload);
            setErrors({});
        } catch (error: any) {
            const errorData = error.response?.data?.error;
            setErrors(errorData ? errorData : { general: "An error occurred" });
        }
    }, [formState, onSave]);

    useEffect(() => {
        const handleKeyDown = (evt: KeyboardEvent) => {
            if (evt.key === "Escape") cancel();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [cancel, isOpen]);

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                >
                    <motion.div
                        className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mx-4"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h2 className="text-xl font-semibold mb-4">
                            {userData ? "Edit User" : "Add User"}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formState.first_name}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md"
                                        required
                                    />
                                    {errors.first_name && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.first_name}
                                        </p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formState.last_name}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md"
                                        required
                                    />
                                    {errors.last_name && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.last_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formState.email}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    required
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Password {userData ? "(leave empty to keep current)" : ""}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formState.password}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    required={!userData}
                                />
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={formState.confirm_password}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    required={!userData}
                                />
                                {errors.confirm_password && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.confirm_password}
                                    </p>
                                )}
                            </div>

                            {/* Error Message */}
                            {errors.general && (
                                <p className="text-red-500 text-center mt-2">
                                    {errors.general}
                                </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={cancel}
                                    className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
                                >
                                    {loading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default memo(EditUserModal);
