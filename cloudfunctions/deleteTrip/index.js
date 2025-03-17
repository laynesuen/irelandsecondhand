// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { tripId } = event
  
  try {
    // 验证用户是否登录
    const user = await db.collection('users').where({
      _openid: OPENID
    }).get()
    
    if (user.data.length === 0) {
      return {
        success: false,
        error: '用户未登录'
      }
    }
    
    // 验证行程是否存在且属于当前用户
    const trip = await db.collection('trips').doc(tripId).get()
    
    if (!trip.data) {
      return {
        success: false,
        error: '行程不存在'
      }
    }
    
    if (trip.data.creatorId !== OPENID) {
      return {
        success: false,
        error: '无权删除此行程'
      }
    }
    
    // 删除行程
    await db.collection('trips').doc(tripId).remove()
    
    return {
      success: true,
      message: '行程删除成功'
    }
  } catch (error) {
    console.error('删除行程失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 