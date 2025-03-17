const cloud = require('wx-server-sdk');
const axios = require('axios');

console.log('开始初始化云函数...');

// 设置云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
  traceUser: true
});

console.log('云环境初始化完成');

// 从环境变量获取配置
const TEMPLATE_ID = process.env.TEMPLATE_ID;
const CLOUD_HOSTED_SERVICE_URL = process.env.CLOUD_HOSTED_SERVICE_URL;

if (!TEMPLATE_ID || !CLOUD_HOSTED_SERVICE_URL) {
  console.error('缺少必要的环境变量:', {
    TEMPLATE_ID: !!TEMPLATE_ID,
    CLOUD_HOSTED_SERVICE_URL: !!CLOUD_HOSTED_SERVICE_URL
  });
}

const db = cloud.database();
const _ = db.command;

console.log('数据库连接初始化完成');

// 云函数入口函数
exports.main = async (event, context) => {
  const { 
    receiver,    // 接收者ID
    sender,      // 发送者ID
    messageType, // 消息类型
    conversationId // 会话ID
  } = event

  try {
    // 参数校验
    if (!receiver || !sender || !conversationId) {
      return {
        code: 400,
        message: '参数错误',
        data: null
      }
    }

    // 获取接收者信息，查看其消息通知设置
    const receiverRes = await db.collection('users').doc(receiver).get()
    if (!receiverRes.data) {
      return {
        code: 404,
        message: '接收者不存在',
        data: null
      }
    }

    const receiverSettings = receiverRes.data.settings || {}
    
    // 检查用户是否开启了消息通知
    if (receiverSettings.enableNotification === false) {
      return {
        code: 200,
        message: '用户已关闭通知',
        data: null
      }
    }

    // 获取发送者信息
    const senderRes = await db.collection('users').doc(sender).get()
    if (!senderRes.data) {
      return {
        code: 404,
        message: '发送者不存在',
        data: null
      }
    }

    const senderInfo = senderRes.data
    const senderName = senderInfo.nickName || '用户'

    // 获取会话信息
    const convRes = await db.collection('conversations').doc(conversationId).get()
    if (!convRes.data) {
      return {
        code: 404,
        message: '会话不存在',
        data: null
      }
    }

    // 构建通知内容
    let title = `新消息提醒`
    let content = `${senderName}发来一条${typeToText(messageType)}消息`
    
    // 如果是关联行程的会话，可以添加相关信息
    if (convRes.data.postId && convRes.data.postType) {
      const postType = convRes.data.postType === 'trip' ? '行程' : '需求'
      content += `(关于${postType})`
    }

    // 构建跳转路径
    const path = `/pages/chat/chat?conversationId=${conversationId}&targetId=${sender}`

    // 调用微信的订阅消息推送（需要用户已订阅相关模板）
    // 注意：这里需要提前在微信公众平台申请订阅消息模板
    try {
      const wxContext = cloud.getWXContext()
      const result = await cloud.openapi.subscribeMessage.send({
        touser: receiver,
        page: path,
        lang: 'zh_CN',
        data: {
          // 以下字段需要根据你申请的模板进行修改
          thing1: {
            value: senderName
          },
          thing2: {
            value: typeToText(messageType)
          },
          time3: {
            value: new Date().toLocaleString()
          },
          thing4: {
            value: '点击查看详情'
          }
        },
        templateId: 'YOUR_TEMPLATE_ID' // 替换为你的模板ID
      })
      
      console.log('发送订阅消息成功', result)
    } catch (err) {
      // 订阅消息发送失败，可能是用户未订阅或其他原因
      console.error('发送订阅消息失败', err)
      
      // 可以考虑使用其他通知方式，如云开发数据库记录通知等
      // 这里我们将通知保存到数据库中
      await db.collection('notifications').add({
        data: {
          receiver,
          sender,
          title,
          content,
          path,
          isRead: false,
          createTime: db.serverDate(),
          type: 'message'
        }
      })
    }

    return {
      code: 200,
      message: '通知发送成功',
      data: null
    }
  } catch (error) {
    console.error('发送通知失败', error)
    return {
      code: 500,
      message: '服务器错误',
      error: error.message,
      data: null
    }
  }
}

// 辅助函数：消息类型转文字
function typeToText(type) {
  const typeMap = {
    'text': '文本',
    'image': '图片',
    'location': '位置',
    'order': '订单'
  }
  return typeMap[type] || '消息'
}

/**
 * 发送订阅消息
 */
