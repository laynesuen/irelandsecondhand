const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    const { touser, templateId, page, data } = event;
    
    const result = await cloud.openapi.subscribeMessage.send({
      touser,
      templateId,
      page,
      data
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('发送订阅消息失败:', error);
    return {
      success: false,
      error: error
    };
  }
}; 