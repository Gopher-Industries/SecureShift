import React, { useState } from 'react';

const ManageShift = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 8;
    const totalPages = Math.ceil(dummyShifts.length / cardsPerPage);

    const indexStart = (currentPage - 1) * cardsPerPage;
    const currentCards = dummyShifts.slice(indexStart, indexStart + cardsPerPage);

    const goPrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };
    const goNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div style={containerStyle}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Manage Guard Shifts</h1>
            <div style={gridStyle}>
                {currentCards.map(({ id, title, dateTime, location, status }) => (
                    <div key={id} style={cardStyle}>
                        <div>
                            <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>{title}</h3>
                            <p style={{ margin: '6px 0', color: '#555' }}>
                                <strong>Date & Time:</strong> {dateTime}
                            </p>
                            <p style={{ margin: '6px 0', color: '#555' }}>
                                <strong>Location:</strong> {location}
                            </p>
                        </div>
                        <div style={getStatusStyle(status)}>
                            <strong>Status:</strong> {status}
                        </div>
                    </div>
                ))}
            </div>

            <div style={paginationStyle}>
                <button
                    onClick={goPrev}
                    disabled={currentPage === 1}
                    style={currentPage === 1 ? disabledButtonStyle : buttonStyle}
                >
                    Prev
                </button>
                <span style={{ alignSelf: 'center' }}>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={goNext}
                    disabled={currentPage === totalPages}
                    style={currentPage === totalPages ? disabledButtonStyle : buttonStyle}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default ManageShift;


const generateDummyShifts = (count) => {
    const titles = ['Night Patrol', 'Gate Duty', 'Event Watch', 'Lobby Control'];
    const locations = ['Melbourne CBD', 'Docklands', 'Southbank', 'St Kilda'];
    const statuses = ['Open', 'Assigned', 'Pending'];

    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        title: `Security Guard - ${titles[i % titles.length]}`,
        dateTime: `2025-08-${(i % 30) + 1} ${(8 + (i % 12))}:00`,
        location: locations[i % locations.length],
        status: statuses[i % statuses.length],
    }));
};

const dummyShifts = generateDummyShifts(22);

const getStatusStyle = (status) => ({
    padding: '6px 12px',
    borderRadius: '12px',
    fontWeight: '600',
    color:
        status === 'Open' ? '#155724' :
            status === 'Assigned' ? '#004085' :
                '#856404',
    backgroundColor:
        status === 'Open' ? '#d4edda' :
            status === 'Assigned' ? '#cce5ff' :
                '#fff3cd',
    display: 'inline-block',
});

const cardStyle = {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '220px',  // fixed height for all cards
    boxSizing: 'border-box',
};

const containerStyle = {
    padding: '20px',
    backgroundColor: '#f4f4f4',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
};

const paginationStyle = {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
};

const buttonStyle = {
    padding: '8px 16px',
    fontSize: '16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
};

const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
};