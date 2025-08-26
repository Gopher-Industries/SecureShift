import React from 'react'
import CompanyLogo from './company_logo.svg'
import { Link } from 'react-router-dom'

export default function Footer() {
    const footerNavList = [
        { title: 'Privacy Policy', link: '/privacy-policy' },
        { title: 'Terms and Conditions', link: '/terms-and-condition' },
        { title: 'FAQ’s', link: '/faqs' },
        { title: 'Contact Us', link: '/contact-us' }
    ]

    const footerStyle = {
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#072261',
        color: '#fff',
        textAlign: 'center',
    }

    const linkStyle = {
        color: '#fff',
        textDecoration: 'none',
    }

    const headerStyle = {
        backgroundColor: '#072261',
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "white",
        padding: "0px 20px",
        height: "70px",
        borderBottom: '1px solid #ccc'
    };

    const buttonList = [
        {
            title: 'Express of Interest',
            link: '/'
        },
        {
            title: 'Login',
            link: '/login'
        }
    ]

    const navButtonStyle = {
        borderRadius: "30px",
        minWidth: '90px',
        padding: "0 20px",
        height: "42px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textDecoration: "none",
        color: "white",
        backgroundColor: "#274B93",
        transition: "background-color 0.3s"
    }

    const footerNavListStyle = {
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'center',
        padding: '10px',
        gap: '10px',
        marginLeft: '10px'
    }

    return (
        <footer style={footerStyle}>
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

                </div>
            </div>
            <div style={footerNavListStyle}>
                {footerNavList.map((item, index) => (
                    <span key={index}>
                        <Link to={item.link} style={linkStyle}>
                            {item.title}
                        </Link>
                        {index < footerNavList.length - 1 && ' | '}
                    </span>
                ))}
            </div>
        </footer >
    )
}
