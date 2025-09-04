import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ShiftStatus = Object.freeze({
    Completed: 'Completed',
    InProgress: 'In Progress',
    Pending: 'Pending',
});

const Filter = Object.freeze({
    All: 'All',
    Completed: 'Completed',
    InProgress: 'In Progress',
    Pending: 'Pending',
});

const Sort = Object.freeze({
    DateAsc: 'Date (Asc)',
    DateDesc: 'Date (Desc)',
});

const ManageShift = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFilter, setSelectedFilter] = useState(Filter.All);
    const [sortBy, setSortBy] = useState(Sort.DateAsc);
    const [showSortModal, setShowSortModal] = useState(false);

    const itemsPerPage = 8;

    // Filter shifts based on selected filter
    const filteredShifts = selectedFilter === Filter.All
        ? dummyShifts
        : dummyShifts.filter(shift => shift.status === selectedFilter);

    // Sort filtered shifts based on selected sort option
    const sortedShifts = [...filteredShifts].sort((a, b) => {
        const dateA = new Date(a.dateTime);
        const dateB = new Date(b.dateTime);

        if (sortBy === Sort.DateAsc) {
            return dateA - dateB;
        } else if (sortBy === Sort.DateDesc) {
            return dateB - dateA;
        }
        return 0;
    });

    const totalPages = Math.ceil(sortedShifts.length / itemsPerPage);
    const indexStart = (currentPage - 1) * itemsPerPage;
    const currentItems = sortedShifts.slice(indexStart, indexStart + itemsPerPage);

    // Calculate summary statistics
    const totalShifts = dummyShifts.length;
    const completedShifts = dummyShifts.filter(shift => shift.status === ShiftStatus.Completed).length;
    const inProgressShifts = dummyShifts.filter(shift => shift.status === ShiftStatus.InProgress).length;
    const pendingShifts = dummyShifts.filter(shift => shift.status === ShiftStatus.Pending).length;

    const goPrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };
    const goNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };
    const goToPage = (page) => {
        setCurrentPage(page);
    };

    const getPaginationNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) {
                    pages.push(i);
                }
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const selectSortBy = (sortOption) => {
        setSortBy(sortOption);
        setShowSortModal(false);
    };

    // Format date as MMM DD, YYYY
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Format time range as HH:MM - HH:MM
    const formatTime = (timeString) => {
        const startTime = timeString;
        const endTime = timeString.replace(/(\d+):(\d+)/, (match, hour, minute) => {
            const newHour = parseInt(hour) + 4;
            return `${newHour.toString().padStart(2, '0')}:${minute}`;
        });
        return `${startTime} - ${endTime}`;
    };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <h1 style={titleStyle}>Manage Shifts</h1>
                <button style={addButtonStyle} onClick={() => navigate('/create-shift')}>
                    <img src={"/ic-add.svg"} alt="Add" style={bigIconStyle} />
                    Add New Shift
                </button>
            </div>

            {/* Summary Cards */}
            <div style={summaryGridStyle}>
                <div style={{ ...summaryCardStyle, backgroundColor: "#EFF4FF" }}>
                    <div>
                        <p style={summaryLabelStyle}>Total shifts</p>
                        <p style={summaryNumberStyle}>{totalShifts}</p>
                    </div>
                    <div>
                        <img src={"/ic-task.svg"} alt="Check" style={bigIconStyle} />
                    </div>
                </div>

                <div style={{ ...summaryCardStyle, backgroundColor: "#EAFAE7" }}>
                    <div>
                        <p style={summaryLabelStyle}>Completed shifts</p>
                        <p style={summaryNumberStyle}>{completedShifts}</p>
                    </div>
                    <div>
                        <img src={"/ic-completed.svg"} alt="Completed" style={bigIconStyle} />
                    </div>
                </div>

                <div style={{ ...summaryCardStyle, backgroundColor: "#F6EFFF" }}>
                    <div>
                        <p style={summaryLabelStyle}>In-Progress shifts</p>
                        <p style={summaryNumberStyle}>{inProgressShifts}</p>
                    </div>
                    <div>
                        <img src={"/ic-lightning.svg"} alt="In Progress" style={bigIconStyle} />
                    </div>
                </div>

                <div style={{ ...summaryCardStyle, backgroundColor: "#FBFAE2" }}>
                    <div>
                        <p style={summaryLabelStyle}>Pending shifts</p>
                        <p style={summaryNumberStyle}>{pendingShifts}</p>
                    </div>
                    <div>
                        <img src={"/ic-hourglass.svg"} alt="Pending" style={bigIconStyle} />
                    </div>
                </div>
            </div>

            {/* Filter and Sort Section */}
            <div style={filterSectionStyle}>
                <div style={filterGroupStyle}>
                    <img src={"/ic-filter.svg"} alt="Filter" style={smallIconStyle} />
                    <span style={filterLabelStyle}>Filter by:</span>
                    <div style={filterButtonsStyle}>
                        {Object.values(Filter).map(filter => (
                            <button
                                key={filter}
                                style={selectedFilter === filter ? activeFilterButtonStyle : filterButtonStyle}
                                onClick={() => setSelectedFilter(filter)}
                            >
                                {filter}
                            </button>
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

            {/* Shift Cards Grid */}
            <div style={gridStyle}>
                {currentItems.map(({ id, title, dateTime, location, status, price }) => (
                    <div key={id} style={cardStyle}>
                        <div>
                            <h3 style={cardTitleStyle}>{title}</h3>
                            <div style={cardHeaderStyle}>
                                <div style={getStatusTagStyle(status)}>
                                    {status}
                                </div>
                                <div style={priceStyle}>${price}</div>
                            </div>
                        </div>

                        <div style={cardDetailsStyle}>
                            <div style={detailRowStyle}>
                                <img src={"/ic-location.svg"} alt="Location" style={smallIconStyle} />
                                <span style={detailTextStyle}>{location}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={detailRowStyle}>
                                    <img src={"/ic-calendar.svg"} alt="Date" style={smallIconStyle} />
                                    <span style={detailTextStyle}>{formatDate(dateTime.split(' ')[0])}</span>
                                </div>
                                <div style={detailRowStyle}>
                                    <img src={"/ic-clock.svg"} alt="Time" style={smallIconStyle} />
                                    <span style={detailTextStyle}>{formatTime(dateTime.split(' ')[1])}</span>
                                </div>
                            </div>
                            <button style={viewDetailsButtonStyle}>
                                View Details
                            </button>
                        </div>


                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div style={paginationStyle}>
                <button
                    onClick={goPrevPage}
                    disabled={currentPage === 1}
                    style={currentPage === 1 ? disabledPaginationButtonStyle : paginationButtonStyle}
                >
                    <img src={"/ic-arrow-back.svg"} alt="Previous" style={smallIconStyle} />
                </button>

                {getPaginationNumbers().map((page, index) => (
                    <button
                        key={index}
                        onClick={() => typeof page === 'number' ? goToPage(page) : null}
                        style={page === currentPage ? activePaginationButtonStyle : paginationButtonStyle}
                        disabled={page === '...'}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={goNextPage}
                    disabled={currentPage === totalPages}
                    style={currentPage === totalPages ? disabledPaginationButtonStyle : paginationButtonStyle}
                >
                    <img src={"/ic-arrow-forward.svg"} alt="Next" style={smallIconStyle} />
                </button>
            </div>

            {/* Sort Modal */}
            {showSortModal && (
                <div style={modalOverlayStyle} onClick={() => setShowSortModal(false)}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={modalHeaderStyle}>
                            <h3 style={modalTitleStyle}>Sort by</h3>
                            <button style={closeButtonStyle} onClick={() => setShowSortModal(false)}>×</button>
                        </div>
                        <div style={modalBodyStyle}>
                            {Object.values(Sort).map((sortOption) => (
                                <button
                                    key={sortOption}
                                    style={sortOption === sortBy ? activeSortOptionStyle : sortOptionStyle}
                                    onClick={() => selectSortBy(sortOption)}
                                >
                                    {sortOption}
                                    {sortOption === sortBy && <span style={checkmarkStyle}>✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageShift;

// Generate dummy data with more realistic information
const generateDummyShifts = (count) => {
    const titles = ['Night Patrol', 'Gate Duty', 'Event Watch', 'Lobby Control'];
    const locations = ['Melbourne CBD', 'Docklands', 'Southbank', 'St Kilda'];
    const statuses = [ShiftStatus.Pending, ShiftStatus.InProgress, ShiftStatus.Completed];
    const prices = [100, 120, 150, 180];

    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        title: `Security Guard - ${titles[i % titles.length]}`,
        dateTime: `2025-08-${(i % 30) + 1} ${(8 + (i % 12))}:00`,
        location: locations[i % locations.length],
        status: statuses[i % statuses.length],
        price: prices[i % prices.length],
    }));
};

const dummyShifts = generateDummyShifts(100);

// Status tag styles
const getStatusTagStyle = (status) => ({
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
    color: status === ShiftStatus.Completed ? '#2E7D32' :
        status === ShiftStatus.InProgress ? '#7B1FA2' : '#F57C00',
    backgroundColor: status === ShiftStatus.Completed ? '#EAFAE7' :
        status === ShiftStatus.InProgress ? '#F6EFFF' : '#FBFAE2',
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
