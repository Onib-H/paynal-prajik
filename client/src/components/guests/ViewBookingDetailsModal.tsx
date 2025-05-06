import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { FC } from "react"
import { BookingDetailsSkeleton } from "../../motions/skeletons/GuestDetailSkeleton"
import { fetchBookingDetail } from "../../services/Booking"
import BookingData from "../bookings/BookingData"

interface ViewBookingDetailsModalProps {
    bookingId: number;
    onClose: () => void;
}

const ViewBookingDetailsModal: FC<ViewBookingDetailsModalProps> = ({ bookingId, onClose }) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['bookingDetails', bookingId],
        queryFn: () => fetchBookingDetail(bookingId),
    });

    return (
        <AnimatePresence>
            {bookingId && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="relative max-w-4xl mx-auto mt-20 bg-white rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Booking Details</h2>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 cursor-pointer hover:text-red-600 rounded-full text-gray-500"
                            >
                                <X size={24} />
                            </motion.button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto p-3">
                            {isLoading ? (
                                <BookingDetailsSkeleton />
                            ) : isError ? (
                                <div className="text-red-500 p-4">Failed to load booking details</div>
                            ) : (
                                <BookingData bookingId={data.id} />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default ViewBookingDetailsModal