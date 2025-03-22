const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    orderId: '',
    order: null,
    trip: null,
    counterpart: null,
    roleMap: {
      'customer': '我是发起方',
      'carrier': '我是承运方'
    },
    statusMap: {
      'pending': '待处理',
      'confirmed': '已确认',
      'rejected': '已拒绝',
      'completed': '已完成',
      'cancelled': '已取消'
    },
    loading: true,
    canOperate: false, // 是否可以操作订单
    availableActions: [] // 可用操作按钮
  },

  onLoad: function (options) {
    const { id } = options
    
    if (!id) {
      this.showError('订单ID不能为空')
      return
    }
    
    this.setData({
      orderId: id,
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo
    })

    // 监听登录状态变化
    app.watch('isLoggedIn', (newValue) => {
      this.setData({
        isLoggedIn: newValue
      })
      
      if (newValue) {
        this.loadOrderDetail()
      }
    })
    
    if (this.data.isLoggedIn) {
      this.loadOrderDetail()
    } else {
      this.showLogin()
    }
  },
  
  // 加载订单详情
  loadOrderDetail: function () {
    wx.showLoading({
      title: '加载中...',
    })
    
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'getOrderDetail',
      data: {
        orderId: this.data.orderId
      }
    }).then(res => {
      const result = res.result
      
      if (result.code === 200) {
        const { order, trip, counterpart } = result.data
        
        this.setData({
          order,
          trip,
          counterpart,
          loading: false
        })
        
        // 计算可用操作
        this.calculateAvailableActions()
        
      } else {
        this.showError(result.message || '获取订单详情失败')
        this.setData({ loading: false })
      }
      
      wx.hideLoading()
    }).catch(err => {
      console.error('获取订单详情失败', err)
      this.showError('获取订单详情失败，请检查网络')
      this.setData({ loading: false })
      wx.hideLoading()
    })
  },
  
  // 计算可用操作
  calculateAvailableActions: function() {
    const { order } = this.data
    if (!order) return
    
    const actions = []
    const role = order.userRole
    const status = order.status
    
    // 根据用户角色和订单状态确定可用操作
    if (role === 'carrier') {
      // 承运方可用操作
      if (status === 'pending') {
        actions.push('confirm')
        actions.push('reject')
      } else if (status === 'confirmed') {
        actions.push('complete')
        actions.push('cancel')
      }
    } else if (role === 'customer') {
      // 发起方可用操作
      if (status === 'pending') {
        actions.push('cancel')
      } else if (status === 'confirmed') {
        actions.push('cancel')
      }
    }
    
    this.setData({
      availableActions: actions,
      canOperate: actions.length > 0
    })
  },
  
  // 确认接单
  handleConfirm: function() {
    this.updateOrderStatus('confirmed', '确认接单')
  },
  
  // 拒绝订单
  handleReject: function() {
    wx.showModal({
      title: '拒绝订单',
      content: '确定要拒绝此订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus('rejected', '拒绝订单')
        }
      }
    })
  },
  
  // 完成订单
  handleComplete: function() {
    wx.showModal({
      title: '完成订单',
      content: '确认货物已被成功运送？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus('completed', '标记订单完成')
        }
      }
    })
  },
  
  // 取消订单
  handleCancel: function() {
    wx.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus('cancelled', '取消订单')
        }
      }
    })
  },
  
  // 更新订单状态
  updateOrderStatus: function(status, operationName) {
    wx.showLoading({
      title: '处理中...',
    })
    
    wx.cloud.callFunction({
      name: 'updateOrderStatus',
      data: {
        orderId: this.data.orderId,
        status: status,
        note: operationName
      }
    }).then(res => {
      const result = res.result
      
      if (result.code === 200) {
        wx.showToast({
          title: '操作成功',
          icon: 'success'
        })
        
        // 重新加载订单详情
        setTimeout(() => {
          this.loadOrderDetail()
        }, 1000)
        
      } else {
        this.showError(result.message || '操作失败')
      }
      
      wx.hideLoading()
    }).catch(err => {
      console.error('操作失败', err)
      this.showError('操作失败，请检查网络')
      wx.hideLoading()
    })
  },
  
  // 联系对方
  contactCounterpart: function() {
    const { order, counterpart } = this.data
    
    if (!order || !counterpart) {
      this.showError('无法获取联系信息')
      return
    }
    
    wx.navigateTo({
      url: `/pages/chat/chat?conversationId=${order.conversationId || ''}&targetId=${counterpart.openid || ''}&postId=${order.tripId || ''}`
    })
  },
  
  // 查看行程
  viewTrip: function() {
    const { trip } = this.data
    
    if (!trip || !trip.id) {
      this.showError('无法获取行程信息')
      return
    }
    
    wx.navigateTo({
      url: `/pages/trip-detail/trip-detail?id=${trip.id}`
    })
  },
  
  // 格式化日期时间
  formatDateTime: function(dateTimeStr) {
    if (!dateTimeStr) return '未知时间'
    
    const date = new Date(dateTimeStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day} ${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`
  },
  
  // 显示登录提示
  showLogin: function() {
    wx.showModal({
      title: '提示',
      content: '请先登录后再查看订单详情',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/profile/profile'
          })
        } else {
          wx.navigateBack()
        }
      }
    })
  },
  
  // 显示错误提示
  showError: function(message) {
    wx.showToast({
      title: message,
      icon: 'none'
    })
  },
  
  // 获取状态标签颜色
  getStatusColor: function() {
    if (!this.data.order) return '#8C8C8C'
    
    const status = this.data.order.status
    const colorMap = {
      'pending': '#FFA940',     // 橙色
      'confirmed': '#1890FF',   // 蓝色
      'rejected': '#FF4D4F',    // 红色
      'completed': '#52C41A',   // 绿色
      'cancelled': '#8C8C8C'    // 灰色
    }
    return colorMap[status] || '#8C8C8C'
  },
  
  // 下拉刷新
  onPullDownRefresh: function() {
    if (this.data.isLoggedIn) {
      this.loadOrderDetail()
      setTimeout(() => {
        wx.stopPullDownRefresh()
      }, 1000)
    } else {
      wx.stopPullDownRefresh()
    }
  },
  
  // 分享
  onShareAppMessage: function() {
    return {
      title: '查看订单详情',
      path: `/pages/order-detail/order-detail?id=${this.data.orderId}`
    }
  }
}) 