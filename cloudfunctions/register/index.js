// 云函数入口文件
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 生成随机盐
function generateSalt() {
  return crypto.randomBytes(16).toString('hex')
}

// 加密密码
function encryptPassword(password, salt) {
  const hash = crypto.createHmac('sha256', salt)
  hash.update(password)
  return hash.digest('hex')
}

// 验证验证码
async function verifyCode(phone, code) {
  if (!code) return false;
  
  try {
    const codeCollection = db.collection('verification_codes')
    const result = await codeCollection.where({
      phone: phone,
      code: code,
      expireTime: db.command.gt(new Date())
    }).get()
    
    return result.data.length > 0
  } catch (error) {
    console.error('验证码验证失败', error)
    return false
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { phone, email, password, code } = event
  
  try {
    // 基本验证
    if (!phone || !email || !password) {
      return {
        success: false,
        error: '手机号、邮箱和密码不能为空'
      }
    }
    
    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        error: '邮箱格式不正确'
      }
    }
    
    // 验证手机号格式（爱尔兰手机号）
    if (!/^(08\d{8}|\+?353\d{9})$/.test(phone.replace(/\s/g, ''))) {
      return {
        success: false,
        error: '手机号格式不正确'
      }
    }
    
    // 验证密码长度
    if (password.length < 6) {
      return {
        success: false,
        error: '密码长度不能少于6位'
      }
    }
    
    const { OPENID } = cloud.getWXContext()
    
    // 检查手机号和邮箱是否已被注册
    const userCollection = db.collection('users')
    const phoneExist = await userCollection.where({
      phone: phone
    }).count()
    
    if (phoneExist.total > 0) {
      return {
        success: false,
        error: '该手机号已被注册'
      }
    }
    
    const emailExist = await userCollection.where({
      email: email
    }).count()
    
    if (emailExist.total > 0) {
      return {
        success: false,
        error: '该邮箱已被注册'
      }
    }
    
    // 验证验证码
    const isCodeValid = await verifyCode(phone, code)
    if (code && !isCodeValid) {
      return {
        success: false,
        error: '验证码错误或已过期'
      }
    }
    
    // 生成盐和加密密码
    const salt = generateSalt()
    const encryptedPassword = encryptPassword(password, salt)
    
    // 创建用户
    const result = await userCollection.add({
      data: {
        _openid: OPENID,
        phone: phone,
        email: email,
        password: encryptedPassword,
        salt: salt,
        userInfo: {
          nickName: '用户' + phone.substr(-4),
          avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
          gender: 0
        },
        role: 'user',
        status: 'active',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
    
    // 如果有验证码，使验证码失效
    if (code) {
      await db.collection('verification_codes').where({
        phone: phone,
        code: code
      }).update({
        data: {
          expireTime: new Date(0) // 设置为过去的时间使其失效
        }
      })
    }
    
    return {
      success: true,
      data: {
        message: '注册成功'
      }
    }
  } catch (error) {
    console.error('注册失败:', error)
    return {
      success: false,
      error: error.message || '注册失败，请稍后再试'
    }
  }
} 