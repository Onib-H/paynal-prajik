import { FC } from "react";

interface OrderFoodModalProps {
    bookingId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

const OrderFoodModal: FC<OrderFoodModalProps> = ({ bookingId, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw] relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                    onClick={onClose}
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold mb-4">Order Food for Booking #{bookingId}</h2>
                <div>OrderFoodModal (feature coming soon)</div>
            </div>
        </div>
    );
}

export default OrderFoodModal;