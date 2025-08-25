import React from 'react'
import lockIcon from '../images/icon_lock.svg';



export default function TextInput({ value, onChange, onBlur, name, disabled, multiline, ...props }) {
    const inputStyle = {
        backgroundColor: disabled ? "#ABABAB" : "white",
        width: '422px',
        color: 'black',
        padding: "8px 12px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: "14px",
    };

    const containerStyle = {
        position: 'relative',
    }
    const lockIconStyle = {
        position: 'absolute',
        right: '10px',
        top: multiline ? '70%' : '50%',
        transform: 'translateY(-50%)',
        width: '24px',
        height: '24px',
    }



    return (
        <div style={containerStyle}>
            {multiline ? <textarea
                {...props}
                style={inputStyle}
                rows={4}
            /> : <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                style={inputStyle}
                {...props}
            />}
            {disabled && <img src={lockIcon} alt="lock_icon" style={lockIconStyle} />}
        </div>
    )
}
