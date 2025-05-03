import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion } from 'framer-motion';

export const GuestReservationSkeleton = () => {
  return (
    <div className="p-6">
      <Skeleton height={40} width={300} style={{ marginBottom: '1rem' }} />
      <Skeleton height={30} width={200} style={{ marginBottom: '0.5rem' }} />
      <Skeleton height={30} width={150} style={{ marginBottom: '1rem' }} />
      <Skeleton height={25} count={1} style={{ marginBottom: '0.5rem' }} />
      <Skeleton height={30} count={5} style={{ marginBottom: '0.5rem' }} />
    </div>
  );
};

export const BookingsTableSkeleton = () => {
  return (
    <div className="space-y-6 container mx-auto py-4 animate-fade-in">
      {/* Header skeleton */}
      <div>
        <Skeleton width={200} height={32} className="mb-2" />
        <Skeleton width={300} height={24} />
      </div>

      {/* Search and Filters skeleton */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <Skeleton width={300} height={40} className="rounded-full" />
        <Skeleton width={200} height={40} className="rounded-full" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead>
              <tr>
                {Array(7).fill(0).map((_, i) => (
                  <th key={i} className="px-6 py-3 text-center">
                    <Skeleton width="80%" height={16} className="mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array(5).fill(0).map((_, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <Skeleton circle height={40} width={40} />
                      </div>
                      <div className="ml-4">
                        <Skeleton width={120} height={18} className="mb-1" />
                        <Skeleton width={60} height={16} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width={100} height={18} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width={100} height={18} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width={100} height={18} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width={80} height={24} className="rounded-full" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width={70} height={18} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-center space-x-2">
                      <Skeleton width={100} height={40} className="rounded-full" />
                      <Skeleton width={100} height={40} className="rounded-full" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination skeleton */}
        <div className="flex justify-center mt-6">
          <Skeleton width={250} height={40} />
        </div>
      </div>
    </div>
  );
};

export const BookingDetailsSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-4"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Dates Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 mb-2 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 mb-2 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Guest Info */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-48 mb-2 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        </div>

        {/* Price Summary */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-56 mb-2 rounded" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex justify-between items-center"
              >
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Total Price */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Loading Animation Bar */}
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "mirror",
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent w-1/2 skew-x-[-20deg]"
      />
    </motion.div>
  );
};