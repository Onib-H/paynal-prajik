import { motion } from "framer-motion";
import { FC } from "react";

interface OrderFoodModalProps {
    bookingId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

const OrderFoodModal: FC<OrderFoodModalProps> = ({ bookingId, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
            <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw] relative"
            >
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                    onClick={onClose}
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold mb-4">Order Food for Booking #{bookingId}</h2>
                <div>OrderFoodModal (feature coming soon)</div>
            </motion.div>
        </motion.div>
    );
}

export default OrderFoodModal;