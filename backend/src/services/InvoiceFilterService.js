const DateUtils = require('./DateUtils');

/**
 * 统一的发票筛选服务
 * 提供标准化的发票筛选和查询接口
 */
class InvoiceFilterService {
    /**
     * 按支付日期筛选发票
     * @param {Array} invoices - 发票数组
     * @param {string} startDate - 开始日期 (YYYY-MM-DD)
     * @param {string} endDate - 结束日期 (YYYY-MM-DD)
     * @returns {Array} 筛选后的发票数组
     */
    static filterByPaymentDate(invoices, startDate, endDate) {
        if (!invoices || !Array.isArray(invoices)) {
            return [];
        }

        if (!startDate && !endDate) {
            return invoices;
        }

        return invoices.filter(invoice => {
            if (!invoice.paymentDate) {
                return false;
            }

            const paymentDate = new Date(invoice.paymentDate);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && paymentDate < start) {
                return false;
            }

            if (end && paymentDate > end) {
                return false;
            }

            return true;
        });
    }

    /**
     * 按创建日期筛选发票
     * @param {Array} invoices - 发票数组
     * @param {string} startDate - 开始日期 (YYYY-MM-DD)
     * @param {string} endDate - 结束日期 (YYYY-MM-DD)
     * @returns {Array} 筛选后的发票数组
     */
    static filterByCreatedDate(invoices, startDate, endDate) {
        if (!invoices || !Array.isArray(invoices)) {
            return [];
        }

        if (!startDate && !endDate) {
            return invoices;
        }

        return invoices.filter(invoice => {
            if (!invoice.createdAt) {
                return false;
            }

            const createdDate = new Date(invoice.createdAt);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && createdDate < start) {
                return false;
            }

            if (end && createdDate > end) {
                return false;
            }

            return true;
        });
    }

    /**
     * 按用户筛选发票
     * @param {Array} invoices - 发票数组
     * @param {string} userId - 用户ID
     * @returns {Array} 筛选后的发票数组
     */
    static filterByUser(invoices, userId) {
        if (!invoices || !Array.isArray(invoices)) {
            return [];
        }

        if (!userId) {
            return invoices;
        }

        return invoices.filter(invoice => {
            return invoice.userId === userId || invoice.userId === parseInt(userId);
        });
    }

    /**
     * 按状态筛选发票
     * @param {Array} invoices - 发票数组
     * @param {string} status - 发票状态
     * @returns {Array} 筛选后的发票数组
     */
    static filterByStatus(invoices, status) {
        if (!invoices || !Array.isArray(invoices)) {
            return [];
        }

        if (!status) {
            return invoices;
        }

        return invoices.filter(invoice => {
            return invoice.status === status;
        });
    }

    /**
     * 按月份筛选发票
     * @param {Array} invoices - 发票数组
     * @param {number} year - 年份
     * @param {number} month - 月份 (1-12)
     * @param {string} dateField - 日期字段名 ('createdAt', 'paymentDate', 'invoiceDate', 'issueDate')
     * @returns {Array} 筛选后的发票数组
     */
    static filterByMonth(invoices, year, month, dateField = 'createdAt') {
        if (!invoices || !Array.isArray(invoices)) {
            return [];
        }

        if (!year || !month) {
            return invoices;
        }

        // 构建月份字符串 (YYYY-MM格式)
        const monthString = `${year}-${month.toString().padStart(2, '0')}`;

        return invoices.filter(invoice => {
            const dateValue = invoice[dateField];
            if (!dateValue) {
                return false;
            }

            return DateUtils.isDateInMonth(dateValue, monthString);
        });
    }

    /**
     * 组合筛选发票
     * @param {Array} invoices - 发票数组
     * @param {Object} filters - 筛选条件
     * @param {string} filters.userId - 用户ID
     * @param {string} filters.status - 发票状态
     * @param {string} filters.startDate - 开始日期
     * @param {string} filters.endDate - 结束日期
     * @param {string} filters.dateField - 日期字段 ('createdAt' 或 'paymentDate')
     * @param {number} filters.year - 年份
     * @param {number} filters.month - 月份
     * @returns {Array} 筛选后的发票数组
     */
    static filterInvoices(invoices, filters = {}) {
        if (!invoices || !Array.isArray(invoices)) {
            return [];
        }

        let filteredInvoices = [...invoices];

        // 按用户筛选
        if (filters.userId) {
            filteredInvoices = this.filterByUser(filteredInvoices, filters.userId);
        }

        // 按状态筛选
        if (filters.status) {
            filteredInvoices = this.filterByStatus(filteredInvoices, filters.status);
        }

        // 按月份筛选
        if (filters.year && filters.month) {
            const dateField = filters.dateField || 'createdAt';
            filteredInvoices = this.filterByMonth(filteredInvoices, filters.year, filters.month, dateField);
        }
        // 按日期范围筛选
        else if (filters.startDate || filters.endDate) {
            const dateField = filters.dateField || 'createdAt';
            if (dateField === 'paymentDate') {
                filteredInvoices = this.filterByPaymentDate(filteredInvoices, filters.startDate, filters.endDate);
            } else {
                filteredInvoices = this.filterByCreatedDate(filteredInvoices, filters.startDate, filters.endDate);
            }
        }

        return filteredInvoices;
    }

    /**
     * 获取发票的唯一状态列表
     * @param {Array} invoices - 发票数组
     * @returns {Array} 状态数组
     */
    static getUniqueStatuses(invoices) {
        if (!invoices || !Array.isArray(invoices)) {
            return [];
        }

        const statuses = invoices
            .map(invoice => invoice.status)
            .filter(status => status)
            .filter((status, index, array) => array.indexOf(status) === index);

        return statuses.sort();
    }

    /**
     * 获取发票的唯一用户列表
     * @param {Array} invoices - 发票数组
     * @returns {Array} 用户ID数组
     */
    static getUniqueUsers(invoices) {
        if (!invoices || !Array.isArray(invoices)) {
            return [];
        }

        const userIds = invoices
            .map(invoice => invoice.userId)
            .filter(userId => userId !== null && userId !== undefined)
            .filter((userId, index, array) => array.indexOf(userId) === index);

        return userIds.sort((a, b) => a - b);
    }

    /**
     * 验证筛选参数
     * @param {Object} filters - 筛选条件
     * @returns {Object} 验证结果
     */
    static validateFilters(filters) {
        const errors = [];
        const warnings = [];

        if (filters.startDate && !DateUtils.isValidDateString(filters.startDate)) {
            errors.push('开始日期格式无效');
        }

        if (filters.endDate && !DateUtils.isValidDateString(filters.endDate)) {
            errors.push('结束日期格式无效');
        }

        if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            if (start > end) {
                errors.push('开始日期不能晚于结束日期');
            }
        }

        if (filters.year && (filters.year < 2000 || filters.year > 2100)) {
            warnings.push('年份可能不在合理范围内');
        }

        if (filters.month && (filters.month < 1 || filters.month > 12)) {
            errors.push('月份必须在1-12之间');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

module.exports = InvoiceFilterService;