import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface AlertProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const Alert = ({
  message,
  type = "info",
  onClose,
  autoClose = true,
  duration = 5000
}: AlertProps) => {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    clearTimer();
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose, clearTimer]);

  useEffect(() => {
    if (autoClose) {
      timerRef.current = window.setTimeout(() => {
        handleClose();
      }, duration);
    }

    return clearTimer;
  }, [autoClose, duration, handleClose, clearTimer]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-100";
      case "error":
        return "bg-red-50 border-red-100";
      case "warning":
        return "bg-yellow-50 border-yellow-100";
      case "info":
      default:
        return "bg-blue-50 border-blue-100";
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`${getBgColor()} flex items-start p-4 mb-4 rounded-md border`}
        >
          <div className="flex-shrink-0 mr-3">{getIcon()}</div>
          <div className="flex-1 mr-2">{message}</div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close alert"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;
