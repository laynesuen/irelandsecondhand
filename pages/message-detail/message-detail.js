// pages/message-detail/message-detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    messageId: '', // 消息ID
    messageData: null, // 消息数据
    relatedMessages: [], // 相关消息
    loading: true // 加载状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({
        messageId: options.id
      });
      this.loadMessageDetail(options.id);
    } else {
      this.setData({
        loading: false,
        messageData: null
      });
    }
  },

  /**
   * 加载消息详情
   */
  loadMessageDetail(id) {
    // 模拟加载数据
    setTimeout(() => {
      // 模拟消息详情数据
      const messageData = this.getMockMessageDetail(id);
      
      // 模拟相关消息
      const relatedMessages = this.getMockRelatedMessages(messageData.type);
      
      this.setData({
        messageData,
        relatedMessages,
        loading: false
      });
      
      // 更新消息已读状态
      this.updateMessageReadStatus(id);
    }, 1000);
  },

  /**
   * 获取模拟消息详情数据
   */
  getMockMessageDetail(id) {
    // 解析ID获取类型
    const isSystem = id.includes('system');
    
    return {
      id: id,
      type: isSystem ? 'system' : 'order',
      title: isSystem ? '系统通知' : '订单状态更新',
      content: isSystem 
        ? '尊敬的用户，感谢您使用爱岛捎带！我们的平台已全面升级，新增了更多便捷功能。现在您可以更方便地发布和接受捎带需求，享受更流畅的使用体验。如有任何问题，请随时联系客服。'
        : '您的订单 #' + id.substring(5) + ' 状态已更新为"已接单"',
      time: "2023-06-15 14:30",
      orderId: isSystem ? null : 'order_' + id.substring(5),
      orderStatus: isSystem ? null : '已接单',
      updateTime: isSystem ? null : '2023-06-15 14:28'
    };
  },

  /**
   * 获取模拟相关消息
   */
  getMockRelatedMessages(type) {
    // 根据消息类型生成相关消息
    const messages = [];
    const count = Math.floor(Math.random() * 3) + 1; // 1-3条相关消息
    
    for (let i = 0; i < count; i++) {
      const now = new Date();
      const time = `${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
      
      if (type === 'system') {
        messages.push({
          id: `system_${i}`,
          title: '系统功能更新通知',
          time: time
        });
      } else {
        messages.push({
          id: `order_${i}`,
          title: '订单状态变更提醒',
          time: time
        });
      }
    }
    
    return messages;
  },

  /**
   * 更新消息已读状态
   */
  updateMessageReadStatus(id) {
    // 实际应用中，这里会调用API更新消息已读状态
    console.log('更新消息已读状态:', id);
  },

  /**
   * 查看订单详情
   */
  viewOrderDetail() {
    const orderId = this.data.messageData.orderId;
    if (!orderId) return;
    
    // 跳转到订单详情页
    wx.navigateTo({
      url: `/pages/detail/detail?id=${orderId}`
    });
  },

  /**
   * 点击相关消息
   */
  onRelatedTap(e) {
    const id = e.currentTarget.dataset.id;
    
    // 跳转到对应的消息详情页
    wx.navigateTo({
      url: `/pages/message-detail/message-detail?id=${id}`
    });
  },

  /**
   * 返回消息列表
   */
  goBack() {
    wx.navigateBack();
  }
});