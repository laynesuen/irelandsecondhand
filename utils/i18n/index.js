const app = getApp();
const zh_CN = require('./zh_CN');
const en_US = require('./en_US');

// 语言包映射
const locales = {
  'zh-CN': zh_CN,
  'en-US': en_US
};

/**
 * 获取文本的翻译
 * @param {string} key 文本键值
 * @param {Object} params 替换参数对象
 * @returns {string} 翻译后的文本
 */
function t(key, params = {}) {
  // 获取当前语言设置
  const currentLocale = app.globalData.locale || 'zh-CN';
  
  // 获取对应语言包
  const localeData = locales[currentLocale] || locales['zh-CN'];
  
  // 通过键值获取文本
  let text = getTextByPath(localeData, key);
  
  // 如果未找到文本，尝试使用默认语言（中文）
  if (!text && currentLocale !== 'zh-CN') {
    text = getTextByPath(locales['zh-CN'], key);
  }
  
  // 如果仍未找到文本，使用键值作为文本
  if (!text) {
    console.warn(`文本键值未找到: ${key}`);
    text = key;
  }
  
  // 替换参数
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(paramKey => {
      const regex = new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g');
      text = text.replace(regex, params[paramKey]);
    });
  }
  
  return text;
}

/**
 * 根据路径获取对象中的值
 * @param {Object} obj 数据对象
 * @param {string} path 路径，如：'common.button.submit'
 * @returns {string|undefined} 文本或undefined
 */
function getTextByPath(obj, path) {
  if (!obj || !path) return undefined;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return undefined;
    }
    result = result[key];
  }
  
  return result;
}

/**
 * 切换语言
 * @param {string} locale 目标语言代码，如'zh-CN'或'en-US'
 * @returns {boolean} 是否成功切换
 */
function switchLocale(locale) {
  if (!locales[locale]) {
    console.error(`不支持的语言: ${locale}`);
    return false;
  }
  
  try {
    // 更新全局语言设置
    app.globalData.locale = locale;
    
    // 保存设置到本地存储
    wx.setStorageSync('userLocale', locale);
    
    // 通知页面刷新语言
    notifyPagesLocaleChanged();
    
    console.log(`语言已切换为: ${locale}`);
    return true;
  } catch (error) {
    console.error('切换语言失败:', error);
    return false;
  }
}

/**
 * 通知所有页面语言已变更
 */
function notifyPagesLocaleChanged() {
  const pages = getCurrentPages();
  if (!pages || pages.length === 0) return;
  
  pages.forEach(page => {
    if (page && page.onLocaleChanged) {
      try {
        page.onLocaleChanged();
      } catch (error) {
        console.error(`通知页面语言变更失败:`, error);
      }
    }
  });
}

/**
 * 获取当前语言代码
 * @returns {string} 当前语言代码
 */
function getCurrentLocale() {
  return app.globalData.locale || 'zh-CN';
}

/**
 * 获取支持的语言列表
 * @returns {Array} 支持的语言列表
 */
function getSupportedLocales() {
  return Object.keys(locales).map(code => ({
    code,
    name: locales[code].__name || code
  }));
}

module.exports = {
  t,
  switchLocale,
  getCurrentLocale,
  getSupportedLocales
}; 