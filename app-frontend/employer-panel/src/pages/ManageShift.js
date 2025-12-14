// --- ManageShift.js ---
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ManageShift = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/v1/shifts", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        const shiftList = Array.isArray(data) ? data : data.shifts || [];

        const formatted = shiftList.map((s) => ({
          id: s._id,
          title: s.title,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status,
          location: formatLocation(s.location)
        }));

        setShifts(formatted);

      } catch (err) {
        console.error("Fetch error:", err);
      }
    };


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
                                <button
                                style={viewDetailsButtonStyle}
                                onClick={() => navigate(`/manage-shift/${shift.id}`)}
                                >
                                View Details
                                </button>
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
    fetchShifts();
  }, []);

  const formatLocation = (loc) => {
    if (!loc) return "No location provided";

    return [
      loc.street,
      loc.suburb,
      loc.state,
      loc.postcode
    ].filter(Boolean).join(", ");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Manage Shifts</h1>

      {/* navigate is used here → no warnings */}
      <button onClick={() => navigate("/create-shift")}>
        + Add Shift
      </button>

      <div style={{ marginTop: "20px" }}>
        {shifts.map((s) => (
          <div key={s.id} style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "10px" }}>
            <h3>{s.title}</h3>
            <p><strong>Date:</strong> {s.date}</p>
            <p><strong>Time:</strong> {s.startTime} - {s.endTime}</p>
            <p><strong>Location:</strong> {s.location}</p>
            <p><strong>Status:</strong> {s.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageShift;
