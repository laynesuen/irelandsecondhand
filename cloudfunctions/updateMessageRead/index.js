// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const messages = db.collection('messages');

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  if (!openid) {
    return {
      success: false,
      error: '用户未登录'
    };
  }
  
  try {
    // 获取消息ID
    const { messageId } = event;
    
    if (!messageId) {
      return {
        success: false,
        error: '消息ID不能为空'
      };
    }
    
    // 查询消息
    const messageRes = await messages.doc(messageId).get();
    const message = messageRes.data;
    
    // 检查消息是否存在
    if (!message) {
      return {
        success: false,
        error: '消息不存在'
      };
    }
    
    // 验证权限：只有消息的接收者可以标记为已读
    if (message.toUserId !== openid) {
      return {
        success: false,
        error: '无权限更新该消息状态'
      };
    }
    
    // 更新已读状态
    await messages.doc(messageId).update({
      data: {
        read: true,
        readTime: db.serverDate()
      }
    });
    
    return {
      success: true,
      message: '消息已标记为已读'
    };
  } catch (err) {
    console.error('更新消息已读状态失败', err);
    return {
      success: false,
      error: err.message
    };
  }
}; 