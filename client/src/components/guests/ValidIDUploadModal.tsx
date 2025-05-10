import { AnimatePresence, motion } from "framer-motion"
import { ChangeEvent, FC, useEffect, useState } from "react"
import { IdCard, X } from "lucide-react"

interface ValidIDUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (idType: string, front: File, back: File) => void;
    isLoading: boolean;
    error: string | null;
}

const ID_TYPE_OPTIONS = [
    { value: 'passport', label: 'Passport' },
    { value: 'driver_license', label: "Driver's License" },
    { value: 'national_id', label: 'National ID' },
    { value: 'sss_id', label: 'SSS ID' },
    { value: 'umid', label: 'Unified Multi-Purpose ID (UMID)' },
    { value: 'philhealth_id', label: 'PhilHealth ID' },
    { value: 'prc_id', label: 'PRC ID' },
    { value: 'student_id', label: 'Student ID' },
    { value: 'other', label: 'Other Government-Issued ID' },
]

const ValidIDUploadModal: FC<ValidIDUploadModalProps> = ({ isOpen, onClose, onUpload, isLoading, error }) => {
    const [idType, setIdType] = useState<string>('');
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [frontPreview, setFrontPreview] = useState<string | null>(null);
    const [backPreview, setBackPreview] = useState<string | null>(null);

    useEffect(() => {
        if (frontFile) {
            const objectUrl = URL.createObjectURL(frontFile);
            setFrontPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [frontFile]);

    useEffect(() => {
        if (backFile) {
            const objectUrl = URL.createObjectURL(backFile);
            setBackPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [backFile]);

    const handleFileChange = (side: 'front' | 'back', e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                return;
            }
            if (side === 'front') setFrontFile(file);
            else setBackFile(file);
        }
    };

    const handleSubmit = () => {
        if (!idType) return;
        if (frontFile && backFile) onUpload(idType, frontFile, backFile);
    }

    const handleClose = () => {
        setFrontFile(null);
        setBackFile(null);
        setFrontPreview(null);
        setBackPreview(null);
        onClose();
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <IdCard className="h-5 w-5 mr-2" />
                                Upload Valid ID
                            </h3>
                            <motion.button
                                whileHover={{ rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClose}
                                className="text-white hover:text-red-200 transition-colors"
                            >
                                <X size={24} />
                            </motion.button>
                        </div>

                        {/* Upload Section */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Front of ID
                                <motion.label
                                    whileHover={{ scale: 1.02 }}
                                    className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('front', e)}
                                    />
                                </motion.label>
                            </label>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Back of ID
                                <motion.label
                                    whileHover={{ scale: 1.02 }}
                                    className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('back', e)}
                                    />
                                </motion.label>
                            </label>
                        </div>

                        <div className="px-6 mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ID Type
                                <select
                                    value={idType}
                                    onChange={(e) => setIdType(e.target.value)}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="" disabled>Select ID Type</option>
                                    {ID_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="px-6 py-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Front Preview
                                <div className="border-2 border-gray-200 rounded-lg h-48 overflow-hidden">
                                    {frontPreview ? (
                                        <img
                                            src={frontPreview}
                                            alt="Front ID preview"
                                            className="w-full h-full object-contain bg-gray-50 p-2"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">
                                            No front image selected
                                        </div>
                                    )}
                                </div>
                            </label>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Back Preview
                                <div className="border-2 border-gray-200 rounded-lg h-48 overflow-hidden">
                                    {backPreview ? (
                                        <img
                                            src={backPreview}
                                            alt="Back ID preview"
                                            className="w-full h-full object-contain bg-gray-50 p-2"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">
                                            No back image selected
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>

                        {/* Footer Section */}
                        <div className="px-6 pb-6">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-red-500 bg-red-50 p-2 rounded-md text-sm mb-4"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="flex justify-end gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleClose}
                                    className="px-4 py-2 text-gray-600 cursor-pointer hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSubmit}
                                    disabled={!frontFile || !backFile || isLoading}
                                    className={`px-4 py-2 bg-purple-600 text-white rounded-lg ${(!frontFile || !backFile) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
                                        } transition-colors`}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center">
                                            <motion.span
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                                            />
                                            Uploading...
                                        </span>
                                    ) : (
                                        'Upload IDs'
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default ValidIDUploadModal