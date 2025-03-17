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
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    // 模拟加载数据
    setTimeout(() => {
      const newMessages = this.getMockMessages();
      
      this.setData({
        messageList: this.data.page === 1 ? newMessages : [...newMessages, ...this.data.messageList],
        loading: false,
        hasMore: this.data.page < 3,
        page: this.data.page + 1
      });
    }, 1000);
  },

  /**
   * 获取模拟消息数据
   */
  getMockMessages() {
    const messages = [];
    const contents = [
      '你好，请问有什么可以帮到你？',
      '我想了解一下这个捎带的详情',
      '好的，我可以帮你带过去',
      '请问什么时候可以送达？',
      '谢谢，已经收到了'
    ];
    
    for (let i = 0; i < this.data.pageSize; i++) {
      const contentIndex = Math.floor(Math.random() * contents.length);
      const isSelf = Math.random() > 0.5;
      const now = new Date();
      const time = `${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
      
      messages.push({
        id: `msg_${this.data.page}_${i}`,
        type: 'text',
        content: contents[contentIndex],
        time: time,
        isSelf: isSelf
      });
    }
    
    return messages;
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
    if (!this.data.inputMessage.trim()) return;
    
    if (!this.data.wsConnected) {
      wx.showToast({
        title: '网络连接失败，请重试',
        icon: 'none'
      });
      return;
    }
    
    const now = new Date();
    const time = `${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
    
    const message = {
      id: `msg_${Date.now()}`,
      type: 'text',
      content: this.filterMessage(this.data.inputMessage),
      time: time,
      isSelf: true,
      status: 'sending'
    };
    
    // 添加到消息列表
    this.setData({
      messageList: [...this.data.messageList, message],
      inputMessage: '',
      scrollToMessage: `msg-${message.id}`,
      showFunctionPanel: false
    });
    
    // 发送消息
    this.webSocket.send({
      data: JSON.stringify(message),
      success: () => {
        // 更新消息状态为已发送
        const messages = this.data.messageList.map(item => {
          if (item.id === message.id) {
            return { ...item, status: 'sent' };
          }
          return item;
        });
        this.setData({ messageList: messages });
      },
      fail: () => {
        // 更新消息状态为发送失败
        const messages = this.data.messageList.map(item => {
          if (item.id === message.id) {
            return { ...item, status: 'failed' };
          }
          return item;
        });
        this.setData({ messageList: messages });
        
        wx.showToast({
          title: '发送失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 过滤消息内容
   */
  filterMessage(content) {
    // 过滤敏感词
    const sensitiveWords = ['敏感词1', '敏感词2'];
    let filteredContent = content;
    
    sensitiveWords.forEach(word => {
      const reg = new RegExp(word, 'g');
      filteredContent = filteredContent.replace(reg, '*'.repeat(word.length));
    });
    
    return filteredContent;
  },

  /**
   * 加载更多消息
   */
  loadMoreMessages() {
    this.loadMessages();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({
      messageList: [],
      page: 1,
      hasMore: true
    });
    
    this.loadMessages();
    wx.stopPullDownRefresh();
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
      success: function(res) {
        const location = {
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        };
        
        // 发送位置消息
        const messageId = Date.now().toString();
        const message = {
          id: messageId,
          type: 'location',
          content: location,
          isSelf: true,
          time: that.formatTime(new Date()),
          status: 'success'
        };
        
        that.addMessageToList(message);
        
        // 发送消息到服务器
        that.sendMessageToServer({
          id: messageId,
          type: 'location',
          content: location
        });
        
        // 隐藏功能面板
        that.setData({
          showFunctionPanel: false
        });
      },
      fail: function(err) {
        console.error('选择位置失败', err);
        if (err.errMsg !== 'chooseLocation:fail cancel') {
          wx.showToast({
            title: '选择位置失败',
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
  }
})