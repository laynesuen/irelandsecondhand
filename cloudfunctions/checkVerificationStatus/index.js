// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const userCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  if (!openid) {
    return {
      code: 1,
      message: '未获取到用户身份信息',
      data: {
        status: 'unverified'
      }
    }
  }
  
  try {
    // 查询用户信息
    const userResult = await userCollection.where({
      _openid: openid
    }).get()
    
    if (userResult.data.length === 0) {
      return {
        code: 1,
        message: '用户不存在',
        data: {
          status: 'unverified'
        }
      }
    }
    
    const user = userResult.data[0]
    
    // 获取实名认证状态
    let status = 'unverified'
    if (user.verification) {
      if (user.verification.status === 'verified') {
        status = 'verified'
      } else if (user.verification.status === 'pending') {
        status = 'inProgress'
      }
    }
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        status: status,
        verificationInfo: user.verification || {}
      }
    }
  } catch (err) {
    console.error('查询用户实名认证状态失败', err)
    return {
      code: 2,
      message: '查询失败',
      error: err.message,
      data: {
        status: 'unverified'
      }
    }
  }
} 