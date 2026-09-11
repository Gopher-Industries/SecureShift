import React from 'react';
import './RefreshButton.css';

const RefreshButton = ({
  onRefresh,
  isRefreshing = false,
  lastRefreshed = null,
  disabled = false,
  className = '',
  label = 'Refresh',
  showTimestamp = true,
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    if (!isRefreshing && !disabled && onRefresh) {
      onRefresh();
    }
  };

  const formatLastRefreshed = (time) => {
    if (!time) return null;
    const dateObj = time instanceof Date ? time : new Date(time);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formattedTime = formatLastRefreshed(lastRefreshed);

  return (
    <div className={`ss-refresh-wrapper ${className}`}>
      <button
        type="button"
        className={`ss-refresh-btn ${isRefreshing ? 'is-refreshing' : ''}`}
        onClick={handleClick}
        disabled={isRefreshing || disabled}
        aria-label="Refresh data"
        title={formattedTime ? `Last refreshed ${formattedTime}` : 'Refresh data'}
      >
        <svg
          className="ss-refresh-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.5 2v6h-6" />
          <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
        <span className="ss-refresh-label">{isRefreshing ? 'Refreshing...' : label}</span>
      </button>
      {showTimestamp && formattedTime && (
        <span className="ss-refresh-timestamp">Last refreshed {formattedTime}</span>
      )}
    </div>
  );
};

export default RefreshButton;
