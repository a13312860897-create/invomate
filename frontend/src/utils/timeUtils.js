/**
 * 时间工具函数
 * 用于动态时间段分割和计算
 */

/**
 * 计算两个日期之间的天数差
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {number} 天数差
 */
export const getDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 根据日期跨度自动确定最佳的时间分组级别
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {string} 分组级别：'day', 'week', 'month', 'quarter', 'year'
 */
export const getOptimalGroupBy = (startDate, endDate) => {
  const days = getDaysDifference(startDate, endDate);
  
  if (days <= 30) {
    return 'day';      // 30天内：按天分组
  } else if (days <= 90) {
    return 'week';     // 3个月内：按周分组
  } else if (days <= 730) {
    return 'month';    // 2年内：按月分组
  } else if (days <= 1460) {
    return 'quarter';  // 4年内：按季度分组
  } else {
    return 'year';     // 4年以上：按年分组
  }
};

/**
 * 生成动态时间段节点（固定10个节点）
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @param {number} nodeCount - 节点数量，默认10个
 * @returns {Array} 时间节点数组
 */
export const generateTimeNodes = (startDate, endDate, nodeCount = 10) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = getDaysDifference(start, end);
  const intervalDays = Math.ceil(totalDays / nodeCount);
  
  const nodes = [];
  
  for (let i = 0; i < nodeCount; i++) {
    const nodeDate = new Date(start);
    nodeDate.setDate(start.getDate() + (i * intervalDays));
    
    // 确保最后一个节点不超过结束日期
    if (i === nodeCount - 1 || nodeDate > end) {
      nodes.push(end);
      break;
    } else {
      nodes.push(new Date(nodeDate));
    }
  }
  
  return nodes;
};

/**
 * 根据分组级别格式化日期标签
 * @param {Date} date - 日期对象
 * @param {string} groupBy - 分组级别
 * @returns {string} 格式化的日期标签
 */
export const formatDateLabel = (date, groupBy) => {
  const d = new Date(date);
  
  switch (groupBy) {
    case 'day':
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    case 'week':
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return `${weekStart.getMonth() + 1}/${weekStart.getDate()}周`;
    case 'month':
      return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
    case 'quarter':
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}Q${quarter}`;
    case 'year':
      return d.getFullYear().toString();
    default:
      return d.toLocaleDateString('zh-CN');
  }
};

/**
 * 生成智能时间段参数
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {Object} 包含groupBy和nodes的对象
 */
export const generateSmartTimeParams = (startDate, endDate) => {
  const groupBy = getOptimalGroupBy(startDate, endDate);
  const nodes = generateTimeNodes(startDate, endDate, 10);
  
  return {
    groupBy,
    nodes,
    nodeCount: nodes.length,
    totalDays: getDaysDifference(startDate, endDate),
    labels: nodes.map(node => formatDateLabel(node, groupBy))
  };
};

/**
 * 将日期范围分割为指定数量的时间段
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @param {number} segments - 分割段数，默认10
 * @returns {Array} 时间段数组，每个元素包含start和end
 */
export const divideDateRange = (startDate, endDate, segments = 10) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalMs = end.getTime() - start.getTime();
  const segmentMs = totalMs / segments;
  
  const ranges = [];
  
  for (let i = 0; i < segments; i++) {
    const segmentStart = new Date(start.getTime() + (i * segmentMs));
    const segmentEnd = new Date(start.getTime() + ((i + 1) * segmentMs));
    
    // 确保最后一个段的结束时间是原始结束时间
    if (i === segments - 1) {
      segmentEnd.setTime(end.getTime());
    }
    
    ranges.push({
      start: segmentStart,
      end: segmentEnd,
      startStr: segmentStart.toISOString().split('T')[0],
      endStr: segmentEnd.toISOString().split('T')[0],
      label: formatDateLabel(segmentStart, getOptimalGroupBy(segmentStart, segmentEnd))
    });
  }
  
  return ranges;
};