async function sendSubscribeMessage(params) {
  try {
    console.log('准备发送订阅消息到云托管服务:', {
      url: `${CLOUD_HOSTED_SERVICE_URL}/api/subscribe-message`,
      params: {
        ...params,
        templateId: TEMPLATE_ID
      }
    });

    // 调用云托管服务发送订阅消息
    const response = await axios.post(`${CLOUD_HOSTED_SERVICE_URL}/api/subscribe-message`, {
      ...params,
      templateId: TEMPLATE_ID
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('订阅消息发送成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('发送订阅消息失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * 处理系统通知
 */
async function handleSystemNotification(event) {
  const { title, content, userId, priority = 'normal' } = event;
  
  if (!title || !content || !userId) {
    return {
      success: false,
      message: '缺少必要参数'
    };
  }

  try {
    // 保存通知到数据库
    const notification = {
      type: 'system',
      title,
      content,
      userId,
      priority,
      read: false,
      createTime: db.serverDate()
    };

    const result = await db.collection('notifications').add({
      data: notification
    });

    // 发送订阅消息
    try {
      await sendSubscribeMessage({
        touser: userId,
        page: 'pages/notification/notification',
        data: {
          thing1: { value: title },
          thing2: { value: content },
          time3: { value: new Date().toLocaleString() }
        }
      });
    } catch (error) {
      console.error('发送订阅消息失败:', error);
      // 即使发送订阅消息失败，也不影响通知的保存
    }

    return {
      success: true,
      data: {
        ...notification,
        _id: result._id
      }
    };
  } catch (error) {
    console.error('保存通知失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 处理订单状态通知
 */
async function handleOrderStatusNotification(event) {
  const { orderId, status, userId, amount } = event;
  console.log('处理订单状态通知:', event);
  
  if (!orderId || !status || !userId) {
    return {
      success: false,
      message: '缺少必要参数'
    };
  }

  try {
    // 生成通知标题和内容
    let title = '';
    let content = '';
    switch (status) {
      case 'created':
        title = '订单创建成功';
        content = `您的订单${orderId}已创建成功，请尽快支付`;
        break;
      case 'paid':
        title = '订单支付成功';
        content = `您的订单${orderId}已支付成功，金额：${amount || '未知'}元`;
        break;
      case 'shipping':
        title = '订单已发货';
        content = `您的订单${orderId}已发货，请注意查收`;
        break;
      case 'completed':
        title = '订单已完成';
        content = `您的订单${orderId}已完成，感谢您的使用`;
        break;
      case 'cancelled':
        title = '订单已取消';
        content = `您的订单${orderId}已取消`;
        break;
      default:
        title = '订单状态更新';
        content = `您的订单${orderId}状态已更新为${status}`;
    }

    // 保存通知到数据库
    const notification = {
      type: 'order_status',
      title,
      content,
      orderId,
      status,
      userId,
      read: false,
      createTime: db.serverDate()
    };

    const result = await db.collection('notifications').add({
      data: notification
    });

    // 发送订阅消息
    try {
      await sendSubscribeMessage({
        touser: userId,
        page: `pages/order-detail/order-detail?id=${orderId}`,
        data: {
          thing1: { value: title },
          thing2: { value: content },
          time3: { value: new Date().toLocaleString() }
        }
      });
      console.log('订阅消息发送成功');
    } catch (error) {
      console.error('发送订阅消息失败:', error);
    }

    return {
      success: true,
      data: {
        ...notification,
        _id: result._id
      }
    };
  } catch (error) {
    console.error('保存通知失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 处理安全通知
 */
async function handleSecurityNotification(event) {
  const { type, content, userId } = event;
  
  if (!type || !content || !userId) {
    return {
      success: false,
      message: '缺少必要参数'
    };
  }

  try {
    // 生成通知标题
    let title = '';
    switch (type) {
      case 'login':
        title = '账户登录提醒';
        break;
      case 'password':
        title = '密码修改提醒';
        break;
      case 'payment':
        title = '支付密码修改提醒';
        break;
      default:
        title = '账户安全提醒';
    }

    // 保存通知到数据库
    const notification = {
      type: 'security',
      title,
      content,
      securityType: type,
      userId,
      read: false,
      createTime: db.serverDate(),
      priority: 'high',
      needConfirm: true
    };

    const result = await db.collection('notifications').add({
      data: notification
    });

    // 发送订阅消息
    try {
      await sendSubscribeMessage({
        touser: userId,
        page: 'pages/security/security',
        data: {
          thing1: { value: title },
          thing2: { value: content },
          time3: { value: new Date().toLocaleString() }
        }
      });
      console.log('订阅消息发送成功');
    } catch (error) {
      console.error('发送订阅消息失败:', error);
    }

    return {
      success: true,
      data: {
        ...notification,
        _id: result._id
      }
    };
  } catch (error) {
    console.error('保存通知失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 处理活动通知
 */
async function handleActivityNotification(event) {
  const { title, content, activityId, userId } = event;
  
  if (!title || !content || !activityId || !userId) {
    return {
      success: false,
      message: '缺少必要参数'
    };
  }

  try {
    // 保存通知到数据库
    const notification = {
      type: 'activity',
      title,
      content,
      activityId,
      userId,
      read: false,
      createTime: db.serverDate(),
      expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
      priority: 'normal'
    };

    const result = await db.collection('notifications').add({
      data: notification
    });

    // 发送订阅消息
    try {
      await sendSubscribeMessage({
        touser: userId,
        page: `pages/activity-detail/activity-detail?id=${activityId}`,
        data: {
          thing1: { value: title },
          thing2: { value: content },
          time3: { value: new Date().toLocaleString() }
        }
      });
      console.log('订阅消息发送成功');
    } catch (error) {
      console.error('发送订阅消息失败:', error);
    }

    return {
      success: true,
      data: {
        ...notification,
        _id: result._id
      }
    };
  } catch (error) {
    console.error('保存通知失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
} 