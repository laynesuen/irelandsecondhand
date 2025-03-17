const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 发送通知
 */
exports.sendNotification = async (event, context) => {
  const { type, orderId, content, userId } = event;

  try {
    // 保存通知
    const notification = await db.collection('notifications').add({
      data: {
        type,
        orderId,
        content,
        userId,
        isRead: false,
        sendTime: db.serverDate()
      }
    });

    // 发送订阅消息
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: userId,
        templateId: process.env.TEMPLATE_ID,
        page: `pages/order-detail/order-detail?id=${orderId}`,
        data: {
          thing1: { value: content },
          time2: { value: new Date().toLocaleString() }
        }
      });
    } catch (error) {
      console.error('发送订阅消息失败:', error);
    }

    return {
      success: true,
      data: notification
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 获取用户通知列表
 */
exports.getUserNotifications = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { page = 1, pageSize = 20 } = event;

  try {
    const total = await db.collection('notifications')
      .where({
        userId: OPENID
      })
      .count();

    const notifications = await db.collection('notifications')
      .where({
        userId: OPENID
      })
      .orderBy('sendTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return {
      success: true,
      data: {
        total: total.total,
        page,
        pageSize,
        notifications: notifications.data
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 标记通知为已读
 */
exports.markNotificationAsRead = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { notificationId } = event;

  try {
    const result = await db.collection('notifications')
      .where({
        _id: notificationId,
        userId: OPENID
      })
      .update({
        data: {
          isRead: true,
          readTime: db.serverDate()
        }
      });

    if (result.stats.updated === 0) {
      return {
        success: false,
        message: '通知不存在或无权操作'
      };
    }

    return {
      success: true,
      message: '更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 发送支付成功通知
 */
exports.sendPaymentSuccessNotification = async (event, context) => {
  const { orderId, amount, paymentMethod, userId } = event;

  return exports.sendNotification({
    type: 'payment_success',
    orderId,
    content: `订单${orderId}支付成功，金额${amount}${paymentMethod === 'wechat' ? '元' : '欧元'}`,
    userId
  });
};

/**
 * 发送物流状态更新通知
 */
exports.sendLogisticsUpdateNotification = async (event, context) => {
  const { orderId, status, location, userId } = event;

  return exports.sendNotification({
    type: 'logistics_update',
    orderId,
    content: `订单${orderId}当前状态：${status}，位置：${location}`,
    userId
  });
};

/**
 * 发送包裹签收通知
 */
exports.sendPackageReceivedNotification = async (event, context) => {
  const { orderId, receiver, userId } = event;

  return exports.sendNotification({
    type: 'package_received',
    orderId,
    content: `订单${orderId}已被${receiver}签收`,
    userId
  });
}; 