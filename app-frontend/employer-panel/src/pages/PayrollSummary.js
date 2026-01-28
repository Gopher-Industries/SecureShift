import React, { useState, useEffect, useMemo } from 'react';
import http from '../lib/http';
import './PayrollSummary.css';

const GroupBy = Object.freeze({
    Guard: 'guard',
    Shift: 'shift',
    Weekly: 'weekly',
    Monthly: 'monthly',
});

// Calculate hours from HH:MM strings
const calculateHours = (startTime, endTime, spansMidnight) => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;

    let startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;

    // Handle overnight shifts
    if (spansMidnight || endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
    }

    return (endMinutes - startMinutes) / 60;
};

// Calculate payments for a single shift
const calculateShiftPayments = (shift) => {
    const hours = calculateHours(shift.startTime, shift.endTime, shift.spansMidnight);
    const payments = hours * (shift.payRate || 0);
    return { hours, payments };
};

// Get start of week (Monday) - calendar week
const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Get ISO week number
const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Set to nearest Thursday
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

// Group shifts by guard
const groupByGuard = (shifts, calculateShiftPayments) => {
    const groups = {};
    shifts.forEach(shift => {
        const guardId = shift.assignedGuard?._id || 'unknown';
        if (!groups[guardId]) {
            groups[guardId] = {
                guardId,
                guardName: shift.assignedGuard?.name || 'Unknown',
                guardEmail: shift.assignedGuard?.email || '',
                totalHours: 0,
                totalPayments: 0,
                shiftCount: 0
            };
        }
        const { hours, payments } = calculateShiftPayments(shift);
        groups[guardId].totalHours += hours;
        groups[guardId].totalPayments += payments;
        groups[guardId].shiftCount += 1;
    });
    return Object.values(groups).sort((a, b) => a.guardName.localeCompare(b.guardName));
};

// Group shifts by calendar week
const groupByWeek = (shifts, calculateShiftPayments) => {
    const groups = {};
    shifts.forEach(shift => {
        const date = new Date(shift.date);
        const weekStart = getWeekStart(date);
        const weekNumber = getWeekNumber(date);
        const year = weekStart.getFullYear();
        const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
        if (!groups[weekKey]) {
            groups[weekKey] = {
                weekKey: weekKey,
                weekLabel: `Week ${weekNumber}, ${year}`,
                weekStart: weekStart,
                weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
                totalHours: 0,
                totalPayments: 0,
                shiftCount: 0
            };
        }
        const { hours, payments } = calculateShiftPayments(shift);
        groups[weekKey].totalHours += hours;
        groups[weekKey].totalPayments += payments;
        groups[weekKey].shiftCount += 1;
    });
    return Object.values(groups).sort((a, b) => b.weekKey.localeCompare(a.weekKey));
};

// Group shifts by month
const groupByMonth = (shifts, calculateShiftPayments) => {
    const groups = {};
    shifts.forEach(shift => {
        const date = new Date(shift.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!groups[monthKey]) {
            groups[monthKey] = {
                month: monthKey,
                monthName: date.toLocaleDateString('en-AU', { year: 'numeric', month: 'long' }),
                totalHours: 0,
                totalPayments: 0,
                shiftCount: 0
            };
        }
        const { hours, payments } = calculateShiftPayments(shift);
        groups[monthKey].totalHours += hours;
        groups[monthKey].totalPayments += payments;
        groups[monthKey].shiftCount += 1;
    });
    return Object.values(groups).sort((a, b) => b.month.localeCompare(a.month));
};

