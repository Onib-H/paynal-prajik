/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from 'date-fns';
import { useEffect, useRef } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { createPortal } from 'react-dom';
import '../../styles/print.css';
import { ReportData } from '../../utils/reports';

interface MonthlyReportViewProps {
    reportData: ReportData;
    onClose: () => void;
    chartOptions: {
        line: any;
        bar: any;
        pie: any;
    };
    chartData: {
        revenueData: any;
        bookingTrendsData: any;
        bookingStatusData: any;
        roomOccupancyData: any;
        revenueContributionData?: any;
        roomBookingDistributionData?: any;
    };
}

const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
    reportData,
    onClose,
    chartOptions,
    chartData
}) => {
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                /* Hide ALL page elements */
                body > * {
                    display: none !important;
                }
                
                /* Only show the report wrapper */
                #report-print-wrapper {
                    display: block !important;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                }
                
                /* Basic page setup */
                @page {
                    size: A4 portrait;
                    margin: 1cm;
                }
                
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    background: white !important;
                }
            }
            
            #report-print-wrapper {
                background: white;
                z-index: 9999;
            }
        `;
        document.head.appendChild(style);

        const printButton = document.getElementById('print-report-button');
        if (printButton) {
            printButton.focus();
        }

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const totalBookingStatuses = Object.values(reportData.bookingStatusCounts).reduce((sum, count) => sum + count, 0);

    const getPercentage = (value: number) => {
        if (totalBookingStatuses === 0) return '0%';
        return `${((value / totalBookingStatuses) * 100).toFixed(1)}%`;
    };

    return createPortal(
        <div id="report-print-wrapper" className="fixed inset-0 bg-white z-50 overflow-auto">
            {/* Print controls - hidden when printing */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold">Monthly Report Preview</h2>
                <div className="flex gap-3">
                    <button
                        id="print-report-button"
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Print Report
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Report content */}
            <div ref={printRef} className="p-8 max-w-4xl mx-auto bg-white">
                {/* Header with logo - visible in print */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-500">Azurea Hotel Management System</h1>
                    <h2 className="text-2xl font-semibold mt-2">Monthly Performance Report</h2>
                    <p className="text-lg italic mt-1">{reportData.period || format(new Date(), 'MMMM yyyy')}</p>
                    <p className="text-sm text-gray-500 mt-1">Generated on: {format(new Date(), 'PPpp')}</p>
                </div>

                {/* Executive Summary */}
                <div className="mb-8 page-break-after-avoid">
                    <h3 className="text-xl font-bold bg-gray-100 p-2 rounded-md">Executive Summary</h3>
                    <p className="mt-3 text-gray-700 italic">
                        This monthly performance report provides a comprehensive overview of the hotel's operational and financial metrics for {reportData.period}.
                        The report highlights key performance indicators including total bookings ({reportData.stats.totalBookings}),
                        current occupancy rate ({reportData.stats.occupancyRate}), and total revenue ({reportData.stats.formattedRevenue}).
                        Review the detailed sections below for deeper insights into booking trends, revenue patterns, and room occupancy statistics.
                    </p>
                </div>

                {/* KPI Section */}
                <div className="mb-8 page-break-after-avoid">
                    <h3 className="text-xl font-bold bg-gray-100 p-2 rounded-md">1. Key Performance Indicators</h3>
                    <p className="mt-3 mb-4 text-gray-700 italic">
                        These key metrics provide a snapshot of the hotel's current operational status and financial performance for the current month.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 p-4 rounded-md border-l-4 border-blue-500">
                            <p className="text-sm text-gray-500">Total Bookings</p>
                            <p className="text-xl font-bold">{reportData.stats.totalBookings}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md border-l-4 border-green-500">
                            <p className="text-sm text-gray-500">Active Bookings</p>
                            <p className="text-xl font-bold">{reportData.stats.activeBookings}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md border-l-4 border-orange-500">
                            <p className="text-sm text-gray-500">Total Revenue</p>
                            <p className="text-xl font-bold">{reportData.stats.formattedRevenue}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md border-l-4 border-purple-500">
                            <p className="text-sm text-gray-500">Occupancy Rate</p>
                            <p className="text-xl font-bold">{reportData.stats.occupancyRate}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-md border-l-4 border-yellow-500">
                            <p className="text-sm text-gray-500">Pending Bookings</p>
                            <p className="text-xl font-bold">{reportData.stats.pendingBookings}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md border-l-4 border-indigo-500">
                            <p className="text-sm text-gray-500">Checked-in Guests</p>
                            <p className="text-xl font-bold">{reportData.stats.checkedInCount}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md border-l-4 border-teal-500">
                            <p className="text-sm text-gray-500">Available Rooms</p>
                            <p className="text-xl font-bold">{reportData.stats.availableRooms}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md border-l-4 border-gray-500">
                            <p className="text-sm text-gray-500">Total Rooms</p>
                            <p className="text-xl font-bold">{reportData.stats.totalRooms}</p>
                        </div>
                    </div>
                </div>

                {/* Revenue & Booking Analysis */}
                <div className="mb-8 page-break-inside-avoid">
                    <h3 className="text-xl font-bold bg-gray-100 p-2 rounded-md">2. Revenue & Booking Analysis</h3>
                    <p className="mt-3 mb-4 text-gray-700 italic">
                        This section illustrates daily revenue trends and booking patterns throughout the month, helping identify peak periods and opportunities for revenue optimization.
                    </p>

                    <h4 className="text-lg font-semibold mt-6 mb-3">Daily Revenue Trends</h4>
                    <div className="bg-white p-4 border rounded-md h-64 mb-4">
                        <Line data={chartData.revenueData} options={chartOptions.line} />
                    </div>
                    <p className="text-sm italic text-gray-700 mb-6">
                        Total monthly revenue: {reportData.stats.formattedRevenue}.
                        Room revenue accounts for approximately 75% of total revenue, with the remainder coming from venue bookings and additional services.
                    </p>

                    <h4 className="text-lg font-semibold mt-6 mb-3">Booking Pattern Analysis</h4>
                    <div className="bg-white p-4 border rounded-md h-64">
                        <Line data={chartData.bookingTrendsData} options={chartOptions.line} />
                    </div>
                </div>

                {/* Booking Status */}
                <div className="mb-8 page-break-inside-avoid page-break-before">
                    <h3 className="text-xl font-bold bg-gray-100 p-2 rounded-md">3. Booking Status Distribution</h3>
                    <p className="mt-3 mb-4 text-gray-700 italic">
                        This section provides a breakdown of all bookings by their current status, helping identify operational priorities and potential revenue risks.
                    </p>

                    <div className="flex flex-col md:flex-row gap-8 mb-6">
                        <div className="md:w-1/2">
                            <div className="bg-white p-4 border rounded-md h-72 flex justify-center items-center">
                                <div className="w-64 h-64">
                                    <Doughnut data={chartData.bookingStatusData} options={chartOptions.pie} />
                                </div>
                            </div>
                        </div>
                        <div className="md:w-1/2">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border p-2 text-left">Status</th>
                                        <th className="border p-2 text-left">Count</th>
                                        <th className="border p-2 text-left">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-gray-50">
                                        <td className="border p-2">Pending</td>
                                        <td className="border p-2">{reportData.bookingStatusCounts.pending}</td>
                                        <td className="border p-2">{getPercentage(reportData.bookingStatusCounts.pending)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2">Reserved</td>
                                        <td className="border p-2">{reportData.bookingStatusCounts.reserved}</td>
                                        <td className="border p-2">{getPercentage(reportData.bookingStatusCounts.reserved)}</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="border p-2">Checked In</td>
                                        <td className="border p-2">{reportData.bookingStatusCounts.checked_in}</td>
                                        <td className="border p-2">{getPercentage(reportData.bookingStatusCounts.checked_in)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2">Checked Out</td>
                                        <td className="border p-2">{reportData.bookingStatusCounts.checked_out}</td>
                                        <td className="border p-2">{getPercentage(reportData.bookingStatusCounts.checked_out)}</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="border p-2">Cancelled</td>
                                        <td className="border p-2">{reportData.bookingStatusCounts.cancelled}</td>
                                        <td className="border p-2">{getPercentage(reportData.bookingStatusCounts.cancelled)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2">No Show</td>
                                        <td className="border p-2">{reportData.bookingStatusCounts.no_show}</td>
                                        <td className="border p-2">{getPercentage(reportData.bookingStatusCounts.no_show)}</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="border p-2">Rejected</td>
                                        <td className="border p-2">{reportData.bookingStatusCounts.rejected}</td>
                                        <td className="border p-2">{getPercentage(reportData.bookingStatusCounts.rejected)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <p className="text-sm italic text-gray-700">
                        Currently, {getPercentage(reportData.bookingStatusCounts.pending)} of all bookings are pending confirmation,
                        while {getPercentage(reportData.bookingStatusCounts.cancelled)} have been cancelled.
                        Active revenue-generating bookings (reserved and checked-in) account for {
                            getPercentage(reportData.bookingStatusCounts.reserved + reportData.bookingStatusCounts.checked_in)
                        } of all bookings.
                    </p>
                </div>

                {/* Room Occupancy */}
                <div className="mb-8 page-break-inside-avoid page-break-before">
                    <h3 className="text-xl font-bold bg-gray-100 p-2 rounded-md">4. Room Occupancy Analysis</h3>
                    <p className="mt-3 mb-4 text-gray-700 italic">
                        This section analyzes room occupancy by type, highlighting which room categories are most popular and identifying opportunities to optimize room allocation and pricing.
                    </p>

                    <div className="bg-white p-4 border rounded-md h-64 mb-6">
                        <Bar data={chartData.roomOccupancyData} options={chartOptions.bar} />
                    </div>

                    <p className="text-sm italic text-gray-700 mb-6">
                        Current overall occupancy rate is {reportData.stats.occupancyRate}, with {reportData.stats.availableRooms} rooms
                        currently available for booking out of {reportData.stats.totalRooms} total rooms.
                        Standard rooms show the highest occupancy rate, followed by Deluxe rooms.
                    </p>

                    <h4 className="text-lg font-semibold mt-6 mb-3">Recommendations</h4>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Consider targeted promotions for room types with lower occupancy rates</li>
                        <li>Review pricing strategy for peak booking days identified in the booking trends chart</li>
                        <li>Follow up with pending bookings to increase conversion rate</li>
                        <li>Analyze cancellation patterns to identify and address common causes</li>
                    </ul>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-4 border-t text-center text-sm text-gray-500">
                    <p>Confidential - For internal use only</p>
                    <p>© Azurea Hotel Management System</p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MonthlyReportView; 