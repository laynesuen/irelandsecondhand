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
      message: '未获取到用户身份信息'
    }
  }
  
  // 获取验证结果
  const { verifyResult } = event
  
  if (!verifyResult) {
    return {
      code: 1,
      message: '缺少验证结果数据'
    }
  }
  
  try {
    // 查询用户是否存在
    const userResult = await userCollection.where({
      _openid: openid
    }).get()
    
    // 验证结果处理逻辑
    // 在实际项目中，这里会有更复杂的验证逻辑和安全检查
    // 这里为了演示，我们假设验证结果是有效的
    
    const verificationData = {
      status: 'verified', // 这里简化处理，实际可能是异步的，需要先设置为pending
      verifiedAt: db.serverDate(),
      info: {
        name: verifyResult.name || '',
        idNumber: verifyResult.idNumber ? maskIdNumber(verifyResult.idNumber) : '',
        // 其他认证相关信息
      }
    }
    
    // 更新用户记录
    if (userResult.data.length > 0) {
      // 用户存在，更新记录
      await userCollection.doc(userResult.data[0]._id).update({
        data: {
          verification: verificationData,
          updatedAt: db.serverDate()
        }
      })
    } else {
      // 用户不存在，创建记录
      await userCollection.add({
        data: {
          _openid: openid,
          verification: verificationData,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    }
    
    return {
      code: 0,
      message: '认证成功',
      data: {
        status: 'verified'
      }
    }
  } catch (err) {
    console.error('提交实名认证失败', err)
    return {
      code: 2,
      message: '提交认证失败',
      error: err.message
    }
  }
}

// 掩码处理身份证号码，只显示前3位和后4位
function maskIdNumber(idNumber) {
  if (!idNumber || idNumber.length < 8) {
    return '';
  }
  
  const prefix = idNumber.slice(0, 3);
  const suffix = idNumber.slice(-4);
  const mask = '*'.repeat(idNumber.length - 7);
  
  return prefix + mask + suffix;
} 