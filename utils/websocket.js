// utils/websocket.js
const app = getApp();

// WebSocket通信状态
const WS_STATUS = {
  CONNECTING: 0, // 连接中
  OPEN: 1,       // 已连接
  CLOSING: 2,    // 关闭中
  CLOSED: 3,     // 已关闭
  RECONNECTING: 4 // 重连中
};

// WebSocket消息类型
const MSG_TYPE = {
  AUTH: 'AUTH',         // 认证消息
  CHAT: 'CHAT',         // 聊天消息
  NOTIFICATION: 'NOTIFICATION', // 通知消息
  HEARTBEAT: 'HEARTBEAT' // 心跳消息
};

class WebSocketClient {
  constructor() {
    this.socketUrl = 'wss://express-yrin-147698-5-1348651097.sh.run.tcloudbase.com/ws'; // 使用与app.js中相同的服务地址
    this.socketTask = null;
    this.status = WS_STATUS.CLOSED;
    this.reconnectCount = 0;
    this.maxReconnectCount = 5;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.heartbeatInterval = 30000; // 30秒发送一次心跳
    this.callbackMap = new Map(); // 事件回调映射
    this.listeners = {}; // 消息类型监听器
  }

  // 初始化连接
  connect() {
    if (this.status === WS_STATUS.OPEN || this.status === WS_STATUS.CONNECTING) {
      console.log('WebSocket已连接或正在连接中');
      return;
    }

    this.status = WS_STATUS.CONNECTING;
    console.log('WebSocket开始连接:', this.socketUrl);

    try {
      this.socketTask = wx.connectSocket({
        url: this.socketUrl,
        success: () => {
          console.log('WebSocket连接创建成功');
        },
        fail: (err) => {
          console.error('WebSocket连接创建失败:', err);
          this.reconnect();
        }
      });

      this.initSocketEvents();
    } catch (error) {
      console.error('WebSocket连接出错:', error);
      this.reconnect();
    }
  }

  // 初始化WebSocket事件
  initSocketEvents() {
    if (!this.socketTask) return;

    // 连接打开事件
    this.socketTask.onOpen(() => {
      console.log('WebSocket连接已打开');
      this.status = WS_STATUS.OPEN;
      this.reconnectCount = 0;
      this.startHeartbeat();
      this.triggerCallback('open');
      
      // 连接后进行身份认证
      this.authenticate();
    });

    // 接收消息事件
    this.socketTask.onMessage((res) => {
      console.log('WebSocket收到消息:', res.data);
      try {
        const message = JSON.parse(res.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('WebSocket消息解析错误:', error);
      }
    });

    // 连接关闭事件
    this.socketTask.onClose((res) => {
      console.log('WebSocket连接已关闭:', res);
      this.status = WS_STATUS.CLOSED;
      this.stopHeartbeat();
      this.triggerCallback('close', res);
      this.reconnect();
    });

    // 连接错误事件
    this.socketTask.onError((err) => {
      console.error('WebSocket连接发生错误:', err);
      this.triggerCallback('error', err);
      this.reconnect();
    });
  }

  // 发送身份认证
  authenticate() {
    const token = wx.getStorageSync('token');
    if (!token) {
      console.warn('用户未登录，无法进行WebSocket认证');
      return;
    }

    const authMessage = {
      type: MSG_TYPE.AUTH,
      data: {
        token: token,
        platform: 'wxapp',
        version: '1.0.0'
      }
    };

    this.sendMessage(authMessage);
  }

  // 发送消息
  sendMessage(message) {
    if (this.status !== WS_STATUS.OPEN) {
      console.warn('WebSocket未连接，消息发送失败');
      this.connect();
      return false;
    }

    try {
      // 将消息转换为JSON字符串
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      
      this.socketTask.send({
        data: messageStr,
        success: () => {
          console.log('WebSocket消息发送成功');
        },
        fail: (err) => {
          console.error('WebSocket消息发送失败:', err);
        }
      });
      
      return true;
    } catch (error) {
      console.error('WebSocket发送消息出错:', error);
      return false;
    }
  }

  // 发送聊天消息
  sendChatMessage(to, content, contentType = 'text') {
    const chatMessage = {
      type: MSG_TYPE.CHAT,
      data: {
        to: to,
        content: content,
        contentType: contentType,
        timestamp: Date.now()
      }
    };

    return this.sendMessage(chatMessage);
  }

  // 发送心跳消息
  sendHeartbeat() {
    const heartbeatMessage = {
      type: MSG_TYPE.HEARTBEAT,
      data: {
        timestamp: Date.now()
      }
    };

    return this.sendMessage(heartbeatMessage);
  }

  // 启动心跳
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 重连
  reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectCount >= this.maxReconnectCount) {
      console.warn(`WebSocket重连失败，已达到最大重连次数: ${this.maxReconnectCount}`);
      this.triggerCallback('reconnectFailed');
      return;
    }

