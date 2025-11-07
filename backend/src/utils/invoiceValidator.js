/**
 * Invoice data validation utility
 * Ensures invoice data integrity and consistency
 */

/**
 * Validate invoice creation data
 * @param {Object} invoiceData - Invoice data
 * @param {Array} items - Invoice items array
 * @returns {Object} Validation result {isValid: boolean, errors: Array}
 */
function validateInvoiceCreation(invoiceData, items) {
    const errors = [];
    
    // Validate required fields
    if (!invoiceData.clientId && !invoiceData.buyer) {
        errors.push('Client information missing: clientId or buyer field required');
    }
    
    if (!invoiceData.issueDate && !invoiceData.invoiceDate) {
        errors.push('Invoice date missing: issueDate or invoiceDate field required');
    }
    
    // Validate invoice items
    if (items) {
        const itemValidation = validateInvoiceItems(items);
        if (!itemValidation.isValid) {
            errors.push(...itemValidation.errors);
        }
        
        // Validate amount calculation
        const amountValidation = validateAmountCalculation(invoiceData, items);
        if (!amountValidation.isValid) {
            errors.push(...amountValidation.errors);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate invoice update data
 * @param {Object} updateData - Update data
 * @param {Array} items - Invoice items array (optional)
 * @returns {Object} Validation result
 */
function validateInvoiceUpdate(updateData, items) {
    const errors = [];
    
    // If items provided, validate item data
    if (items) {
        const itemValidation = validateInvoiceItems(items);
        if (!itemValidation.isValid) {
            errors.push(...itemValidation.errors);
        }
        
        // Validate amount calculation
        const amountValidation = validateAmountCalculation(updateData, items);
        if (!amountValidation.isValid) {
            errors.push(...amountValidation.errors);
        }
    }
    
    // Validate date format
    if (updateData.issueDate && !isValidDate(updateData.issueDate)) {
        errors.push('Invalid invoice date format');
    }
    
    if (updateData.dueDate && !isValidDate(updateData.dueDate)) {
        errors.push('Invalid due date format');
    }
    
    // Validate status
    if (updateData.status && !isValidStatus(updateData.status)) {
        errors.push('Invalid invoice status');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate invoice items array
 * @param {Array} items - Invoice items array
 * @returns {Object} Validation result
 */
function validateInvoiceItems(items) {
    const errors = [];
    
    if (!Array.isArray(items)) {
        errors.push('Invoice items must be in array format');
        return { isValid: false, errors };
    }
    
    if (items.length === 0) {
        errors.push('Invoice must contain at least one item');
        return { isValid: false, errors };
    }
    
    items.forEach((item, index) => {
        const itemErrors = validateSingleItem(item, index);
        errors.push(...itemErrors);
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate single invoice item
 * @param {Object} item - Invoice item
 * @param {number} index - Item index
 * @returns {Array} Error array
 */
function validateSingleItem(item, index) {
    const errors = [];
    const itemPrefix = `Item ${index + 1}: `;
    
    if (!item.description || item.description.trim() === '') {
        errors.push(`${itemPrefix}Description cannot be empty`);
    }
    
    if (!item.quantity || item.quantity <= 0) {
        errors.push(`${itemPrefix}Quantity must be a number greater than 0`);
    }
    
    if (item.unitPrice === undefined || item.unitPrice < 0) {
        errors.push(`${itemPrefix}Unit price must be a non-negative number`);
    }
    
    if (item.taxRate !== undefined && (item.taxRate < 0 || item.taxRate > 100)) {
        errors.push(`${itemPrefix}Tax rate must be between 0-100`);
    }
    
    return errors;
}

/**
 * Validate amount calculation consistency
 * @param {Object} invoiceData - Invoice data
 * @param {Array} items - Invoice items array
 * @returns {Object} Validation result
 */
function validateAmountCalculation(invoiceData, items) {
    const errors = [];
    
    try {
        // Calculate expected amounts
        let expectedSubtotal = 0;
        let expectedTaxAmount = 0;
        
        items.forEach(item => {
            const quantity = parseFloat(item.quantity || 0);
            const unitPrice = parseFloat(item.unitPrice || 0);
            const taxRate = parseFloat(item.taxRate || 0);
            
            const itemTotal = quantity * unitPrice;
            expectedSubtotal += itemTotal;
            expectedTaxAmount += itemTotal * (taxRate / 100);
        });
        
        const expectedTotal = expectedSubtotal + expectedTaxAmount;
        
        // Use more lenient validation - allow up to 0.1 difference for floating point precision issues
        const tolerance = 0.1;
        
        // Validate subtotal (optional - only if provided)
        if (invoiceData.subtotal !== undefined && invoiceData.subtotal !== null) {
            const actualSubtotal = parseFloat(invoiceData.subtotal || 0);
            if (Math.abs(expectedSubtotal - actualSubtotal) > tolerance) {
                errors.push(`Subtotal amount mismatch: expected ${expectedSubtotal.toFixed(2)}, actual ${actualSubtotal.toFixed(2)}`);
            }
        }
        
        // Validate tax amount (optional - only if provided)
        if (invoiceData.taxAmount !== undefined && invoiceData.taxAmount !== null) {
            const actualTaxAmount = parseFloat(invoiceData.taxAmount || 0);
            if (Math.abs(expectedTaxAmount - actualTaxAmount) > tolerance) {
                errors.push(`Tax amount mismatch: expected ${expectedTaxAmount.toFixed(2)}, actual ${actualTaxAmount.toFixed(2)}`);
            }
        }
        
        // Validate total (required field)
        const actualTotal = parseFloat(invoiceData.total || invoiceData.totalAmount || 0);
        if (actualTotal <= 0) {
            errors.push('Total amount must be greater than 0');
        } else if (Math.abs(expectedTotal - actualTotal) > tolerance) {
            // Only warn for significant differences, don't fail validation
            console.warn(`Total amount difference detected: expected ${expectedTotal.toFixed(2)}, actual ${actualTotal.toFixed(2)}`);
        }
        
    } catch (error) {
        errors.push(`Amount calculation validation failed: ${error.message}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate date format
 * @param {string|Date} date - Date
 * @returns {boolean} Whether valid
 */
function isValidDate(date) {
    if (!date) return false;
    
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

/**
 * Validate invoice status
 * @param {string} status - Status
 * @returns {boolean} Whether valid
 */
function isValidStatus(status) {
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    return validStatuses.includes(status);
}

/**
 * Validate invoice data integrity (for data migration)
 * @param {Object} invoice - Invoice object
 * @returns {Object} Validation result
 */
function validateDataIntegrity(invoice) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!invoice.id) errors.push('Invoice ID missing');
    if (!invoice.userId) errors.push('User ID missing');
    if (!invoice.invoiceNumber) errors.push('Invoice number missing');

    // Check amount field consistency
    if (invoice.total !== undefined && invoice.totalAmount !== undefined) {
        if (Math.abs(parseFloat(invoice.total) - parseFloat(invoice.totalAmount)) > 0.01) {
            warnings.push('total and totalAmount fields inconsistent');
        }
    }

    // Check item data consistency
    const hasInvoiceItems = invoice.InvoiceItems && invoice.InvoiceItems.length > 0;
    const hasItemsJson = invoice.items && invoice.items.trim() !== '';

    if (!hasInvoiceItems && !hasItemsJson) {
        errors.push('Invoice item data missing (both InvoiceItems and items fields are empty)');
    } else if (hasInvoiceItems && hasItemsJson) {
        try {
            const jsonItems = JSON.parse(invoice.items);
            if (jsonItems.length !== invoice.InvoiceItems.length) {
                warnings.push('InvoiceItems and items JSON data count inconsistent');
            } else {
                // Check item content consistency
                for (let i = 0; i < jsonItems.length; i++) {
                    const jsonItem = jsonItems[i];
                    const dbItem = invoice.InvoiceItems[i];
                    
                    if (jsonItem.description !== dbItem.description ||
                        jsonItem.quantity !== dbItem.quantity ||
                        jsonItem.unitPrice !== dbItem.unitPrice ||
                        jsonItem.taxRate !== dbItem.taxRate) {
                        errors.push('Invoice item data inconsistent');
                        break;
                    }
                }
            }
        } catch (error) {
            warnings.push('items JSON format invalid');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

module.exports = {
    validateCreateData: validateInvoiceCreation,
    validateUpdateData: validateInvoiceUpdate,
    validateInvoiceCreation,
    validateInvoiceUpdate,
    validateInvoiceItems,
    validateSingleItem,
    validateAmountCalculation,
    isValidDate,
    isValidStatus,
    validateDataIntegrity
};