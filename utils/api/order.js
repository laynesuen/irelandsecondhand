const { request } = require('../http');
const mockData = require('../mock/orderMock');

/**
 * 创建订单
 * @param {Object} data 订单数据
 * @returns {Promise} 返回创建结果
 */
function createOrder(data) {
  // 在实际生产环境中，应该使用下面的代码调用后端API
  /*
  return request({
    url: '/orders',
    method: 'POST',
    data
  });
  */
  
  // 使用模拟数据
  return new Promise((resolve) => {
    setTimeout(() => {
      // 生成订单ID
      const orderId = 'O' + Date.now();
      
      // 返回成功创建的订单
      resolve({
        success: true,
        data: {
          orderId,
          ...data,
          status: 'pending',
          createTime: new Date().toISOString(),
        }
      });
    }, 500);
  });
}

/**
 * 获取订单列表
 * @param {Object} params 查询参数
 * @returns {Promise} 返回订单列表
 */
function getOrderList(params) {
  // 在实际生产环境中，应该使用下面的代码调用后端API
  /*
  return request({
    url: '/orders',
    method: 'GET',
    data: params
  });
  */
  
  // 使用模拟数据
  return new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = 10, status, keyword, orderType } = params;
      
      // 获取模拟数据
      let orderList = mockData.getMockOrderList(page, pageSize);
      
      // 根据状态过滤
      if (status && status !== 'all') {
        orderList = orderList.filter(order => order.status === status);
      }
      
      // 根据关键词过滤
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        orderList = orderList.filter(order => 
          order.fromLocation.toLowerCase().includes(lowerKeyword) ||
          order.toLocation.toLowerCase().includes(lowerKeyword) ||
          order.id.toLowerCase().includes(lowerKeyword)
        );
      }
      
      // 根据订单类型过滤
      if (orderType) {
        orderList = orderList.filter(order => order.orderType === orderType);
      }
      
      resolve({
        success: true,
        data: {
          list: orderList,
          total: 100,
          hasMore: page < 10 // 模拟只有10页数据
        }
      });
    }, 500);
  });
}

/**
 * 获取订单详情
 * @param {String} orderId 订单ID
 * @returns {Promise} 返回订单详情
 */
function getOrderDetail(orderId) {
  // 在实际生产环境中，应该使用下面的代码调用后端API
  /*
  return request({
    url: `/orders/${orderId}`,
    method: 'GET'
  });
  */
  
  // 使用模拟数据
  return new Promise((resolve) => {
    setTimeout(() => {
      const orderDetail = mockData.getMockOrderDetail(orderId);
      
      resolve({
        success: true,
        data: orderDetail
      });
    }, 500);
  });
}

/**
 * 更新订单状态
 * @param {String} orderId 订单ID
 * @param {String} status 新状态
 * @returns {Promise} 返回更新结果
 */
function updateOrderStatus(orderId, status) {
  // 在实际生产环境中，应该使用下面的代码调用后端API
  /*
  return request({
    url: `/orders/${orderId}/status`,
    method: 'PUT',
    data: { status }
  });
  */
  
  // 使用模拟数据
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          orderId,
          status,
          updateTime: new Date().toISOString()
        }
      });
    }, 500);
  });
}

/**
 * 支付订单
 * @param {String} orderId 订单ID
 * @returns {Promise} 返回支付结果
 */
function payOrder(orderId) {
  // 在实际生产环境中，应该使用下面的代码调用后端API
  /*
  return request({
    url: `/orders/${orderId}/pay`,
    method: 'POST'
  });
  */
  
  // 使用模拟数据
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          orderId,
          status: 'paid',
          payTime: new Date().toISOString()
        }
      });
    }, 500);
  });
}

/**
 * 获取微信支付参数
 * @param {String} orderId 订单ID
 * @returns {Promise} 返回支付参数
 */
function getPaymentParams(orderId) {
  // 在实际生产环境中，应该使用下面的代码调用后端API
  /*
  return request({
    url: `/orders/${orderId}/payment-params`,
    method: 'GET'
  });
  */
  
  // 使用模拟数据
  return new Promise((resolve) => {
    setTimeout(() => {
      // 微信支付要求参数
      const payParams = {
        timeStamp: '' + Math.floor(Date.now() / 1000), // 时间戳
        nonceStr: Math.random().toString(36).substr(2, 15), // 随机字符串
        package: 'prepay_id=wx' + Date.now(), // 预支付交易会话标识
        signType: 'MD5', // 签名算法
        paySign: 'MOCK_SIGNATURE_' + orderId // 签名，实际应由服务器计算
      };
      
      resolve({
        success: true,
        data: payParams
      });
    }, 500);
  });
}

module.exports = {
  createOrder,
  getOrderList,
  getOrderDetail,
  updateOrderStatus,
  payOrder,
  getPaymentParams
}; 