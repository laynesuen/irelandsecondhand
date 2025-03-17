const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 创建订单
 */
exports.createOrder = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { productInfo, address, amount } = event;

  try {
    const result = await db.collection('orders').add({
      data: {
        userId: OPENID,
        productInfo,
        address,
        amount,
        status: 'unpaid',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      data: {
        orderId: result._id
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
 * 获取订单详情
 */
exports.getOrderDetail = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { orderId } = event;

  try {
    const order = await db.collection('orders')
      .where({
        _id: orderId,
        userId: OPENID // 只能查看自己的订单
      })
      .get();

    if (order.data.length === 0) {
      return {
        success: false,
        message: '订单不存在或无权访问'
      };
    }

    return {
      success: true,
      data: order.data[0]
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 获取用户订单列表
 */
exports.getUserOrders = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { page = 1, pageSize = 20, status } = event;

  try {
    const query = {
      userId: OPENID
    };
    
    if (status) {
      query.status = status;
    }

    const total = await db.collection('orders')
      .where(query)
      .count();

    const orders = await db.collection('orders')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return {
      success: true,
      data: {
        total: total.total,
        page,
        pageSize,
        orders: orders.data
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
 * 更新订单状态
 */
exports.updateOrderStatus = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { orderId, status } = event;

  try {
    const result = await db.collection('orders')
      .where({
        _id: orderId,
        userId: OPENID
      })
      .update({
        data: {
          status,
          updateTime: db.serverDate()
        }
      });

    if (result.stats.updated === 0) {
      return {
        success: false,
        message: '订单不存在或无权操作'
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