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

// Normalize shift data from backend
const normalizeShift = (s) => {
    let finalDate = null;

    if (s.date) {
        const dateOnly = s.date.split("T")[0];     // "2025-01-10"
        if (s.startTime) {
            finalDate = new Date(`${dateOnly}T${s.startTime}:00`);
        } else {
            finalDate = new Date(s.date);
        }
    }
    return {
        // Compose dateTime string for sorting
        id: s._id,
        title: s.title || "--",
        dateTime: finalDate,      
        location: s.location 
            ? [s.location.street, s.location.suburb, s.location.state].filter(Boolean).join(", ") 
            : "--",
        status: statusDisplayMap[s.status?.toLowerCase()] || "Open",
        price: s.price || "--"
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
    </div>
  );
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