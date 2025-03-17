// pages/detail/detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: '',
    type: '', // 'need' 或 'trip'
    detailData: null,
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取传递的参数
    const { id, type } = options;
    
    this.setData({
      id,
      type,
      loading: true
    });
    
    console.log(`加载详情页，类型: ${type}, ID: ${id}`);
    
    // 设置页面标题
    if (type === 'need') {
      wx.setNavigationBarTitle({
        title: '捎带详情'
      });
    } else if (type === 'trip') {
      wx.setNavigationBarTitle({
        title: '行程详情'
      });
    }
    
    // 根据类型和ID加载详情数据
    this.loadDetailData();
  },

  /**
   * 加载详情数据
   */
  loadDetailData() {
    // 模拟数据加载，实际开发中应该调用API
    setTimeout(() => {
      let detailData;
      
      if (this.data.type === 'need') {
        // 加载捎带需求详情
        detailData = this.generateMockNeedDetail();
      } else if (this.data.type === 'trip') {
        // 加载行程信息详情
        detailData = this.generateMockTripDetail();
      } else if (this.data.id.startsWith('banner')) {
        // 加载轮播图详情
        detailData = this.generateMockBannerDetail();
      }
      
      this.setData({
        detailData,
        loading: false
      });
    }, 500);
  },
  
  /**
   * 生成模拟捎带需求详情数据
   */
  generateMockNeedDetail() {
    return {
      id: this.data.id,
      fromLocation: '上海',
      toLocation: '都柏林',
      itemType: '电子产品',
      weight: '2.5kg',
      size: '中',
      expectedTime: '2023-08-15',
      reward: '€300',
      description: '需要帮忙带一台新笔记本电脑，已经包装好，体积不大，重量约2.5kg。希望能在8月15日前送达都柏林。报酬€300，可协商。',
      requirements: '请小心轻放，避免碰撞。',
      contactInfo: '微信: user123',
      publisher: {
        id: 'user_123',
        name: '张三',
        avatar: '/images/default-avatar.png',
        rating: '4.8',
        completedOrders: 15
      },
      createTime: '2023-05-10'
    };
  },
  
  /**
   * 生成模拟行程信息详情数据
   */
  generateMockTripDetail() {
    return {
      id: this.data.id,
      fromLocation: '上海',
      toLocation: '都柏林',
      flightNumber: 'CA123',
      departureTime: '2023-07-20',
      arrivalTime: '2023-07-21',
      availableWeight: '8kg',
      acceptableItems: ['文件', '衣服', '食品', '药品', '箱包', '数码产品', '其他'],
      rewardRequirement: '按重量计算，每公斤 €100起',
      description: '计划7月20日从上海出发前往都柏林，可以帮忙带一些小件物品。行李箱还有约8kg的空间。',
      restrictions: '不接受液体、食品和违禁品',
      contactInfo: '微信: user456',
      traveler: {
        id: 'user_456',
        name: '李四',
        avatar: '/images/default-avatar.png',
        rating: '4.9',
        completedOrders: 23
      },
      createTime: '2023-05-15'
    };
  },
  
  /**
   * 生成模拟轮播图详情数据
   */
  generateMockBannerDetail() {
    return {
      id: this.data.id,
      title: '活动详情',
      imageUrl: `/images/${this.data.id}.png`,
      content: '这是一个促销活动的详细介绍，包含活动规则、时间和奖励等信息。',
      startTime: '2023-05-01',
      endTime: '2023-06-30',
      rules: '活动期间，完成指定任务即可获得奖励。详情请咨询客服。'
    };
  },

  /**
   * 联系发布者/旅行者
   */
  onContactTap() {
    // 获取用户ID
    const userId = this.data.type === 'need' ? 
      this.data.detailData.publisher.id : 
      this.data.detailData.traveler.id;
    
    // 获取用户名称
    const userName = this.data.type === 'need' ? 
      this.data.detailData.publisher.name : 
      this.data.detailData.traveler.name;
    
    // 跳转到聊天页面，修正参数名称为postType
    // 将type值转换成postType期望的格式：trip或delivery
    const postType = this.data.type === 'trip' ? 'trip' : 'delivery';
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${userId}&name=${userName}&postType=${postType}&orderId=${this.data.id}`
    });
  },
  
  /**
   * 接单/下单按钮点击
   */
  onAcceptTap() {
    const isNeed = this.data.type === 'need';
    wx.showModal({
      title: '确认',
      content: isNeed ? '确定要接受这个订单吗？' : '确定要下单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: isNeed ? '接单成功' : '下单成功',
            icon: 'success'
          });
          
          // 跳转到订单页面
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/order/order'
            });
          }, 1500);
        }
      }
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: this.data.type === 'need' ? '捎带需求详情' : '行程信息详情',
      path: `/pages/detail/detail?id=${this.data.id}&type=${this.data.type}`
    };
  }
})