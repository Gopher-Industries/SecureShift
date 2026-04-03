import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import TextInput from '../input/TextInput';
import AppIcon from '../images/app_icon.png';
import http from '../lib/http';

export default function EmailSettings() {
    const [enableEdit, setEnableEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [testEmail, setTestEmail] = useState('');

    const validationSchema = Yup.object().shape({
        SMTP_HOST: Yup.string().required('SMTP Host is required'),
        SMTP_PORT: Yup.string().required('SMTP Port is required'),
        SMTP_SECURE: Yup.string().oneOf(['true', 'false'], 'Must be true or false'),
        SMTP_USER: Yup.string().required('SMTP User is required'),
        SMTP_PASS: Yup.string().required('SMTP Password is required'),
        SMTP_FROM_EMAIL: Yup.string().email('Must be a valid email').required('From Email is required'),
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset,
    } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            SMTP_HOST: '',
            SMTP_PORT: '587',
            SMTP_SECURE: 'false',
            SMTP_USER: '',
            SMTP_PASS: '',
            SMTP_FROM_EMAIL: '',
        },
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const { data } = await http.get('/admin/smtp-settings');
            const passwordValue = data.SMTP_PASS === '***hidden***' || !data.SMTP_PASS ? '' : data.SMTP_PASS;
            reset({
                SMTP_HOST: data.SMTP_HOST || '',
                SMTP_PORT: data.SMTP_PORT || '587',
                SMTP_SECURE: data.SMTP_SECURE || 'false',
                SMTP_USER: data.SMTP_USER || '',
                SMTP_PASS: passwordValue,
                SMTP_FROM_EMAIL: data.SMTP_FROM_EMAIL || '',
            });
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to load SMTP settings' 
            });
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await http.put('/admin/smtp-settings', data);
            setMessage({ type: 'success', text: 'SMTP settings saved successfully!' });
            setEnableEdit(false);
            await loadSettings();
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to save SMTP settings' 
            });
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            setMessage({ type: 'error', text: 'Please enter a test email address' });
            return;
        }

        setTesting(true);
        setMessage({ type: '', text: '' });
        try {
            await http.post('/admin/smtp-settings/test', { testEmail });
            setMessage({ 
                type: 'success', 
                text: `Test email sent successfully to ${testEmail}. Please check the inbox.` 
            });
            setTestEmail('');
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to send test email' 
            });
        } finally {
            setTesting(false);
        }
    };

    const formFields = [
        { name: 'SMTP_HOST', label: 'SMTP Host', slot: 'left', placeholder: 'e.g., smtp.gmail.com' },
        { name: 'SMTP_PORT', label: 'SMTP Port', slot: 'left', placeholder: 'e.g., 587' },
        { name: 'SMTP_SECURE', label: 'SMTP Secure', slot: 'left', placeholder: 'true or false' },
        { name: 'SMTP_USER', label: 'SMTP User/Email', slot: 'right', placeholder: 'your-email@gmail.com or apikey' },
        { name: 'SMTP_PASS', label: 'SMTP Password', slot: 'right', placeholder: 'your-app-password', type: 'password' },
        { name: 'SMTP_FROM_EMAIL', label: 'From Email (Verified)', slot: 'right', placeholder: 'noreply@yourcompany.com', type: 'email' },
    ];

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Loading SMTP settings...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <PageHeader />

            {message.text && (
                <div style={{
                    padding: '12px',
                    marginBottom: '20px',
                    borderRadius: '4px',
                    backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <div
                    style={{
                        display: 'flex',
                        gap: '50px',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        marginTop: '20px',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {formFields
                            .filter((field) => field.slot === 'left')
                            .map((field, index) => (
                                <div
                                    key={index}
                                    style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                                >
                                    <div style={{ width: '150px', fontWeight: 'bold' }}>
                                        {field.label}:
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            {...register(field.name)}
                                            type={field.type || 'text'}
                                            placeholder={field.placeholder}
                                            disabled={!enableEdit}
                                            style={{
                                                backgroundColor: !enableEdit ? "#ABABAB" : "white",
                                                width: '422px',
                                                color: 'black',
                                                padding: "8px 12px",
                                                border: "1px solid #ccc",
                                                borderRadius: "4px",
                                                fontSize: "14px",
                                            }}
                                        />
                                        {errors[field.name] && (
                                            <p style={{ color: 'red', fontSize: '12px' }}>
                                                {errors[field.name].message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {formFields
                            .filter((field) => field.slot === 'right')
                            .map((field, index) => (
                                <div
                                    key={index}
                                    style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                                >
                                    <div style={{ width: '150px', fontWeight: 'bold' }}>
                                        {field.label}:
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            {...register(field.name)}
                                            type={field.type || 'text'}
                                            placeholder={field.placeholder}
                                            disabled={!enableEdit}
                                            style={{
                                                backgroundColor: !enableEdit ? "#ABABAB" : "white",
                                                width: '422px',
                                                color: 'black',
                                                padding: "8px 12px",
                                                border: "1px solid #ccc",
                                                borderRadius: "4px",
                                                fontSize: "14px",
                                            }}
                                        />
                                        {errors[field.name] && (
                                            <p style={{ color: 'red', fontSize: '12px' }}>
                                                {errors[field.name].message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button
                        type="button"
                        onClick={() => setEnableEdit((prev) => !prev)}
                        style={{
                            minWidth: '120px',
                            textAlign: 'center',
                            borderRadius: '110px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '12px 24px',
                            cursor: 'pointer',
                            border: 'none',
                        }}
                    >
                        {enableEdit ? 'Cancel' : 'Edit Settings'}
                    </button>

                    {enableEdit && (
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                minWidth: '120px',
                                textAlign: 'center',
                                borderRadius: '110px',
                                backgroundColor: '#284B93',
                                color: 'white',
                                fontWeight: 'bold',
                                padding: '12px 24px',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                border: 'none',
                                opacity: saving ? 0.6 : 1,
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    )}
                </div>
            </form>

            <div style={{ 
                marginTop: '40px', 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                maxWidth: '800px',
                margin: '40px auto',
            }}>
                <h3 style={{ marginBottom: '15px' }}>Test Email Configuration</h3>
                <p style={{ marginBottom: '15px', color: '#666' }}>
                    Send a test email to verify your SMTP settings are working correctly.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="email"
                        placeholder="Enter test email address"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        style={{
                            flex: 1,
                            padding: "8px 12px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            fontSize: "14px",
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={testing || !testEmail}
                        style={{
                            padding: '8px 24px',
                            borderRadius: '4px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: testing || !testEmail ? 'not-allowed' : 'pointer',
                            border: 'none',
                            opacity: testing || !testEmail ? 0.6 : 1,
                        }}
                    >
                        {testing ? 'Sending...' : 'Send Test Email'}
                    </button>
                </div>
            </div>

            <div style={{ 
                marginTop: '30px', 
                padding: '20px', 
                backgroundColor: '#e7f3ff', 
                borderRadius: '8px',
                maxWidth: '800px',
                margin: '30px auto',
            }}>
                <h3 style={{ marginBottom: '15px' }}>Quick Reference</h3>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                    <p><strong>Gmail:</strong></p>
                    <ul style={{ marginLeft: '20px' }}>
                        <li>Host: <code>smtp.gmail.com</code></li>
                        <li>Port: <code>587</code></li>
                        <li>Secure: <code>false</code></li>
                        <li>User: Your Gmail address</li>
                        <li>Password: App Password (from Google Account settings)</li>
                    </ul>
                    <p style={{ marginTop: '15px' }}><strong>SendGrid:</strong></p>
                    <ul style={{ marginLeft: '20px' }}>
                        <li>Host: <code>smtp.sendgrid.net</code></li>
                        <li>Port: <code>587</code></li>
                        <li>Secure: <code>false</code></li>
                        <li>User: <code>apikey</code></li>
                        <li>Password: Your SendGrid API key</li>
                        <li><strong>From Email:</strong> Must be a verified sender in SendGrid (verify in SendGrid dashboard)</li>
                    </ul>
                    <p style={{ marginTop: '15px', color: '#d32f2f', fontWeight: 'bold' }}>
                        ⚠️ Important: The "From Email" must be verified in your email provider:
                    </p>
                    <ul style={{ marginLeft: '20px', color: '#d32f2f' }}>
                        <li><strong>SendGrid:</strong> Go to Settings → Sender Authentication → Verify a Single Sender</li>
                        <li><strong>Gmail:</strong> Use your Gmail address (already verified)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function PageHeader() {
    const headerStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const titleStyles = {
        marginTop: '16px',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '50px',
    };

    return (
        <>
            <div style={headerStyles}>
                <img src={AppIcon} alt="app_icon" style={{ width: '80px' }} />
                <div style={{ fontSize: '38px', fontWeight: 'bold' }}>Email Settings</div>
                <div style={{ width: '80px' }}></div>
            </div>
            <div style={titleStyles}>Configure SMTP Settings for OTP Emails</div>
        </>
    );
}

