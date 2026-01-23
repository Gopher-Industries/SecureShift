import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CompanyLogo from './company_logo.svg';
import ProfilePicPlaceHolder from './ProfilePicPlaceHolder.svg';

export default function Header() {
    const navigate = useNavigate();

    const headerStyle = {
        backgroundColor: '#072261',
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "white",
        padding: "0px 20px",
        height: "70px"
    };

    const navButtonStyle = {
        borderRadius: "30px",
        width: '127px',
        height: "42px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textDecoration: "none",
        color: "white",
        backgroundColor: "#274B93",
        transition: "background-color 0.3s",
        cursor: "pointer"
    };

    const handleHomeClick = () => {
        const token = localStorage.getItem("token");
        navigate(token ? "/employer-dashboard" : "/login");
    };

    return (
        <div style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src={CompanyLogo} alt="Company Logo" style={{ height: '66px' }} />
                <div style={{ fontWeight: "600", fontSize: "24px" }}>Secure Shift</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Home button */}
                <div onClick={handleHomeClick} style={navButtonStyle}>Home</div>

                {/* Other buttons using Link to avoid full page reload */}
                <Link to="/manage-shift" style={navButtonStyle}>Shifts</Link>
                <Link to="/timesheets" style={navButtonStyle}>Timesheets</Link>
                <Link to="/guard-profiles" style={navButtonStyle}>Guard</Link>
                
                {/* Email Settings - Admin only (backend will enforce) */}
                {localStorage.getItem("userRole") === "admin" && (
                    <Link to="/email-settings" style={navButtonStyle}>Email</Link>
                )}

                {/* Avatar */}
                <div onClick={() => navigate("/company-profile")} style={{ cursor: "pointer" }}>
                    <img src={ProfilePicPlaceHolder} alt="Profile" style={{ height: '60px', marginLeft: "10px" }} />
                </div>
            </div>
        </div>
    );
}
