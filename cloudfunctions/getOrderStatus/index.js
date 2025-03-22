// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 参数解析
  const { orderId } = event

  try {
    // 参数校验
    if (!orderId) {
      return {
        success: false,
        code: 400,
        message: '参数错误：缺少订单ID',
        data: null
      }
    }

    // 验证用户登录
    const userRes = await db.collection('users').doc(openid).get()
    if (!userRes.data) {
      return {
        success: false,
        code: 401,
        message: '用户未登录',
        data: null
      }
    }

    // 获取订单
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return {
        success: false,
        code: 404,
        message: '订单不存在',
        data: null
      }
    }

    const order = orderRes.data

    // 验证用户权限（订单创建者或行程发布者）
    if (order.userId !== openid && order.carrierId !== openid) {
      return {
        success: false,
        code: 403,
        message: '无权查看此订单',
        data: null
      }
    }

    // 获取行程信息
    let trip = null
    if (order.tripId) {
      const tripRes = await db.collection('trips').doc(order.tripId).get()
      if (tripRes.data) {
        trip = {
          id: tripRes.data._id,
          fromCity: tripRes.data.fromCity,
          toCity: tripRes.data.toCity,
          date: tripRes.data.date,
          publisher: tripRes.data.publisher
        }
      }
    }

    // 获取捎带需求信息
    let carry = null
    if (order.carryId) {
      const carryRes = await db.collection('carries').doc(order.carryId).get()
      if (carryRes.data) {
        carry = {
          id: carryRes.data._id,
          fromCity: carryRes.data.fromCity,
          toCity: carryRes.data.toCity,
          deadline: carryRes.data.deadline,
          publisher: carryRes.data.publisher
        }
      }
    }

    // 获取相关用户信息
    const usersToFetch = [order.userId, order.carrierId].filter(id => id !== openid)
    
    const userInfo = {}
    if (usersToFetch.length > 0) {
      for (const userId of usersToFetch) {
        const userResult = await db.collection('users').doc(userId).get()
        if (userResult.data) {
          userInfo[userId] = {
            id: userResult.data._id,
            nickName: userResult.data.nickName,
            avatarUrl: userResult.data.avatarUrl
          }
        }
      }
    }

    // 格式化结果
    const result = {
      orderId: order._id,
      status: order.status,
      trip: trip,
      carry: carry,
      items: order.items,
      totalWeight: order.totalWeight,
      price: order.price,
      note: order.note,
      contactInfo: order.contactInfo,
      timeline: order.timeline,
      createTime: order.createTime,
      carrier: order.carrierId !== openid ? userInfo[order.carrierId] || null : null,
      customer: order.userId !== openid ? userInfo[order.userId] || null : null,
      userRole: order.userId === openid ? 'customer' : 'carrier'
    }

    return {
      success: true,
      code: 200,
      message: '获取订单成功',
      data: result
    }
  } catch (error) {
    console.error('获取订单失败:', error)
    return {
      success: false,
      code: 500,
      message: '服务器错误',
      error: error.message,
      data: null
    }
  }
} 