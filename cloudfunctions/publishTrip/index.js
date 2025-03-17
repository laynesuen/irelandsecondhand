// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 验证用户登录状态
async function validateUser(openid) {
  try {
    const user = await db.collection('users').where({
      _openid: openid
    }).get()
    
    if (user.data.length === 0) {
      return {
        isValid: false,
        error: '用户未登录'
      }
    }
    
    const currentUser = user.data[0]
    const currentTime = new Date()
    
    // 检查用户状态
    if (currentUser.status !== 'active') {
      return {
        isValid: false,
        error: '用户状态异常'
      }
    }
    
    // 检查token是否过期
    if (!currentUser.token || !currentUser.tokenExpireTime || currentUser.tokenExpireTime < currentTime) {
      return {
        isValid: false,
        error: '登录已过期，请重新登录'
      }
    }
    
    return {
      isValid: true,
      user: currentUser
    }
  } catch (error) {
    console.error('验证用户状态失败:', error)
    return {
      isValid: false,
      error: '验证用户状态失败'
    }
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const tripData = event.tripData
  
  try {
    // 验证用户登录状态
    const validationResult = await validateUser(OPENID)
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error
      }
    }
    
    // 添加行程信息
    const result = await db.collection('trips').add({
      data: {
        ...tripData,
        creatorId: OPENID,
        status: 'active',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      data: {
        tripId: result._id
      }
    }
  } catch (error) {
    console.error('发布行程失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 