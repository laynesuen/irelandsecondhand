// 云函数入口文件
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 生成自定义token
function generateToken(openid) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  const hash = crypto.createHash('sha256')
  hash.update(openid + timestamp + random)
  return hash.digest('hex')
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { code, userInfo } = event
  
  try {
    // 获取openid
    const { OPENID } = cloud.getWXContext()
    
    // 查询用户是否已存在
    const userCollection = db.collection('users')
    const user = await userCollection.where({
      _openid: OPENID
    }).get()
    
    // 生成token和过期时间
    const token = generateToken(OPENID)
    const expireTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
    
    if (user.data.length === 0) {
      // 新用户，创建用户记录
      await userCollection.add({
        data: {
          _openid: OPENID,
          userInfo: userInfo,
          role: 'user', // 默认用户角色
          status: 'active', // 用户状态
          token: token,
          tokenExpireTime: expireTime,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    } else {
      // 检查现有token是否过期
      const currentUser = user.data[0]
      const currentTime = new Date()
      
      if (currentUser.tokenExpireTime && currentUser.tokenExpireTime < currentTime) {
        // token已过期，生成新token
        console.log('Token已过期，生成新token')
      }
      
      // 更新用户信息
      await userCollection.doc(currentUser._id).update({
        data: {
          userInfo: userInfo,
          token: token,
          tokenExpireTime: expireTime,
          updateTime: db.serverDate()
        }
      })
    }
    
    return {
      success: true,
      data: {
        openid: OPENID,
        token: token,
        userInfo: userInfo,
        expireTime: expireTime
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 