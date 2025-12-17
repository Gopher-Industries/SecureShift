import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../lib/http';

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
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    dateTime: s.date && s.startTime ? `${s.date} ${s.startTime}` : s.date || "",
    locationLabel: s.location 
        ? [s.location.street, s.location.suburb, s.location.state].filter(Boolean).join(', ')
        : "--",
    location: s.location || {},
    status: statusDisplayMap[s.status?.toLowerCase()] || "Open",
    payRate: s.payRate ?? s.price ?? "--",
    urgency: s.urgency || 'normal',
    field: s.field || '',
    applicantCount: s.applicantCount ?? (Array.isArray(s.applicants) ? s.applicants.length : 0),
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
    const [selectedShift, setSelectedShift] = useState(null);
    const [detailForm, setDetailForm] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [optimisticSnapshot, setOptimisticSnapshot] = useState(null);
    const itemsPerPage = 8;

    useEffect(() => {
    const fetchShifts = async () => {
        try {
            const { data } = await http.get('/shifts');
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
            setShifts(apiShifts.map(normalizeShift));
        } catch (err) {
            const message = err?.response?.data?.message || 'Error fetching shifts.';
            setError(message);
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

    const formatTimeRange = (start, end) => {
        if (!start || !end) return "--";
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return "--";
        return `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')} - ${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
    };

    const openShiftModal = (shift) => {
        setSelectedShift(shift);
        setDetailForm({
            title: shift.title || '',
            date: shift.date ? shift.date.substring(0, 10) : '',
            startTime: shift.startTime || '',
            endTime: shift.endTime || '',
            payRate: shift.payRate === "--" ? '' : shift.payRate ?? '',
            street: shift.location?.street || '',
            suburb: shift.location?.suburb || '',
            state: shift.location?.state || '',
            postcode: shift.location?.postcode || '',
            field: shift.field || '',
            urgency: shift.urgency || 'normal',
        });
        setIsEditing(false);
        setFeedback('');
    };

    const closeShiftModal = () => {
        setSelectedShift(null);
        setDetailForm(null);
        setIsEditing(false);
        setSaving(false);
        setFeedback('');
    };

    const handleDetailChange = (e) => {
        const { name, value } = e.target;
        setDetailForm((prev) => ({ ...prev, [name]: value }));
    };

    const validateDetailForm = () => {
        const errs = {};
        if (!detailForm.title?.trim()) errs.title = 'Title required';
        if (!detailForm.date?.trim()) errs.date = 'Date required';
        if (!detailForm.startTime?.trim()) errs.startTime = 'Start time required';
        if (!detailForm.endTime?.trim()) errs.endTime = 'End time required';
        if (detailForm.payRate !== '' && Number(detailForm.payRate) < 0) errs.payRate = 'Pay rate must be positive';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSaveShift = async () => {
        if (!selectedShift || !detailForm) return;
        if (!validateDetailForm()) return;
        setSaving(true);
        setFeedback('');
        try {
            const cleanedLocation = {
                street: detailForm.street?.trim() || undefined,
                suburb: detailForm.suburb?.trim() || undefined,
                state: detailForm.state?.trim() || undefined,
                postcode: detailForm.postcode?.trim() || undefined,
            };
            const hasLocation = Object.values(cleanedLocation).some(Boolean);
            const payload = {
                title: detailForm.title,
                date: detailForm.date,
                startTime: detailForm.startTime,
                endTime: detailForm.endTime,
                payRate: detailForm.payRate === '' ? undefined : Number(detailForm.payRate),
                field: detailForm.field,
                urgency: detailForm.urgency,
                ...(hasLocation ? { location: cleanedLocation } : {}),
            };
            // optimistic update snapshot
            setOptimisticSnapshot({ shifts, selectedShift });
            const optimistic = { ...selectedShift, ...payload };
            setShifts((prev) => prev.map((s) => s.id === selectedShift.id ? { ...s, ...optimistic } : s));
            setFeedback('Saving...');

            const { data } = await http.patch(`/shifts/${selectedShift.id}`, payload);
            const updated = normalizeShift(data.shift || { ...selectedShift, ...payload });
            setShifts((prev) => prev.map((s) => s.id === updated.id ? { ...s, ...updated } : s));
            setSelectedShift(updated);
            setDetailForm({
                title: updated.title || '',
                date: updated.date ? updated.date.substring(0, 10) : '',
                startTime: updated.startTime || '',
                endTime: updated.endTime || '',
                payRate: updated.payRate === "--" ? '' : updated.payRate ?? '',
                street: updated.location?.street || '',
                suburb: updated.location?.suburb || '',
                state: updated.location?.state || '',
                postcode: updated.location?.postcode || '',
                field: updated.field || '',
                urgency: updated.urgency || 'normal',
            });
            setIsEditing(false);
            setFeedback('Saved successfully');
        } catch (err) {
            const message = err?.response?.data?.message || 'Failed to update shift';
            setFeedback(message);
            if (optimisticSnapshot) {
                setShifts(optimisticSnapshot.shifts);
                setSelectedShift(optimisticSnapshot.selectedShift);
            }
        } finally {
            setSaving(false);
        }
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
                                    <div style={priceStyle}>{shift.payRate !== "--" ? `$${shift.payRate}` : '--'}</div>
                                </div>
                            </div>
                            <div style={cardDetailsStyle}>
                                <div style={detailRowStyle}>
                                    <img src={"/ic-location.svg"} alt="Location" style={smallIconStyle} />
                                    <span style={detailTextStyle}>{shift.locationLabel}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                                    <div style={detailRowStyle}>
                                        <img src={"/ic-calendar.svg"} alt="Date" style={smallIconStyle} />
                                        <span style={detailTextStyle}>{formatDate(datePart)}</span>
                                    </div>
                                    <div style={detailRowStyle}>
                                        <img src={"/ic-clock.svg"} alt="Time" style={smallIconStyle} />
                                        <span style={detailTextStyle}>{formatTimeRange(shift.startTime, shift.endTime)}</span>
                                    </div>
                                </div>
                                <button style={viewDetailsButtonStyle} onClick={() => openShiftModal(shift)}>View Details</button>
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
            {selectedShift && detailForm && (
                <div style={detailModalOverlay} onClick={closeShiftModal}>
                    <div style={detailModalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={detailModalHeader}>
                            <div>
                                <p style={detailModalOverline}>Secure Shift</p>
                                <h2 style={detailModalTitle}>{isEditing ? 'Edit Shift' : 'Shift Details'}</h2>
                                <p style={detailModalSubtitle}>Review and update shift fields. All fields are required.</p>
                            </div>
                            <button style={modalCloseButton} onClick={closeShiftModal}>×</button>
                        </div>

                        {feedback && <div style={feedbackStyle}>{feedback}</div>}

                        <div style={detailGrid}>
                            <div style={detailField}>
                                <label style={detailLabel}>Job Title</label>
                                <input
                                    name="title"
                                    value={detailForm.title}
                                    onChange={handleDetailChange}
                                    style={inputStyle}
                                    disabled={!isEditing}
                                    placeholder="Job title"
                                />
                                {formErrors.title && <span style={inlineError}>{formErrors.title}</span>}
                            </div>
                            <div style={detailField}>
                                <label style={detailLabel}>Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={detailForm.date}
                                    onChange={handleDetailChange}
                                    style={inputStyle}
                                    disabled={!isEditing}
                                />
                                {formErrors.date && <span style={inlineError}>{formErrors.date}</span>}
                            </div>
                            <div style={detailField}>
                                <label style={detailLabel}>Start Time</label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={detailForm.startTime}
                                    onChange={handleDetailChange}
                                    style={inputStyle}
                                    disabled={!isEditing}
                                />
                                {formErrors.startTime && <span style={inlineError}>{formErrors.startTime}</span>}
                            </div>
                            <div style={detailField}>
                                <label style={detailLabel}>End Time</label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={detailForm.endTime}
                                    onChange={handleDetailChange}
                                    style={inputStyle}
                                    disabled={!isEditing}
                                />
                                {formErrors.endTime && <span style={inlineError}>{formErrors.endTime}</span>}
                            </div>
                            <div style={detailField}>
                                <label style={detailLabel}>Location</label>
                                <input
                                    name="street"
                                    value={detailForm.street}
                                    onChange={handleDetailChange}
                                    style={inputStyle}
                                    disabled={!isEditing}
                                    placeholder="Street"
                                />
                            </div>
                            <div style={detailField}>
                                <label style={detailLabel}>Pay Rate</label>
                                <input
                                    type="number"
                                    name="payRate"
                                    value={detailForm.payRate}
                                    onChange={handleDetailChange}
                                    style={inputStyle}
                                    disabled={!isEditing}
                                    placeholder="0.00"
                                />
                                {formErrors.payRate && <span style={inlineError}>{formErrors.payRate}</span>}
                            </div>
                            <div style={detailField}>
                                <label style={detailLabel}>Field</label>
                                <input
                                    name="field"
                                    value={detailForm.field}
                                    onChange={handleDetailChange}
                                    style={inputStyle}
                                    disabled={!isEditing}
                                    placeholder="e.g. Security"
                                />
                            </div>
                            <div style={detailField}>
                                <label style={detailLabel}>Urgency</label>
                                <select
                                    name="urgency"
                                    value={detailForm.urgency}
                                    onChange={handleDetailChange}
                                    style={inputStyle}
                                    disabled={!isEditing}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="priority">Priority</option>
                                    <option value="last-minute">Last-minute</option>
                                </select>
                            </div>
                        </div>

                        <div style={detailActions}>
                            {!isEditing ? (
                                <button style={primaryButton} onClick={() => setIsEditing(true)}>Edit Shift</button>
                            ) : (
                                <>
                                    <button style={primaryButton} onClick={handleSaveShift} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save changes'}
                                    </button>
                                    <button style={secondaryButton} onClick={() => setIsEditing(false)}>Cancel edit</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
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

// Detail modal styles (aligned to create shift design)
const detailModalOverlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '20px',
};

const detailModalContent = {
    background: '#fff',
    borderRadius: '14px',
    width: 'min(960px, 100%)',
    padding: '28px 32px 32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    fontFamily: 'Poppins, sans-serif',
};

const detailModalHeader = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '12px',
};

const detailModalOverline = {
    margin: 0,
    color: '#566074',
    fontSize: '12px',
    letterSpacing: '0.4px',
    fontWeight: 600,
};

const detailModalTitle = {
    margin: '4px 0',
    fontSize: '22px',
    fontWeight: 700,
    color: '#1d1f2e',
};

const detailModalSubtitle = {
    margin: 0,
    color: '#6b7280',
    fontSize: '14px',
};

const modalCloseButton = {
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    width: '36px',
    height: '36px',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#374151',
};

const detailGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginTop: '16px',
};

const detailField = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
};

const detailLabel = {
    fontSize: '13px',
    color: '#374151',
    fontWeight: 600,
};

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: '#f3f4f6',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
};

const detailActions = {
    marginTop: '20px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
};

const primaryButton = {
    backgroundColor: '#274b93',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
};

const secondaryButton = {
    backgroundColor: 'white',
    color: '#d14343',
    border: '1px solid #d14343',
    borderRadius: '20px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
};

const feedbackStyle = {
    marginTop: '8px',
    marginBottom: '8px',
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    fontSize: '13px',
};

const inlineError = {
    color: '#d14343',
    fontSize: '12px',
    marginTop: '2px',
};