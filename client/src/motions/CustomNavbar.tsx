import { motion } from "framer-motion";
import { FC } from "react";
import { NavLink } from "react-router-dom";

interface NavBtn {
    to: string;
    children: React.ReactNode;
    className?: string;
}

const SlotNavButton: FC<NavBtn> = ({ to, children, className }) => {
    return (
        <li className={`relative inline-block text-2xl font-black ${className} transition-all duration-300`}>
            <NavLink
                to={to}
                className={({ isActive }) =>
                    isActive ? "text-purple-700 font-extrabold" : ""
                }
            >
                {({ isActive }) => (
                    <motion.div
                        className={`relative overflow-hidden inline-block ${isActive ? "active-nav-item" : ""}`}
                        initial="rest"
                        whileHover="hover"
                        animate="rest"
                    >
                        <motion.div
                            className="block"
                            variants={{
                                rest: { y: "0%" },
                                hover: { y: "-100%" },
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                        <motion.div
                            className="block absolute inset-0"
                            variants={{
                                rest: { y: "100%" },
                                hover: { y: "0%" },
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                )}
            </NavLink>
        </li>
    );
};

export default SlotNavButton;