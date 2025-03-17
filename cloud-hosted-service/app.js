const express = require('express');
const cloud = require('wx-server-sdk');

const app = express();
app.use(express.json());

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 健康检查接口
app.get('/health', (req, res) => {
  console.log('收到健康检查请求');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 订阅消息发送接口
app.post('/api/subscribe-message', async (req, res) => {
  try {
    console.log('收到订阅消息请求:', req.body);
    
    const { touser, templateId, page, data } = req.body;
    
    if (!touser || !templateId || !data) {
      console.error('缺少必要参数:', { touser, templateId, data });
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 使用微信云开发SDK发送订阅消息
    const result = await cloud.openapi.subscribeMessage.send({
      touser,
      templateId,
      page,
      data
    });
    
    console.log('订阅消息发送成功:', result);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('发送订阅消息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// 404 处理
app.use((req, res) => {
  console.log('收到未处理的请求:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

const port = process.env.PORT || 80;
app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`);
}); 