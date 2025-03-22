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
    // 查询未读消息数量
    const messageCount = await db.collection('messages')
      .where({
        toUserId: openid,
        read: false
      })
      .count();
    
    // 查询未读系统通知数量
    const notificationCount = await db.collection('notifications')
      .where({
        userId: openid,
        read: false
      })
      .count();
    
    // 合计未读数量
    const totalCount = messageCount.total + notificationCount.total;
    
    return {
      success: true,
      data: {
        count: totalCount,
        messageCount: messageCount.total,
        notificationCount: notificationCount.total
      }
    };
  } catch (err) {
    console.error('获取未读消息数量失败：', err);
    return {
      success: false,
      error: err.message
    };
  }
}; 