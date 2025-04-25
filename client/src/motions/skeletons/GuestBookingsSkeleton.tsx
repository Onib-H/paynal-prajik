import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { motion } from "framer-motion";

const GuestBookingsSkeleton = () => {
    return (
        <motion.div
            className="space-y-6 container mx-auto py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header Skeleton */}
            <div className="space-y-2">
                <Skeleton height={32} width={200} className="rounded-lg" />
                <Skeleton height={24} width={300} className="rounded-lg" />
            </div>

            {/* Search and Filters Skeleton */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-grow max-w-md">
                    <Skeleton height={40} className="rounded-full" />
                </div>
                <div className="flex items-center">
                    <Skeleton height={40} width={200} className="rounded-full" />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-7 gap-4 mb-4">
                        {[...Array(7)].map((_, i) => (
                            <Skeleton key={`header-${i}`} height={20} className="rounded" />
                        ))}
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-4">
                        {[...Array(5)].map((_, rowIndex) => (
                            <motion.div
                                key={`row-${rowIndex}`}
                                className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border-b border-gray-200"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: rowIndex * 0.05 }}
                            >
                                {/* Property */}
                                <div className="flex items-center space-x-3">
                                    <Skeleton circle height={40} width={40} />
                                    <div className="space-y-2">
                                        <Skeleton width={100} height={16} />
                                        <Skeleton width={60} height={16} />
                                    </div>
                                </div>

                                {/* Dates */}
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={`date-${rowIndex}-${i}`} height={20} />
                                ))}

                                {/* Status */}
                                <Skeleton height={28} width={80} className="rounded-full" />

                                {/* Amount */}
                                <Skeleton height={20} width={60} />

                                {/* Actions */}
                                <div className="flex space-x-2">
                                    <Skeleton height={40} width={80} className="rounded-full" />
                                    <Skeleton height={40} width={80} className="rounded-full" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination Skeleton */}
                    <div className="flex justify-center mt-6">
                        <div className="flex items-center space-x-4">
                            <Skeleton height={32} width={32} circle />
                            <Skeleton height={32} width={180} className="rounded-lg" />
                            <Skeleton height={32} width={32} circle />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default GuestBookingsSkeleton;