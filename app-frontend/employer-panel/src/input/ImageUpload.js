import React, { useRef } from "react"
import lockIcon from '../images/icon_lock.svg';

export default function ImageUpload({ value, onChange, disabled }) {
    const fileInputRef = useRef(null)

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                onChange(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const triggerFileSelect = () => {
        if (!disabled) {
            fileInputRef.current.click()
        }
    }

    const containerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "10px",
        position: 'relative'
    }

    const lockIconStyle = {
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        width: '24px',
        height: '24px',
        display: disabled ? 'block' : 'none'
    }

    return (
        <div style={containerStyle}>
            {/* Preview */}
            <div
                style={{
                    width: "80px",
                    height: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: disabled ? "default" : "pointer",
                }}
                onClick={triggerFileSelect}
            >
                {value ? (
                    <img src={value} alt="logo preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                    <span style={{ fontSize: "12px", color: "#888" }}>
                        {disabled ? "No Logo" : "Click to Upload"}
                    </span>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
                disabled={disabled}
            />
            <img src={lockIcon} alt="lock icon" style={lockIconStyle} />
        </div>
    )
}
