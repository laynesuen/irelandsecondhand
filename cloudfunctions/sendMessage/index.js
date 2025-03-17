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
  const { 
    content,         // 消息内容
    type = 'text',   // 消息类型: text, image, location, order
    receiver,        // 接收者ID
    tempId,          // 临时消息ID (客户端生成)
    conversationId,  // 会话ID (可选)
    postId,          // 相关帖子ID (可选)
    postType,        // 帖子类型 (可选): trip, carry
    metadata = {}    // 额外元数据 (例如位置、订单等信息)
  } = event
  
  try {
    // 参数校验
    if (!content && type !== 'image') {
      return {
        code: 400,
        message: '消息内容不能为空',
        data: null
      }
    }
    
    if (!receiver) {
      return {
        code: 400,
        message: '接收者不能为空',
        data: null
      }
    }
    
    // 验证用户登录
    const userRes = await db.collection('users').doc(openid).get()
    if (!userRes.data) {
      return {
        code: 401,
        message: '用户未登录',
        data: null
      }
    }
    
    // 查找或创建会话
    let conversation = null
    
    // 如果提供了会话ID，直接使用
    if (conversationId) {
      const convRes = await db.collection('conversations').doc(conversationId).get()
      if (convRes.data) {
        conversation = convRes.data
        
        // 验证发送者是否在会话中
        if (!conversation.participants.includes(openid)) {
          return {
            code: 403,
            message: '无权在此会话发送消息',
            data: null
          }
        }
      }
    }
    
    // 如果没找到会话，创建一个新会话
    if (!conversation) {
      const participants = [openid, receiver].sort()
      
      // 先查找是否有现有会话（如果有，应该优先使用）
      let convQuery = {
        participants: _.all(participants)
      }
      
      // 如果有相关帖子ID，加入查询条件
      if (postId) {
        convQuery.postId = postId
      }
      
      const existingConvRes = await db.collection('conversations')
        .where(convQuery)
        .get()
      
      if (existingConvRes.data && existingConvRes.data.length > 0) {
        conversation = existingConvRes.data[0]
      } else {
        // 创建新会话
        const newConversation = {
          participants,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
          lastMessage: type === 'text' ? content : `[${typeToText(type)}]`,
          lastMessageTime: db.serverDate(),
          lastSender: openid,
          unreadCount: {
            [openid]: 0,
            [receiver]: 1
          },
          postId: postId || null,
          postType: postType || null
        }
        
        const addResult = await db.collection('conversations').add({
          data: newConversation
        })
        
        conversation = {
          ...newConversation,
          _id: addResult._id
        }
      }
    }
    
    // 构建消息对象
    const messageData = {
      conversationId: conversation._id,
      sender: openid,
      receiver,
      content,
      type,
      createdAt: db.serverDate(),
      isRead: false,
      metadata
    }
    
    // 保存消息
    const addResult = await db.collection('messages').add({
      data: messageData
    })
    
    // 更新会话信息
    await db.collection('conversations').doc(conversation._id).update({
      data: {
        lastMessage: type === 'text' ? content : `[${typeToText(type)}]`,
        lastMessageTime: db.serverDate(),
        lastSender: openid,
        updatedAt: db.serverDate(),
        [`unreadCount.${receiver}`]: _.inc(1)
      }
    })
    
    // 触发消息通知（可选，根据需求实现）
    try {
      await cloud.callFunction({
        name: 'messageNotify',
        data: {
          receiver,
          sender: openid,
          messageType: type,
          conversationId: conversation._id
        }
      })
    } catch (notifyError) {
      console.error('发送通知失败:', notifyError)
    }
    
    // 返回结果
    return {
      code: 200,
      message: '发送消息成功',
      data: {
        messageId: addResult._id,
        tempId,
        sendTime: new Date(),
        conversationId: conversation._id
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    return {
      code: 500,
      message: '服务器错误',
      error: error.message,
      data: null
    }
  }
}

// 辅助函数：消息类型转文字
function typeToText(type) {
  const typeMap = {
    'text': '文本',
    'image': '图片',
    'location': '位置',
    'order': '订单'
  }
  return typeMap[type] || '消息'
} 