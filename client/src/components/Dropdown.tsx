import { AnimatePresence, motion } from "framer-motion";
import { FC, ReactNode, memo, useCallback, useEffect, useRef, useState } from "react";

interface DropdownItem {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
}

interface CustomDropdownProps {
    options: DropdownItem[];
    position?: "top" | "right" | "bottom" | "left";
    children: ReactNode;
}

const Dropdown: FC<CustomDropdownProps> = ({ options, position = "bottom", children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleToggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const handleOptionClick = useCallback((onClick: () => void) => {
        onClick();
        setIsOpen(false);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    let dropdownPositionClasses = "";
    switch (position) {
        case "top":
            dropdownPositionClasses = "absolute left-0 bottom-full mb-2";
            break;
        case "left":
            dropdownPositionClasses = "absolute right-full mr-2 top-0";
            break;
        case "right":
            dropdownPositionClasses = "absolute left-full ml-2 top-0";
            break;
        case "bottom":
        default:
            dropdownPositionClasses = "absolute right-2 mt-2";
            break;
    }

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <div onClick={handleToggle} className="cursor-pointer">
                {children}
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.3 }}
                        className={`${dropdownPositionClasses} bg-white text-gray-800 rounded-md shadow-lg z-50 overflow-hidden w-44`}
                    >
                        <ul className="py-2">
                            {options.map((option, index) => (
                                <li key={`${option.label}-${index}`}>
                                    <button
                                        className="flex w-full items-center px-4 py-2 text-md cursor-pointer font-semibold hover:bg-gray-100 text-left"
                                        onClick={() => handleOptionClick(option.onClick)}
                                    >
                                        {option.icon && (
                                            <span className="mr-2">{option.icon}</span>
                                        )}
                                        {option.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(Dropdown);
