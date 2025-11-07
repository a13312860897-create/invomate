/**
 * 统一的日期处理工具类
 * 解决项目中日期处理逻辑不一致的问题
 */
class DateUtils {
  /**
   * 获取指定日期的月份字符串 (YYYY-MM格式)
   * @param {Date|string} date - 日期对象或日期字符串
   * @returns {string} YYYY-MM格式的月份字符串
   */
  static getMonthString(date) {
    if (!date) return null;
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toISOString().slice(0, 7);
  }

  /**
   * 获取指定日期的日期字符串 (YYYY-MM-DD格式)
   * @param {Date|string} date - 日期对象或日期字符串
   * @returns {string} YYYY-MM-DD格式的日期字符串
   */
  static getDateString(date) {
    if (!date) return null;
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toISOString().slice(0, 10);
  }

  /**
   * 获取当前月份字符串
   * @returns {string} 当前月份的YYYY-MM格式字符串
   */
  static getCurrentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  /**
   * 获取指定月份的开始和结束日期
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Object} {startDate, endDate} 月份的开始和结束日期
   */
  static getMonthRange(monthString) {
    if (!monthString || !monthString.match(/^\d{4}-\d{2}$/)) {
      throw new Error('Invalid month string format. Expected YYYY-MM');
    }

    const [year, month] = monthString.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return { startDate, endDate };
  }

  /**
   * 检查日期是否在指定月份内
   * @param {Date|string} date - 要检查的日期
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {boolean} 是否在指定月份内
   */
  static isDateInMonth(date, monthString) {
    if (!date || !monthString) return false;
    return this.getMonthString(date) === monthString;
  }

  /**
   * 获取月份内的天数
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {number} 该月的天数
   */
  static getDaysInMonth(monthString) {
    const [year, month] = monthString.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }

  /**
   * 生成月份内的时间点数组（用于图表显示）
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @param {number} pointCount - 时间点数量，默认10个
   * @returns {Array} 时间点数组
   */
  static generateTimePoints(monthString, pointCount = 10) {
    const [year, monthNum] = monthString.split('-').map(Number);
    const daysInMonth = this.getDaysInMonth(monthString);
    
    const timePoints = [];
    for (let i = 0; i < pointCount; i++) {
      const dayOfMonth = Math.floor((daysInMonth / (pointCount - 1)) * i) + 1;
      const date = new Date(year, monthNum - 1, Math.min(dayOfMonth, daysInMonth));
      
      timePoints.push({
        date: date,
        label: `${monthNum}/${dayOfMonth}`,
        dayStart: (i * Math.floor(daysInMonth / pointCount)) + 1,
        dayEnd: Math.min((i + 1) * Math.floor(daysInMonth / pointCount), daysInMonth)
      });
    }
    
    return timePoints;
  }

  /**
   * 验证日期字符串格式
   * @param {string} dateString - 日期字符串
   * @param {string} format - 期望的格式 ('YYYY-MM' 或 'YYYY-MM-DD')
   * @returns {boolean} 是否符合格式
   */
  static validateDateFormat(dateString, format = 'YYYY-MM-DD') {
    if (!dateString) return false;
    
    const patterns = {
      'YYYY-MM': /^\d{4}-\d{2}$/,
      'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/
    };
    
    return patterns[format] ? patterns[format].test(dateString) : false;
  }

  /**
   * 获取发票的有效支付日期
   * 优先使用paidDate，如果没有则使用updatedAt
   * @param {Object} invoice - 发票对象
   * @returns {Date|null} 有效的支付日期
   */
  static getInvoicePaymentDate(invoice) {
    if (!invoice) return null;
    
    // 优先使用支付日期
    if (invoice.paidDate) {
      const paidDate = new Date(invoice.paidDate);
      if (!isNaN(paidDate.getTime())) {
        return paidDate;
      }
    }
    
    // 备选使用更新日期
    if (invoice.updatedAt) {
      const updatedDate = new Date(invoice.updatedAt);
      if (!isNaN(updatedDate.getTime())) {
        return updatedDate;
      }
    }
    
    return null;
  }

  /**
   * 解析月份字符串，返回年份和月份
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Object} {year, month} 年份和月份对象
   */
  static parseMonthString(monthString) {
    if (!monthString || !monthString.match(/^\d{4}-\d{2}$/)) {
      throw new Error('Invalid month string format. Expected YYYY-MM');
    }
    
    const [year, month] = monthString.split('-').map(Number);
    return { year, month };
  }

  /**
   * 获取发票的创建日期
   * @param {Object} invoice - 发票对象
   * @returns {Date|null} 创建日期
   */
  static getInvoiceCreationDate(invoice) {
    if (!invoice || !invoice.createdAt) return null;
    
    const createdDate = new Date(invoice.createdAt);
    return isNaN(createdDate.getTime()) ? null : createdDate;
  }
}

module.exports = DateUtils;