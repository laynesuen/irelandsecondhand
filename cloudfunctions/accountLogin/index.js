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

// 加密密码
function encryptPassword(password, salt) {
  const hash = crypto.createHmac('sha256', salt)
  hash.update(password)
  return hash.digest('hex')
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { username, password } = event
  
  try {
    if (!username || !password) {
      return {
        success: false,
        error: '用户名和密码不能为空'
      }
    }
    
    const { OPENID } = cloud.getWXContext()
    
    // 根据用户名查找用户（可以是手机号或邮箱）
    const userCollection = db.collection('users')
    const userQuery = {
      _openid: db.command.exists(true)
    }
    
    // 判断是邮箱还是手机号
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      userQuery.email = username
    } else {
      userQuery.phone = username
    }
    
    const user = await userCollection.where(userQuery).get()
    
    if (user.data.length === 0) {
      return {
        success: false,
        error: '用户名或密码错误'
      }
    }
    
    const userData = user.data[0]
    
    // 校验密码
    const encryptedPassword = encryptPassword(password, userData.salt)
    
    if (encryptedPassword !== userData.password) {
      return {
        success: false,
        error: '用户名或密码错误'
      }
    }
    
    // 检查账号状态
    if (userData.status === 'inactive') {
      return {
        success: false,
        error: '账号已被禁用，请联系客服'
      }
    }
    
    // 生成新的token
    const token = generateToken(userData._openid)
    const expireTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
    
    // 更新用户token
    await userCollection.doc(userData._id).update({
      data: {
        token: token,
        tokenExpireTime: expireTime,
        lastLoginTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
    
    // 返回登录成功的信息
    const userInfo = {
      nickName: userData.userInfo.nickName,
      avatarUrl: userData.userInfo.avatarUrl,
      gender: userData.userInfo.gender
    }
    
    return {
      success: true,
      data: {
        token: token,
        expireTime: expireTime,
        userInfo: userInfo
      }
    }
    
  } catch (error) {
    console.error('账号密码登录失败:', error)
    return {
      success: false,
      error: error.message || '登录失败，请稍后再试'
    }
  }
} 