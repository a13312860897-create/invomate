// 日期工具函数
export class DateUtils {
  /**
   * 获取当前月份（YYYY-MM格式）
   * @param {boolean} useCurrentMonth - 是否使用当前月份，false则使用配置的月份
   * @returns {string} 格式化的月份字符串
   */
  static getCurrentMonth(useCurrentMonth = true) {
    if (useCurrentMonth) {
      // 使用本地时间而不是UTC时间，避免时区问题
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    } else {
      // 可以在这里配置特定月份，或者从配置文件读取
      return '2025-11';
    }
  }

  /**
   * 获取指定月份的下一个月
   * @param {string} monthStr - 月份字符串 (YYYY-MM)
   * @returns {string} 下一个月的字符串
   */
  static getNextMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1); // month-1 因为Date的月份从0开始
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 7);
  }

  /**
   * 获取指定月份的上一个月
   * @param {string} monthStr - 月份字符串 (YYYY-MM)
   * @returns {string} 上一个月的字符串
   */
  static getPreviousMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  }

  /**
   * 格式化月份显示
   * @param {string} monthStr - 月份字符串 (YYYY-MM)
   * @returns {string} 格式化的显示文本
   */
  static formatMonthDisplay(monthStr) {
    const [year, month] = monthStr.split('-');
    return `${year}年${month}月`;
  }

  /**
   * 检查是否为当前月份
   * @param {string} monthStr - 月份字符串 (YYYY-MM)
   * @returns {boolean} 是否为当前月份
   */
  static isCurrentMonth(monthStr) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return monthStr === currentMonth;
  }
}

// 全局配置
export const DateConfig = {
  // 设置为true使用当前月份，false使用固定月份
  USE_CURRENT_MONTH: false,  // 设置为false，使用固定月份2025-11
  // 当USE_CURRENT_MONTH为false时使用的固定月份
  FIXED_MONTH: '2025-11'
};

// 便捷函数
export const getCurrentDisplayMonth = () => {
  return DateConfig.USE_CURRENT_MONTH 
    ? DateUtils.getCurrentMonth(true)
    : DateConfig.FIXED_MONTH;
};