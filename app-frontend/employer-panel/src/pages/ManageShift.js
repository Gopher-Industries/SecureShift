import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../lib/http';

const statusDisplayMap = {
    completed: "Completed",
    assigned: "In Progress",
    applied: "Pending",
    open: "Open",
};

const Filter = Object.freeze({
    All: 'All',
    Completed: 'Completed',
    InProgress: 'In Progress',
    Pending: 'Pending',
    Open: 'Open',
});

const editableStatuses = [Filter.Open, Filter.Pending, Filter.InProgress, Filter.Completed];

const Sort = Object.freeze({
    DateAsc: 'Date (Asc)',
    DateDesc: 'Date (Desc)',
});

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
    applicants: Array.isArray(s.applicants) ? s.applicants : [],
    assignedGuard: s.assignedGuard || null,
});

const TABS = Object.freeze({ DETAILS: 'details', APPLICANTS: 'applicants' });

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
    const [activeTab, setActiveTab] = useState(TABS.DETAILS);
    const [applicantAction, setApplicantAction] = useState({});

    // ─── Chat state ───────────────────────────────────────────────────────────
    const [chatShift, setChatShift] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const chatEndRef = useRef(null);

    const itemsPerPage = 9;

    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const { data } = await http.get('/shifts');
                let apiShifts;
                if (Array.isArray(data)) apiShifts = data;
                else if (Array.isArray(data.shifts)) apiShifts = data.shifts;
                else if (data.items && Array.isArray(data.items)) apiShifts = data.items;
                else apiShifts = [];
                setShifts(apiShifts.map(normalizeShift));
            } catch (err) {
                setError(err?.response?.data?.message || 'Error fetching shifts.');
            } finally {
                setLoading(false);
            }
        };
        fetchShifts();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── Chat handlers ────────────────────────────────────────────────────────

    const openChatModal = async (shift) => {
        setChatShift(shift);
        setMessages([]);
        setNewMessage('');
        setLoadingMessages(true);
        try {
            const guardId = shift.assignedGuard?._id || shift.assignedGuard;
            const { data } = await http.get(`/messages/conversation/${guardId}`);
            setMessages(data.data?.conversation?.messages || []);
        } catch (err) {
            console.error('Failed to load messages', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const closeChatModal = () => {
        setChatShift(null);
        setMessages([]);
        setNewMessage('');
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !chatShift || sendingMsg) return;
        setSendingMsg(true);
        try {
            const guardId = chatShift.assignedGuard?._id || chatShift.assignedGuard;
            const { data } = await http.post(`/messages`, {
                receiverId: guardId,
                content: newMessage,
            });
            setMessages((prev) => [...prev, {
                _id: data.data?.messageId,
                content: data.data?.content || newMessage,
                sender: { email: localStorage.getItem('userEmail') },
                isOwn: true,
                timestamp: data.data?.timestamp || new Date().toISOString(),
            }]);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setSendingMsg(false);
        }
    };

    const handleChatKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    // ─── Filter / sort / pagination ───────────────────────────────────────────

    const filteredShifts = selectedFilter === Filter.All
        ? shifts
        : shifts.filter(shift => shift.status === selectedFilter);

    const sortedShifts = [...filteredShifts].sort((a, b) => {
        const keyA = (a.date || '') + ' ' + (a.startTime || '');
        const keyB = (b.date || '') + ' ' + (b.startTime || '');
        if (keyA !== keyB) return sortBy === Sort.DateAsc ? (keyA < keyB ? -1 : 1) : (keyA > keyB ? -1 : 1);
        const endA = a.endTime || '';
        const endB = b.endTime || '';
        if (endA === endB) return 0;
        return sortBy === Sort.DateAsc ? (endA < endB ? -1 : 1) : (endA > endB ? -1 : 1);
    });

    const totalPages = Math.ceil(sortedShifts.length / itemsPerPage);

    useEffect(() => {
        if (totalPages === 0) { if (currentPage !== 1) setCurrentPage(1); return; }
        if (currentPage > totalPages) setCurrentPage(totalPages);
        else if (currentPage < 1) setCurrentPage(1);
    }, [totalPages, currentPage]);

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

    const selectSortBy = (sortOption) => { setSortBy(sortOption); setShowSortModal(false); };

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

    // ─── Detail modal handlers ────────────────────────────────────────────────

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
            status: shift.status || Filter.Open,
        });
        setIsEditing(false);
        setFeedback('');
        setActiveTab(TABS.DETAILS);
        setApplicantAction({});
    };

    const closeShiftModal = () => {
        setSelectedShift(null);
        setDetailForm(null);
        setIsEditing(false);
        setSaving(false);
        setFeedback('');
        setApplicantAction({});
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
        if (!editableStatuses.includes(detailForm.status)) errs.status = 'Please select a valid status';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSaveShift = async () => {
        if (!selectedShift || !detailForm) return;
        if (selectedShift.status === Filter.Completed) { setFeedback('Completed shifts cannot be edited.'); return; }
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
                ...(detailForm.field?.trim() ? { field: detailForm.field.trim() } : {}),
                urgency: detailForm.urgency,
                ...(hasLocation ? { location: cleanedLocation } : {}),
            };
            setOptimisticSnapshot({ shifts, selectedShift });
            const optimistic = { ...selectedShift, ...payload, status: detailForm.status };
            setShifts((prev) => prev.map((s) => s.id === selectedShift.id ? { ...s, ...optimistic } : s));
            const { data } = await http.patch(`/shifts/${selectedShift.id}`, payload);
            const updated = normalizeShift(data.shift || { ...selectedShift, ...payload });
            const updatedWithUiStatus = { ...updated, status: detailForm.status };
            setShifts((prev) => prev.map((s) => s.id === updatedWithUiStatus.id ? { ...s, ...updatedWithUiStatus } : s));
            setSelectedShift(updatedWithUiStatus);
            setDetailForm({
                title: updatedWithUiStatus.title || '',
                date: updatedWithUiStatus.date ? updatedWithUiStatus.date.substring(0, 10) : '',
                startTime: updatedWithUiStatus.startTime || '',
                endTime: updatedWithUiStatus.endTime || '',
                payRate: updatedWithUiStatus.payRate === "--" ? '' : updatedWithUiStatus.payRate ?? '',
                street: updatedWithUiStatus.location?.street || '',
                suburb: updatedWithUiStatus.location?.suburb || '',
                state: updatedWithUiStatus.location?.state || '',
                postcode: updatedWithUiStatus.location?.postcode || '',
                field: updatedWithUiStatus.field || '',
                urgency: updatedWithUiStatus.urgency || 'normal',
                status: updatedWithUiStatus.status || Filter.Open,
            });
            setIsEditing(false);
            setFeedback('Saved successfully');
        } catch (err) {
            const message = err?.response?.data?.message || 'Failed to update shift';
            setFeedback(message);
            if (optimisticSnapshot) { setShifts(optimisticSnapshot.shifts); setSelectedShift(optimisticSnapshot.selectedShift); }
        } finally {
            setSaving(false);
        }
    };

    // ─── Approval workflow ────────────────────────────────────────────────────

    const handleApproveGuard = async (guardId) => {
        if (!selectedShift) return;
        setApplicantAction((prev) => ({ ...prev, [guardId]: 'approving' }));
        try {
            const { data } = await http.put(`/shifts/${selectedShift.id}/approve`, { guardId });
            const updatedShift = normalizeShift(data.shift || { ...selectedShift, status: 'assigned', assignedGuard: guardId });
            setShifts((prev) => prev.map((s) => s.id === updatedShift.id ? updatedShift : s));
            setSelectedShift(updatedShift);
            setApplicantAction((prev) => ({ ...prev, [guardId]: 'approved' }));
            setFeedback('Guard approved. Shift is now In Progress.');
        } catch (err) {
            setFeedback(err?.response?.data?.message || 'Failed to approve guard');
            setApplicantAction((prev) => ({ ...prev, [guardId]: undefined }));
        }
    };

    const handleCompleteShift = async () => {
        if (!selectedShift) return;
        setSaving(true);
        setFeedback('');
        try {
            const { data } = await http.put(`/shifts/${selectedShift.id}/complete`);
            const updatedShift = normalizeShift(data.shift || { ...selectedShift, status: 'completed' });
            setShifts((prev) => prev.map((s) => s.id === updatedShift.id ? updatedShift : s));
            setSelectedShift(updatedShift);
            setFeedback('Shift marked as Completed.');
        } catch (err) {
            setFeedback(err?.response?.data?.message || 'Failed to complete shift');
        } finally {
            setSaving(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

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
                onFilterChange={(filter) => { setSelectedFilter(filter); setCurrentPage(1); }}
                sortBy={sortBy}
                setShowSortModal={setShowSortModal}
            />

            {loading && <p>Loading shifts...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && currentItems.length === 0 && <p>No shifts found.</p>}

            <div style={gridStyle}>
                {currentItems.map((shift) => {
                    const [datePart] = shift.dateTime?.split(' ') || [null];
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
                                {shift.applicantCount > 0 && (
                                    <div style={applicantBadgeStyle}>
                                        <span style={applicantDotStyle} />
                                        {shift.applicantCount} applicant{shift.applicantCount !== 1 ? 's' : ''} pending review
                                    </div>
                                )}
                                {/* View Details + Chat icon row */}
                                <div style={cardActionsRowStyle}>
                                    <button style={viewDetailsButtonStyle} onClick={() => openShiftModal(shift)}>View Details</button>
                                    {shift.status === 'In Progress' && (
                                        <button style={chatIconButtonStyle} onClick={() => openChatModal(shift)} title="Open shift chat">
                                            <ChatIcon />
                                        </button>
                                    )}
                                </div>
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
                <SortModal Sort={Sort} sortBy={sortBy} selectSortBy={selectSortBy} setShowSortModal={setShowSortModal} />
            )}

            {/* ─── Shift Detail Modal ─── */}
            {selectedShift && detailForm && (
                <div style={detailModalOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) closeShiftModal(); }}>
                    <div style={detailModalContent} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <div style={detailModalHeader}>
                            <div>
                                <p style={detailModalOverline}>Secure Shift</p>
                                <h2 style={detailModalTitle}>
                                    {activeTab === TABS.DETAILS ? (isEditing ? 'Edit Shift' : 'Shift Details') : 'Applicants'}
                                </h2>
                                <p style={detailModalSubtitle}>
                                    {activeTab === TABS.DETAILS ? 'Review and update shift fields.' : `${selectedShift.applicants?.length ?? 0} applicant(s) for this shift.`}
                                </p>
                            </div>
                            <button style={modalCloseButton} onClick={closeShiftModal}>×</button>
                        </div>

                        <div style={tabBarStyle}>
                            <button style={activeTab === TABS.DETAILS ? activeTabStyle : tabStyle} onClick={() => setActiveTab(TABS.DETAILS)}>Details</button>
                            <button style={activeTab === TABS.APPLICANTS ? activeTabStyle : tabStyle} onClick={() => setActiveTab(TABS.APPLICANTS)}>
                                Applicants
                                {(selectedShift.applicants?.length ?? 0) > 0 && (
                                    <span style={tabBadgeStyle}>{selectedShift.applicants.length}</span>
                                )}
                            </button>
                        </div>

                        {feedback && (
                            <div style={feedback === 'Saved successfully' || feedback.includes('approved') || feedback.includes('Completed') ? feedbackSuccessStyle : feedbackErrorStyle}>
                                {feedback}
                            </div>
                        )}

                        {activeTab === TABS.DETAILS && (
                            <>
                                <div style={detailGrid}>
                                    <div style={detailField}>
                                        <label style={detailLabel}>Job Title</label>
                                        <input name="title" value={detailForm.title} onChange={handleDetailChange} style={inputStyle} disabled={!isEditing} placeholder="Job title" />
                                        {formErrors.title && <span style={inlineError}>{formErrors.title}</span>}
                                    </div>
                                    <div style={detailField}>
                                        <label style={detailLabel}>Date</label>
                                        <input type="date" name="date" value={detailForm.date} onChange={handleDetailChange} style={inputStyle} disabled={!isEditing} />
                                        {formErrors.date && <span style={inlineError}>{formErrors.date}</span>}
                                    </div>
                                    <div style={detailField}>
                                        <label style={detailLabel}>Start Time</label>
                                        <input type="time" name="startTime" value={detailForm.startTime} onChange={handleDetailChange} style={inputStyle} disabled={!isEditing} />
                                        {formErrors.startTime && <span style={inlineError}>{formErrors.startTime}</span>}
                                    </div>
                                    <div style={detailField}>
                                        <label style={detailLabel}>End Time</label>
                                        <input type="time" name="endTime" value={detailForm.endTime} onChange={handleDetailChange} style={inputStyle} disabled={!isEditing} />
                                        {formErrors.endTime && <span style={inlineError}>{formErrors.endTime}</span>}
                                    </div>
                                    <div style={detailField}>
                                        <label style={detailLabel}>Location</label>
                                        <input name="street" value={detailForm.street} onChange={handleDetailChange} style={inputStyle} disabled={!isEditing} placeholder="Street" />
                                    </div>
                                    <div style={detailField}>
                                        <label style={detailLabel}>Pay Rate</label>
                                        <input type="number" name="payRate" value={detailForm.payRate} onChange={handleDetailChange} style={inputStyle} disabled={!isEditing} placeholder="0.00" />
                                        {formErrors.payRate && <span style={inlineError}>{formErrors.payRate}</span>}
                                    </div>
                                    <div style={detailField}>
                                        <label style={detailLabel}>Field</label>
                                        <input name="field" value={detailForm.field} onChange={handleDetailChange} style={inputStyle} disabled={!isEditing} placeholder="e.g. Security" />
                                    </div>
                                    <div style={detailField}>
                                        <label style={detailLabel}>Urgency</label>
                                        <select name="urgency" value={detailForm.urgency} onChange={handleDetailChange} style={inputStyle} disabled={!isEditing}>
                                            <option value="normal">Normal</option>
                                            <option value="priority">Priority</option>
                                            <option value="last-minute">Last-minute</option>
                                        </select>
                                    </div>
                                    <div style={detailField}>
                                        <label style={detailLabel}>Status</label>
                                        <select name="status" value={detailForm.status} onChange={handleDetailChange} style={inputStyle} disabled={!isEditing}>
                                            {editableStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        {formErrors.status && <span style={inlineError}>{formErrors.status}</span>}
                                    </div>
                                </div>
                                <div style={detailActions}>
                                    {!isEditing ? (
                                        <button style={primaryButton} onClick={() => { setFeedback(''); setIsEditing(true); }}>Edit Shift</button>
                                    ) : (
                                        <>
                                            <button style={primaryButton} onClick={handleSaveShift} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
                                            <button style={secondaryButton} onClick={closeShiftModal}>Cancel edit</button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === TABS.APPLICANTS && (
                            <ApplicantsPanel
                                shift={selectedShift}
                                applicantAction={applicantAction}
                                onApprove={handleApproveGuard}
                                onComplete={handleCompleteShift}
                                saving={saving}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ─── Chat Modal ─── */}
            {chatShift && (
                <div style={chatModalOverlay} onClick={closeChatModal}>
                    <div style={chatModalContainer} onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div style={chatModalHeaderStyle}>
                            <div style={chatModalHeaderLeft}>
                                <div style={chatLogoStyle}>
                                    <img src="/logo.svg" alt="SS" style={{ width: '20px', height: '20px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                                <div>
                                    <p style={chatModalOverlineStyle}>SECURE SHIFT</p>
                                    <p style={chatModalTitleStyle}>Shift Chat</p>
                                </div>
                            </div>
                            <button style={chatCloseButtonStyle} onClick={closeChatModal}>×</button>
                        </div>

                        {/* Shift info pills */}
                        <div style={chatShiftInfoRowStyle}>
                            <span style={chatPillStyle}>
                                <span style={chatPillDotStyle} />
                                {chatShift.title}
                            </span>
                            <span style={chatPillStyle}>
                                📍 {chatShift.locationLabel !== '--' ? chatShift.locationLabel : 'Location TBD'}
                            </span>
                            <span style={chatPillStyle}>
                                🕐 {formatTimeRange(chatShift.startTime, chatShift.endTime)}
                            </span>
                        </div>

                        {/* Guard name */}
                        {chatShift.assignedGuard && (
                            <div style={chatGuardNameStyle}>
                                • {chatShift.assignedGuard?.name || 'Assigned Guard'}
                            </div>
                        )}

                        {/* Messages */}
                        <div style={chatMessagesAreaStyle}>
                            {loadingMessages ? (
                                <div style={chatEmptyStyle}>
                                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading messages...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div style={chatEmptyStyle}>
                                    <div style={{ marginBottom: '8px' }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                    </div>
                                    <p style={{ margin: '0 0 4px', color: '#374151', fontSize: '14px', fontWeight: 500 }}>No messages yet</p>
                                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Send a message to start the conversation</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isOwn = msg.senderRole === 'employer' || msg.isOwn;
                                    return (
                                        <div key={msg._id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                                            {!isOwn && <span style={chatSenderNameStyle}>{msg.senderName || 'Guard'}</span>}
                                            <div style={isOwn ? chatBubbleOwnStyle : chatBubbleOtherStyle}>
                                                {msg.content}
                                            </div>
                                            {msg.timestamp && (
                                                <span style={chatTimestampStyle}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div style={chatInputAreaStyle}>
                            <div style={chatInputRowStyle}>
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleChatKeyDown}
                                    placeholder="Type a message..."
                                    style={chatInputStyle}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={sendingMsg || !newMessage.trim()}
                                    style={{
                                        ...chatSendButtonStyle,
                                        opacity: sendingMsg || !newMessage.trim() ? 0.5 : 1,
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </button>
                            </div>
                            <p style={chatFooterNoteStyle}>Messages are visible to all parties on this shift</p>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Chat Icon SVG ─────────────────────────────────────────────────────────────

const ChatIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

// ─── Applicants Panel ──────────────────────────────────────────────────────────

const ApplicantsPanel = ({ shift, applicantAction, onApprove, onComplete, saving }) => {
    const applicants = shift.applicants || [];
    const assignedGuardId = shift.assignedGuard?._id || shift.assignedGuard;
    const isCompleted = shift.status === 'Completed';

    if (applicants.length === 0) {
        return (
            <div style={emptyApplicantsStyle}>
                <div style={emptyIconStyle}>👥</div>
                <p style={{ margin: '8px 0 4px', fontWeight: 600, color: '#374151' }}>No applicants yet</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Guards who apply for this shift will appear here.</p>
            </div>
        );
    }

    return (
        <div style={applicantsPanelStyle}>
            {assignedGuardId && !isCompleted && (
                <div style={assignedBannerStyle}>✅ A guard has been approved. Shift is In Progress.</div>
            )}
            {isCompleted && (
                <div style={{ ...assignedBannerStyle, background: '#EAFAE7', borderColor: '#a7f3d0', color: '#065f46' }}>
                    🏁 This shift has been completed.
                </div>
            )}
            <div style={applicantsListStyle}>
                {applicants.map((applicant) => {
                    const gid = applicant._id || applicant.id;
                    const action = applicantAction[gid];
                    const isApproved = assignedGuardId === gid || action === 'approved';
                    return (
                        <div key={gid} style={{ ...applicantCardStyle, ...(isApproved ? approvedCardStyle : {}) }}>
                            <div style={avatarStyle}>
                                {(applicant.name || applicant.email || 'G').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={applicantNameStyle}>{applicant.name || 'Unknown Guard'}</p>
                                <p style={applicantEmailStyle}>{applicant.email || '--'}</p>
                                {applicant.licenseType && <span style={licenseBadgeStyle}>{applicant.licenseType}</span>}
                            </div>
                            <div style={applicantActionsStyle}>
                                {isApproved ? (
                                    <span style={approvedPillStyle}>✓ Approved</span>
                                ) : assignedGuardId || isCompleted ? (
                                    <span style={disabledPillStyle}>Shift filled</span>
                                ) : (
                                    <button style={approveButtonStyle} onClick={() => onApprove(gid)} disabled={action === 'approving'}>
                                        {action === 'approving' ? 'Approving…' : 'Approve'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {assignedGuardId && !isCompleted && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#6b7280' }}>
                        Once the shift is done, mark it as complete to finalise the booking.
                    </p>
                    <button style={completeButtonStyle} onClick={onComplete} disabled={saving}>
                        {saving ? 'Completing…' : '🏁 Mark Shift as Complete'}
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const SummaryCard = ({ label, number, icon, bg }) => (
    <div style={{ ...summaryCardStyle, backgroundColor: bg }}>
        <div>
            <p style={summaryLabelStyle}>{label}</p>
            <p style={summaryNumberStyle}>{number}</p>
        </div>
        <div><img src={icon} alt={label} style={bigIconStyle} /></div>
    </div>
);

const FilterSortSection = ({ Filter, selectedFilter, onFilterChange, sortBy, setShowSortModal }) => (
    <div style={filterSectionStyle}>
        <div style={filterGroupStyle}>
            <img src={"/ic-filter.svg"} alt="Filter" style={smallIconStyle} />
            <span style={filterLabelStyle}>Filter by:</span>
            <div style={filterButtonsStyle}>
                {Object.values(Filter).map(f => (
                    <button key={f} style={selectedFilter === f ? activeFilterButtonStyle : filterButtonStyle} onClick={() => onFilterChange(f)}>{f}</button>
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
            <button key={index} onClick={() => typeof page === 'number' ? goToPage(page) : null}
                style={page === currentPage ? activePaginationButtonStyle : paginationButtonStyle} disabled={page === '...'}>
                {page}
            </button>
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
                    <button key={option} style={option === sortBy ? activeSortOptionStyle : sortOptionStyle} onClick={() => selectSortBy(option)}>
                        {option} {option === sortBy && <span style={checkmarkStyle}>✓</span>}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

export default ManageShift;

// ─── Styles ────────────────────────────────────────────────────────────────────

const getStatusTagStyle = (status) => ({
    padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '600', display: 'inline-block',
    color: status === "Completed" ? "#2E7D32" : status === "In Progress" ? "#7B1FA2" : status === "Pending" ? "#F57C00" : status === "Open" ? "#1565C0" : "#757575",
    backgroundColor: status === "Completed" ? "#EAFAE7" : status === "In Progress" ? "#F6EFFF" : status === "Pending" ? "#FBFAE2" : status === "Open" ? "#E3F2FD" : "#F5F5F5",
});

const containerStyle = { padding: '40px', minHeight: '100vh', maxWidth: '1200px', margin: '0 auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' };
const titleStyle = { fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: '0' };
const addButtonStyle = { backgroundColor: '#274b93', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(39, 75, 147, 0.2)' };
const summaryGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' };
const summaryCardStyle = { borderRadius: '12px', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const summaryLabelStyle = { margin: '0 0 8px 0', fontSize: '16px', color: '#1E1E1E', fontWeight: '400' };
const summaryNumberStyle = { margin: '0', fontSize: '24px', fontWeight: '700', color: '#1E1E1E' };
const bigIconStyle = { width: '24px', height: '24px' };
const smallIconStyle = { width: '20px', height: '20px' };
const filterSectionStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' };
const filterGroupStyle = { display: 'flex', alignItems: 'center', gap: '12px' };
const sortGroupStyle = { display: 'flex', alignItems: 'center', gap: '12px' };
const filterLabelStyle = { fontSize: '14px', fontWeight: '400', color: '#1E1E1E' };
const filterButtonsStyle = { display: 'flex', gap: '8px' };
const filterButtonStyle = { backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '8px 16px', fontSize: '14px', color: '#666', cursor: 'pointer', fontWeight: '500' };
const activeFilterButtonStyle = { ...filterButtonStyle, backgroundColor: '#274b93', color: 'white', border: '1px solid #274b93' };
const sortButtonStyle = { backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '8px 16px', fontSize: '14px', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' };
const cardStyle = { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' };
const cardHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' };
const cardTitleStyle = { margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#1E1E1E' };
const priceStyle = { fontSize: '16px', fontWeight: '600', color: '#2E7D32' };
const cardDetailsStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const detailRowStyle = { display: 'flex', alignItems: 'center', gap: '8px' };
const detailTextStyle = { fontSize: '14px', color: '#1E1E1E', fontWeight: '400' };
const cardActionsRowStyle = { display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' };
const viewDetailsButtonStyle = { flex: 1, backgroundColor: '#274b93', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };
const chatIconButtonStyle = { width: '44px', height: '44px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', flexShrink: 0 };
const paginationStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' };
const paginationButtonStyle = { width: '32px', height: '32px', backgroundColor: 'white', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: '500', color: '#1E1E1E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const activePaginationButtonStyle = { ...paginationButtonStyle, backgroundColor: '#274b93', color: 'white', fontWeight: '600' };
const disabledPaginationButtonStyle = { ...paginationButtonStyle, cursor: 'not-allowed' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', borderRadius: '12px', padding: '0', maxWidth: '400px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e0e0e0' };
const modalTitleStyle = { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1E1E1E' };
const closeButtonStyle = { backgroundColor: 'transparent', border: 'none', fontSize: '24px', color: '#666', cursor: 'pointer', padding: '0', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalBodyStyle = { padding: '16px 0' };
const sortOptionStyle = { width: '100%', backgroundColor: 'transparent', border: 'none', padding: '12px 24px', fontSize: '16px', color: '#1E1E1E', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' };
const activeSortOptionStyle = { ...sortOptionStyle, backgroundColor: '#EFF4FF', color: '#274b93', fontWeight: '600' };
const checkmarkStyle = { color: '#274b93', fontWeight: 'bold' };
const detailModalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' };
const detailModalContent = { background: '#fff', borderRadius: '14px', width: 'min(960px, 100%)', padding: '28px 32px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: 'Poppins, sans-serif', maxHeight: '90vh', overflowY: 'auto' };
const detailModalHeader = { display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '12px' };
const detailModalOverline = { margin: 0, color: '#566074', fontSize: '12px', letterSpacing: '0.4px', fontWeight: 600 };
const detailModalTitle = { margin: '4px 0', fontSize: '22px', fontWeight: 700, color: '#1d1f2e' };
const detailModalSubtitle = { margin: 0, color: '#6b7280', fontSize: '14px' };
const modalCloseButton = { background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '10px', width: '36px', height: '36px', fontSize: '22px', cursor: 'pointer', color: '#374151' };
const detailGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' };
const detailField = { display: 'flex', flexDirection: 'column', gap: '6px' };
const detailLabel = { fontSize: '13px', color: '#374151', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#f3f4f6', fontSize: '14px', color: '#111827', outline: 'none', boxSizing: 'border-box' };
const detailActions = { marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' };
const primaryButton = { backgroundColor: '#274b93', color: 'white', border: 'none', borderRadius: '20px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' };
const secondaryButton = { backgroundColor: 'white', color: '#d14343', border: '1px solid #d14343', borderRadius: '20px', padding: '12px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' };
const feedbackStyle = { marginTop: '8px', marginBottom: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' };
const feedbackSuccessStyle = { ...feedbackStyle, backgroundColor: '#edf7ed', color: '#1b5e20', border: '1px solid #c8e6c9' };
const feedbackErrorStyle = { ...feedbackStyle, backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2' };
const inlineError = { color: '#d14343', fontSize: '12px', marginTop: '2px' };

// Tab styles
const tabBarStyle = { display: 'flex', gap: '4px', borderBottom: '2px solid #f3f4f6', marginBottom: '8px' };
const tabStyle = { padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', fontWeight: 500, color: '#9ca3af', cursor: 'pointer', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: 'transparent', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '6px' };
const activeTabStyle = { ...tabStyle, color: '#274b93', borderBottomColor: '#274b93', fontWeight: 700 };
const tabBadgeStyle = { backgroundColor: '#274b93', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 };

// Applicant panel styles
const applicantsPanelStyle = { marginTop: '8px' };
const applicantsListStyle = { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' };
const applicantCardStyle = { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff' };
const approvedCardStyle = { borderColor: '#bbf7d0', background: '#f0fdf4' };
const avatarStyle = { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #274b93, #4a72d4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 };
const applicantNameStyle = { margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: '#111827' };
const applicantEmailStyle = { margin: 0, fontSize: '12px', color: '#6b7280' };
const licenseBadgeStyle = { display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '8px', background: '#EFF4FF', color: '#274b93', fontSize: '11px', fontWeight: 600 };
const applicantActionsStyle = { display: 'flex', gap: '8px', flexShrink: 0 };
const approveButtonStyle = { padding: '7px 16px', borderRadius: '20px', border: 'none', background: '#274b93', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' };
const approvedPillStyle = { padding: '6px 14px', borderRadius: '20px', background: '#dcfce7', color: '#16a34a', fontSize: '13px', fontWeight: 600 };
const disabledPillStyle = { padding: '6px 14px', borderRadius: '20px', background: '#f3f4f6', color: '#9ca3af', fontSize: '13px', fontWeight: 500 };
const completeButtonStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#1d4a2e', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' };
const emptyApplicantsStyle = { textAlign: 'center', padding: '40px 20px', color: '#9ca3af' };
const emptyIconStyle = { fontSize: '40px', marginBottom: '8px' };
const assignedBannerStyle = { padding: '12px 16px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '13px', fontWeight: 500, marginBottom: '8px' };
const applicantBadgeStyle = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#274b93', fontWeight: 500, background: '#EFF4FF', borderRadius: '8px', padding: '4px 10px' };
const applicantDotStyle = { width: '6px', height: '6px', borderRadius: '50%', background: '#274b93', display: 'inline-block' };

// ─── Chat modal styles ────────────────────────────────────────────────────────
const chatModalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' };
const chatModalContainer = { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden' };
// Dark navy header section
const chatModalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 14px', background: '#1a2f6e' };
const chatModalHeaderLeft = { display: 'flex', alignItems: 'center', gap: '10px' };
const chatLogoStyle = { width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const chatModalOverlineStyle = { margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.8px' };
const chatModalTitleStyle = { margin: 0, fontSize: '16px', fontWeight: 700, color: 'white' };
const chatCloseButtonStyle = { background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
// Shift info pills — still on dark navy banner
const chatShiftInfoRowStyle = { display: 'flex', gap: '6px', padding: '10px 20px 14px', flexWrap: 'wrap', background: '#1a2f6e' };
const chatPillStyle = { display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 };
const chatPillDotStyle = { width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 };
// Guard name — on white background
const chatGuardNameStyle = { padding: '10px 20px', fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #f3f4f6', background: '#fff' };
// White message area
const chatMessagesAreaStyle = { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', minHeight: '240px', maxHeight: '340px', background: '#fff' };
const chatEmptyStyle = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px' };
const chatSenderNameStyle = { fontSize: '11px', color: '#9ca3af', marginBottom: '4px', paddingLeft: '2px' };
const chatBubbleOtherStyle = { background: '#f3f4f6', borderRadius: '12px 12px 12px 2px', padding: '10px 14px', fontSize: '13px', color: '#111827', maxWidth: '80%', wordBreak: 'break-word' };
const chatBubbleOwnStyle = { background: '#1a2f6e', borderRadius: '12px 12px 2px 12px', padding: '10px 14px', fontSize: '13px', color: 'white', maxWidth: '80%', wordBreak: 'break-word' };
const chatTimestampStyle = { fontSize: '10px', color: '#9ca3af', marginTop: '3px', paddingLeft: '2px' };
// White input area
const chatInputAreaStyle = { padding: '12px 16px 14px', borderTop: '1px solid #f3f4f6', background: '#fff' };
const chatInputRowStyle = { display: 'flex', gap: '8px', alignItems: 'center', background: '#f3f4f6', borderRadius: '12px', padding: '6px 6px 6px 14px' };
const chatInputStyle = { flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#111827' };
const chatSendButtonStyle = { width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: '#1a2f6e', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const chatFooterNoteStyle = { margin: '8px 0 0', fontSize: '11px', color: '#9ca3af', textAlign: 'center' };