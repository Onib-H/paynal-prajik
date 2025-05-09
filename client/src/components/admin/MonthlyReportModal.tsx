/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/report-modal.css'; // Import the styles
import { generateMonthlyReportPDF, generateReportPreviewHTML } from '../../utils/monthlyReportGenerator';

interface MonthlyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: any;
}

const MonthlyReportModal = ({ isOpen, onClose, reportData }: MonthlyReportModalProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const reportContainerRef = useRef<HTMLDivElement>(null);

    console.log("MonthlyReportModal rendered with isOpen:", isOpen);
    console.log("Report data received:", reportData);

    // Effect for keyboard shortcuts and cleanup
    useEffect(() => {
        console.log("Setting up keyboard shortcuts for modal");
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                console.log("Escape key pressed, closing modal");
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            console.log("Cleaning up keyboard event listeners");
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose]);

    // Render report function that will be called after a delay
    const renderReport = useCallback(() => {
        console.log("Rendering report now");
        try {
            if (reportContainerRef.current) {
                console.log("Report container found, generating HTML");
                const html = generateReportPreviewHTML(reportData);
                console.log(`HTML generated, length: ${html.length}`);

                reportContainerRef.current.innerHTML = html;
                console.log("HTML inserted into container");

                setIsLoading(false);
            } else {
                console.error("Report container ref is null");
                setError("Report container not found");
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error rendering report:', err);
            setError(`Failed to render report: ${err instanceof Error ? err.message : String(err)}`);
            setIsLoading(false);
        }
    }, [reportData]);

    useEffect(() => {
        if (isOpen && reportData) {
            console.log("Modal is open and report data exists, preparing to render");
            setIsLoading(true);
            setError(null);

            // Delay rendering to ensure DOM is ready
            console.log("Setting timeout for rendering report");
            const renderTimer = setTimeout(renderReport, 800);

            return () => {
                console.log("Cleaning up render timeout");
                clearTimeout(renderTimer);
            };
        }
    }, [isOpen, reportData, renderReport]);

    // Handle print functionality
    const handlePrintReport = () => {
        console.log("Print button clicked");
        if (isLoading) {
            console.log("Cannot print, still loading");
            return;
        }

        try {
            const printContent = reportContainerRef.current;
            if (printContent) {
                console.log("Initiating print process");
                const originalContents = document.body.innerHTML;
                document.body.innerHTML = printContent.innerHTML;

                setTimeout(() => {
                    console.log("Printing report");
                    window.print();
                    console.log("Print dialog completed, restoring original content");
                    document.body.innerHTML = originalContents;
                    // Reload to restore React components
                    console.log("Reloading page to restore React components");
                    window.location.reload();
                }, 100);
            } else {
                console.error("Print content not found");
                setError("Print content not found");
            }
        } catch (err) {
            console.error('Print error:', err);
            setError(`Failed to print report: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    // Handle PDF download
    const handleDownloadReport = async () => {
        console.log("Download PDF button clicked");
        if (isLoading) {
            console.log("Cannot download, still loading");
            return;
        }

        try {
            console.log("Starting PDF generation process");
            setIsLoading(true);
            setError(null);

            const doc = await generateMonthlyReportPDF(reportData);
            console.log("PDF generation completed");

            const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
            const period = reportData.period.replace(/\s+/g, '_').toLowerCase();
            const filename = `Azurea_Hotel_Monthly_Report_${period}_${timestamp}.pdf`;

            console.log("Saving PDF with filename:", filename);
            doc.save(filename);
            console.log("PDF saved successfully");

            setIsLoading(false);
        } catch (err) {
            console.error(`Error generating PDF:`, err);
            setError(`Failed to generate PDF: ${err instanceof Error ? err.message : String(err)}`);
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto"
            >
                <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b">
                        <h2 className="text-2xl font-bold">Monthly Report - {reportData.period}</h2>
                        <button
                            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            onClick={() => {
                                console.log("Close button clicked");
                                onClose();
                            }}
                        >
                            &times;
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-auto">
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center h-96">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                <div className="ml-4 text-lg text-gray-600 mt-4">Loading report...</div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col justify-center items-center h-96">
                                <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
                                <div className="text-gray-700">{error}</div>
                                <button
                                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={() => {
                                        console.log("Retry button clicked");
                                        setIsLoading(true);
                                        setError(null);
                                        renderReport();
                                    }}
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className="report-preview" ref={reportContainerRef}>
                                {/* Content will be dynamically inserted here */}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-4 p-6 border-t bg-gray-50">
                        <button
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                            onClick={() => {
                                console.log("Close button (footer) clicked");
                                onClose();
                            }}
                            disabled={isLoading}
                        >
                            Close
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            onClick={handleDownloadReport}
                            disabled={isLoading || !!error}
                        >
                            {isLoading ? 'Preparing...' : 'Download PDF'}
                        </button>
                        <button
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            onClick={handlePrintReport}
                            disabled={isLoading || !!error}
                        >
                            {isLoading ? 'Preparing...' : 'Print Report'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MonthlyReportModal;