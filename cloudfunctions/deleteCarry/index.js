// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { carryId } = event
  
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
    
    // 验证捎带是否存在且属于当前用户
    const carry = await db.collection('carries').doc(carryId).get()
    
    if (!carry.data) {
      return {
        success: false,
        error: '捎带不存在'
      }
    }
    
    if (carry.data.creatorId !== OPENID) {
      return {
        success: false,
        error: '无权删除此捎带'
      }
    }
    
    // 删除捎带
    await db.collection('carries').doc(carryId).remove()
    
    return {
      success: true,
      message: '捎带删除成功'
    }
  } catch (error) {
    console.error('删除捎带失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 