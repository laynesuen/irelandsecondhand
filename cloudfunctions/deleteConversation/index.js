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
  const { conversationId } = event

  try {
    // 参数校验
    if (!conversationId) {
      return {
        code: 400,
        message: '会话ID不能为空',
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

    // 验证会话存在并且用户有权限
    const convRes = await db.collection('conversations').doc(conversationId).get()
    if (!convRes.data) {
      return {
        code: 404,
        message: '会话不存在',
        data: null
      }
    }

    const conversation = convRes.data
    if (!conversation.participants.includes(openid)) {
      return {
        code: 403,
        message: '无权访问此会话',
        data: null
      }
    }

    // 执行删除操作
    // 1. 删除会话
    await db.collection('conversations').doc(conversationId).remove()
    
    // 2. 删除相关消息
    await db.collection('messages').where({
      conversationId: conversationId
    }).remove()

    return {
      code: 200,
      message: '删除会话成功',
      data: null
    }
  } catch (error) {
    console.error('删除会话失败:', error)
    return {
      code: 500,
      message: '服务器错误',
      error: error.message,
      data: null
    }
  }
} 