    this.status = WS_STATUS.RECONNECTING;
    this.reconnectCount++;
    
    const delay = Math.min(1000 * (2 ** this.reconnectCount), 30000); // 指数退避策略，最大等待30秒
    
    console.log(`WebSocket将在 ${delay}ms 后进行第 ${this.reconnectCount} 次重连`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
      this.triggerCallback('reconnecting', this.reconnectCount);
    }, delay);
  }

  // 关闭连接
  close() {
    if (!this.socketTask || this.status === WS_STATUS.CLOSED) {
      return;
    }

    this.status = WS_STATUS.CLOSING;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      this.socketTask.close({
        success: () => {
          console.log('WebSocket连接已关闭');
          this.status = WS_STATUS.CLOSED;
        },
        fail: (err) => {
          console.error('WebSocket关闭失败:', err);
        }
      });
    } catch (error) {
      console.error('WebSocket关闭出错:', error);
    }
  }

  // 处理接收到的消息
  handleMessage(message) {
    if (!message || !message.type) {
      console.warn('收到无效的WebSocket消息');
      return;
    }

    // 触发该消息类型的所有监听器
    this.triggerMessageListeners(message.type, message.data);
    
    // 根据消息类型进行处理
    switch (message.type) {
      case MSG_TYPE.AUTH:
        this.handleAuthMessage(message.data);
        break;
      case MSG_TYPE.CHAT:
        this.handleChatMessage(message.data);
        break;
      case MSG_TYPE.NOTIFICATION:
        this.handleNotificationMessage(message.data);
        break;
      case MSG_TYPE.HEARTBEAT:
        // 心跳响应，无需特殊处理
        break;
      default:
        console.warn('收到未知类型的消息:', message.type);
    }
  }

  // 处理认证消息
  handleAuthMessage(data) {
    if (data.success) {
      console.log('WebSocket认证成功');
      this.triggerCallback('authenticated', data);
    } else {
      console.error('WebSocket认证失败:', data.error);
      this.triggerCallback('authFailed', data);
    }
  }

  // 处理聊天消息
  handleChatMessage(data) {
    console.log('收到聊天消息:', data);
    this.triggerCallback('chat', data);
  }

  // 处理通知消息
  handleNotificationMessage(data) {
    console.log('收到通知消息:', data);
    this.triggerCallback('notification', data);
  }

  // 注册事件回调
  on(event, callback) {
    if (!this.callbackMap.has(event)) {
      this.callbackMap.set(event, []);
    }
    this.callbackMap.get(event).push(callback);
  }

  // 移除事件回调
  off(event, callback) {
    if (!this.callbackMap.has(event)) return;
    
    if (!callback) {
      // 如果未提供具体回调函数，则移除该事件的所有回调
      this.callbackMap.delete(event);
    } else {
      // 移除特定回调函数
      const callbacks = this.callbackMap.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.callbackMap.delete(event);
      }
    }
  }

  // 触发事件回调
  triggerCallback(event, data) {
    if (!this.callbackMap.has(event)) return;
    
    const callbacks = this.callbackMap.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`WebSocket事件[${event}]回调执行出错:`, error);
      }
    });
  }

  // 添加消息类型监听器
  addMessageListener(messageType, listener) {
    if (!this.listeners[messageType]) {
      this.listeners[messageType] = [];
    }
    this.listeners[messageType].push(listener);
  }

  // 移除消息类型监听器
  removeMessageListener(messageType, listener) {
    if (!this.listeners[messageType]) return;
    
    if (!listener) {
      // 移除该类型的所有监听器
      delete this.listeners[messageType];
    } else {
      // 移除特定监听器
      const index = this.listeners[messageType].indexOf(listener);
      if (index !== -1) {
        this.listeners[messageType].splice(index, 1);
      }
      if (this.listeners[messageType].length === 0) {
        delete this.listeners[messageType];
      }
    }
  }

  // 触发消息类型监听器
  triggerMessageListeners(messageType, data) {
    if (!this.listeners[messageType]) return;
    
    this.listeners[messageType].forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`消息类型[${messageType}]监听器执行出错:`, error);
      }
    });
  }
}

// 创建单例
const webSocketClient = new WebSocketClient();

// 导出
module.exports = {
  webSocketClient,
  WS_STATUS,
  MSG_TYPE
}; 