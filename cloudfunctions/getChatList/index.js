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
  const openId = wxContext.OPENID
  
  try {
    // 获取用户作为发送者或接收者的所有会话
    const conversationsAsSender = await db.collection('conversations')
      .where({
        senderId: openId
      })
      .get()
    
    const conversationsAsReceiver = await db.collection('conversations')
      .where({
        receiverId: openId
      })
      .get()
    
    // 合并会话列表
    let allConversations = [
      ...conversationsAsSender.data,
      ...conversationsAsReceiver.data
    ]
    
    // 去重，按照 lastMessageTime 排序
    allConversations = Array.from(
      new Map(allConversations.map(item => [item.conversationId, item])).values()
    ).sort((a, b) => b.lastMessageTime - a.lastMessageTime)
    
    // 获取每个会话的参与者信息
    const userIds = []
    allConversations.forEach(conv => {
      if (conv.senderId !== openId) userIds.push(conv.senderId)
      if (conv.receiverId !== openId) userIds.push(conv.receiverId)
    })
    
    // 去重用户ID
    const uniqueUserIds = [...new Set(userIds)]
    
    // 批量获取用户信息
    const usersInfo = {}
    if (uniqueUserIds.length > 0) {
      const usersResult = await db.collection('users')
        .where({
          _openid: _.in(uniqueUserIds)
        })
        .get()
      
      usersResult.data.forEach(user => {
        usersInfo[user._openid] = {
          userId: user._openid,
          userName: user.userInfo ? user.userInfo.nickName : '用户',
          avatar: user.userInfo ? user.userInfo.avatarUrl : '/images/default-avatar.png'
        }
      })
    }
    
    // 构建返回结果
    const chatList = allConversations.map(conv => {
      const otherUserId = conv.senderId === openId ? conv.receiverId : conv.senderId
      const otherUser = usersInfo[otherUserId] || {
        userId: otherUserId,
        userName: '未知用户',
        avatar: '/images/default-avatar.png'
      }
      
      return {
        id: conv.conversationId,
        userId: otherUser.userId,
        userName: otherUser.userName,
        avatar: otherUser.avatar,
        lastMessage: conv.lastMessage,
        time: new Date(conv.lastMessageTime).toLocaleString(),
        unreadCount: conv.receiverId === openId ? (conv.unreadCount || 0) : 0,
        postType: conv.postType || 'trip',
        postId: conv.postId || '',
        lastMessageTime: conv.lastMessageTime
      }
    })
    
    return {
      success: true,
      data: chatList
    }
  } catch (error) {
    console.error('获取聊天列表失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 