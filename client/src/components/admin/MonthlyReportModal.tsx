/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/report-modal.css';
import { generateReportPreviewHTML } from '../../utils/monthlyReportGenerator';

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

    const handlePrintReport = async () => {
        try {
            if (!reportContainerRef.current) {
                throw new Error('Report container not found');
            }

            const element = reportContainerRef.current;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            const pageWidth = 210;
            const pageHeight = 297;

            const targetWidth = pageWidth * 3.78; // 210mm → 794px
            const targetHeight = pageHeight * 3.78; // 297mm → 1123px

            console.log('Target Dimensions:', {
                width: `${targetWidth}px`,
                height: `${targetHeight}px`
            });

            element.style.width = `${pageWidth}mm`;
            element.style.minHeight = `auto`;
            element.style.overflow = 'visible';

            const totalPages = Math.ceil(element.scrollHeight / targetHeight);

            for (let page = 0; page < totalPages; page++) {
                if (page > 0) pdf.addPage();

                const canvas = await html2canvas(element, {
                    scale: 2,
                    windowHeight: targetHeight,
                    y: page * targetHeight,
                    height: targetHeight,
                    useCORS: true,
                    logging: true,
                    onclone: (clonedDoc) => {
                        clonedDoc.documentElement.style.overflow = 'visible';
                        clonedDoc.body.style.zoom = '100%';
                    }
                });

                console.log('Captured Canvas:', {
                    width: `${canvas.width}px`,
                    height: `${canvas.height}px`,
                    ratio: (canvas.width / targetWidth).toFixed(2)
                });

                pdf.addImage(
                    canvas.toDataURL('image/png', 0.85),
                    'PNG',
                    0,
                    0,
                    pageWidth,
                    pageHeight,
                    undefined,
                    'FAST'
                );
            }

            pdf.save(`AzureaHotel_${reportData.period}_Monthly_Report.pdf`);
        } catch (err) {
            setError(`Failed to print report: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    ref={modalRef}
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    exit={{ y: -20 }}
                    className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-gray-200">
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
                                    className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                            className="report-root"
                            style={{
                                background: 'white',
                                margin: '0 auto',
                                overflow: 'hidden'
                            }}
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
                                onClick={handlePrintReport}
                                disabled={isLoading || !!error}
                                className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Preparing...' : 'Download PDF'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MonthlyReportModal;