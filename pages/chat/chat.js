// pages/chat/chat.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    targetId: '', // 目标用户ID
    targetUser: {}, // 目标用户信息
    userInfo: {}, // 当前用户信息
    messageList: [], // 消息列表
    inputMessage: '', // 输入框内容
    loading: false, // 是否正在加载
    page: 1, // 当前页码
    pageSize: 20, // 每页数量
    scrollToMessage: '', // 滚动到指定消息
    hasMore: true, // 是否有更多消息
    showFunctionPanel: false, // 是否显示功能面板
    inputFocus: false, // 输入框是否聚焦
    timeHeader: '', // 时间头信息
    timeHeaderIndex: 0, // 时间头索引
    userPosts: [], // 用户发布的行程或捎带需求
    postType: '', // 发布类型：'trip' 或 'delivery'
    wsConnected: false, // WebSocket连接状态
    reconnectCount: 0, // 重连次数
    maxReconnectCount: 3, // 最大重连次数
    keyboardHeight: 0, // 键盘高度
    conversationId: '', // 会话ID
    postId: '', // 发布ID
    isVoiceMode: false,   // 语音模式标志
    isRecording: false,   // 是否正在录音
    recordingTime: '0"',  // 录音时长
    willCancel: false,    // 是否取消录音
    recorderManager: null, // 录音管理器
    innerAudioContext: null, // 音频播放上下文
    currentPlayingId: '', // 当前正在播放的语音消息ID
    showQuickReply: false, // 显示快捷回复
    quickReplies: ['谢谢', '好的', '稍等', '收到', '好久不见', '在吗？', '多少钱'], // 快捷回复列表
    searchKeyword: '', // 搜索关键词
    searchResults: [], // 搜索结果
    isSearching: false, // 是否正在搜索
    navHeight: 0, // 导航栏高度
    searchBarHeight: 0, // 搜索框高度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("聊天页面接收到的参数：", options);
    
    // 获取目标用户信息
    this.setData({
      targetId: options.targetId,
      targetUser: {
        id: options.targetId,
        name: options.name,
        avatar: '/images/default-avatar.png',
        online: Math.random() > 0.5 // 模拟在线状态
      }
    });

    // 处理postType参数，确保其值为'trip'或'delivery'
    // 先检查options.postType，如果没有，则兼容旧版本使用options.type
    let postType = options.postType;
    if (!postType && options.type) {
      // 将旧版本的type转换为postType格式
      postType = options.type === 'trip' ? 'trip' : 'delivery';
    }
    
    if (postType) {
      console.log("设置postType:", postType);
      this.setData({
        postType: postType
      });
    }

    // 获取当前用户信息
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({ userInfo });
    } else {
      app.getUserInfo((userInfo) => {
        this.setData({ userInfo });
      });
    }

    // 加载用户发布信息，确保传递正确的postType
    this.loadUserPosts(options.targetId, postType);
    // 加载历史消息
    this.loadMessages();

    // 初始化WebSocket连接
    this.connectWebSocket();

    // 初始化录音管理器
    this.initRecorder();
    
    // 初始化音频播放器
    this.initAudioPlayer();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 获取导航栏高度和状态栏高度
    const that = this;
    wx.getSystemInfo({
      success: function(res) {
        const statusBarHeight = res.statusBarHeight;
        const capsuleButton = wx.getMenuButtonBoundingClientRect();
        const navBarHeight = (capsuleButton.top - statusBarHeight) * 2 + capsuleButton.height + statusBarHeight;
        
        // 设置搜索框的样式
        that.setData({
          navHeight: navBarHeight
        });
        
        // 为message-list添加一个顶部内边距，确保不被搜索框遮挡
        const pxToRpxRatio = 750 / res.windowWidth;
        const searchBarHeightRpx = 72 + 32; // 搜索框高度 + 内边距
        const totalTopOffset = (navBarHeight + searchBarHeightRpx / pxToRpxRatio);
        
        // 动态设置样式
        wx.createSelectorQuery()
          .select('.message-list')
          .fields({ node: true, style: true }, function(res) {
            if (res && res.node) {
              res.node.style.paddingTop = totalTopOffset + 'px';
            }
          })
          .exec();
          
        // 同样调整user-posts-card的顶部边距  
        wx.createSelectorQuery()
          .select('.user-posts-card')
          .fields({ node: true, style: true }, function(res) {
            if (res && res.node) {
              res.node.style.marginTop = totalTopOffset + 'px';
            }
          })
          .exec();
      }
    });
  },

  /**
   * 加载用户发布信息
   */
  loadUserPosts(userId, initialPostType) {
    // 这里应该根据userId从服务器获取用户的发布信息
    // 现在使用模拟数据，模拟从服务器获取数据
    this.getUserPosts(userId, initialPostType).then(posts => {
      if (posts && posts.length > 0) {
        // 获取最新的一条发布
        const latestPost = posts[0];
        // 确保使用传入的initialPostType参数，这是从上一个页面传递过来的，应该优先使用
        this.setData({
          userPosts: [latestPost],
          // 保持postType与页面加载时设置的一致，避免覆盖
          postType: this.data.postType || latestPost.type
        });
      }
    });
  },

  /**
   * 模拟获取用户发布信息
   */
  getUserPosts(userId, postType) {
    return new Promise((resolve) => {
      // 模拟服务器请求延迟
      setTimeout(() => {
        // 使用已经设置到this.data中的postType，这是页面onLoad时处理过的
        // 如果不存在，则使用传入参数，或者随机生成
        let type = this.data.postType || postType || (Math.random() > 0.5 ? 'trip' : 'delivery');
        
        // 确保posts中的type与请求的postType一致
        const posts = [
          {
            id: 'post_1',
            type: type, // 使用确定的类型
            from: type === 'trip' ? '北京' : '上海',
            to: type === 'trip' ? '上海' : '北京',
            time: '2024-03-15 14:30',
            status: 'active',
            statusText: '进行中',
            price: type === 'trip' ? '100' : '50',
            description: type === 'trip' ? '北京到上海的行程，可以帮忙带东西' : '希望有人从上海带一些特产到北京'
          }
        ];
        resolve(posts);
      }, 500);
    });
  },

  /**
   * 加载消息列表
   */
  loadMessages() {
    this.setData({ loading: true });
    
    // 构造请求参数
    const params = {
      page: this.data.page,
      pageSize: this.data.pageSize
    };
    
    // 如果已有会话ID，则使用该会话ID
    if (this.data.conversationId) {
      params.conversationId = this.data.conversationId;
    } 
    // 否则使用目标用户ID
    else if (this.data.targetId) {
      params.targetUserId = this.data.targetId;
      params.postType = this.data.postType;
      params.postId = this.data.postId;
    } else {
      console.error('加载消息失败：缺少conversationId或targetId');
      this.setData({ loading: false });
      return;
    }
    
    // 调用云函数获取消息
    wx.cloud.callFunction({
      name: 'getMessages',
      data: params,
      success: res => {
        console.log('获取消息成功:', res);
        
        if (res.result && res.result.success) {
          const { messages, hasMore, conversationId } = res.result.data;
          
          // 如果没有conversationId，保存从云函数返回的conversationId
          if (!this.data.conversationId && conversationId) {
            this.setData({ conversationId });
          }
          
          // 处理消息数据
          const formattedMessages = this.formatMessages(messages);
          
          this.setData({
            messageList: this.data.page === 1 ? formattedMessages : [...formattedMessages, ...this.data.messageList],
            loading: false,
            hasMore: hasMore
          });
          
          // 如果是第一页，滚动到底部
          if (this.data.page === 1) {
            this.scrollToBottom();
          }
        } else {
          console.error('获取消息失败:', res);
          this.setData({ loading: false });
          
          // 使用模拟数据
          if (this.data.page === 1 && this.data.messageList.length === 0) {
            this.loadMockMessages();
          }
        }
      },
      fail: err => {
        console.error('调用云函数获取消息失败:', err);
        this.setData({ loading: false });
        
        // 使用模拟数据
        if (this.data.page === 1 && this.data.messageList.length === 0) {
          this.loadMockMessages();
        }
      }
    });
  },
  
  // 格式化消息数据
  formatMessages(messages) {
    if (!messages || !Array.isArray(messages)) return [];
    
    const formattedMessages = [];
    let lastTime = 0;
    
    messages.forEach((msg, index) => {
      const time = new Date(msg.time).getTime();
      const showTime = index === 0 || time - lastTime > 5 * 60 * 1000; // 5分钟内不显示时间
      
      if (showTime) {
        lastTime = time;
      }
      
      formattedMessages.push({
        id: msg.id,
        content: msg.content,
        type: msg.type || 'text',
        sender: msg.sender,
        time: new Date(msg.time),
        showTime: showTime,
        status: msg.status || 'sent',
        metadata: msg.metadata || {}
      });
    });
    
    return formattedMessages;
  },
  
  // 加载模拟消息数据
  loadMockMessages() {
    console.log('使用模拟数据');
    const mockMessages = this.getMockMessages();
    
    this.setData({
      messageList: this.data.page === 1 ? mockMessages : [...mockMessages, ...this.data.messageList],
      loading: false,
      hasMore: this.data.page < 3 // 模拟只有3页数据
    });
    
    // 如果是第一页，滚动到底部
    if (this.data.page === 1) {
      this.scrollToBottom();
    }
  },

  /**
   * 输入框内容变化
   */
  onInputChange(e) {
    this.setData({
      inputMessage: e.detail.value
    });
  },

  /**
   * 输入框获得焦点
   */
  onInputFocus(e) {
    // 输入框获取焦点时隐藏功能面板
    if (this.data.showFunctionPanel) {
      this.setData({
        showFunctionPanel: false
      });
    }
    
    // 获取键盘高度
    const keyboardHeight = e.detail.height || 0;
    
    // 页面上浮
    this.setData({
      keyboardHeight: keyboardHeight,
      inputFocus: true
    });
    
    // 将消息列表滚动到最底部
    if (this.data.messageList.length > 0) {
      const lastMessageId = this.data.messageList[this.data.messageList.length - 1].id;
      this.setData({
        scrollToMessage: `msg-${lastMessageId}`
      });
    }
  },

  /**
   * 输入框失去焦点
   */
  onInputBlur() {
    this.setData({
      inputFocus: false,
      keyboardHeight: 0
    });
  },

  /**
   * 发送消息
   */
  sendMessage() {
    const content = this.data.inputMessage.trim();
    if (!content) return;
    
    // 清空输入框
    this.setData({
      inputMessage: '',
      showFunctionPanel: false
    });
    
    // 生成临时消息ID
    const tempId = 'temp_' + Date.now();
    const currentTime = new Date();
    
    // 添加消息到列表
    const newMessage = {
      id: tempId,
      content: content,
      type: 'text',
      sender: this.data.userInfo._openid || 'self',
      time: currentTime,
      showTime: this.shouldShowTime(currentTime),
      status: 'sending'
    };
    
    this.addMessageToList(newMessage);
    
    // 构造请求参数
    const params = {
      receiverId: this.data.targetId,
      content: content,
      messageType: 'text'
    };
    
    // 如果已有会话ID，则使用该会话ID
    if (this.data.conversationId) {
      params.conversationId = this.data.conversationId;
    }
    
    // 添加发布类型和ID（如果有）
    if (this.data.postType) {
      params.postType = this.data.postType;
    }
    
    if (this.data.postId) {
      params.postId = this.data.postId;
    }
    
    // 调用云函数发送消息
    wx.cloud.callFunction({
      name: 'sendMessage',
      data: params,
      success: res => {
        console.log('发送消息成功:', res);
        
        if (res.result && res.result.success) {
          // 如果没有conversationId，保存从云函数返回的conversationId
          if (!this.data.conversationId && res.result.data.conversationId) {
            this.setData({
              conversationId: res.result.data.conversationId
            });
          }
          
          // 更新消息状态
          this.updateMessageStatus(tempId, 'sent', res.result.data.messageId);
        } else {
          console.error('发送消息失败:', res);
          this.updateMessageStatus(tempId, 'failed');
        }
      },
      fail: err => {
        console.error('调用云函数发送消息失败:', err);
        this.updateMessageStatus(tempId, 'failed');
      }
    });
    
    // 模拟收到回复
    setTimeout(() => {
      this.simulateReply();
    }, 1000);
  },
  
  // 更新消息状态
  updateMessageStatus(tempId, status, newId = null) {
    const { messageList } = this.data;
    const index = messageList.findIndex(msg => msg.id === tempId);
    
    if (index !== -1) {
      const updatedMessages = [...messageList];
      updatedMessages[index].status = status;
      
      if (newId) {
        updatedMessages[index].id = newId;
      }
      
      this.setData({
        messageList: updatedMessages
      });
    }
  },
  
  // 判断是否应该显示时间
  shouldShowTime(currentTime) {
    const { messageList } = this.data;
    
    if (messageList.length === 0) {
      return true;
    }
    
    const lastMessage = messageList[messageList.length - 1];
    const lastTime = lastMessage.time instanceof Date ? lastMessage.time : new Date(lastMessage.time);
    
    // 如果当前消息和上一条消息的时间间隔超过5分钟，则显示时间
    return currentTime - lastTime > 5 * 60 * 1000;
  },

  /**
   * 选择并发送图片
   */
  chooseImage() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        // 显示发送中状态
        const messageId = Date.now().toString();
        const message = {
          id: messageId,
          type: 'image',
          content: tempFilePath,
          isSelf: true,
          time: that.formatTime(new Date()),
          status: 'sending'
        };
        
        that.addMessageToList(message);
        
        // 上传图片
        that.uploadFile(tempFilePath, messageId);
        
        // 隐藏功能面板
        that.setData({
          showFunctionPanel: false
        });
      },
      fail: function(err) {
        console.error('选择图片失败', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 上传文件
   */
  uploadFile(filePath, messageId) {
    const that = this;
    
    // 在实际应用中应该调用上传API
    // 这里使用模拟的延时来模拟上传过程
    setTimeout(function() {
      const success = Math.random() > 0.1; // 90%的成功率
      
      let messageList = that.data.messageList;
      const index = messageList.findIndex(item => item.id === messageId);
      
      if (index !== -1) {
        messageList[index].status = success ? 'success' : 'failed';
        
        that.setData({
          messageList: messageList
        });
        
        if (success) {
          // 发送图片消息到服务器
          that.sendMessageToServer({
            id: messageId,
            type: 'image',
            content: filePath
          });
        } else {
          wx.showToast({
            title: '图片发送失败',
            icon: 'none'
          });
        }
      }
    }, 1500);
  },

  /**
   * 分享订单
   */
  shareOrder() {
    const that = this;
    
    // 获取可分享的订单列表
    // 在实际应用中应该从服务器获取数据
    const orders = [
      { orderId: 'O202304250001', status: '待处理', price: '50.00' },
      { orderId: 'O202304240002', status: '进行中', price: '35.50' },
      { orderId: 'O202304230003', status: '已完成', price: '120.00' }
    ];
    
    if (orders.length === 0) {
      wx.showToast({
        title: '暂无可分享订单',
        icon: 'none'
      });
      return;
    }
    
    // 显示订单选择器
    wx.showActionSheet({
      itemList: orders.map(order => `订单: ${order.orderId} (${order.status})`),
      success: function(res) {
        const selectedOrder = orders[res.tapIndex];
        
        // 发送订单消息
        const messageId = Date.now().toString();
        const message = {
          id: messageId,
          type: 'order',
          content: selectedOrder,
          isSelf: true,
          time: that.formatTime(new Date()),
          status: 'success'
        };
        
        that.addMessageToList(message);
        
        // 发送消息到服务器
        that.sendMessageToServer({
          id: messageId,
          type: 'order',
          content: selectedOrder
        });
        
        // 隐藏功能面板
        that.setData({
          showFunctionPanel: false
        });
      }
    });
  },

  /**
   * 分享位置
   */
  shareLocation() {
    const that = this;
    
    wx.chooseLocation({
      success: (res) => {
        console.log('选择位置成功', res);
        
        const location = {
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        };
        
        // 获取静态地图作为预览图
        const mapUrl = `https://apis.map.qq.com/ws/staticmap/v2/?center=${res.latitude},${res.longitude}&zoom=15&size=300*150&maptype=roadmap&markers=color:red|${res.latitude},${res.longitude}&key=YOUR_MAP_KEY`;
        
        // 创建位置消息
        const msgId = 'temp_' + Date.now();
        const message = {
          id: msgId,
          type: 'location',
          content: {
            ...location,
            cover: mapUrl
          },
          isSelf: true,
          status: 'sending',
          timestamp: Date.now(),
          time: this.formatTime(new Date()),
          date: this.formatDate(new Date()),
          read: false
        };
        
        // 添加到消息列表
        this.addMessageToList(message);
        
        // 发送消息到服务器
        this.sendMessageToServer({
          type: 'location',
          content: location,
          tempId: msgId
        });
      },
      fail: (err) => {
        console.error('选择位置失败', err);
        if (err.errMsg !== 'chooseLocation:fail cancel') {
          wx.showToast({
            title: '位置选择失败',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 添加消息到列表
   */
  addMessageToList(message) {
    let messageList = this.data.messageList;
    messageList.push(message);
    
    this.setData({
      messageList: messageList,
      scrollToMessage: 'msg-' + message.id
    });
  },

  /**
   * 查看订单详情
   */
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${orderId}`
    });
  },

  /**
   * 切换功能面板
   */
  toggleFunctionPanel() {
    this.setData({
      showFunctionPanel: !this.data.showFunctionPanel,
      inputFocus: false
    });
  },

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    if (this.data.messageList.length > 0) {
      const lastMessage = this.data.messageList[this.data.messageList.length - 1];
      this.setData({
        scrollToMessage: `msg-${lastMessage.id}`
      });
    }
  },

  /**
   * 模拟对方回复
   */
  simulateReply() {
    // 模拟对方正在输入
    setTimeout(() => {
      // 模拟回复内容
      const replies = [
        '好的，没问题',
        '我明白了，谢谢你的信息',
        '可以，我会尽快处理',
        '需要更多详细信息吗？',
        '我已经收到了，稍后回复你'
      ];
      
      const replyIndex = Math.floor(Math.random() * replies.length);
      const replyContent = replies[replyIndex];
      
      // 创建回复消息
      const replyMessage = {
        id: `msg_reply_${Date.now()}`,
        type: 'text',
        content: replyContent,
        senderId: this.data.targetUser.id,
        time: new Date(),
        status: 'sent',
        showTimeHeader: false
      };
      
      // 添加到消息列表
      const messages = [...this.data.messageList, replyMessage];
      
      this.setData({
        messageList: messages
      });
      
      // 滚动到底部
      this.scrollToBottom();
    }, 1000 + Math.random() * 2000); // 随机1-3秒后回复
  },

  /**
   * 查看发布详情
   */
  viewPostDetail(e) {
    const postId = e.currentTarget.dataset.id;
    const post = this.data.userPosts.find(item => item.id === postId);
    
    if (post) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${postId}&type=${this.data.postType}`
      });
    }
  },

  onUnload() {
    // 页面卸载时断开WebSocket连接
    if (this.webSocket) {
      this.webSocket.close();
    }
    // 清除心跳定时器
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // 清理录音计时器
    this.clearRecordTimer();
    
    // 停止录音
    if (this.data.isRecording) {
      this.recorderManager.stop();
    }
    
    // 释放录音管理器
    if (this.recorderManager) {
      // 录音管理器无需手动释放
    }
    
    // 释放音频播放上下文
    if (this.innerAudioContext) {
      this.innerAudioContext.stop();
      this.innerAudioContext.destroy();
    }
  },

  /**
   * 建立WebSocket连接
   */
  connectWebSocket() {
    if (this.data.reconnectCount >= this.data.maxReconnectCount) {
      wx.showToast({
        title: '连接失败，请重试',
        icon: 'none'
      });
      return;
    }

    const token = wx.getStorageSync('token'); // 获取用户token
    const wsUrl = `wss://your-domain/ws?token=${token}&targetId=${this.data.targetId}`;
    
    this.webSocket = wx.connectSocket({
      url: wsUrl,
      success: () => {
        console.log('WebSocket连接成功');
        this.setData({ wsConnected: true });
        this.startHeartbeat();
      },
      fail: (error) => {
        console.error('WebSocket连接失败：', error);
        this.setData({
          wsConnected: false,
          reconnectCount: this.data.reconnectCount + 1
        });
        // 3秒后重连
        setTimeout(() => this.connectWebSocket(), 3000);
      }
    });

    // 监听WebSocket连接打开
    this.webSocket.onOpen(() => {
      console.log('WebSocket连接已打开');
      this.setData({ 
        wsConnected: true,
        reconnectCount: 0
      });
    });

    // 监听WebSocket错误
    this.webSocket.onError((error) => {
      console.error('WebSocket错误：', error);
      this.setData({ wsConnected: false });
    });

    // 监听WebSocket关闭
    this.webSocket.onClose(() => {
      console.log('WebSocket连接已关闭');
      this.setData({ wsConnected: false });
      // 清除心跳定时器
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
      }
      // 尝试重连
      setTimeout(() => this.connectWebSocket(), 3000);
    });

    // 监听WebSocket消息
    this.webSocket.onMessage((res) => {
      try {
        const message = JSON.parse(res.data);
        this.handleNewMessage(message);
      } catch (error) {
        console.error('解析消息失败：', error);
      }
    });
  },

  /**
   * 开始心跳检测
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.data.wsConnected) {
        this.webSocket.send({
          data: JSON.stringify({ type: 'heartbeat' }),
          fail: () => {
            this.setData({ wsConnected: false });
            this.connectWebSocket();
          }
        });
      }
    }, 30000); // 每30秒发送一次心跳
  },

  /**
   * 处理新消息
   */
  handleNewMessage(message) {
    // 根据消息类型处理
    switch (message.type) {
      case 'text':
      case 'image':
      case 'order':
        // 添加到消息列表
        const messages = [...this.data.messageList, message];
        this.setData({
          messageList: messages,
          scrollToMessage: `msg-${message.id}`
        });
        break;
      case 'typing':
        // 处理对方正在输入状态
        this.setData({
          'targetUser.typing': message.typing
        });
        break;
      case 'status':
        // 处理用户在线状态更新
        this.setData({
          'targetUser.online': message.online,
          'targetUser.lastSeen': message.lastSeen
        });
        break;
    }
  },

  /**
   * 重发消息
   */
  resendMessage(e) {
    const message = e.currentTarget.dataset.message;
    
    // 更新消息状态为发送中
    this.updateMessageStatus(message.id, 'sending');
    
    // 根据消息类型处理重发
    switch (message.type) {
      case 'text':
        this.webSocket.send({
          data: JSON.stringify(message),
          success: () => {
            this.updateMessageStatus(message.id, 'sent');
          },
          fail: () => {
            this.updateMessageStatus(message.id, 'failed');
            wx.showToast({
              title: '发送失败',
              icon: 'none'
            });
          }
        });
        break;
        
      case 'image':
        // 如果是本地图片路径，重新上传
        if (message.content.startsWith('wxfile://') || message.content.startsWith('http://tmp/')) {
          this.uploadImage(message.content, message.id);
        } else {
          // 如果是网络图片，直接重发消息
          this.webSocket.send({
            data: JSON.stringify({
              type: 'image',
              messageId: message.id,
              url: message.content
            }),
            success: () => {
              this.updateMessageStatus(message.id, 'sent');
            },
            fail: () => {
              this.updateMessageStatus(message.id, 'failed');
              wx.showToast({
                title: '发送失败',
                icon: 'none'
              });
            }
          });
        }
        break;
        
      case 'order':
        this.webSocket.send({
          data: JSON.stringify(message),
          success: () => {
            this.updateMessageStatus(message.id, 'sent');
          },
          fail: () => {
            this.updateMessageStatus(message.id, 'failed');
            wx.showToast({
              title: '发送失败',
              icon: 'none'
            });
          }
        });
        break;
    }
  },

  /**
   * 图片加载错误处理
   */
  onImageError(e) {
    const messageId = e.currentTarget.dataset.id;
    
    // 更新消息列表中的图片状态
    const messages = this.data.messageList.map(item => {
      if (item.id === messageId) {
        return {
          ...item,
          imageError: true
        };
      }
      return item;
    });
    
    this.setData({ messageList: messages });
  },

  /**
   * 创建订单
   */
  createOrder(e) {
    try {
      // 阻止事件冒泡，防止触发viewPostDetail
      if (e && typeof e.stopPropagation === "function") { e.stopPropagation(); } else { console.warn("事件对象不完整或缺少stopPropagation方法"); }
      
      let id, type; if (e && e.currentTarget && e.currentTarget.dataset) { id = e.currentTarget.dataset.id; type = e.currentTarget.dataset.type; } else { console.warn("无法从事件获取id和type，使用默认值"); id = this.data.userPosts && this.data.userPosts.length > 0 ? this.data.userPosts[0].id : ""; type = this.data.postType; }
      const isTrip = this.data.postType === 'trip';
      
      // 显示加载提示
      wx.showLoading({
        title: '处理中...',
        mask: true
      });
      
      // 第一步：创建预订单，获取订单ID
      setTimeout(() => {
        wx.hideLoading();
        
        // 创建订单成功
        wx.showModal({
          title: isTrip ? '下单确认' : '接单确认',
          content: isTrip ? 
            `确认要为此行程创建订单吗？` : 
            `确认要接受此捎带需求吗？`,
          success: (res) => {
            if (res.confirm) {
              // 用户点击确认，创建预订单
              // 在实际应用中，这里应该调用后端API创建订单并获取订单ID
              const orderId = 'O' + Date.now();
              const price = isTrip ? '50.00' : '30.00'; // 模拟价格
              
              // 显示订单金额确认
              wx.showModal({
                title: '订单金额',
                content: `订单金额：¥${price}元，${isTrip ? '是否确认支付？' : '发布需求的人将支付此金额'}`,
                confirmText: isTrip ? '去支付' : '确认接单',
                cancelText: '取消',
                success: (payConfirm) => {
                  if (payConfirm.confirm) {
                    if (isTrip) {
                      // 如果是行程订单，由下单人支付
                      this.requestPayment(orderId, parseFloat(price));
                    } else {
                      // 如果是接单，创建订单但不要求接单人支付
                      const orderInfo = {
                        orderId: orderId,
                        postId: id,
                        postType: this.data.postType,
                        status: '已接单',
                        price: price
                      };
                      
                      const messageId = Date.now().toString();
                      const message = {
                        id: messageId,
                        type: 'order',
                        content: orderInfo,
                        isSelf: true,
                        time: this.formatTime(new Date()),
                        status: 'success'
                      };
                      
                      this.addMessageToList(message);
                      
                      // 发送消息到服务器
                      this.sendMessageToServer({
                        id: messageId,
                        type: 'order',
                        content: orderInfo
                      });
                      
                      // 提示用户接单成功
                      wx.showToast({
                        title: '接单成功',
                        icon: 'success'
                      });

                      // 跳转到订单详情页
                      setTimeout(() => {
                        wx.navigateTo({
                          url: `/pages/order-detail/order-detail?id=${orderId}`
                        });
                      }, 1500);
                    }
                  }
                }
              });
            }
          }
        });
      }, 1000);
    } catch (error) {
      console.error('创建订单失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '创建订单失败',
        icon: 'none'
      });
    }
  },

  /**
   * 发起微信支付
   */
  requestPayment(orderId, amount) {
    // 显示加载提示
    wx.showLoading({
      title: '获取支付参数...',
      mask: true
    });

    // 在实际应用中，这里应该调用后端API获取支付参数
    // 这里使用模拟数据
    setTimeout(() => {
      wx.hideLoading();
      
      // 调用微信支付API
      wx.requestPayment({
        timeStamp: '' + Math.floor(Date.now() / 1000),
        nonceStr: Math.random().toString(36).substr(2, 15),
        package: 'prepay_id=wx' + Date.now(),
        signType: 'MD5',
        paySign: 'MOCK_SIGNATURE', // 实际应用中应该由服务器生成
        success: (payRes) => {
          // 支付成功
          this.handlePaymentSuccess(orderId, amount);
        },
        fail: (payErr) => {
          // 支付失败（包括用户取消）
          if (payErr.errMsg !== 'requestPayment:fail cancel') {
            // 非用户取消的失败情况
            wx.showToast({
              title: '支付失败，请重试',
              icon: 'none'
            });
          }
          
          // 更新订单状态为"待支付"
          const orderInfo = {
            orderId: orderId,
            status: '待支付',
            price: amount.toFixed(2)
          };
          
          // 可以选择跳转到订单详情页，用户可以在那里继续支付
          setTimeout(() => {
            wx.navigateTo({
              url: `/pages/order-detail/order-detail?id=${orderId}`
            });
          }, 1000);
        },
        complete: () => {
          // 支付流程完成
        }
      });
    }, 1000);
  },

  /**
   * 处理支付成功
   */
  handlePaymentSuccess(orderId, amount) {
    // 显示支付成功提示
    wx.showToast({
      title: '支付成功',
      icon: 'success',
      duration: 2000
    });
    
    // 更新订单状态为"已支付"
    const orderInfo = {
      orderId: orderId,
      postType: this.data.postType,
      status: '已支付',
      price: amount.toFixed(2)
    };
    
    const messageId = Date.now().toString();
    const message = {
      id: messageId,
      type: 'order',
      content: orderInfo,
      isSelf: true,
      time: this.formatTime(new Date()),
      status: 'success'
    };
    
    this.addMessageToList(message);
    
    // 发送消息到服务器
    this.sendMessageToServer({
      id: messageId,
      type: 'order',
      content: orderInfo
    });
    
    // 跳转到订单详情页
    setTimeout(() => {
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${orderId}`
      });
    }, 1500);
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    return `${month}-${day} ${hour}:${minute < 10 ? '0' + minute : minute}`;
  },

  /**
   * 格式化预计到达时间
   */
  formatEstimatedArrival(timeStr) {
    try {
      // 假设timeStr格式为 '2024-03-15 14:30'
      const date = new Date(timeStr);
      return date.toISOString();
    } catch (e) {
      // 如果解析失败，返回7天后的日期
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date.toISOString();
    }
  },

  /**
   * 发送消息到服务器
   */
  sendMessageToServer(message) {
    // 如果WebSocket连接正常，则通过WebSocket发送
    if (this.data.wsConnected && this.webSocket) {
      this.webSocket.send({
        data: JSON.stringify(message),
        fail: (err) => {
          console.error('发送消息到服务器失败:', err);
        }
      });
    } else {
      console.warn('WebSocket未连接，无法发送消息');
      // 可以考虑将消息存入本地缓存，等连接恢复后再发送
    }
  },

  // 初始化录音管理器
  initRecorder() {
    const recorderManager = wx.getRecorderManager();
    
    recorderManager.onStart(() => {
      console.log('录音开始');
      this.setData({
        isRecording: true,
        recordingTime: '0"',
        willCancel: false
      });
      
      // 开始计时
      this.startRecordTimer();
    });
    
    recorderManager.onStop((res) => {
      console.log('录音结束', res);
      this.clearRecordTimer();
      
      if (this.data.willCancel) {
        console.log('取消发送语音');
        this.setData({
          isRecording: false,
          willCancel: false
        });
        return;
      }
      
      if (res.duration < 1000) {
        wx.showToast({
          title: '说话时间太短',
          icon: 'none'
        });
        this.setData({
          isRecording: false
        });
        return;
      }
      
      // 发送语音消息
      this.sendVoiceMessage(res);
    });
    
    recorderManager.onError((err) => {
      console.error('录音失败', err);
      wx.showToast({
        title: '录音失败: ' + err.errMsg,
        icon: 'none'
      });
      this.clearRecordTimer();
      this.setData({
        isRecording: false,
        willCancel: false
      });
    });
    
    this.recorderManager = recorderManager;
  },
  
  // 初始化音频播放器
  initAudioPlayer() {
    const innerAudioContext = wx.createInnerAudioContext();
    
    innerAudioContext.onPlay(() => {
      console.log('音频播放开始');
    });
    
    innerAudioContext.onEnded(() => {
      console.log('音频播放结束');
      this.stopVoicePlaying();
    });
    
    innerAudioContext.onError((err) => {
      console.error('音频播放错误', err);
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
      this.stopVoicePlaying();
    });
    
    this.innerAudioContext = innerAudioContext;
  },
  
  // 开始录音计时
  startRecordTimer() {
    this.recordStartTime = Date.now();
    this.recordTimer = setInterval(() => {
      const duration = Math.floor((Date.now() - this.recordStartTime) / 1000);
      this.setData({
        recordingTime: `${duration}"`
      });
      
      // 超过60秒自动停止
      if (duration >= 60) {
        this.endVoiceRecord();
      }
    }, 1000);
  },
  
  // 清除录音计时器
  clearRecordTimer() {
    if (this.recordTimer) {
      clearInterval(this.recordTimer);
      this.recordTimer = null;
    }
  },
  
  // 切换语音/文本输入模式
  toggleVoiceInput() {
    this.setData({
      isVoiceMode: !this.data.isVoiceMode,
      showFunctionPanel: false
    });
  },
  
  // 开始录音
  startVoiceRecord(e) {
    // 检查录音权限
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.recorderManager.start({
          duration: 60000, // 最长60s
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 64000,
          format: 'mp3'
        });
      },
      fail: (err) => {
        console.error('录音授权失败', err);
        wx.showToast({
          title: '请授权录音权限',
          icon: 'none'
        });
      }
    });
    
    // 记录起始触摸位置
    this.touchStartY = e.touches[0].clientY;
  },
  
  // 移动录音按钮
  moveVoiceRecord(e) {
    if (!this.data.isRecording) return;
    
    const touchY = e.touches[0].clientY;
    const distance = this.touchStartY - touchY;
    
    // 上滑超过50像素，认为是取消发送
    const willCancel = distance > 50;
    
    if (willCancel !== this.data.willCancel) {
      this.setData({
        willCancel
      });
    }
  },
  
  // 结束录音
  endVoiceRecord() {
    if (this.data.isRecording) {
      this.recorderManager.stop();
    }
  },
  
  // 发送语音消息
  sendVoiceMessage(res) {
    const { tempFilePath, duration } = res;
    
    // 显示发送中
    wx.showLoading({
      title: '发送中...',
    });
    
    // 上传语音文件到云存储
    const cloudPath = `voices/${this.data.targetUserId}/${Date.now()}.mp3`;
    
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath,
      success: res => {
        console.log('上传语音成功', res);
        const fileID = res.fileID;
        
        // 准备语音消息内容
        const voiceContent = {
          fileID: fileID,
          duration: Math.floor(duration / 1000), // 转换为秒
          path: tempFilePath
        };
        
        // 创建消息对象
        const msgId = 'temp_' + Date.now();
        const message = {
          id: msgId,
          type: 'voice',
          content: voiceContent,
          isSelf: true,
          status: 'sending',
          timestamp: Date.now(),
          time: this.formatTime(new Date()),
          date: this.formatDate(new Date()),
          read: false
        };
        
        // 添加到消息列表
        this.addMessageToList(message);
        
        // 发送消息到服务器
        this.sendMessageToServer({
          type: 'voice',
          content: voiceContent,
          tempId: msgId
        });
      },
      fail: err => {
        console.error('上传语音失败', err);
        wx.showToast({
          title: '语音发送失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
        this.setData({
          isRecording: false
        });
      }
    });
  },
  
  // 播放语音消息
  playVoice(e) {
    const { voice, id } = e.currentTarget.dataset;
    
    // 如果当前有正在播放的，先停止
    if (this.data.currentPlayingId) {
      this.stopVoicePlaying();
    }
    
    // 如果点击的是当前正在播放的，则停止播放
    if (this.data.currentPlayingId === id) {
      return;
    }
    
    const audioSrc = voice.path || voice.fileID;
    
    // 设置音频源
    this.innerAudioContext.src = audioSrc;
    
    // 设置当前播放ID并更新UI
    this.setData({
      currentPlayingId: id
    });
    
    // 更新消息列表中的播放状态
    const messageList = this.data.messageList;
    const msgIndex = messageList.findIndex(msg => msg.id === id);
    
    if (msgIndex !== -1) {
      const key = `messageList[${msgIndex}].isPlaying`;
      this.setData({
        [key]: true
      });
    }
    
    // 开始播放
    this.innerAudioContext.play();
  },
  
  // 停止语音播放
  stopVoicePlaying() {
    if (!this.data.currentPlayingId) return;
    
    this.innerAudioContext.stop();
    
    // 更新消息列表中的播放状态
    const messageList = this.data.messageList;
    const msgIndex = messageList.findIndex(msg => msg.id === this.data.currentPlayingId);
    
    if (msgIndex !== -1) {
      const key = `messageList[${msgIndex}].isPlaying`;
      this.setData({
        [key]: false
      });
    }
    
    this.setData({
      currentPlayingId: ''
    });
  },
  
  // 选择文件
  chooseFile() {
    // 微信小程序目前只支持选择图片、视频和相机，不支持通用文件选择
    // 这里仅作为功能示例，实际应用中需根据小程序的限制调整
    wx.showActionSheet({
      itemList: ['文档', '表格', '其他文件'],
      success: (res) => {
        // 模拟文件选择
        const fileTypes = ['doc', 'xlsx', 'pdf'];
        const selectedType = fileTypes[res.tapIndex];
        
        // 模拟文件数据
        const mockFile = {
          name: `示例文件.${selectedType}`,
          size: '258KB',
          type: selectedType,
          url: `cloud://example/files/sample.${selectedType}`
        };
        
        this.sendFileMessage(mockFile);
      }
    });
  },
  
  // 发送文件消息
  sendFileMessage(file) {
    // 创建消息对象
    const msgId = 'temp_' + Date.now();
    const message = {
      id: msgId,
      type: 'file',
      content: file,
      isSelf: true,
      status: 'sending',
      timestamp: Date.now(),
      time: this.formatTime(new Date()),
      date: this.formatDate(new Date()),
      read: false
    };
    
    // 添加到消息列表
    this.addMessageToList(message);
    
    // 模拟发送到服务器
    setTimeout(() => {
      this.updateMessageStatus(msgId, 'sent');
      
      // 模拟消息回复
      if (this.data.simulateReply) {
        setTimeout(() => {
          this.simulateReply(`我收到了你的文件：${file.name}`);
        }, 1000);
      }
    }, 500);
  },
  
  // 打开文件
  openFile(e) {
    const file = e.currentTarget.dataset.file;
    
    wx.showToast({
      title: '暂不支持打开此类文件',
      icon: 'none'
    });
    
    // 实际应用中，可以根据文件类型调用对应的打开方法
    // 如果是网络文件，可以尝试使用wx.downloadFile和wx.openDocument
  },
  
  // 切换快捷回复栏
  toggleQuickReply() {
    this.setData({
      showQuickReply: !this.data.showQuickReply,
      showFunctionPanel: false
    });
  },
  
  // 发送快捷回复
  sendQuickReply(e) {
    const reply = e.currentTarget.dataset.reply;
    
    // 设置输入框内容
    this.setData({
      inputMessage: reply,
      showQuickReply: false
    });
    
    // 直接发送
    this.sendMessage();
  },
  
  // 打开位置
  openLocation(e) {
    const location = e.currentTarget.dataset.location;
    
    wx.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
      address: location.address,
      scale: 18
    });
  },
  
  // 更新未读状态
  updateMessageRead(messageId) {
    // 查找消息
    const messageList = this.data.messageList;
    const msgIndex = messageList.findIndex(msg => msg.id === messageId);
    
    if (msgIndex !== -1 && !messageList[msgIndex].read) {
      // 更新已读状态
      const key = `messageList[${msgIndex}].read`;
      this.setData({
        [key]: true
      });
      
      // 调用云函数更新服务器端状态
      wx.cloud.callFunction({
        name: 'updateMessageRead',
        data: {
          messageId
        }
      }).then(res => {
        console.log('更新消息已读状态成功', res);
      }).catch(err => {
        console.error('更新消息已读状态失败', err);
      });
    }
  },
  
  // 收到新消息时的处理
  onNewMessage(message) {
    // ... existing code ...
    
    // 更新消息未读状态
    if (!message.isSelf && message.status !== 'read') {
      // 通知服务器消息已读
      this.updateMessageRead(message.id);
    }
    
    // ... existing code ...
  },

  /**
   * 搜索输入处理
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },
  
  /**
   * 搜索消息
   */
  searchMessages() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      return;
    }
    
    this.setData({
      isSearching: true
    });
    
    // 在消息列表中搜索关键词
    const results = this.data.messageList.filter(msg => {
      if (msg.type === 'text' && msg.content) {
        return msg.content.indexOf(keyword) > -1;
      }
      return false;
    });
    
    this.setData({
      searchResults: results,
      isSearching: false
    });
    
    // 如果有搜索结果，滚动到第一条匹配的消息
    if (results.length > 0) {
      this.setData({
        scrollToMessage: `msg-${results[0].id}`
      });
      
      // 高亮显示搜索结果
      wx.showToast({
        title: `找到 ${results.length} 条匹配消息`,
        icon: 'none'
      });
    } else {
      wx.showToast({
        title: '未找到匹配内容',
        icon: 'none'
      });
    }
  },
})