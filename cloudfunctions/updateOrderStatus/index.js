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
  
  if (!openid) {
    return {
      code: 401,
      message: '未登录',
      data: null
    }
  }
  
  // 获取请求参数
  const { orderId, status, note } = event
  
  if (!orderId) {
    return {
      code: 400,
      message: '订单ID不能为空',
      data: null
    }
  }
  
  if (!status) {
    return {
      code: 400,
      message: '状态不能为空',
      data: null
    }
  }
  
  // 验证状态值
  const validStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    return {
      code: 400,
      message: '无效的状态值',
      data: null
    }
  }
  
  try {
    // 获取用户信息
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()
    
    if (!userRes.data || userRes.data.length === 0) {
      return {
        code: 401,
        message: '用户不存在',
        data: null
      }
    }
    
    const user = userRes.data[0]
    
    // 检查用户状态
    if (user.status !== 'active') {
      return {
        code: 403,
        message: '您的账户已被禁用',
        data: null
      }
    }
    
    // 获取订单信息
    const orderRes = await db.collection('orders').doc(orderId).get()
    
    if (!orderRes.data) {
      return {
        code: 404,
        message: '订单不存在',
        data: null
      }
    }
    
    const order = orderRes.data
    
    // 确认用户是订单的参与者
    if (order.customerId !== openid && order.carrierId !== openid) {
      return {
        code: 403,
        message: '无权操作该订单',
        data: null
      }
    }
    
    // 确定用户角色
    const userRole = order.customerId === openid ? 'customer' : 'carrier'
    
    // 验证用户是否有权限更新到指定状态
    let canUpdate = false
    
    if (userRole === 'carrier') {
      // 承运方可以更新的状态
      if (order.status === 'pending' && (status === 'confirmed' || status === 'rejected')) {
        canUpdate = true
      } else if (order.status === 'confirmed' && (status === 'completed' || status === 'cancelled')) {
        canUpdate = true
      }
    } else if (userRole === 'customer') {
      // 发起方可以更新的状态
      if ((order.status === 'pending' || order.status === 'confirmed') && status === 'cancelled') {
        canUpdate = true
      }
    }
    
    if (!canUpdate) {
      return {
        code: 403,
        message: '当前状态下不能执行此操作',
        data: null
      }
    }
    
    // 如果是取消订单，需要恢复行程可用重量
    let updateTripWeight = false
    if (status === 'cancelled' || status === 'rejected') {
      updateTripWeight = true
    }
    
    // 更新订单状态
    const timelineItem = {
      status: status,
      time: db.serverDate(),
      operatorId: openid,
      operatorRole: userRole,
      note: note || `订单${status === 'confirmed' ? '已确认' : status === 'rejected' ? '已拒绝' : status === 'completed' ? '已完成' : '已取消'}`
    }
    
    await db.collection('orders').doc(orderId).update({
      data: {
        status: status,
        timeline: _.push(timelineItem)
      }
    })
    
    // 如果取消订单，恢复行程可用重量
    if (updateTripWeight && order.tripId) {
      await db.collection('trips').doc(order.tripId).update({
        data: {
          availableWeight: _.inc(order.totalWeight)
        }
      })
    }
    
    // 获取对方ID
    const targetId = userRole === 'customer' ? order.carrierId : order.customerId
    
    // 更新会话状态
    const conversationRes = await db.collection('conversations').where({
      participants: _.all([openid, targetId]),
      relatedOrderId: orderId
    }).get()
    
    if (conversationRes.data && conversationRes.data.length > 0) {
      const conversationId = conversationRes.data[0]._id
      
      // 发送系统消息
      await db.collection('messages').add({
        data: {
          conversationId: conversationId,
          senderId: 'system',
          content: `订单状态已更新为「${status === 'confirmed' ? '已确认' : status === 'rejected' ? '已拒绝' : status === 'completed' ? '已完成' : '已取消'}」`,
          type: 'system',
          sendTime: db.serverDate(),
          isRead: {
            [openid]: true,
            [targetId]: false
          }
        }
      })
      
      // 更新会话最后消息
      await db.collection('conversations').doc(conversationId).update({
        data: {
          lastMessage: {
            content: `订单状态已更新为「${status === 'confirmed' ? '已确认' : status === 'rejected' ? '已拒绝' : status === 'completed' ? '已完成' : '已取消'}」`,
            senderId: 'system',
            sendTime: db.serverDate(),
            type: 'system'
          },
          lastMessageTime: db.serverDate(),
          [`unreadCount.${targetId}`]: _.inc(1)
        }
      })
    }
    
    // 发送通知
    await cloud.callFunction({
      name: 'sendNotification',
      data: {
        targetUserId: targetId,
        title: '订单状态更新',
        content: `您的订单状态已更新为：${status === 'confirmed' ? '已确认' : status === 'rejected' ? '已拒绝' : status === 'completed' ? '已完成' : '已取消'}`,
        type: 'order',
        relationId: orderId
      }
    }).catch(err => {
      console.error('发送通知失败', err)
    })
    
    return {
      code: 200,
      message: '更新订单状态成功',
      data: {
        orderId: orderId,
        status: status
      }
    }
    
  } catch (err) {
    console.error('更新订单状态失败:', err)
    return {
      code: 500,
      message: '更新订单状态失败: ' + err.message,
      data: null
    }
  }
} 