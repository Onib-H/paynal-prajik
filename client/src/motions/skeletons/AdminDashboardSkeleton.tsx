import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

const DashboardSkeleton = () => {
    return (
        <div className="p-6 container mx-auto animate-pulse">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <Skeleton width={250} height={40} className="mb-2 md:mb-0" />
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Month Controls */}
                    <div className="flex items-center bg-white rounded-lg shadow-sm h-10 w-48">
                        <Skeleton circle width={32} height={32} className="m-2" />
                        <Skeleton width={100} height={24} className="mx-2" />
                        <Skeleton circle width={32} height={32} className="m-2" />
                    </div>

                    {/* Report Button */}
                    <Skeleton width={200} height={40} className="rounded-lg" />
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="p-4 bg-white shadow rounded-lg h-24">
                        <Skeleton height={20} width={120} className="mb-2" />
                        <Skeleton height={28} width={80} />
                    </div>
                ))}
            </div>

            {/* Monthly Trends Section */}
            <div className="mb-8">
                <Skeleton width={200} height={28} className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-white shadow-lg rounded-lg p-4 h-80">
                            <Skeleton width={160} height={24} className="mb-2 mx-auto" />
                            <Skeleton height={240} className="mt-4" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Business Insights Section */}
            <div className="mb-8">
                <Skeleton width={280} height={28} className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="bg-white shadow-lg rounded-lg p-4 h-80">
                            <Skeleton width={200} height={24} className="mb-2 mx-auto" />
                            {index === 2 ? (
                                <div className="flex justify-center mt-6">
                                    <Skeleton circle width={150} height={150} />
                                </div>
                            ) : (
                                <Skeleton height={240} className="mt-4" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default DashboardSkeleton