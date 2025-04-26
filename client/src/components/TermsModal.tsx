/* eslint-disable react-hooks/exhaustive-deps */
import { AnimatePresence, motion } from "framer-motion";
import { FC, useState, useRef, useEffect } from "react";

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAgree: () => void;
}

const TermsModal: FC<TermsModalProps> = ({ isOpen, onClose, onAgree }) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.3, delay: 0.1 } }
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            y: 40,
            rotateX: 20,
            transformPerspective: 1000
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            rotateX: 0,
            transition: {
                type: "spring",
                damping: 20,
                stiffness: 200,
                duration: 0.4
            }
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            y: 40,
            rotateX: 10,
            transition: {
                duration: 0.3,
                ease: "easeInOut"
            }
        }
    };

    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
            setHasScrolledToBottom(isAtBottom);
        }
    };

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.addEventListener('scroll', handleScroll);
            return () => {
                if (contentRef.current) {
                    contentRef.current.removeEventListener('scroll', handleScroll);
                }
            };
        }
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={overlayVariants}
                >
                    <motion.div
                        className="relative w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-2xl backdrop-blur-sm mx-4"
                        variants={modalVariants}
                    >
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute top-3 right-3 z-40 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            onClick={onClose}
                        >
                            <i className="fa fa-x"></i>
                        </motion.button>

                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
                                Terms and Conditions
                            </h2>

                            <div
                                ref={contentRef}
                                className="h-96 overflow-y-auto pr-4 mb-4 text-gray-700 border border-gray-200 rounded-lg p-4"
                                onScroll={handleScroll}
                            >
                                <h3 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h3>
                                <p className="mb-4">
                                    By registering an account with Azurea Hotel Management System, you agree to be bound by these Terms and Conditions. If you do not agree to all the terms, you may not access or use our services.
                                </p>

                                <h3 className="text-lg font-semibold mb-2">2. Account Registration</h3>
                                <p className="mb-4">
                                    You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                                </p>

                                <h3 className="text-lg font-semibold mb-2">3. Privacy Policy</h3>
                                <p className="mb-4">
                                    Your personal information will be handled in accordance with our Privacy Policy. By using our services, you consent to the collection, use, and sharing of your information as described in the Privacy Policy.
                                </p>

                                <h3 className="text-lg font-semibold mb-2">4. Booking and Cancellation</h3>
                                <p className="mb-4">
                                    Room reservations are subject to availability. Cancellation policies vary by room type and rate plan. Please review the specific cancellation policy at the time of booking.
                                </p>

                                <h3 className="text-lg font-semibold mb-2">5. Payment</h3>
                                <p className="mb-4">
                                    All payments must be made with valid payment methods. You authorize us to charge the provided payment method for all charges incurred under your account.
                                </p>

                                <h3 className="text-lg font-semibold mb-2">6. Guest Responsibilities</h3>
                                <p className="mb-4">
                                    Guests are responsible for any damage to hotel property caused by themselves or their visitors. The hotel reserves the right to charge the guest's account for any such damages.
                                </p>

                                <h3 className="text-lg font-semibold mb-2">7. Prohibited Activities</h3>
                                <p className="mb-4">
                                    The following activities are prohibited: unauthorized access to hotel systems, reselling of rooms, any illegal activities, or behavior that disturbs other guests.
                                </p>

                                <h3 className="text-lg font-semibold mb-2">8. Limitation of Liability</h3>
                                <p className="mb-4">
                                    Azurea Hotel Management System shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.
                                </p>

                                <h3 className="text-lg font-semibold mb-2">9. Changes to Terms</h3>
                                <p className="mb-4">
                                    We reserve the right to modify these terms at any time. Continued use of our services after such changes constitutes your acceptance of the new terms.
                                </p>

                                <h3 className="text-lg font-semibold mb-2">10. Governing Law</h3>
                                <p className="mb-4">
                                    These terms shall be governed by and construed in accordance with the laws of the jurisdiction where the hotel is located, without regard to its conflict of law provisions.
                                </p>

                                <div className="text-center mt-6">
                                    <p className="font-semibold">By checking the box below, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
                                </div>
                            </div>

                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    id="agreeTerms"
                                    checked={isChecked}
                                    onChange={(e) => setIsChecked(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <label htmlFor="agreeTerms" className="ml-2 text-sm font-medium text-gray-700">
                                    I have read and agree to the Terms and Conditions {!hasScrolledToBottom && "(please scroll to bottom)"}
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(124, 58, 237, 0.3)" }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onAgree}
                                    disabled={!hasScrolledToBottom}
                                    className={`px-4 py-2 cursor-pointer text-lg font-medium text-white rounded-lg transition-colors ${(!isChecked || !hasScrolledToBottom) ? "bg-purple-400 cursor-not-allowed" : "bg-purple-700 hover:bg-purple-800"}`}
                                >
                                    I Agree
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TermsModal;