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
  const { 
    tripId, 
    itemDescription, 
    totalWeight, 
    price, 
    customerNote 
  } = event
  
  // 参数验证
  if (!tripId) {
    return {
      code: 400,
      message: '行程ID不能为空',
      data: null
    }
  }
  
  if (!itemDescription) {
    return {
      code: 400,
      message: '物品描述不能为空',
      data: null
    }
  }
  
  if (!totalWeight || isNaN(parseFloat(totalWeight)) || parseFloat(totalWeight) <= 0) {
    return {
      code: 400,
      message: '物品重量必须是大于0的数字',
      data: null
    }
  }
  
  if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    return {
      code: 400,
      message: '价格必须是大于0的数字',
      data: null
    }
  }
  
  const parsedTotalWeight = parseFloat(totalWeight)
  const parsedPrice = parseFloat(price)
  
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
    
    // 检查用户是否被禁用
    if (user.status !== 'active') {
      return {
        code: 403,
        message: '您的账户已被禁用',
        data: null
      }
    }
    
    // 获取行程信息
    const tripRes = await db.collection('trips').doc(tripId).get()
    
    if (!tripRes.data) {
      return {
        code: 404,
        message: '行程不存在',
        data: null
      }
    }
    
    const trip = tripRes.data
    
    // 判断行程是否已取消
    if (trip.status === 'cancelled') {
      return {
        code: 400,
        message: '该行程已取消，无法创建订单',
        data: null
      }
    }
    
    // 判断行程是否已结束
    const tripDate = new Date(trip.date)
    const now = new Date()
    
    if (tripDate < now) {
      return {
        code: 400,
        message: '该行程已结束，无法创建订单',
        data: null
      }
    }
    
    // 判断行程是否是自己发布的
    if (trip.userId === openid) {
      return {
        code: 400,
        message: '不能为自己发布的行程创建订单',
        data: null
      }
    }
    
    // 判断行程是否有足够的剩余空间
    if (trip.availableWeight < parsedTotalWeight) {
      return {
        code: 400,
        message: `行程剩余可用重量不足，当前剩余: ${trip.availableWeight}kg`,
        data: null
      }
    }
    
    // 创建订单
    const orderData = {
      tripId: tripId,
      customerId: openid,
      carrierId: trip.userId,
      itemDescription: itemDescription,
      totalWeight: parsedTotalWeight,
      price: parsedPrice,
      customerNote: customerNote || '',
      status: 'pending',
      createTime: db.serverDate(),
      timeline: [
        {
          status: 'pending',
          time: db.serverDate(),
          operatorId: openid,
          operatorRole: 'customer',
          note: '订单创建'
        }
      ]
    }
    
    const orderRes = await db.collection('orders').add({
      data: orderData
    })
    
    if (!orderRes._id) {
      return {
        code: 500,
        message: '创建订单失败',
        data: null
      }
    }
    
    // 更新行程的可用重量
    await db.collection('trips').doc(tripId).update({
      data: {
        availableWeight: _.inc(-parsedTotalWeight)
      }
    })
    
    // 创建订单和行程发布者的对话
    const conversationData = {
      participants: [openid, trip.userId],
      lastMessage: {
        content: '我有货物需要您帮忙带，已创建订单，请查看',
        senderId: openid,
        sendTime: db.serverDate(),
        type: 'text'
      },
      lastMessageTime: db.serverDate(),
      unreadCount: {
        [openid]: 0,
        [trip.userId]: 1
      },
      relatedPostId: tripId,
      relatedOrderId: orderRes._id,
      createTime: db.serverDate()
    }
    
    const conversationRes = await db.collection('conversations').add({
      data: conversationData
    })
    
    // 发送系统消息到对话
    if (conversationRes._id) {
      await db.collection('messages').add({
        data: {
          conversationId: conversationRes._id,
          senderId: 'system',
          content: `订单已创建，订单号: ${orderRes._id}`,
          type: 'system',
          sendTime: db.serverDate(),
          isRead: {
            [openid]: true,
            [trip.userId]: false
          }
        }
      })
      
      // 发送订单详情消息
      await db.collection('messages').add({
        data: {
          conversationId: conversationRes._id,
          senderId: openid,
          content: JSON.stringify({
            orderId: orderRes._id,
            itemDescription: itemDescription,
            totalWeight: parsedTotalWeight,
            price: parsedPrice,
            status: 'pending'
          }),
          type: 'order',
          sendTime: db.serverDate(),
          isRead: {
            [openid]: true,
            [trip.userId]: false
          }
        }
      })
    }
    
    // 发送通知给行程创建者
    await cloud.callFunction({
      name: 'sendNotification',
      data: {
        targetUserId: trip.userId,
        title: '新订单通知',
        content: `您有新的订单请求，物品: ${itemDescription.substring(0, 10)}${itemDescription.length > 10 ? '...' : ''}`,
        type: 'order',
        relationId: orderRes._id
      }
    }).catch(err => {
      console.error('发送通知失败', err)
    })
    
    return {
      code: 200,
      message: '创建订单成功',
      data: {
        orderId: orderRes._id,
        conversationId: conversationRes ? conversationRes._id : null
      }
    }
    
  } catch (err) {
    console.error('创建订单失败:', err)
    return {
      code: 500,
      message: '创建订单失败: ' + err.message,
      data: null
    }
  }
} 