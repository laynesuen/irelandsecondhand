// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  if (!openid) {
    return {
      success: false,
      error: '未获取到用户信息'
    };
  }
  
  // 获取认证结果
  const { authResult } = event;
  
  // 简单验证认证结果
  if (!authResult || !authResult.authenticity) {
    return {
      success: false,
      error: '实名认证结果无效'
    };
  }
  
  try {
    // 查询用户信息
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get();
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      };
    }
    
    const user = userResult.data[0];
    
    // 更新用户的实名认证状态
    await db.collection('users').doc(user._id).update({
      data: {
        isRealNameVerified: true,
        realNameAuthInfo: {
          // 安全起见，不保存敏感信息
          authTime: db.serverDate(),
          authResult: authResult.authenticity // 只存储认证结果的真实性标志
        },
        updateTime: db.serverDate()
      }
    });
    
    return {
      success: true,
      data: {
        message: '实名认证信息更新成功'
      }
    };
  } catch (err) {
    console.error('更新实名认证状态失败：', err);
    return {
      success: false,
      error: err.message
    };
  }
}; 