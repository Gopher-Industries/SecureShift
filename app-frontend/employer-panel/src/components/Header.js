import React from 'react'
import CompanyLogo from './company_logo.svg'
import { Link } from 'react-router-dom'

import ProfilePicPlaceHolder from './ProfilePicPlaceHolder.svg'
export default function Header() {
    const headerStyle = {
        backgroundColor: '#072261',
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "white",
        padding: "0px 20px",
        height: "70px"
    };

    const buttonList = [
        {
            title: 'Home',
            link: '/'
        },
        {
            title: 'Dashboard',
            link: '/employer-dashboard'
        }
    ]

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
        transition: "background-color 0.3s"
    }


    return (
        <div style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src={CompanyLogo} alt="Company Logo" style={{ height: '66px' }} />
                <div style={{ fontWeight: "600", fontSize: "24px" }}>Secure Shift</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {buttonList.map((button, index) => (
                    <Link key={index} to={button.link} style={navButtonStyle}>
                        {button.title}
                    </Link>
                ))}

                <img src={ProfilePicPlaceHolder} alt="Profile" style={{ height: '60px', marginLeft: "10px" }} />
            </div>
        </div>
    )
}
