// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 生成随机验证码
function generateCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { phone } = event
  
  try {
    if (!phone) {
      return {
        success: false,
        error: '手机号不能为空'
      }
    }
    
    // 验证手机号格式（爱尔兰手机号）
    if (!/^(08\d{8}|\+?353\d{9})$/.test(phone.replace(/\s/g, ''))) {
      return {
        success: false,
        error: '手机号格式不正确'
      }
    }
    
    // 检查是否频繁发送验证码
    const codeCollection = db.collection('verification_codes')
    const recentCodes = await codeCollection.where({
      phone: phone,
      createTime: db.command.gt(new Date(Date.now() - 60 * 1000)) // 1分钟内
    }).count()
    
    if (recentCodes.total > 0) {
      return {
        success: false,
        error: '发送太频繁，请稍后再试'
      }
    }
    
    // 生成6位验证码
    const code = generateCode(6)
    
    // 设置过期时间（15分钟后）
    const expireTime = new Date(Date.now() + 15 * 60 * 1000)
    
    // 在实际产品中，这里应该调用短信平台发送验证码
    // 此处模拟发送验证码，在console中打印
    console.log(`向手机号${phone}发送验证码: ${code}`)
    
    // 保存验证码到数据库
    await codeCollection.add({
      data: {
        phone: phone,
        code: code,
        createTime: db.serverDate(),
        expireTime: expireTime,
        used: false
      }
    })
    
    return {
      success: true,
      data: {
        message: '验证码发送成功'
      }
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    return {
      success: false,
      error: error.message || '发送验证码失败，请稍后再试'
    }
  }
} 