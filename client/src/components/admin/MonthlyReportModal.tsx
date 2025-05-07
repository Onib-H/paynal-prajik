import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { generateMonthlyReportPDF, generateReportPreviewHTML } from '../../utils/monthlyReportGenerator';

interface MonthlyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: any;
}

const MonthlyReportModal = ({ isOpen, onClose, reportData }: MonthlyReportModalProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const reportContainerRef = useRef<HTMLDivElement>(null);
    const bookingStatusChartRef = useRef<HTMLDivElement>(null);
    const areaRevenueChartRef = useRef<HTMLDivElement>(null);
    const roomRevenueChartRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose]);

    // When the modal is opened, generate the report preview
    useEffect(() => {
        if (isOpen && reportContainerRef.current) {
            setIsLoading(true);

            // Set HTML content first
            if (reportContainerRef.current) {
                reportContainerRef.current.innerHTML = generateReportPreviewHTML(reportData);
            }

            // Clone the charts from the dashboard
            const renderCharts = async () => {
                try {
                    // Render the booking status chart
                    if (reportData.charts.bookingStatusChart && bookingStatusChartRef.current) {
                        const chartContainer = document.getElementById('bookingStatusChart');
                        if (chartContainer) {
                            chartContainer.innerHTML = '';
                            chartContainer.appendChild(reportData.charts.bookingStatusChart.cloneNode(true));
                        }
                    }

                    // Render the area revenue chart
                    if (reportData.charts.areaRevenueChart && areaRevenueChartRef.current) {
                        const chartContainer = document.getElementById('areaRevenueChart');
                        if (chartContainer) {
                            chartContainer.innerHTML = '';
                            chartContainer.appendChild(reportData.charts.areaRevenueChart.cloneNode(true));
                        }
                    }

                    // Render the room revenue chart
                    if (reportData.charts.roomRevenueChart && roomRevenueChartRef.current) {
                        const chartContainer = document.getElementById('roomRevenueChart');
                        if (chartContainer) {
                            chartContainer.innerHTML = '';
                            chartContainer.appendChild(reportData.charts.roomRevenueChart.cloneNode(true));
                        }
                    }
                } catch (error) {
                    console.error('Error rendering charts:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            // Small delay to ensure DOM is ready
            setTimeout(renderCharts, 300);
        }
    }, [isOpen, reportData]);

    const handlePrintReport = () => {
        window.print();
    };

    const handleDownloadReport = async () => {
        try {
            setIsLoading(true);
            const doc = await generateMonthlyReportPDF(reportData);

            // Generate PDF filename
            const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
            const period = reportData.period.replace(/\s+/g, '_').toLowerCase();
            const filename = `hotel_monthly_report_${period}_${timestamp}.pdf`;

            // Save the PDF file
            doc.save(filename);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="report-modal">
            <div className="report-modal-content">
                <div className="report-modal-header">
                    <h2 className="report-modal-title">Monthly Report - {reportData.period}</h2>
                    <button className="report-modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="report-modal-body">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-96">
                            <div className="text-lg text-gray-600">Loading report...</div>
                        </div>
                    ) : (
                        <div className="report-preview" ref={reportContainerRef}>
                            {/* Content will be dynamically inserted here */}
                        </div>
                    )}
                </div>

                <div className="report-modal-footer">
                    <button
                        className="btn-close"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    <button
                        className="btn-download"
                        onClick={handleDownloadReport}
                        disabled={isLoading}
                    >
                        Download PDF
                    </button>
                    <button
                        className="btn-print"
                        onClick={handlePrintReport}
                        disabled={isLoading}
                    >
                        Print Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonthlyReportModal; 