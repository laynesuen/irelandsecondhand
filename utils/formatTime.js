/**
 * 日期时间格式化工具
 */

/**
 * 将日期格式化为 YYYY-MM-DD HH:mm:ss 格式的字符串
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 将日期格式化为 YYYY-MM-DD 格式的字符串
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 将日期格式化为 HH:mm:ss 格式的字符串
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(date) {
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  
  return `${hour}:${minute}:${second}`;
}

/**
 * 将日期格式化为 MM-DD HH:mm 格式的字符串
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期时间字符串
 */
function formatMonthDayTime(date) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  
  return `${month}-${day} ${hour}:${minute}`;
}

/**
 * 将ISO日期字符串转换为本地日期时间格式
 * @param {string} isoString ISO格式的日期字符串
 * @returns {string} 格式化后的日期时间字符串
 */
function formatISOToLocal(isoString) {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    return formatDateTime(date);
  } catch (e) {
    console.error('无效的ISO日期字符串:', isoString);
    return '';
  }
}

/**
 * 获取相对时间描述（例如：刚刚、5分钟前、1小时前等）
 * @param {Date|string} date 日期对象或日期字符串
 * @returns {string} 相对时间描述
 */
function getRelativeTime(date) {
  if (!date) return '';
  
  // 如果传入的是字符串，转换为Date对象
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const now = new Date();
  const diff = now - dateObj; // 时间差（毫秒）
  
  // 不同时间范围的处理
  if (diff < 60000) { // 1分钟内
    return '刚刚';
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`;
  } else if (diff < 604800000) { // 7天内
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    // 超过7天，返回具体日期
    return formatDate(dateObj);
  }
}

module.exports = {
  formatDateTime,
  formatDate,
  formatTime,
  formatMonthDayTime,
  formatISOToLocal,
  getRelativeTime
}; 