const PayrollSummary = () => {
    const [shifts, setShifts] = useState([]);
    const [groupBy, setGroupBy] = useState(GroupBy.Guard);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch completed shifts from history endpoint
    useEffect(() => {
        const fetchShifts = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await http.get('/shifts/history');
                setShifts(data.items || []);
            } catch (err) {
                const message = err?.response?.data?.message || 'Failed to load shift history.';
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        fetchShifts();
    }, []);

    // Apply date filters
    const filteredShifts = useMemo(() => {
        return shifts.filter(shift => {
            const shiftDate = new Date(shift.date);
            if (startDate && shiftDate < new Date(startDate)) return false;
            if (endDate && shiftDate > new Date(endDate + 'T23:59:59')) return false;
            return true;
        });
    }, [shifts, startDate, endDate]);

    // Group data by selected dimension
    const groupedData = useMemo(() => {
        switch (groupBy) {
            case GroupBy.Guard:
                return groupByGuard(filteredShifts, calculateShiftPayments);
            case GroupBy.Weekly:
                return groupByWeek(filteredShifts, calculateShiftPayments);
            case GroupBy.Monthly:
                return groupByMonth(filteredShifts, calculateShiftPayments);
            default: // 'shift'
                return filteredShifts.map(s => ({
                    ...s,
                    ...calculateShiftPayments(s),
                    guardName: s.assignedGuard?.name || 'Unassigned'
                }));
        }
    }, [filteredShifts, groupBy]);

    // Calculate overall summary
    const summary = useMemo(() => {
        let totalHours = 0, totalPayments = 0;
        filteredShifts.forEach(shift => {
            const { hours, payments } = calculateShiftPayments(shift);
            totalHours += hours;
            totalPayments += payments;
        });
        return {
            totalHours: totalHours.toFixed(1),
            totalPayments: totalPayments.toFixed(2),
            totalShifts: filteredShifts.length
        };
    }, [filteredShifts]);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '--';
        const date = new Date(dateString);
        if (isNaN(date)) return '--';
        return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // CSV Export
    const handleExportCSV = () => {
        const headers = {
            guard: ['Guard Name', 'Email', 'Total Hours', 'Total Payments ($)', 'Shift Count'],
            shift: ['Shift Title', 'Date', 'Guard', 'Hours', 'Pay Rate ($)', 'Payments ($)'],
            weekly: ['Week', 'Date Range', 'Total Hours', 'Total Payments ($)', 'Shift Count'],
            monthly: ['Month', 'Total Hours', 'Total Payments ($)', 'Shift Count']
        };

        const rows = groupedData.map(item => {
            switch (groupBy) {
                case GroupBy.Guard:
                    return [item.guardName, item.guardEmail, item.totalHours.toFixed(1),
                            item.totalPayments.toFixed(2), item.shiftCount];
                case GroupBy.Weekly:
                    return [item.weekLabel, `${formatDate(item.weekStart)} - ${formatDate(item.weekEnd)}`,
                            item.totalHours.toFixed(1), item.totalPayments.toFixed(2), item.shiftCount];
                case GroupBy.Monthly:
                    return [item.monthName, item.totalHours.toFixed(1),
                            item.totalPayments.toFixed(2), item.shiftCount];
                default: // shift
                    return [item.title || '--', formatDate(item.date), item.guardName,
                            item.hours.toFixed(1), item.payRate || 0, item.payments.toFixed(2)];
            }
        });

        // Escape CSV fields
        const escapeCSV = (field) => {
            const str = String(field);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csv = [
            headers[groupBy].join(','),
            ...rows.map(r => r.map(escapeCSV).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payroll-${groupBy}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Render table based on groupBy selection
    const renderTable = () => {
        if (groupedData.length === 0) {
            return <p className="payroll-empty">No completed shifts found for the selected period.</p>;
        }

        switch (groupBy) {
            case GroupBy.Guard:
                return (
                    <table className="payroll-table">
                        <thead>
                            <tr>
                                <th>Guard Name</th>
                                <th>Email</th>
                                <th>Hours</th>
                                <th>Payments ($)</th>
                                <th>Shifts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedData.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.guardName}</td>
                                    <td>{item.guardEmail || '--'}</td>
                                    <td>{item.totalHours.toFixed(1)}</td>
                                    <td>${item.totalPayments.toFixed(2)}</td>
                                    <td>{item.shiftCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case GroupBy.Weekly:
                return (
                    <table className="payroll-table">
                        <thead>
                            <tr>
                                <th>Week</th>
                                <th>Date Range</th>
                                <th>Hours</th>
                                <th>Payments ($)</th>
                                <th>Shifts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedData.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.weekLabel}</td>
                                    <td>{formatDate(item.weekStart)} - {formatDate(item.weekEnd)}</td>
                                    <td>{item.totalHours.toFixed(1)}</td>
                                    <td>${item.totalPayments.toFixed(2)}</td>
                                    <td>{item.shiftCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case GroupBy.Monthly:
                return (
                    <table className="payroll-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Hours</th>
                                <th>Payments ($)</th>
                                <th>Shifts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedData.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.monthName}</td>
                                    <td>{item.totalHours.toFixed(1)}</td>
                                    <td>${item.totalPayments.toFixed(2)}</td>
                                    <td>{item.shiftCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            default: // shift
                return (
                    <table className="payroll-table">
                        <thead>
                            <tr>
                                <th>Shift Title</th>
                                <th>Date</th>
                                <th>Guard</th>
                                <th>Hours</th>
                                <th>Rate ($)</th>
                                <th>Payments ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedData.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.title || '--'}</td>
                                    <td>{formatDate(item.date)}</td>
                                    <td>{item.guardName}</td>
                                    <td>{item.hours.toFixed(1)}</td>
                                    <td>${item.payRate || 0}</td>
                                    <td>${item.payments.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
        }
    };

    return (
        <div className="payroll-container">
            {/* Header */}
            <div className="payroll-header">
                <h1 className="payroll-title">Payroll Summary</h1>
                <button className="payroll-export-btn" onClick={handleExportCSV} disabled={loading || groupedData.length === 0}>
                    <img src="/ic-download.svg" alt="Export" className="payroll-icon" onError={(e) => e.target.style.display = 'none'} />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="payroll-summary-grid">
                <div className="payroll-summary-card payroll-card-hours">
                    <div>
                        <p className="payroll-summary-label">Total Hours</p>
                        <p className="payroll-summary-number">{summary.totalHours}</p>
                    </div>
                    <img src="/ic-clock.svg" alt="Hours" className="payroll-card-icon" />
                </div>
                <div className="payroll-summary-card payroll-card-payments">
                    <div>
                        <p className="payroll-summary-label">Total Payments</p>
                        <p className="payroll-summary-number">${summary.totalPayments}</p>
                    </div>
                    <img src="/ic-dollar.svg" alt="Payments" className="payroll-card-icon" onError={(e) => e.target.style.display = 'none'} />
                </div>
                <div className="payroll-summary-card payroll-card-shifts">
                    <div>
                        <p className="payroll-summary-label">Total Shifts</p>
                        <p className="payroll-summary-number">{summary.totalShifts}</p>
                    </div>
                    <img src="/ic-task.svg" alt="Shifts" className="payroll-card-icon" />
                </div>
            </div>

            {/* Filters Section */}
            <div className="payroll-filter-section">
                <div className="payroll-filter-group">
                    <span className="payroll-filter-label">Group by:</span>
                    <div className="payroll-filter-buttons">
                        {Object.entries(GroupBy).map(([label, value]) => (
                            <button
                                key={value}
                                className={`payroll-filter-btn ${groupBy === value ? 'active' : ''}`}
                                onClick={() => setGroupBy(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="payroll-date-filters">
                    <div className="payroll-date-group">
                        <label className="payroll-date-label">Start Date:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="payroll-date-input"
                        />
                    </div>
                    <div className="payroll-date-group">
                        <label className="payroll-date-label">End Date:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="payroll-date-input"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button
                            className="payroll-clear-btn"
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading && <p className="payroll-loading">Loading shift history...</p>}
            {error && <p className="payroll-error">{error}</p>}
            {!loading && !error && (
                <div className="payroll-table-container">
                    {renderTable()}
                </div>
            )}
        </div>
    );
};

export default PayrollSummary;
