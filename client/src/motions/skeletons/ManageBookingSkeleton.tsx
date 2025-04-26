import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { AnimatePresence, motion } from "framer-motion";

const ManageBookingSkeleton = () => {
    const skeletonRows = Array(7).fill(0);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[calc(100vh-25px)] p-3 md:p-3 overflow-y-auto container mx-auto"
            >
                {/* Header Skeleton */}
                <div className="mb-4 md:mb-6">
                    <Skeleton
                        height={32}
                        width={200}
                        className="md:text-3xl"
                        containerClassName="block"
                    />
                </div>

                {/* Search & Filter Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3">
                    <div className="w-full md:w-1/3">
                        <Skeleton height={40} />
                    </div>
                    <div className="w-full md:w-1/3">
                        <Skeleton height={40} />
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="overflow-x-auto shadow-md rounded-lg">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                                <tr className="bg-gray-100">
                                    {[...Array(8)].map((_, i) => (
                                        <th
                                            key={i}
                                            className="py-2 md:py-3 px-2 md:px-4 text-left"
                                        >
                                            <Skeleton height={20} width={70} />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {skeletonRows.map((_, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        {/* Date */}
                                        <td className="py-2 md:py-3 px-2 md:px-4">
                                            <Skeleton width={90} height={20} />
                                        </td>

                                        {/* Guest */}
                                        <td className="py-2 md:py-3 px-2 md:px-4">
                                            <Skeleton width={120} height={20} />
                                        </td>

                                        {/* Property */}
                                        <td className="py-2 md:py-3 px-2 md:px-4">
                                            <div className="flex flex-col gap-1">
                                                <Skeleton width={100} height={20} />
                                                <Skeleton
                                                    width={60}
                                                    height={20}
                                                    className="rounded-full"
                                                />
                                            </div>
                                        </td>

                                        {/* Check-in (hidden on mobile) */}
                                        <td className="hidden md:table-cell py-3 px-4">
                                            <Skeleton width={90} height={20} />
                                        </td>

                                        {/* Check-out (hidden on mobile) */}
                                        <td className="hidden md:table-cell py-3 px-4">
                                            <Skeleton width={90} height={20} />
                                        </td>

                                        {/* Status */}
                                        <td className="py-2 md:py-3 px-2 md:px-4">
                                            <Skeleton
                                                width={80}
                                                height={24}
                                                className="rounded-full mx-auto"
                                            />
                                        </td>

                                        {/* Amount (hidden on mobile) */}
                                        <td className="hidden md:table-cell py-3 px-4">
                                            <Skeleton width={70} height={20} className="mx-auto" />
                                        </td>

                                        {/* Actions */}
                                        <td className="py-2 md:py-3 px-2 md:px-4">
                                            <div className="flex justify-center">
                                                <Skeleton
                                                    circle
                                                    width={32}
                                                    height={32}
                                                    className="rounded-md"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Skeleton */}
                <div className="flex justify-center mt-4 md:mt-6">
                    <div className="flex items-center gap-2">
                        <Skeleton width={40} height={32} className="rounded-md" />
                        {[...Array(4)].map((_, i) => (
                            <Skeleton
                                key={i}
                                width={40}
                                height={32}
                                className="rounded-md hidden md:block"
                            />
                        ))}
                        <Skeleton width={40} height={32} className="rounded-md" />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ManageBookingSkeleton;