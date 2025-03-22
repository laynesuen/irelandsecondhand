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
    
    // 返回用户的实名认证状态
    return {
      success: true,
      data: {
        isVerified: user.isRealNameVerified || false
      }
    };
  } catch (err) {
    console.error('查询实名认证状态失败：', err);
    return {
      success: false,
      error: err.message
    };
  }
}; 