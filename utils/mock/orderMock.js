/**
 * 生成模拟订单列表数据
 * @param {Number} page 页码
 * @param {Number} pageSize 每页数量
 * @returns {Array} 订单列表
 */
function getMockOrderList(page = 1, pageSize = 10) {
  const orders = [];
  const orderTypes = ['trip', 'delivery'];
  const statuses = ['pending', 'accepted', 'inProgress', 'completed', 'cancelled'];
  const fromLocations = ['上海', '北京', '广州', '深圳', '杭州'];
  const toLocations = ['都柏林', '伦敦', '巴黎', '纽约', '东京'];
  
  // 生成订单数据
  for (let i = 0; i < pageSize; i++) {
    const index = (page - 1) * pageSize + i;
    const typeIndex = index % 2;
    const statusIndex = index % 5;
    const fromIndex = index % 5;
    const toIndex = (index + 1) % 5;
    
    const orderType = orderTypes[typeIndex];
    const status = statuses[statusIndex];
    
    // 创建基本订单数据
    const order = {
      id: `O${page}${i}${Date.now().toString().substring(8)}`,
      orderType: orderType,
      orderTypeText: orderType === 'trip' ? '行程订单' : '捎带需求',
      status: status,
      statusText: getStatusText(status),
      fromLocation: fromLocations[fromIndex],
      toLocation: toLocations[toIndex],
      createTime: new Date(Date.now() - index * 86400000).toISOString(), // 每个订单日期依次减1天
      estimatedArrival: new Date(Date.now() + (10 - index % 10) * 86400000).toISOString(),
      totalAmount: (Math.floor(Math.random() * 10) + 5) * 50, // 随机金额
      paymentStatus: Math.random() > 0.3 ? 'paid' : 'unpaid', // 随机付款状态
    };
    
    // 添加用户信息
    if (orderType === 'trip') {
      order.traveler = {
        id: `user_${100 + typeIndex}`,
        name: ['李四', '王五', '赵六'][typeIndex % 3],
        avatar: '/images/default-avatar.png',
      };
      order.customer = {
        id: `user_${200 + typeIndex}`,
        name: ['张三', '刘一', '陈二'][typeIndex % 3],
        avatar: '/images/default-avatar.png',
      };
    } else {
      order.publisher = {
        id: `user_${200 + typeIndex}`,
        name: ['张三', '刘一', '陈二'][typeIndex % 3],
        avatar: '/images/default-avatar.png',
      };
      order.carrier = {
        id: `user_${100 + typeIndex}`,
        name: ['李四', '王五', '赵六'][typeIndex % 3],
        avatar: '/images/default-avatar.png',
      };
    }
    
    orders.push(order);
  }
  
  return orders;
}

/**
 * 生成模拟订单详情数据
 * @param {String} orderId 订单ID
 * @returns {Object} 订单详情
 */
