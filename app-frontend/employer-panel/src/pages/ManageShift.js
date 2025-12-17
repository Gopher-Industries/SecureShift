import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Map backend status to filter display
const statusDisplayMap = {
    completed: "Completed",
    assigned: "In Progress",
    applied: "Pending",
    open: "Open",
};

const frontToBackendStatus = {
    "Completed": "completed",
    "Open": "open",
    "In Progress": "assigned",
    "Pending": "applied"
};

const Filter = Object.freeze({
    All: 'All',
    Status: 'Status',     
    Date: 'Date',         
    Location: 'Location', 
    Guard: "Guard",
    Completed: 'Completed',
    InProgress: 'In Progress',
    Pending: 'Pending',
    Open: 'Open',
});

const Sort = Object.freeze({
    DateAsc: 'Date (Asc)',
    DateDesc: 'Date (Desc)',
});

const normalizeShift = (s) => {
    let finalDate = null;

    if (s.date) {
        const dateOnly = s.date.split("T")[0];
        if (s.startTime) {
            finalDate = new Date(`${dateOnly}T${s.startTime}:00`);
        } else {
            finalDate = new Date(s.date);
        }
    }

    return {
        id: s._id,
        title: s.title || "--",
        dateTime: finalDate,
        location: s.location
            ? [s.location.street, s.location.suburb, s.location.state].filter(Boolean).join(", ")
            : "--",
        status: statusDisplayMap[s.status?.toLowerCase()] || "Open",
        price: s.payRate != null ? `${s.payRate} p/h` : "--",
        description: s.description || "",
        requirements: s.requirements || [],
    };
};

