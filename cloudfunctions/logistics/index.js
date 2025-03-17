const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 查询物流信息
 */
exports.queryLogistics = async (event, context) => {
  const { trackingNumber, carrier } = event;

  try {
    // 调用快递100 API
    const res = await cloud.callContainer({
      path: '/api/logistics/query',
      method: 'GET',
      data: {
        trackingNumber,
        carrier,
        key: process.env.EXPRESS_API_KEY
      },
      header: {
        'X-WX-SERVICE': 'express-service',
        'content-type': 'application/json'
      }
    });

    if (res.data.success) {
      return {
        success: true,
        data: res.data
      };
    }

    return {
      success: false,
      message: res.data.message || '查询物流信息失败'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 更新物流信息
 */
exports.updateLogistics = async (event, context) => {
  const { orderId, trackingNumber, carrier } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    // 验证订单
    const order = await db.collection('orders')
      .where({
        _id: orderId,
        userId: OPENID
      })
      .get();

    if (!order.data.length) {
      return {
        success: false,
        message: '订单不存在或无权操作'
      };
    }

    // 查询物流信息
    const logisticsRes = await exports.queryLogistics({
      trackingNumber,
      carrier
    });

    if (!logisticsRes.success) {
      return logisticsRes;
    }

    // 保存物流信息
    await db.collection('logistics').add({
      data: {
        orderId,
        trackingNumber,
        carrier,
        status: logisticsRes.data.status,
        currentLocation: logisticsRes.data.currentLocation,
        estimatedArrival: logisticsRes.data.estimatedArrival,
        trackingHistory: logisticsRes.data.trackingHistory,
        updateTime: db.serverDate()
      }
    });

    // 更新订单状态
    await db.collection('orders')
      .doc(orderId)
      .update({
        data: {
          status: 'shipping',
          updateTime: db.serverDate()
        }
      });

    // 发送物流状态更新通知
    await cloud.callFunction({
      name: 'notification',
      data: {
        action: 'sendLogisticsUpdateNotification',
        orderId,
        status: logisticsRes.data.status,
        location: logisticsRes.data.currentLocation,
        userId: OPENID
      }
    });

    return {
      success: true,
      data: logisticsRes.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 获取物流状态
 */
exports.getLogisticsStatus = async (event, context) => {
  const { orderId } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    const logistics = await db.collection('logistics')
      .where({
        orderId
      })
      .orderBy('updateTime', 'desc')
      .limit(1)
      .get();

    if (!logistics.data.length) {
      return {
        success: false,
        message: '未找到物流信息'
      };
    }

    return {
      success: true,
      data: logistics.data[0]
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 同步物流信息
 */
exports.syncLogistics = async (event, context) => {
  const { orderId } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    const logistics = await db.collection('logistics')
      .where({
        orderId
      })
      .orderBy('updateTime', 'desc')
      .limit(1)
      .get();

    if (!logistics.data.length) {
      return {
        success: false,
        message: '未找到物流信息'
      };
    }

    const { trackingNumber, carrier } = logistics.data[0];
    
    // 重新查询物流信息
    const logisticsRes = await exports.queryLogistics({
      trackingNumber,
      carrier
    });

    if (!logisticsRes.success) {
      return logisticsRes;
    }

    // 更新物流信息
    await db.collection('logistics')
      .doc(logistics.data[0]._id)
      .update({
        data: {
          status: logisticsRes.data.status,
          currentLocation: logisticsRes.data.currentLocation,
          estimatedArrival: logisticsRes.data.estimatedArrival,
          trackingHistory: logisticsRes.data.trackingHistory,
          updateTime: db.serverDate()
        }
      });

    // 如果状态发生变化，发送通知
    if (logisticsRes.data.status !== logistics.data[0].status) {
      await cloud.callFunction({
        name: 'notification',
        data: {
          action: 'sendLogisticsUpdateNotification',
          orderId,
          status: logisticsRes.data.status,
          location: logisticsRes.data.currentLocation,
          userId: OPENID
        }
      });
    }

    return {
      success: true,
      data: logisticsRes.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}; 