function getMockOrderDetail(orderId) {
  // 从订单ID解析类型和状态（仅用于模拟）
  const typeIndex = parseInt(orderId.substring(1, 2)) % 2;
  const statusIndex = parseInt(orderId.substring(2, 3)) % 5;
  
  const orderTypes = ['trip', 'delivery'];
  const statuses = ['pending', 'accepted', 'inProgress', 'completed', 'cancelled'];
  
  const orderType = orderTypes[typeIndex];
  const status = statuses[statusIndex];
  
  // 构建基本订单数据
  const order = {
    id: orderId,
    orderType: orderType,
    orderTypeText: orderType === 'trip' ? '行程订单' : '捎带需求',
    status: status,
    statusText: getStatusText(status),
    createTime: new Date(Date.now() - statusIndex * 86400000).toISOString(),
    fromLocation: '上海',
    toLocation: '都柏林',
    estimatedArrival: new Date(Date.now() + (10 - statusIndex) * 86400000).toISOString(),
    totalAmount: (Math.floor(Math.random() * 10) + 5) * 50, // 随机金额
    paymentStatus: status === 'pending' ? 'unpaid' : 'paid', // 根据状态设置支付状态
    payTime: status === 'pending' ? null : new Date(Date.now() - (statusIndex - 1) * 86400000).toISOString(),
    remarks: '请小心轻放，避免碰撞。',
    steps: generateOrderSteps(status),
  };
  
  // 根据订单类型添加不同的字段
  if (orderType === 'trip') {
    order.traveler = {
      id: 'user_123',
      name: '李四',
      avatar: '/images/default-avatar.png',
      rating: '4.9',
      phone: '138****5678'
    };
    order.customer = {
      id: 'user_456',
      name: '张三',
      avatar: '/images/default-avatar.png',
      rating: '4.7',
      phone: '139****1234'
    };
    order.tripInfo = {
      departureTime: new Date(Date.now() + 5 * 86400000).toISOString(),
      arrivalTime: new Date(Date.now() + 6 * 86400000).toISOString(),
      flightNumber: 'CA123',
      maxWeight: '5kg'
    };
    
    // 客户需要帮助带的物品
    order.items = [{
      name: '电子产品',
      description: '一台新iPhone手机，已包装好',
      quantity: 1,
      weight: '0.5kg',
      size: '小',
      images: ['/images/default-avatar.png']
    }];
  } else {
    order.publisher = {
      id: 'user_456',
      name: '张三',
      avatar: '/images/default-avatar.png',
      rating: '4.7',
      phone: '139****1234'
    };
    order.carrier = {
      id: 'user_123',
      name: '李四',
      avatar: '/images/default-avatar.png',
      rating: '4.9',
      phone: '138****5678'
    };
    
    // 发布者需要捎带的物品
    order.items = [{
      name: '奶粉',
      description: '两罐爱尔兰奶粉',
      quantity: 2,
      weight: '2kg',
      size: '中',
      images: ['/images/default-avatar.png']
    }];
    
    // 捎带需求的额外信息
    order.deliveryInfo = {
      expectedDeliveryTime: new Date(Date.now() + 7 * 86400000).toISOString(),
      pickupAddress: '上海市浦东新区XX路XX号',
      deliveryAddress: '都柏林市XX区XX街XX号'
    };
  }
  
  return order;
}

/**
 * 生成订单状态流程步骤
 * @param {String} currentStatus 当前状态
 * @returns {Array} 订单步骤数组
 */
function generateOrderSteps(currentStatus) {
  const statusFlow = [
    { status: 'pending', title: '等待接单', desc: '订单已创建，等待接单' },
    { status: 'accepted', title: '已接单', desc: '订单已被接受' },
    { status: 'inProgress', title: '进行中', desc: '订单正在进行中' },
    { status: 'completed', title: '已完成', desc: '订单已完成' }
  ];
  
  // 如果是取消状态，添加取消步骤
  if (currentStatus === 'cancelled') {
    return [
      { status: 'pending', title: '等待接单', desc: '订单已创建，等待接单', time: new Date(Date.now() - 3 * 86400000).toISOString(), completed: true },
      { status: 'cancelled', title: '已取消', desc: '订单已取消', time: new Date().toISOString(), completed: true }
    ];
  }
  
  // 根据当前状态，标记已完成的步骤
  const steps = [];
  let foundCurrent = false;
  
  for (const step of statusFlow) {
    if (foundCurrent) {
      // 当前状态之后的步骤
      steps.push({
        ...step,
        time: null,
        completed: false
      });
    } else {
      // 已完成的步骤
      steps.push({
        ...step,
        time: new Date(Date.now() - steps.length * 86400000).toISOString(),
        completed: true
      });
      
      // 当找到当前状态时，标记
      if (step.status === currentStatus) {
        foundCurrent = true;
      }
    }
  }
  
  return steps;
}

/**
 * 获取订单状态文本
 * @param {String} status 状态代码
 * @returns {String} 状态文本
 */
function getStatusText(status) {
  const statusMap = {
    'pending': '待接单',
    'accepted': '已接单',
    'inProgress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  
  return statusMap[status] || status;
}

module.exports = {
  getMockOrderList,
  getMockOrderDetail
}; 