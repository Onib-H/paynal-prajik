import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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

// Skeleton loader component for the bookings table
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

// Skeleton loader for booking details
export const BookingDetailsSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 overflow-y-auto h-[calc(100vh-3rem)] pr-2">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-50 py-3 z-10">
        <Skeleton width={200} height={32} />
        <Skeleton width={150} height={40} className="rounded-md" />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton height={240} className="rounded-lg" />
            <Skeleton height={24} width="70%" />
            <Skeleton height={16} count={3} />
          </div>

          <div className="space-y-6">
            <div>
              <Skeleton height={32} width="60%" className="mb-2" />
              <Skeleton height={16} count={4} />
            </div>

            <div>
              <Skeleton height={32} width="50%" className="mb-2" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton height={16} width="80%" className="mb-1" />
                  <Skeleton height={20} width="50%" />
                </div>
                <div>
                  <Skeleton height={16} width="80%" className="mb-1" />
                  <Skeleton height={20} width="50%" />
                </div>
                <div>
                  <Skeleton height={16} width="80%" className="mb-1" />
                  <Skeleton height={20} width="50%" />
                </div>
                <div>
                  <Skeleton height={16} width="80%" className="mb-1" />
                  <Skeleton height={20} width="50%" />
                </div>
              </div>
            </div>

            <Skeleton height={50} className="rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};