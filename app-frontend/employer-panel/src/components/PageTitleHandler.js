import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom';

function PageTitleHandler() {
    const location = useLocation();

    useEffect(() => {
        switch (location.pathname) {
            case "/":
            case "/login":
                document.title = "SecureShift - Login";
                break;
            case "/2fa":
                document.title = "SecureShift - Two-Factor Authentication";
                break;
            case "/employer-dashboard":
                document.title = "SecureShift - Employer Dashboard";
                break;
            case "/create-shift":
                document.title = "SecureShift - Create Shift";
                break;
            case "/manage-shift":
                document.title = "SecureShift - Manage Shift";
                break;
            case "/guard-profiles":
                document.title = "SecureShift - Guard Profiles";
                break;
            case "/company-profile":
                document.title = "SecureShift - Company Profile";
                break;
            case "/submission":
                document.title = "SecureShift - Submission Confirmation";
                break;
            case "/expression-of-interest":
                document.title = "SecureShift - Expression Of Interest";
                break;
            default:
                document.title = "SecureShift";
        }
    }, [location]);

    return null;
}

export default PageTitleHandler;