/**
 * PDF Email Sender Component
 * Provides a simple UI to send invoice PDF emails
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './PDFEmailSender.css';

const PDFEmailSender = ({ invoiceId, invoiceData, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        recipientEmail: '',
        subject: '',
        customText: '',
        customHtml: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Initialize form data
    useEffect(() => {
        if (invoiceData) {
            setFormData(prev => ({
                ...prev,
                subject: `Invoice ${invoiceData.invoiceNumber || invoiceId}`,
                recipientEmail: invoiceData.client?.email || ''
            }));
        }
    }, [invoiceData, invoiceId]);

    // Handle form inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Validate email format
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Send email
    const handleSendEmail = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!formData.recipientEmail) {
            setError('Please enter the recipient email address');
            return;
        }

        if (!validateEmail(formData.recipientEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        if (!formData.subject) {
            setError('Please enter an email subject');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/api/pdf-email/send/${invoiceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    recipientEmail: formData.recipientEmail,
                    subject: formData.subject,
                    customText: formData.customText || undefined,
                    customHtml: formData.customHtml || undefined
                })
            });

            const result = await response.json();

            if (result.success) {
                setSuccess('Email sent successfully!');
                if (onSuccess) {
                    onSuccess(result.data);
                }
                // 3秒后自动关闭
                setTimeout(() => {
                    if (onClose) onClose();
                }, 3000);
            } else {
                setError(result.error || 'Email sending failed');
            }

        } catch (error) {
            console.error('Email sending error:', error);
            setError('Network error, please try again later');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pdf-email-sender-overlay">
            <div className="pdf-email-sender-modal">
                <div className="pdf-email-sender-header">
                    <h3>Send Invoice PDF Email</h3>
                    <button 
                        className="close-button"
                        onClick={onClose}
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSendEmail} className="pdf-email-sender-form">
                    {/* Invoice info */}
                    <div className="invoice-info">
                        <h4>Invoice Information</h4>
                        <div className="info-row">
                            <span className="label">Invoice ID:</span>
                            <span className="value">{invoiceId}</span>
                        </div>
                        {invoiceData?.invoiceNumber && (
                            <div className="info-row">
                                <span className="label">Invoice Number:</span>
                                <span className="value">{invoiceData.invoiceNumber}</span>
                            </div>
                        )}
                        {invoiceData?.client?.name && (
                            <div className="info-row">
                                <span className="label">Client Name:</span>
                                <span className="value">{invoiceData.client.name}</span>
                            </div>
                        )}
                        {invoiceData?.totalAmount && (
                            <div className="info-row">
                                <span className="label">Total Amount:</span>
                                <span className="value">€{invoiceData.totalAmount}</span>
                            </div>
                        )}
                    </div>

                    {/* Email form */}
                    <div className="form-group">
                        <label htmlFor="recipientEmail">Recipient Email *</label>
                        <input
                            type="email"
                            id="recipientEmail"
                            name="recipientEmail"
                            value={formData.recipientEmail}
                            onChange={handleInputChange}
                            placeholder="Enter recipient email address"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="subject">Subject *</label>
                        <input
                            type="text"
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            placeholder="Enter email subject"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="customText">Custom email content (optional)</label>
                        <textarea
                            id="customText"
                            name="customText"
                            value={formData.customText}
                            onChange={handleInputChange}
                            placeholder="Enter custom email text..."
                            rows="4"
                            disabled={loading}
                        />
                        <small className="form-help">
                            Leave empty to use the default email template
                        </small>
                    </div>

                    {/* Error and success messages */}
                    {error && (
                        <div className="message error-message">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="message success-message">
                            {success}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="send-button"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Email'}
                        </button>
                    </div>
                </form>

                {/* Feature notes */}
                <div className="feature-info">
                    <h4>Feature Notes</h4>
                    <ul>
                        <li>The system generates a PDF invoice and sends it as an attachment</li>
                        <li>Email includes basic invoice details</li>
                        <li>Supports custom email content</li>
                        <li>Send records are saved for review</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PDFEmailSender;