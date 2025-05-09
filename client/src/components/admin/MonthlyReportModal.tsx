/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { generateReportPreviewHTML } from '../../utils/monthlyReportGenerator';
import '../../styles/report-modal.css';

interface MonthlyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: any;
}

const MonthlyReportModal = ({ isOpen, onClose, reportData }: MonthlyReportModalProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const reportContainerRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) onClose();
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isOpen, onClose]);

    const renderReport = useCallback(() => {
        try {
            if (reportContainerRef.current) {
                const html = generateReportPreviewHTML(reportData);
                reportContainerRef.current.innerHTML = html;
                setIsLoading(false);
            } else {
                setError("Report container not found");
                setIsLoading(false);
            }
        } catch (err) {
            setError(`Failed to render report: ${err instanceof Error ? err.message : String(err)}`);
            setIsLoading(false);
        }
    }, [reportData]);

    useEffect(() => {
        if (isOpen && reportData) {
            setIsLoading(true);
            setError(null);
            renderReport();
        }
    }, [isOpen, reportData, renderReport]);

    const handlePrintReport = () => {
        if (isLoading || !reportContainerRef.current) return;

        try {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>${reportData.period} Report</title>
                            <link rel="stylesheet" href="/report-modal.css">
                        </head>
                        <body>
                            ${reportContainerRef.current.innerHTML}
                            <script>
                                setTimeout(() => {
                                    window.print();
                                    window.close();
                                }, 500);
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } catch (err) {
            setError(`Failed to print report: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    ref={modalRef}
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    exit={{ y: -20 }}
                    className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Monthly Report - {reportData.period}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden">
                        {isLoading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full p-6"
                            >
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                                <p className="mt-4 text-gray-600">Generating report preview...</p>
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full p-6 text-center"
                            >
                                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Report</h3>
                                <p className="text-gray-600 mb-6">{error}</p>
                                <button
                                    onClick={() => {
                                        setIsLoading(true);
                                        setError(null);
                                        renderReport();
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </motion.div>
                        ) : null}
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full overflow-y-auto"
                    >
                        <div
                            ref={reportContainerRef}
                            className="p-6 print-container"
                        />
                    </motion.div>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-t border-gray-200 bg-gray-50 p-4"
                    >
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrintReport}
                                disabled={isLoading || !!error}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Preparing...' : 'Print Report'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MonthlyReportModal;