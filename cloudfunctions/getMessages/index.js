// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 参数解析
  const { 
    conversationId, // 会话ID
    targetId,       // 对话目标ID（如果没有会话ID，使用目标ID创建会话）
    postId,         // 帖子ID（可选）
    postType,       // 帖子类型（可选）
    pageSize = 20,  // 每页消息数量
    lastId          // 上一页最后一条消息ID（用于分页）
  } = event

  try {
    // 验证用户登录
    const userRes = await db.collection('users').doc(openid).get()
    if (!userRes.data) {
      return {
        code: 401,
        message: '用户未登录',
        data: null
      }
    }

    let conversation = null
    let targetUser = null

    // 如果提供了会话ID，则直接获取会话
    if (conversationId) {
      const convRes = await db.collection('conversations').doc(conversationId).get()
      if (!convRes.data) {
        return {
          code: 404,
          message: '会话不存在',
          data: null
        }
      }

      conversation = convRes.data

      // 验证用户是否是会话参与者
      if (!conversation.participants.includes(openid)) {
        return {
          code: 403,
          message: '无权访问此会话',
          data: null
        }
      }

      // 获取目标用户ID（会话中的另一方）
      const targetUserId = conversation.participants.find(id => id !== openid)
      if (targetUserId) {
        const targetUserRes = await db.collection('users').doc(targetUserId).get()
        if (targetUserRes.data) {
          targetUser = {
            _id: targetUserRes.data._id,
            nickName: targetUserRes.data.nickName,
            avatarUrl: targetUserRes.data.avatarUrl
          }
        }
      }
    } 
    // 如果提供了目标用户ID，则查找或创建会话
    else if (targetId) {
      // 先尝试查找现有会话
      const participants = [openid, targetId].sort()
      let convQuery = {
        participants: _.all(participants)
      }
      
      // 如果有帖子ID，则加入查询条件
      if (postId) {
        convQuery.postId = postId
      }
      
      const existingConvRes = await db.collection('conversations')
        .where(convQuery)
        .get()
      
      if (existingConvRes.data && existingConvRes.data.length > 0) {
        conversation = existingConvRes.data[0]
      } else {
        // 获取目标用户信息
        const targetUserRes = await db.collection('users').doc(targetId).get()
        if (!targetUserRes.data) {
          return {
            code: 404,
            message: '目标用户不存在',
            data: null
          }
        }

        // 创建新会话
        const newConversation = {
          participants,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
          lastMessage: '',
          lastMessageTime: db.serverDate(),
          unreadCount: {
            [openid]: 0,
            [targetId]: 0
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

        // 设置目标用户信息
        targetUser = {
          _id: targetUserRes.data._id,
          nickName: targetUserRes.data.nickName,
          avatarUrl: targetUserRes.data.avatarUrl
        }
      }
    } else {
      return {
        code: 400,
        message: '参数错误：需要提供conversationId或targetId',
        data: null
      }
    }

    // 标记消息为已读
    if (conversation._id) {
      await db.collection('conversations').doc(conversation._id).update({
        data: {
          [`unreadCount.${openid}`]: 0
        }
      })
      
      await db.collection('messages').where({
        conversationId: conversation._id,
        receiver: openid,
        isRead: false
      }).update({
        data: {
          isRead: true,
          readAt: db.serverDate()
        }
      })
    }

    // 构建消息查询
    let messageQuery = db.collection('messages').where({
      conversationId: conversation._id
    })
    
    // 如果提供了lastId，则获取早于该消息的消息
    if (lastId) {
      const lastMsgRes = await db.collection('messages').doc(lastId).get()
      if (lastMsgRes.data) {
        messageQuery = messageQuery.where({
          createdAt: _.lt(lastMsgRes.data.createdAt)
        })
      }
    }
    
    // 执行查询
    const messageRes = await messageQuery
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .get()
    
    let messages = messageRes.data || []
    
    // 是否有更多消息
    const hasMore = messages.length === pageSize
    
    // 按时间正序排列
    messages = messages.reverse()
    
    // 如果目标用户信息尚未获取，则现在获取
    if (!targetUser && conversation.participants) {
      const targetUserId = conversation.participants.find(id => id !== openid)
      if (targetUserId) {
        const targetUserRes = await db.collection('users').doc(targetUserId).get()
        if (targetUserRes.data) {
          targetUser = {
            _id: targetUserRes.data._id,
            nickName: targetUserRes.data.nickName,
            avatarUrl: targetUserRes.data.avatarUrl
          }
        }
      }
    }

    // 获取消息发送者信息
    const senderIds = new Set()
    messages.forEach(msg => {
      senderIds.add(msg.sender)
    })

    const senderInfo = {}
    if (senderIds.size > 0) {
      const senderIdsArray = Array.from(senderIds)
      for (let i = 0; i < senderIdsArray.length; i++) {
        const senderId = senderIdsArray[i]
        const senderRes = await db.collection('users').doc(senderId).get()
        if (senderRes.data) {
          senderInfo[senderId] = {
            _id: senderRes.data._id,
            nickName: senderRes.data.nickName,
            avatarUrl: senderRes.data.avatarUrl
          }
        }
      }
    }

    return {
      code: 200,
      message: '获取消息成功',
      data: {
        messages,
        conversation,
        targetUser,
        senderInfo,
        hasMore
      }
    }
  } catch (error) {
    console.error('获取消息失败:', error)
    return {
      code: 500,
      message: '服务器错误',
      error: error.message,
      data: null
    }
  }
} 