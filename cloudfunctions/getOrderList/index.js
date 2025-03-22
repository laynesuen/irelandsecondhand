// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate
const MAX_LIMIT = 20

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  if (!openid) {
    return {
      code: 401,
      message: '未登录',
      data: null
    }
  }
  
  // 获取请求参数
  const { role = 'all', status = 'all', page = 1, pageSize = 10 } = event
  
  try {
    // 构建查询条件
    let query = {}
    
    // 根据角色筛选
    if (role === 'customer') {
      query.customerId = openid
    } else if (role === 'carrier') {
      query.carrierId = openid
    } else {
      // 角色为all，同时查询两个角色的订单
      query = _.or([
        { customerId: openid },
        { carrierId: openid }
      ])
    }
    
    // 根据状态筛选
    if (status !== 'all') {
      query.status = status
    }
    
    // 计算分页
    const skip = (page - 1) * pageSize
    
    // 查询订单总数
    const countResult = await db.collection('orders').where(query).count()
    const total = countResult.total
    
    // 查询订单列表
    const ordersResult = await db.collection('orders')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
    
    const orders = ordersResult.data
    
    if (orders.length === 0) {
      return {
        code: 200,
        message: '获取订单列表成功',
        data: {
          total,
          page,
          pageSize,
          orders: []
        }
      }
    }
    
    // 获取关联的行程ID和用户ID
    const tripIds = []
    const userIds = []
    
    orders.forEach(order => {
      if (order.tripId && !tripIds.includes(order.tripId)) {
        tripIds.push(order.tripId)
      }
      
      // 获取交互方的用户ID
      if (order.customerId === openid && order.carrierId && !userIds.includes(order.carrierId)) {
        userIds.push(order.carrierId)
      } else if (order.carrierId === openid && order.customerId && !userIds.includes(order.customerId)) {
        userIds.push(order.customerId)
      }
    })
    
    // 查询关联行程信息
    let trips = []
    if (tripIds.length > 0) {
      const tripsResult = await db.collection('trips').where({
        _id: _.in(tripIds)
      }).get()
      trips = tripsResult.data
    }
    
    // 查询关联用户信息
    let users = []
    if (userIds.length > 0) {
      const usersResult = await db.collection('users').where({
        openid: _.in(userIds)
      }).get()
      users = usersResult.data
    }
    
    // 整合数据
    const formattedOrders = orders.map(order => {
      // 确定用户角色
      let userRole = 'unknown'
      if (order.customerId === openid) {
        userRole = 'customer'
      } else if (order.carrierId === openid) {
        userRole = 'carrier'
      }
      
      // 查找关联的行程信息
      const trip = trips.find(t => t._id === order.tripId) || null
      
      // 查找交互方的用户信息
      let counterpartId = userRole === 'customer' ? order.carrierId : order.customerId
      const counterpart = users.find(u => u.openid === counterpartId) || null
      
      // 格式化日期
      const createTime = order.createTime ? new Date(order.createTime).toLocaleString() : '未知时间'
      
      return {
        orderId: order._id,
        userRole,
        status: order.status,
        price: order.price,
        totalWeight: order.totalWeight,
        createTime,
        tripId: order.tripId,
        trip: trip ? {
          fromCity: trip.fromCity,
          toCity: trip.toCity,
          date: trip.date
        } : null,
        counterpart: counterpart ? {
          openid: counterpart.openid,
          nickName: counterpart.nickName,
          avatarUrl: counterpart.avatarUrl
        } : null
      }
    })
    
    return {
      code: 200,
      message: '获取订单列表成功',
      data: {
        total,
        page,
        pageSize,
        hasMore: total > page * pageSize,
        orders: formattedOrders
      }
    }
    
  } catch (err) {
    console.error('获取订单列表失败:', err)
    return {
      code: 500,
      message: '获取订单列表失败: ' + err.message,
      data: null
    }
  }
} 