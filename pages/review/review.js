const app = getApp();

Page({
  data: {
    orderId: '',
    targetUserId: '',
    orderInfo: null,
    targetUserInfo: null,
    loading: true,
    submitting: false,
    rating: 5, // 默认评分为5星
    content: '',
    selectedTags: [],
    availableTags: [
      '服务热情', '沟通顺畅', '商品满意', '物超所值', '描述相符', 
      '发货迅速', '包装完好', '售后优质', '很有耐心', '时间准时'
    ],
    contentLength: 0
  },

  onLoad(options) {
    // 检查参数
    if (!options.orderId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    const orderId = options.orderId;
    const type = options.type || 'trip'; // 默认为trip类型

    // 保存参数
    this.setData({
      orderId: orderId,
      loading: true,
      orderType: type
    });

    // 获取订单和用户信息
    this.loadOrderInfo();
  },

  // 加载订单信息
  loadOrderInfo() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    // 根据不同的订单类型获取不同的信息
    const { orderId, orderType } = this.data;
    
    // 模拟获取订单详情
    // 实际开发中应该调用接口获取真实数据
    setTimeout(() => {
      // 生成模拟数据
      const orderInfo = this.generateMockOrderInfo(orderId, orderType);
      
      // 确定目标用户ID
      let targetUserId = '';
      if (orderType === 'trip') {
        // 如果是行程订单，则评价的目标是旅行者
        targetUserId = orderInfo.traveler.id;
        this.setData({
          targetUserInfo: orderInfo.traveler
        });
      } else {
        // 如果是捎带需求，则评价的目标是承运者
        targetUserId = orderInfo.carrier.id;
        this.setData({
          targetUserInfo: orderInfo.carrier
        });
      }
      
      this.setData({
        orderInfo: orderInfo,
        targetUserId: targetUserId,
        loading: false
      });
      
      wx.hideLoading();
    }, 1000);
  },

  // 生成模拟订单数据（实际开发中应该替换为真实数据）
  generateMockOrderInfo(orderId, type) {
    return {
      id: orderId,
      orderType: type,
      orderNumber: 'ORD' + Date.now().toString().substring(5),
      status: 'completed',
      createTime: '2023-03-18 12:34:56',
      traveler: {
        id: 'user_' + Math.floor(Math.random() * 1000),
        name: '李四',
        avatar: '/images/default-avatar.png',
        rating: '4.9'
      },
      carrier: {
        id: 'user_' + Math.floor(Math.random() * 1000),
        name: '张三',
        avatar: '/images/default-avatar.png',
        rating: '4.8'
      }
    };
  },

  // 处理评分变化
  onRatingChange(e) {
    this.setData({
      rating: e.detail.value
    });
  },

  // 处理评价内容输入
  onContentInput(e) {
    const content = e.detail.value;
    this.setData({
      content: content,
      contentLength: content.length
    });
  },

  // 处理标签选择
  onTagTap(e) {
    const tagIndex = e.currentTarget.dataset.index;
    const tag = this.data.availableTags[tagIndex];
    let selectedTags = [...this.data.selectedTags];
    
    const index = selectedTags.indexOf(tag);
    
    if (index > -1) {
      // 如果已选择，则取消选择
      selectedTags.splice(index, 1);
    } else {
      // 如果未选择且未超过3个，则添加选择
      if (selectedTags.length < 3) {
        selectedTags.push(tag);
      } else {
        wx.showToast({
          title: '最多选择3个标签',
          icon: 'none'
        });
        return;
      }
    }
    
    this.setData({
      selectedTags: selectedTags
    });
  },

  // 提交评价
  submitReview() {
    // 检查内容是否为空
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入评价内容',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    
    wx.showLoading({
      title: '提交中...',
      mask: true
    });
    
    // 模拟提交评价
    // 实际开发中应该调用接口提交数据
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showToast({
        title: '评价成功',
        icon: 'success'
      });
      
      // 更新全局状态，标记需要刷新订单列表
      if (app.globalData) {
        app.globalData.needRefreshOrders = true;
      }
      
      // 等待提示显示后返回
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
      this.setData({ submitting: false });
    }, 1500);
  },
  
  // 显示错误并返回
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'none'
    });
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 重新加载数据
  reload() {
    this.setData({ loading: true });
    this.loadOrderInfo();
  }
}) 