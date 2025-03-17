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

  try {
    // 获取会话列表
    const conversationsRes = await db.collection('conversations')
      .where({
        participants: openid
      })
      .orderBy('updatedAt', 'desc')
      .get()

    if (!conversationsRes.data || conversationsRes.data.length === 0) {
      return {
        code: 200,
        message: '会话列表为空',
        data: {
          conversations: [],
          userInfoMap: {}
        }
      }
    }

    const conversations = conversationsRes.data

    // 获取所有对话参与者的用户信息
    const userIds = new Set()
    conversations.forEach(conv => {
      conv.participants.forEach(id => {
        if (id !== openid) {
          userIds.add(id)
        }
      })
    })

    // 批量获取用户信息
    const userInfoMap = {}
    if (userIds.size > 0) {
      const userIdsArray = Array.from(userIds)
      const usersRes = await db.collection('users')
        .where({
          _id: _.in(userIdsArray)
        })
        .get()
      
      usersRes.data.forEach(user => {
        userInfoMap[user._id] = {
          _id: user._id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl
        }
      })
    }

    // 处理会话数据
    const processedConversations = conversations.map(conv => {
      // 找到对话的另一方
      const otherParticipant = conv.participants.find(id => id !== openid)
      const otherUser = userInfoMap[otherParticipant] || {
        _id: otherParticipant,
        nickName: '未知用户',
        avatarUrl: ''
      }

      return {
        _id: conv._id,
        targetUser: otherUser,
        lastMessage: conv.lastMessage || '',
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount ? (conv.unreadCount[openid] || 0) : 0,
        postId: conv.postId,
        postType: conv.postType
      }
    })

    return {
      code: 200,
      message: '获取会话列表成功',
      data: {
        conversations: processedConversations
      }
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
    return {
      code: 500,
      message: '服务器错误',
      error: error.message
    }
  }
} 