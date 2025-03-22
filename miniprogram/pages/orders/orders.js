const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    orders: [],
    loading: false,
    loadingMore: false,
    hasMore: false,
    currentPage: 1,
    pageSize: 10,
    total: 0,
    
    // 筛选条件
    roleFilter: 'all', // all, customer, carrier
    statusFilter: 'all', // all, pending, confirmed, rejected, completed, cancelled
    
    // 状态和角色的文本描述
    statusMap: {
      'all': '全部状态',
      'pending': '待处理',
      'confirmed': '已确认',
      'rejected': '已拒绝',
      'completed': '已完成',
      'cancelled': '已取消'
    },
    roleMap: {
      'all': '全部角色',
      'customer': '我发起的',
      'carrier': '我承运的'
    }
  },

  onLoad: function (options) {
    // 获取用户登录状态
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo
    })

    // 监听登录状态变化
    app.watch('isLoggedIn', (newValue) => {
      this.setData({
        isLoggedIn: newValue
      })
      
      if (newValue) {
        this.loadOrders()
      } else {
        this.setData({
          orders: []
        })
      }
    })
  },

  onShow: function () {
    // 页面显示时，如果已登录则加载订单列表
    if (app.globalData.isLoggedIn) {
      this.loadOrders()
    }
  },

  // 加载订单
  loadOrders: function (refresh = true) {
    if (!app.globalData.isLoggedIn) {
      this.showLogin()
      return
    }

    if (refresh) {
      this.setData({
        currentPage: 1,
        loading: true,
        loadingMore: false
      })
    } else {
      this.setData({
        loadingMore: true
      })
    }

    wx.cloud.callFunction({
      name: 'getOrderList',
      data: {
        role: this.data.roleFilter,
        status: this.data.statusFilter,
        page: this.data.currentPage,
        size: this.data.pageSize
      }
    }).then(res => {
      const result = res.result
      
      if (result.code === 200) {
        // 处理时间格式
        const orders = result.data.orders.map(item => ({
          ...item,
          createTime: this.formatDate(new Date(item.createTime))
        }))
        
        this.setData({
          orders: refresh ? orders : [...this.data.orders, ...orders],
          total: result.data.total,
          hasMore: orders.length >= this.data.pageSize,
          loading: false,
          loadingMore: false
        })
      } else {
        this.showError(result.message || '获取订单列表失败')
        this.setData({ 
          loading: false,
          loadingMore: false
        })
      }
    }).catch(err => {
      console.error('获取订单列表失败', err)
      this.showError('获取订单列表失败，请检查网络')
      this.setData({
        loading: false,
        loadingMore: false
      })
    })
  },

  // 切换角色筛选
  onRoleFilterChange: function (e) {
    const role = e.currentTarget.dataset.role
    
    this.setData({
      roleFilter: role
    })
    
    this.loadOrders()
  },

  // 切换状态筛选
  onStatusFilterChange: function (e) {
    const status = e.currentTarget.dataset.status
    
    this.setData({
      statusFilter: status
    })
    
    this.loadOrders()
  },

  // 前往订单详情
  goToOrderDetail: function (e) {
    const { id } = e.currentTarget.dataset
    
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    })
  },

  // 格式化日期
  formatDate: function (date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    if (app.globalData.isLoggedIn) {
      this.loadOrders()
      setTimeout(() => {
        wx.stopPullDownRefresh()
      }, 1000)
    } else {
      wx.stopPullDownRefresh()
    }
  },

  // 上拉加载更多
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loadingMore && !this.data.loading) {
      this.setData({
        currentPage: this.data.currentPage + 1
      })
      this.loadOrders(false)
    }
  },

  // 显示登录提示
  showLogin: function () {
    wx.showModal({
      title: '提示',
      content: '请先登录后再查看订单',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/profile/profile'
          })
        }
      }
    })
  },

  // 显示错误提示
  showError: function (message) {
    wx.showToast({
      title: message,
      icon: 'none'
    })
  },

  // 获取状态标签颜色
  getStatusColor: function (status) {
    const colorMap = {
      'pending': '#FFA940',     // 橙色
      'confirmed': '#1890FF',   // 蓝色
      'rejected': '#FF4D4F',    // 红色
      'completed': '#52C41A',   // 绿色
      'cancelled': '#8C8C8C'    // 灰色
    }
    return colorMap[status] || '#8C8C8C'
  }
}) 