const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    currentTab: 0, // 0: 收到的评价, 1: 发出的评价
    receivedReviews: [],
    createdReviews: [],
    receivedLoading: false,
    createdLoading: false,
    receivedLoadingMore: false,
    createdLoadingMore: false,
    receivedHasMore: true,
    createdHasMore: true,
    receivedLastId: null,
    createdLastId: null,
    pageSize: 10
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    // 如果页面显示时已登录，加载评价数据
    if (this.data.isLoggedIn) {
      this.loadReviews('received');
      this.loadReviews('created');
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    // 简化起见，这里直接使用布尔值表示登录状态
    // 实际开发中，应该从app.globalData或缓存中获取用户登录状态
    const isLoggedIn = true; // 模拟已登录状态
    
    this.setData({ isLoggedIn });
    
    if (isLoggedIn) {
      this.loadReviews('received');
      this.loadReviews('created');
    }
  },

  // 切换选项卡
  switchTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({ currentTab: tab });
  },

  // 加载评价
  loadReviews(type, loadMore = false) {
    // 确定加载状态字段
    const loadingField = type + (loadMore ? 'LoadingMore' : 'Loading');
    const lastIdField = type + 'LastId';
    const reviewsField = type + 'Reviews';
    const hasMoreField = type + 'HasMore';
    
    // 如果没有更多数据或已经在加载中，则返回
    if (loadMore && (!this.data[hasMoreField] || this.data[loadingField])) {
      return;
    }
    
    // 设置加载状态
    this.setData({
      [loadingField]: true
    });
    
    // 在实际开发中，应该调用云函数或API获取评价数据
    // 这里使用setTimeout模拟异步请求
    setTimeout(() => {
      // 生成模拟数据
      const mockData = this.generateMockReviews(type, loadMore);
      const reviews = loadMore 
        ? [...this.data[reviewsField], ...mockData.reviews]
        : mockData.reviews;
      
      this.setData({
        [reviewsField]: reviews,
        [loadingField]: false,
        [hasMoreField]: mockData.hasMore,
        [lastIdField]: mockData.lastId
      });
    }, 1000);
  },

  // 生成模拟评价数据（实际开发中应该替换为真实数据）
  generateMockReviews(type, loadMore) {
    const reviews = [];
    const currentReviews = this.data[type + 'Reviews'];
    const startIndex = loadMore ? currentReviews.length : 0;
    const count = loadMore ? 5 : 10; // 第一次加载10条，加载更多时加载5条
    
    // 模拟是否还有更多数据
    const hasMore = startIndex + count < 15;
    
    for (let i = 0; i < count && startIndex + i < 15; i++) {
      const index = startIndex + i;
      reviews.push({
        id: 'review_' + index,
        orderId: 'order_' + index,
        orderType: Math.random() > 0.5 ? 'trip' : 'demand',
        rating: Math.floor(Math.random() * 3) + 3, // 3-5星
        content: '这是一条' + (type === 'received' ? '收到' : '发出') + '的评价内容，非常感谢您的服务，下次还会选择。',
        tags: ['服务热情', '沟通顺畅', '很有耐心'].slice(0, Math.floor(Math.random() * 3) + 1),
        createTime: '2023-03-' + (10 + Math.floor(Math.random() * 10)),
        user: {
          id: 'user_' + index,
          name: type === 'received' ? '客户' + index : '商家' + index,
          avatar: '/images/default-avatar.png'
        }
      });
    }
    
    return {
      reviews: reviews,
      hasMore: hasMore,
      lastId: hasMore ? 'review_' + (startIndex + count - 1) : null
    };
  },

  // 加载更多评价
  loadMoreReviews(e) {
    const type = e.currentTarget.dataset.type;
    this.loadReviews(type, true);
  },

  // 跳转到评价详情
  goToReviewDetail(e) {
    const reviewId = e.currentTarget.dataset.id;
    // 实际开发中，应该跳转到评价详情页
    // wx.navigateTo({
    //   url: '/pages/review-detail/review-detail?id=' + reviewId
    // });
    
    // 简化起见，这里只显示一个提示
    wx.showToast({
      title: '查看评价: ' + reviewId,
      icon: 'none'
    });
  },

  // 用户登录
  onLogin() {
    // 实际开发中，应该调用登录接口
    // 简化起见，这里直接设置登录状态
    this.setData({ isLoggedIn: true });
    
    // 加载评价数据
    this.loadReviews('received');
    this.loadReviews('created');
  }
}) 