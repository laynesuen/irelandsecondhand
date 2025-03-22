const app = getApp()

Page({
  data: {
    userInfo: null,
    isLoggedIn: false
  },

  onLoad: function () {
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
    })

    app.watch('userInfo', (newValue) => {
      this.setData({
        userInfo: newValue
      })
    })
  },
  
  onShow: function() {
    // 页面显示时检查登录状态
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo
    })
  },

  // 用户登录
  onGetUserInfo: function(e) {
    if (e.detail.userInfo) {
      app.login().then(() => {
        this.setData({
          isLoggedIn: true,
          userInfo: app.globalData.userInfo
        })
      }).catch(err => {
        console.error('登录失败', err)
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      })
    }
  },
  
  // 退出登录
  logout: function() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          app.logout()
          this.setData({
            isLoggedIn: false,
            userInfo: null
          })
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 跳转到我的行程
  goToMyTrips: function() {
    if (!this.checkLogin()) return
    
    wx.navigateTo({
      url: '/pages/my-trips/my-trips'
    })
  },

  // 跳转到评价列表页
  goToMyReviews: function () {
    if (!this.checkLogin()) return
    
    wx.navigateTo({
      url: '/pages/reviews/reviews'
    })
  },
  
  // 显示关于我们
  showAboutUs: function() {
    wx.showModal({
      title: '关于我们',
      content: '爱尔兰捎带行程小程序是一个方便爱尔兰留学生互相帮助的平台。如有问题或建议，请联系我们的客服。',
      showCancel: false
    })
  },
  
  // 检查登录状态
  checkLogin: function() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return false
    }
    return true
  }
})
