// utils/http.js
const BASE_URL = 'https://api.example.com'; // 实际开发中替换为真实API地址

/**
 * 基础请求函数
 * @param {Object} options 请求选项
 * @returns {Promise} 请求结果
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data, header = {} } = options;
    
    // 获取token
    const token = wx.getStorageSync('token');
    
    // 设置通用header
    const headers = {
      'Content-Type': 'application/json',
      ...header
    };
    
    // 如果有token则添加到header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 发起请求
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: headers,
      success: (res) => {
        const { statusCode, data } = res;
        
        // 请求成功
        if (statusCode >= 200 && statusCode < 300) {
          resolve(data);
        } 
        // 未授权
        else if (statusCode === 401) {
          // 清除token
          wx.removeStorageSync('token');
          
          // 跳转到登录页
          wx.navigateTo({
            url: '/pages/login/login'
          });
          
          reject(new Error('未授权，请重新登录'));
        } 
        // 其他错误
        else {
          reject(new Error(data.message || '请求失败'));
        }
      },
      fail: (err) => {
        // 网络错误
        wx.showToast({
          title: '网络异常，请稍后重试',
          icon: 'none'
        });
        
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });
  });
}

/**
 * GET请求
 * @param {String} url 请求地址
 * @param {Object} data 请求参数
 * @param {Object} header 请求头
 * @returns {Promise} 请求结果
 */
function get(url, data = {}, header = {}) {
  return request({
    url,
    method: 'GET',
    data,
    header
  });
}

/**
 * POST请求
 * @param {String} url 请求地址
 * @param {Object} data 请求参数
 * @param {Object} header 请求头
 * @returns {Promise} 请求结果
 */
function post(url, data = {}, header = {}) {
  return request({
    url,
    method: 'POST',
    data,
    header
  });
}

/**
 * PUT请求
 * @param {String} url 请求地址
 * @param {Object} data 请求参数
 * @param {Object} header 请求头
 * @returns {Promise} 请求结果
 */
function put(url, data = {}, header = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    header
  });
}

/**
 * DELETE请求
 * @param {String} url 请求地址
 * @param {Object} data 请求参数
 * @param {Object} header 请求头
 * @returns {Promise} 请求结果
 */
function del(url, data = {}, header = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    header
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  del
}; 