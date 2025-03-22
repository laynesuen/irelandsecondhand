const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    userId: '',
    activeTab: 0, // 0: 收到的评价, 1: 发出的评价
    receivedReviews: [],
    createdReviews: [],
    loadingReceived: false,
    loadingCreated: false,
    hasMoreReceived: true,
    hasMoreCreated: true,
    pageReceived: 1,
    pageCreated: 1,
    pageSize: 10
  },

  onLoad: function(options) {
    const { userId } = options
    
    // 获取用户登录状态
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo,
      userId: userId || ''  // 如果提供了userId，则查看指定用户的评价
    })
    
    if (this.data.isLoggedIn) {
      this.loadReviews()
    }
    
    // 监听登录状态变化
    app.watch('isLoggedIn', (newValue) => {
      this.setData({
        isLoggedIn: newValue
      })
      
      if (newValue) {
        this.loadReviews()
      }
    })
  },
  
  // 切换标签页
  switchTab: function(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activeTab: index })
    
    // 如果切换到未加载的标签页，加载相应数据
    if (index === 0 && this.data.receivedReviews.length === 0) {
      this.loadReceivedReviews()
    } else if (index === 1 && this.data.createdReviews.length === 0) {
      this.loadCreatedReviews()
    }
  },
  
  // 加载评价列表
  loadReviews: function() {
    // 首次加载收到的评价
    this.loadReceivedReviews()
  },
  
  // 加载收到的评价
  loadReceivedReviews: function(loadMore = false) {
    if (this.data.loadingReceived) return
    
    const page = loadMore ? this.data.pageReceived + 1 : 1
    
    this.setData({
      loadingReceived: true,
      pageReceived: page
    })
    
    wx.cloud.callFunction({
      name: 'getReviews',
      data: {
        userId: this.data.userId || app.globalData.openid,
        type: 'received',
        page: page,
        pageSize: this.data.pageSize
      }
    }).then(res => {
      const result = res.result
      
      if (result.code === 200) {
        const reviews = result.data.reviews
        
        this.setData({
          receivedReviews: loadMore ? [...this.data.receivedReviews, ...reviews] : reviews,
          hasMoreReceived: result.data.hasMore,
          loadingReceived: false
        })
      } else {
        this.showError(result.message || '获取评价失败')
        this.setData({ loadingReceived: false })
      }
    }).catch(err => {
      console.error('获取评价失败', err)
      this.showError('获取评价失败，请检查网络')
      this.setData({ loadingReceived: false })
    })
  },
  
  // 加载发出的评价
  loadCreatedReviews: function(loadMore = false) {
    if (this.data.loadingCreated) return
    
    const page = loadMore ? this.data.pageCreated + 1 : 1
    
    this.setData({
      loadingCreated: true,
      pageCreated: page
    })
    
    wx.cloud.callFunction({
      name: 'getReviews',
      data: {
        userId: this.data.userId || app.globalData.openid,
        type: 'created',
        page: page,
        pageSize: this.data.pageSize
      }
    }).then(res => {
      const result = res.result
      
      if (result.code === 200) {
        const reviews = result.data.reviews
        
        this.setData({
          createdReviews: loadMore ? [...this.data.createdReviews, ...reviews] : reviews,
          hasMoreCreated: result.data.hasMore,
          loadingCreated: false
        })
      } else {
        this.showError(result.message || '获取评价失败')
        this.setData({ loadingCreated: false })
      }
    }).catch(err => {
      console.error('获取评价失败', err)
      this.showError('获取评价失败，请检查网络')
      this.setData({ loadingCreated: false })
    })
  },
  
  // 前往订单详情
  goToOrderDetail: function(e) {
    const orderId = e.currentTarget.dataset.id
    
    if (orderId) {
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${orderId}`
      })
    }
  },
  
  // 显示错误提示
  showError: function(message) {
    wx.showToast({
      title: message,
      icon: 'none'
    })
  },
  
  // 获取星级样式
  getStarClass: function(index, rating) {
    if (index < rating) {
      return 'filled'
    } else if (index < Math.floor(rating) + 0.5) {
      return 'half'
    } else {
      return 'empty'
    }
  },
  
  // 下拉刷新
  onPullDownRefresh: function() {
    if (this.data.activeTab === 0) {
      this.loadReceivedReviews()
    } else {
      this.loadCreatedReviews()
    }
    
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },
  
  // 上拉加载更多
  onReachBottom: function() {
    if (this.data.activeTab === 0) {
      if (this.data.hasMoreReceived && !this.data.loadingReceived) {
        this.loadReceivedReviews(true)
      }
    } else {
      if (this.data.hasMoreCreated && !this.data.loadingCreated) {
        this.loadCreatedReviews(true)
      }
    }
  }
}) 