const ManageShift = () => {
    const navigate = useNavigate();
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFilter, setSelectedFilter] = useState(Filter.All);
    const [sortBy, setSortBy] = useState(Sort.DateAsc);
    const [showSortModal, setShowSortModal] = useState(false);
    
    // States for shift details modal
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    
    const [showStatusDropdown, setShowStatusDropdown] = useState(false); 
    const [showDateDropdown, setShowDateDropdown] = useState(false);     
    const [selectedDateFilter, setSelectedDateFilter] = useState(null);  
    const [selectedLocationFilter, setSelectedLocationFilter] = useState("");
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [guards, setGuards] = useState([]);           
    const [selectedGuardFilter, setSelectedGuardFilter] = useState(""); 
    const [showGuardDropdown, setShowGuardDropdown] = useState(false); 
    const itemsPerPage = 8;

    useEffect(() => {
        const fetchGuards = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/v1/shifts/guards", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = await res.json();
                setGuards(data);
            } catch (err) {
                console.error("Failed to load guards:", err);
            }
        };
        fetchGuards();
    }, []);  

    useEffect(() => {    
        const fetchShifts = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("No token found. Please log in.");
                    setLoading(false);
                    return;
                }
                const params = new URLSearchParams();

                if (["Completed", "In Progress", "Pending", "Open"].includes(selectedFilter)) {
                    const backendStatus = frontToBackendStatus[selectedFilter];
                    params.append("status", backendStatus);
                }

                if (sortBy === "Date (Asc)") params.append("sort", "asc");
                if (sortBy === "Date (Desc)") params.append("sort", "desc");

                if (selectedFilter === "Date" && selectedDateFilter) {
                    params.append("date", selectedDateFilter);
                }

                if (selectedFilter === "Location" && selectedLocationFilter.trim() !== "") {
                    params.append("location", selectedLocationFilter.trim());
                }

                if (selectedFilter === "Guard" && selectedGuardFilter) {
                    params.append("guard", selectedGuardFilter);
                }

                const url = `http://localhost:5000/api/v1/shifts?${params.toString()}`;

                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const text = await res.text();
                    setError(`Failed to fetch shifts (${res.status}): ${text}`);
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                const apiShifts = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
                setShifts(apiShifts.map(normalizeShift));

            } catch (err) {
                setError("Error fetching shifts.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchShifts();
    }, [selectedFilter, selectedDateFilter, selectedLocationFilter, sortBy]);

    const sortedShifts = shifts;
    const totalPages = Math.ceil(sortedShifts.length / itemsPerPage);
    const indexStart = (currentPage - 1) * itemsPerPage;
    const currentItems = sortedShifts.slice(indexStart, indexStart + itemsPerPage);

    const totalShifts = shifts.length;
    const completedShifts = shifts.filter(s => s.status === "Completed").length;
    const inProgressShifts = shifts.filter(s => s.status === "In Progress").length;
    const pendingShifts = shifts.filter(s => s.status === "Pending").length;

    const goPrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
    const goNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
    const goToPage = (page) => setCurrentPage(page);

    const getPaginationNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            if (totalPages > 1) pages.push(totalPages);
        }
        return pages;
    };

    const selectSortBy = (sortOption) => {
        setSortBy(sortOption);
        setShowSortModal(false);
    };

    const formatDate = (dateObj) => {
        if (!(dateObj instanceof Date)) return "--";
        return dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateObj) => {
         if (!(dateObj instanceof Date)) return "--";
        const hour = dateObj.getHours();
        const minute = dateObj.getMinutes();
        const endHour = (hour + 4) % 24;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    // Function to handle View Details button click
    const handleViewDetails = (shift) => {
        console.log("View Details clicked for shift:", shift);
        let datePart = null;
        let timePart = null;

        if (shift.dateTime instanceof Date) {
            datePart = shift.dateTime.toISOString().split("T")[0];
            timePart = shift.dateTime.toTimeString().slice(0, 5);
        }
        let endTime = '';
        
        // Calculate endTime based on 4-hour shift duration
        if (timePart) {
            const [hour, minute] = timePart.split(":").map(Number);
            if (!isNaN(hour) && !isNaN(minute)) {
                // Add 4 hours to the start time
                const endHour = (hour + 4) % 24;
                endTime = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            }
        }
        
        console.log("Setting selected shift:", {
            id: shift.id,
            date: datePart,
            startTime: timePart,
            endTime: endTime
        });
        
        setSelectedShift({
            id: shift.id,
            title: shift.title,
            date: datePart,
            startTime: timePart,
            endTime: endTime,
            location: shift.location,
            price: shift.price,
            status: shift.status,
            description: shift.description || "",
            requirements: shift.requirements || [], 
            applicants: []
        });
        setIsShiftModalOpen(true);
        console.log("Modal should open, isShiftModalOpen will be set to true");
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>Manage Shifts</h1>
                <button style={addButtonStyle} onClick={() => navigate('/create-shift')}>
                    <img src={"/ic-add.svg"} alt="Add" style={bigIconStyle} /> Add New Shift
                </button>
            </div>
            <div style={summaryGridStyle}>
                <SummaryCard label="Total shifts" number={totalShifts} icon="/ic-task.svg" bg="#EFF4FF" />
                <SummaryCard label="Completed shifts" number={completedShifts} icon="/ic-completed.svg" bg="#EAFAE7" />
                <SummaryCard label="In-Progress shifts" number={inProgressShifts} icon="/ic-lightning.svg" bg="#F6EFFF" />
                <SummaryCard label="Pending shifts" number={pendingShifts} icon="/ic-hourglass.svg" bg="#FBFAE2" />
            </div>
            <FilterSortSection
                Filter={Filter}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                sortBy={sortBy}
                setShowSortModal={setShowSortModal}
                showStatusDropdown={showStatusDropdown}         
                setShowStatusDropdown={setShowStatusDropdown}   
                showDateDropdown={showDateDropdown}             
                setShowDateDropdown={setShowDateDropdown}       
                selectSortBy={selectSortBy}                     
                selectedDateFilter={selectedDateFilter}         
                setSelectedDateFilter={setSelectedDateFilter}                   
                showLocationDropdown={showLocationDropdown}
                setShowLocationDropdown={setShowLocationDropdown}
                selectedLocationFilter={selectedLocationFilter}
                setSelectedLocationFilter={setSelectedLocationFilter}
                guards={guards}
                selectedGuardFilter={selectedGuardFilter}
                setSelectedGuardFilter={setSelectedGuardFilter}
                showGuardDropdown={showGuardDropdown}
                setShowGuardDropdown={setShowGuardDropdown}
            />
            {loading && <p>Loading shifts...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && currentItems.length === 0 && <p>No shifts found.</p>}
            <div style={gridStyle}>
                {currentItems.map((shift) => {
                    const dateObj = shift.dateTime instanceof Date ? shift.dateTime : null;
                    const datePart = dateObj ? dateObj.toISOString().split("T")[0] : null;
                    const timePart = dateObj ? dateObj.toTimeString().slice(0,5) : null;
                    return (
                        <div key={shift.id} style={cardStyle}>
                            <div>
                                <h3 style={cardTitleStyle}>{shift.title}</h3>
                                <div style={cardHeaderStyle}>
                                    <div style={getStatusTagStyle(shift.status)}>{shift.status}</div>
                                    <div style={priceStyle}>${shift.price}</div>
                                </div>
                            </div>
                            <div style={cardDetailsStyle}>
                                <div style={detailRowStyle}>
                                    <img src={"/ic-location.svg"} alt="Location" style={smallIconStyle} />
                                    <span style={detailTextStyle}>{shift.location}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                                    <div style={detailRowStyle}>
                                        <img src={"/ic-calendar.svg"} alt="Date" style={smallIconStyle} />
                                        <span style={detailTextStyle}>{formatDate(shift.dateTime)}</span>
                                    </div>
                                    <div style={detailRowStyle}>
                                        <img src={"/ic-clock.svg"} alt="Time" style={smallIconStyle} />
                                        <span style={detailTextStyle}>{formatTime(shift.dateTime)}</span>
                                    </div>
                                </div>
                                <button style={viewDetailsButtonStyle}
                                        onClick={() => navigate(`/shift/${shift.id}`)}
                                >View Details</button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {!loading && !error && totalPages > 1 && (
                <Pagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    goPrevPage={goPrevPage}
                    goNextPage={goNextPage}
                    goToPage={goToPage}
                    getPaginationNumbers={getPaginationNumbers}
                />
            )}
            {showSortModal && (
                <SortModal
                    Sort={Sort}
                    sortBy={sortBy}
                    selectSortBy={selectSortBy}
                    setShowSortModal={setShowSortModal}
                />
            )}
            
            {/* SHIFT DETAILS MODAL */}
            {isShiftModalOpen && selectedShift && (
                <ShiftDetailsModal
                    shift={selectedShift}
                    onClose={() => setIsShiftModalOpen(false)}
                />
            )}
        </div>
    );
};

// Mock Data for Descriptions & Requirements
const USE_MOCK_DATA = true; // Set to false when backend is ready

// Shift Details Modal Component
const ShiftDetailsModal = ({ shift, onClose }) => {
    // Format currency
    const formatCurrency = (amount) => {
        if (!amount || amount === "--") return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString || dateString === "--") return 'Date not set';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Format time
    const formatTime = (timeString) => {
        if (!timeString || timeString === "--") return 'Time not set';
        
        // Handle HH:MM format
        const [hour, minute] = timeString.split(':');
        const hourNum = parseInt(hour, 10);
        if (isNaN(hourNum)) return timeString;
        
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum % 12 || 12;
        return `${displayHour}:${minute || '00'} ${period}`;
    };

    // Calculate duration
    const calculateDuration = (startTime, endTime) => {
        if (!startTime || !endTime || startTime === "--" || endTime === "--") return '';
        
        try {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            
            let durationHours = endHour - startHour;
            let durationMinutes = endMinute - startMinute;
            
            if (durationMinutes < 0) {
                durationHours -= 1;
                durationMinutes += 60;
            }
            
            if (durationHours < 0) durationHours += 24;
            
            if (durationHours === 0) return `${durationMinutes} minutes`;
            if (durationMinutes === 0) return `${durationHours} hour${durationHours !== 1 ? 's' : ''}`;
            return `${durationHours} hour${durationHours !== 1 ? 's' : ''} ${durationMinutes} minutes`;
        } catch {
            return '';
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        if (!status) return { bg: '#eaeaea', text: '#666' };
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('completed')) return { bg: '#EAFAE7', text: '#2E7D32' };
        if (statusLower.includes('in progress')) return { bg: '#F6EFFF', text: '#7B1FA2' };
        if (statusLower.includes('pending')) return { bg: '#FBFAE2', text: '#F57C00' };
        if (statusLower.includes('open')) return { bg: '#E3F2FD', text: '#1565C0' };
        return { bg: '#eaeaea', text: '#666' };
    };

    // Mock applicants for display 
    const mockApplicants = [
        { id: 1, name: 'John Smith', status: 'Applied', appliedDate: '2025-12-01' },
        { id: 2, name: 'Jane Doe', status: 'Pending', appliedDate: '2025-12-02' },
        { id: 3, name: 'Bob Johnson', status: 'Accepted', appliedDate: '2025-12-03' },
    ];

    // Mock description and requirements (you'll need to get these from your backend)
    const mockDescription = "We are looking for a reliable worker to assist with warehouse duties including loading/unloading, inventory management, and general maintenance. The ideal candidate should be physically fit and able to work in a fast-paced environment.";
    
    const mockRequirements = [
        "Must be 18 years or older",
        "Ability to lift 50+ pounds",
        "Valid driver's license",
        "Previous warehouse experience preferred",
        "Available for 4-hour shifts",
        "Reliable transportation"
    ];

    const description = USE_MOCK_DATA ? mockDescription : (shift.description || "No description provided.");
    const requirements = USE_MOCK_DATA ? mockRequirements : (shift.requirements || []);
        
    // Modal styles
    const modalStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
        },
        modal: {
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.3s ease',
        },
        header: {
            padding: '24px 32px',
            borderBottom: '1px solid #eaeaea',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8f9fa',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
        },
        title: {
            fontSize: '24px',
            fontWeight: '600',
            color: '#000000',
            margin: 0,
        },
        closeBtn: {
            background: 'none',
            border: 'none',
            fontSize: '28px',
            color: '#666',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s',
        },
        content: {
            padding: '32px',
        },
        infoGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
        },
        infoCard: {
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            borderLeft: '4px solid #274b93',
        },
        infoLabel: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#666',
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
        },
        infoValue: {
            fontSize: '18px',
            fontWeight: '500',
            color: '#000000',
            margin: 0,
        },
        section: {
            marginBottom: '32px',
        },
        sectionTitle: {
            fontSize: '20px',
            fontWeight: '600',
            color: '#000000',
            margin: '0 0 16px 0',
            paddingBottom: '8px',
            borderBottom: '2px solid #eaeaea',
        },
        statusBadge: {
            display: 'inline-block',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
        },
        applicantsList: {
            listStyle: 'none',
            padding: 0,
            margin: 0,
        },
        applicantItem: {
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #eaeaea',
        },
        applicantName: {
            fontWeight: '600',
            fontSize: '16px',
            color: '#000000',
        },
        applicantStatus: {
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
        },
        statusApplied: {
            background: '#e3f2fd',
            color: '#1565c0',
        },
        statusPending: {
            background: '#fff3e0',
            color: '#ef6c00',
        },
        statusAccepted: {
            background: '#e8f5e9',
            color: '#2e7d32',
        },
        emptyState: {
            textAlign: 'center',
            padding: '40px',
            color: '#666',
            fontStyle: 'italic',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '2px dashed #ddd',
        },
        descriptionText: {
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#000000',
            margin: '0 0 20px 0',
        },
        requirementsList: {
            listStyle: 'none',
            padding: 0,
            margin: 0,
        },
        requirementItem: {
            padding: '12px 16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            borderLeft: '4px solid #274b93',
        },
        requirementText: {
            fontSize: '15px',
            color: '#000000',
            margin: 0,
        },
        footer: {
            padding: '24px 32px',
            borderTop: '1px solid #eaeaea',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
        },
        actionBtn: {
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '500',
            borderRadius: '25px',
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.3s',
            fontFamily: 'Poppins, sans-serif',
        },
        primaryBtn: {
            background: '#274b93',
            color: '#fff',
        },
        secondaryBtn: {
            background: '#fff',
            color: '#274b93',
            border: '2px solid #274b93',
        },
    };

    const statusColor = getStatusColor(shift.status);
    const duration = calculateDuration(shift.startTime, shift.endTime);

    return (
        <div 
            style={modalStyles.overlay}
            onClick={onClose}
        >
            <div 
                style={modalStyles.modal}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={modalStyles.header}>
                    <h2 style={modalStyles.title}>Shift Details</h2>
                    <button
                        style={modalStyles.closeBtn}
                        onClick={onClose}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div style={modalStyles.content}>
                    {/* Basic Information Grid */}
                    <div style={modalStyles.infoGrid}>
                        <div style={modalStyles.infoCard}>
                            <div style={modalStyles.infoLabel}>Job Title</div>
                            <div style={modalStyles.infoValue}>{shift.title || 'Not specified'}</div>
                        </div>
                        
                        <div style={modalStyles.infoCard}>
                            <div style={modalStyles.infoLabel}>Date</div>
                            <div style={modalStyles.infoValue}>{formatDate(shift.date)}</div>
                        </div>
                        
                        <div style={modalStyles.infoCard}>
                            <div style={modalStyles.infoLabel}>Time</div>
                            <div style={modalStyles.infoValue}>
                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                {duration && (
                                    <>
                                        <br />
                                        <small style={{ color: '#666', fontSize: '14px' }}>
                                            Duration: {duration}
                                        </small>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div style={modalStyles.infoCard}>
                            <div style={modalStyles.infoLabel}>Location</div>
                            <div style={modalStyles.infoValue}>
                                {shift.location || 'Not specified'}
                            </div>
                        </div>
                        
                        <div style={modalStyles.infoCard}>
                            <div style={modalStyles.infoLabel}>Pay Rate</div>
                            <div style={modalStyles.infoValue}>
                                {formatCurrency(shift.price)} per hour
                                {shift.price && shift.price !== "--" && (
                                    <>
                                        <br />
                                        <small style={{ color: '#666', fontSize: '14px' }}>
                                            Estimated total: {formatCurrency(parseFloat(shift.price) * 4)} (4 hours)
                                        </small>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div style={modalStyles.infoCard}>
                            <div style={modalStyles.infoLabel}>Status</div>
                            <div style={{ ...modalStyles.statusBadge, backgroundColor: statusColor.bg, color: statusColor.text }}>
                                {shift.status || 'Not specified'}
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div style={modalStyles.section}>
                        <h3 style={modalStyles.sectionTitle}>Job Description</h3>
                        <div style={modalStyles.infoCard}>
                            <div style={modalStyles.descriptionText}>
                                {description || "No description provided."}
                            </div>
                        </div>
                    </div>

                    {/* Requirements Section */}
                    <div style={modalStyles.section}>
                        <h3 style={modalStyles.sectionTitle}>Requirements</h3>
                        <ul style={modalStyles.requirementsList}>
                            {requirements.map((requirement, index) => ( 
                                <li key={index} style={modalStyles.requirementItem}>
                                    <span style={modalStyles.requirementText}>• {requirement}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Applicants Section */}
                    <div style={modalStyles.section}>
                        <h3 style={modalStyles.sectionTitle}>
                            Applicants ({mockApplicants.length})
                        </h3>
                        {mockApplicants.length > 0 ? (
                            <ul style={modalStyles.applicantsList}>
                                {mockApplicants.map(applicant => (
                                    <li key={applicant.id} style={modalStyles.applicantItem}>
                                        <div style={modalStyles.applicantName}>{applicant.name}</div>
                                        <div style={{
                                            ...modalStyles.applicantStatus,
                                            ...(applicant.status === 'Accepted' ? modalStyles.statusAccepted :
                                                 applicant.status === 'Pending' ? modalStyles.statusPending : 
                                                 modalStyles.statusApplied)
                                        }}>
                                            {applicant.status}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={modalStyles.emptyState}>
                                No applicants yet. Check back later!
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={modalStyles.footer}>
                    <button
                        style={{ ...modalStyles.actionBtn, ...modalStyles.secondaryBtn }}
                        onClick={onClose}
                        onMouseOver={(e) => {
                            e.target.style.background = '#f0f5ff';
                            e.target.style.color = '#1a3a7a';
                            e.target.style.borderColor = '#1a3a7a';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = '#fff';
                            e.target.style.color = '#274b93';
                            e.target.style.borderColor = '#274b93';
                        }}
                    >
                        Close
                    </button>
                    <button
                        style={{ ...modalStyles.actionBtn, ...modalStyles.primaryBtn }}
                        onClick={() => {
                            console.log('Edit shift:', shift);
                            onClose();
                        }}
                        onMouseOver={(e) => e.target.style.background = '#1a3a7a'}
                        onMouseOut={(e) => e.target.style.background = '#274b93'}
                    >
                        Edit Shift
                    </button>
                </div>
            </div>
            
            {/* CSS Animation */}
            <style>{`
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @media (max-width: 768px) {
                    .modal-grid {
                        grid-template-columns: 1fr !important;
                    }
                    
                    .modal-footer {
                        flex-direction: column;
                        gap: 12px;
                    }
                    
                    .modal-footer button {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

const SummaryCard = ({ label, number, icon, bg }) => (
    <div style={{ ...summaryCardStyle, backgroundColor: bg }}>
        <div>
            <p style={summaryLabelStyle}>{label}</p>
            <p style={summaryNumberStyle}>{number}</p>
        </div>
        <div><img src={icon} alt={label} style={bigIconStyle} /></div>
    </div>
);

const FilterSortSection = ({ Filter, selectedFilter, setSelectedFilter, sortBy, setShowSortModal, showStatusDropdown, setShowStatusDropdown, showDateDropdown, setShowDateDropdown, selectSortBy, selectedDateFilter, setSelectedDateFilter, showLocationDropdown, setShowLocationDropdown, selectedLocationFilter, setSelectedLocationFilter, guards, setSelectedGuardFilter, showGuardDropdown, setShowGuardDropdown, }) => (
    <div style={filterSectionStyle}>
        <div style={filterGroupStyle}>
            <img src={"/ic-filter.svg"} alt="Filter" style={smallIconStyle} />
            <span style={filterLabelStyle}>Filter by:</span>
   <div style={filterButtonsStyle}>
                {Object.values(Filter).filter(f => !["Completed", "In Progress", "Pending", "Open"].includes(f)).map(f => {
                    if (f === "Status") {
                        return (
                            <div key="Status" style={{ position: "relative" }}>
                                <button
                                    style={filterButtonStyle}
                                    onClick={() => setShowStatusDropdown(prev => !prev)}
                                >
                                    Status <span style={{ fontSize: '10px' }}>▼</span>
                                </button>
                                {showStatusDropdown && (
                                    <div style={dropdownStyle}>
                                        {["Completed", "In Progress", "Pending", "Open"].map(option => (
                                            <div
                                                key={option}
                                                style={dropdownItemStyle}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f7fa")}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                                onClick={() => {
                                                    setSelectedFilter(option);
                                                    setSelectedDateFilter(null);   
                                                    setShowStatusDropdown(false);
                                                }}
                                            >
                                                {option}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    if (f === "Date") {
                        return (
                            <div key="Date" style={{ position: "relative" }}>
                                <button
                                    style={filterButtonStyle}
                                    onClick={() => setShowDateDropdown(prev => !prev)}
                                >
                                    Date <span style={{ fontSize: '10px' }}>▼</span>
                                </button>
                                {showDateDropdown && (
                                    <div style={dropdownStyle}>
                                        {["Date (Asc)", "Date (Desc)"].map(option => (
                                            <div
                                                key={option}
                                                style={dropdownItemStyle}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f7fa")}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                                onClick={() => {
                                                    selectSortBy(option);
                                                    setShowDateDropdown(false);
                                                }}
                                            >
                                                {option}
                                            </div>
                                        ))}
                                        <div style={{ height: "1px", background: "#ddd", margin: "6px 0" }} />
                                        <div style={ datePickerWrapperStyle }>
                                            {/* Calendar picker */}
                                            <input
                                                type="date"
                                                value={selectedDateFilter || ""}
                                                onChange={(e) => {
                                                    setSelectedDateFilter(e.target.value);
                                                    setSelectedFilter("Date");
                                                }}
                                                style={datePickerInputStyle}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }
                    if (f === "Location") {
                        return (
                            <div key="Location" style={{ position: "relative" }}>
                                <button
                                    style={filterButtonStyle}
                                    onClick={() => setShowLocationDropdown(prev => !prev)}
                                >
                                    Location <span style={{ fontSize: '10px' }}>▼</span>
                                </button>
                                {showLocationDropdown && (
                                    <div style={dropdownStyle}>
                                        <div style={{ padding: "10px 16px" }}>
                                            <input
                                                type="text"
                                                placeholder="Enter location"
                                                value={selectedLocationFilter}
                                                onChange={(e) => setSelectedLocationFilter(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "8px 12px",
                                                    borderRadius: "6px",
                                                    border: "1px solid #ccc",
                                                    fontSize: "14px",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                ...dropdownItemStyle,
                                                fontWeight: "600",
                                                color: "#000000ff",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f7fa")}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                            onClick={() => {
                                                setSelectedFilter("Location");
                                                setSelectedDateFilter(null);  
                                                setShowLocationDropdown(false);
                                            }}
                                        >
                                            Apply
                                        </div>
                                        <div
                                            style={{
                                                ...dropdownItemStyle,
                                                color: "#888",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f7fa")}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                            onClick={() => {
                                                setSelectedLocationFilter("");
                                                setSelectedFilter("All");
                                                setShowLocationDropdown(false);
                                            }}
                                        >
                                            Clear
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }
                    if (f === "Guard") {
                        return (
                            <div key="Guard" style={{ position: "relative" }}>
                                <button
                                    style={filterButtonStyle}
                                    onClick={() => setShowGuardDropdown(prev => !prev)}
                                >
                                    Guard <span style={{ fontSize: '10px' }}>▼</span>
                                </button>
                                {showGuardDropdown && (
                                    <div style={dropdownStyle}>
                                        {guards.map(g => (
                                            <div
                                                key={g._id}
                                                style={dropdownItemStyle}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f7fa")}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                                onClick={() => {
                                                    setSelectedGuardFilter(g._id);
                                                    setSelectedFilter("Guard");
                                                    setShowGuardDropdown(false);
                                                }}
                                            >
                                                {g.name}
                                            </div>
                                        ))}
                                        <div
                                            style={{ ...dropdownItemStyle, color: "#888" }}
                                            onClick={() => {
                                                setSelectedGuardFilter("");
                                                setSelectedFilter("All");
                                                setShowGuardDropdown(false);
                                            }}
                                        >
                                            Clear
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }         
                    return (
                        <button
                            key={f}
                            style={selectedFilter === f ? activeFilterButtonStyle : filterButtonStyle}
                            onClick={() => setSelectedFilter(f)}
                        >
                            {f}
                        </button>
                    );
                })}
            </div>
        </div>
        <div style={sortGroupStyle}>
            <img src={"/ic-sort.svg"} alt="Sort" style={smallIconStyle} />
            <span style={filterLabelStyle}>Sort by:</span>
            <button style={sortButtonStyle} onClick={() => setShowSortModal(true)}>
                {sortBy} <span style={{ fontSize: '10px' }}>▼</span>
            </button>
        </div>
    </div>
);

const Pagination = ({ totalPages, currentPage, goPrevPage, goNextPage, goToPage, getPaginationNumbers }) => (
    <div style={paginationStyle}>
        <button onClick={goPrevPage} disabled={currentPage === 1} style={currentPage === 1 ? disabledPaginationButtonStyle : paginationButtonStyle}>
            <img src={"/ic-arrow-back.svg"} alt="Previous" style={smallIconStyle} />
        </button>
        {getPaginationNumbers().map((page, index) => (
            <button
                key={index}
                onClick={() => typeof page === 'number' ? goToPage(page) : null}
                style={page === currentPage ? activePaginationButtonStyle : paginationButtonStyle}
                disabled={page === '...'}
            >{page}</button>
        ))}
      </div>
);

const SortModal = ({ Sort, sortBy, selectSortBy, setShowSortModal }) => (
    <div style={modalOverlayStyle} onClick={() => setShowSortModal(false)}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Sort by</h3>
                <button style={closeButtonStyle} onClick={() => setShowSortModal(false)}>×</button>
            </div>
            <div style={modalBodyStyle}>
                {Object.values(Sort).map(option => (
                    <button
                        key={option}
                        style={option === sortBy ? activeSortOptionStyle : sortOptionStyle}
                        onClick={() => selectSortBy(option)}
                    >
                        {option} {option === sortBy && <span style={checkmarkStyle}>✓</span>}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

// Status tag styles
const getStatusTagStyle = (status) => ({
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
    color: 
        status === "Completed" ? "#2E7D32" :
        status === "In Progress" ? "#7B1FA2" :
        status === "Pending" ? "#F57C00" :
        status === "Open" ? "#1565C0" :
        "#757575",
    backgroundColor: 
        status === "Completed" ? "#EAFAE7" :
        status === "In Progress" ? "#F6EFFF" :
        status === "Pending" ? "#FBFAE2" :
        status === "Open" ? "#E3F2FD" :
        "#F5F5F5",
});

// Container styles
const containerStyle = {
    padding: '40px',
    minHeight: '100vh',
    maxWidth: '1200px',
    margin: '0 auto',
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
};

const titleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0',
};

const addButtonStyle = {
    backgroundColor: '#274b93',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 4px rgba(39, 75, 147, 0.2)',
};

// Summary cards styles
const summaryGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
};

const summaryCardStyle = {
    borderRadius: '12px',
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const summaryLabelStyle = {
    margin: '0 0 8px 0',
    fontSize: '16px',
    color: '#1E1E1E',
    fontWeight: '400',
};

const summaryNumberStyle = {
    margin: '0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1E1E1E',
};

const bigIconStyle = {
    width: '24px',
    height: '24px',
};

const smallIconStyle = {
    width: '20px',
    height: '20px',
};

// Filter section styles
const filterSectionStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
};

const filterGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
};

const sortGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
};

const filterLabelStyle = {
    fontSize: '14px',
    fontWeight: '400',
    color: '#1E1E1E',
};

const filterButtonsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    width: '100%',
};

const filterButtonStyle = {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '8px 16px',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    fontWeight: '500',
    flexShrink: 0,
    flex: "0 0 auto",
};

const activeFilterButtonStyle = {
    ...filterButtonStyle,
    backgroundColor: '#274b93',
    color: 'white',
    border: '1px solid #274b93',
};

const sortButtonStyle = {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '8px 16px',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
};

// Grid and card styles
const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
};

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '20px',
};

const cardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: '12px',
};

const cardTitleStyle = {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1E1E1E',
};

const priceStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2E7D32',
};

const cardDetailsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
};

const detailRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
};

const detailTextStyle = {
    fontSize: '14px',
    color: '#1E1E1E',
    fontWeight: '400',
};

const viewDetailsButtonStyle = {
    backgroundColor: '#274b93',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
};

// Pagination styles
const paginationStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
};

const paginationButtonStyle = {
    width: '32px',
    height: '32px',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1E1E1E',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const activePaginationButtonStyle = {
    ...paginationButtonStyle,
    backgroundColor: '#274b93',
    color: 'white',
    fontWeight: '600',
};

const disabledPaginationButtonStyle = {
    ...paginationButtonStyle,
    cursor: 'not-allowed',
};

// Modal styles
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
};

const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '0',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
};

const modalHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e0e0e0',
};

const modalTitleStyle = {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#1E1E1E',
};

const closeButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    color: '#666',
    cursor: 'pointer',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const modalBodyStyle = {
    padding: '16px 0',
};

const sortOptionStyle = {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    color: '#1E1E1E',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
};

const activeSortOptionStyle = {
    ...sortOptionStyle,
    backgroundColor: '#EFF4FF',
    color: '#274b93',
    fontWeight: '600',
};

const checkmarkStyle = {
    color: '#274b93',
    fontWeight: 'bold',
};

const dropdownStyle = {
    position: "absolute",
    top: "42px",
    left: "0",
    background: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
    padding: "8px 0",
    zIndex: 200,
    minWidth: "160px",
    whiteSpace: "nowrap",
};

const dropdownItemStyle = {
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "14px",
};

const datePickerWrapperStyle = {
    padding: "10px 16px",   
};

const datePickerInputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    cursor: "pointer",
    fontSize: "14px",
};

export default ManageShift;
