import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ManageAmenitiesSkeleton = () => {
    // Create an array for table rows
    const tableRows = Array(8).fill(0);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 container mx-auto py-4"
        >
            {/* Header Skeleton */}
            <div>
                <Skeleton width={200} height={32} className="mb-2" />
                <Skeleton width={300} height={24} />
            </div>

            {/* Search and Add Button Skeleton */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-grow max-w-md">
                    <Skeleton height={40} width="100%" borderRadius={9999} />
                </div>
                <div className="w-44">
                    <Skeleton height={46} borderRadius={9999} />
                </div>
            </div>

            {/* Amenities Table Skeleton */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="overflow-x-auto mb-6">
                            <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-center">
                                            <Skeleton width={100} height={20} />
                                        </th>
                                        <th className="px-6 py-3 text-center">
                                            <Skeleton width={100} height={20} />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tableRows.map((_, index) => (
                                        <motion.tr
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <Skeleton width={200} height={24} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <Skeleton width={80} height={40} borderRadius={9999} />
                                                    <Skeleton width={90} height={40} borderRadius={9999} />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Skeleton */}
                        <div className="flex justify-center mt-6">
                            <nav className="flex items-center space-x-1">
                                <Skeleton width={40} height={36} borderRadius={8} />
                                <Skeleton width={120} height={36} borderRadius={8} />
                                <Skeleton width={40} height={36} borderRadius={8} />
                            </nav>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default ManageAmenitiesSkeleton;