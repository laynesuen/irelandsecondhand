const cloud = require('wx-server-sdk');

/**
 * 发送支付成功通知
 * @param {String} orderId 订单ID
 * @param {Number} amount 支付金额
 * @param {String} paymentMethod 支付方式
 * @returns {Promise} 返回通知结果
 */
export const sendPaymentSuccessNotification = async (orderId, amount, paymentMethod, userId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'notification',
      data: {
        action: 'sendPaymentSuccessNotification',
        orderId,
        amount,
        paymentMethod,
        userId
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('发送支付成功通知失败:', error);
    throw error;
  }
};

/**
 * 发送物流状态更新通知
 * @param {String} orderId 订单ID
 * @param {String} status 物流状态
 * @param {String} location 当前位置
 * @returns {Promise} 返回通知结果
 */
export const sendLogisticsUpdateNotification = async (orderId, status, location, userId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'notification',
      data: {
        action: 'sendLogisticsUpdateNotification',
        orderId,
        status,
        location,
        userId
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('发送物流状态更新通知失败:', error);
    throw error;
  }
};

/**
 * 发送包裹签收通知
 * @param {String} orderId 订单ID
 * @param {String} receiver 收件人
 * @returns {Promise} 返回通知结果
 */
export const sendPackageReceivedNotification = async (orderId, receiver, userId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'notification',
      data: {
        action: 'sendPackageReceivedNotification',
        orderId,
        receiver,
        userId
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('发送包裹签收通知失败:', error);
    throw error;
  }
};

/**
 * 获取用户通知列表
 * @param {String} userId 用户ID
 * @param {Number} page 页码
 * @param {Number} pageSize 每页数量
 * @returns {Promise} 返回通知列表
 */
export const getUserNotifications = async (page = 1, pageSize = 20) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'notification',
      data: {
        page,
        pageSize
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('获取通知列表失败:', error);
    throw error;
  }
};

/**
 * 标记通知为已读
 * @param {String} notificationId 通知ID
 * @returns {Promise} 返回更新结果
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'notification',
      data: {
        action: 'markNotificationAsRead',
        notificationId
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('标记通知已读失败:', error);
    throw error;
  }
};

module.exports = {
  sendPaymentSuccessNotification,
  sendLogisticsUpdateNotification,
  sendPackageReceivedNotification,
  getUserNotifications,
  markNotificationAsRead
}; 