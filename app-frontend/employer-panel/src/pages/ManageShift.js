import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Map backend status to filter display
const statusDisplayMap = {
    completed: "Completed",
    inprogress: "In Progress",
    pending: "Pending",
    open: "Open",
};

const Filter = Object.freeze({
    All: 'All',
    Completed: 'Completed',
    InProgress: 'In Progress',
    Pending: 'Pending',
    Open: 'Open',
});

const Sort = Object.freeze({
    DateAsc: 'Date (Asc)',
    DateDesc: 'Date (Desc)',
});

// Normalize shift data from backend
const normalizeShift = (s) => ({
    id: s._id,
    title: s.title || "--",
    // Compose dateTime string for sorting
    dateTime: s.date && s.startTime ? `${s.date} ${s.startTime}` : s.date || "",
    location: s.location 
        ? `${s.location.street}, ${s.location.suburb}, ${s.location.state}` 
        : "--",
    status: statusDisplayMap[s.status?.toLowerCase()] || "Open",
    price: s.payRate != null ? `${s.payRate} p/h` : "--"
});

const ManageShift = () => {
    const navigate = useNavigate();
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFilter, setSelectedFilter] = useState(Filter.All);
    const [sortBy, setSortBy] = useState(Sort.DateAsc);
    const [showSortModal, setShowSortModal] = useState(false);
    const itemsPerPage = 8;

    useEffect(() => {
    const fetchShifts = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("No token found. Please log in.");
                setLoading(false);
                return;
            }
            const res = await fetch("http://localhost:5000/api/v1/shifts", {
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
            console.log("Raw API response:", data); // Debug
            let apiShifts;
            if (Array.isArray(data)) {
                apiShifts = data;
            } else if (Array.isArray(data.shifts)) {
                apiShifts = data.shifts;
            } else if (data.items && Array.isArray(data.items)) {
                apiShifts = data.items;
            } else {
                apiShifts = [];
            }
            console.log("Normalized shift array:", apiShifts); // Debug
            setShifts(apiShifts.map(normalizeShift));
        } catch (err) {
            setError("Error fetching shifts.");
            console.error(err); // Debug
        } finally {
            setLoading(false);
        }
    };
    fetchShifts();
}, []);


    // Map frontend filter values to backend status
    const filterToBackendStatus = {
        Completed: "Completed",
        InProgress: "In Progress",
        Pending: "Pending",
        Open: "Open",
    };

    const filteredShifts = selectedFilter === Filter.All
        ? shifts
        : shifts.filter(shift => shift.status === filterToBackendStatus[selectedFilter]);

    const sortedShifts = [...filteredShifts].sort((a, b) => {
        const dateA = new Date(a?.dateTime || 0);
        const dateB = new Date(b?.dateTime || 0);
        return sortBy === Sort.DateAsc ? dateA - dateB : dateB - dateA;
    });

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

    const formatDate = (dateString) => {
        if (!dateString) return "--";
        const date = new Date(dateString);
        if (isNaN(date)) return "--";
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateTimeString) => {
        if (!dateTimeString) return "--";
        const timePart = dateTimeString.split(' ')[1] || dateTimeString;
        const [hour, minute] = timePart.split(":").map(Number);
        if (isNaN(hour) || isNaN(minute)) return "--";
        const endHour = (hour + 4) % 24;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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
            />
            {loading && <p>Loading shifts...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && currentItems.length === 0 && <p>No shifts found.</p>}
            <div style={gridStyle}>
                {currentItems.map((shift) => {
                    const [datePart, timePart] = shift.dateTime?.split(' ') || [null, null];
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
                                        <span style={detailTextStyle}>{formatDate(datePart)}</span>
                                    </div>
                                    <div style={detailRowStyle}>
                                        <img src={"/ic-clock.svg"} alt="Time" style={smallIconStyle} />
                                        <span style={detailTextStyle}>{formatTime(shift.dateTime)}</span>
                                    </div>
                                </div>
                                <button style={viewDetailsButtonStyle}>View Details</button>
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

const FilterSortSection = ({ Filter, selectedFilter, setSelectedFilter, sortBy, setShowSortModal }) => (
    <div style={filterSectionStyle}>
        <div style={filterGroupStyle}>
            <img src={"/ic-filter.svg"} alt="Filter" style={smallIconStyle} />
            <span style={filterLabelStyle}>Filter by:</span>
            <div style={filterButtonsStyle}>
                {Object.values(Filter).map(f => (
                    <button
                        key={f}
                        style={selectedFilter === f ? activeFilterButtonStyle : filterButtonStyle}
                        onClick={() => setSelectedFilter(f)}
                    >{f}</button>
                ))}
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
        <button onClick={goNextPage} disabled={currentPage === totalPages} style={currentPage === totalPages ? disabledPaginationButtonStyle : paginationButtonStyle}>
            <img src={"/ic-arrow-forward.svg"} alt="Next" style={smallIconStyle} />
        </button>
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

export default ManageShift;




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
    gap: '8px',
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