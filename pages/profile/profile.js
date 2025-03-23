// pages/profile/profile.js
Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    unreadMessageCount: 0,
    pendingCount: 0,
    menuList: [
      { id: 1, text: '我的订单', url: '/pages/order/order?type=my' },
      { id: 2, text: '我的发布', url: '/pages/my-carries/my-carries' },
      { id: 3, text: '我的消息', url: '/pages/order/order' },
      { id: 4, text: '实名认证', url: '/pages/verification/verification' },
      { id: 5, text: '联系客服', url: '/pages/customer-service/customer-service' },
      { id: 6, text: '设置', url: '/pages/settings/settings' }
    ]
  },
  onLoad: function() {
    this.checkLoginStatus();
  },
  onShow: function() {
    this.checkLoginStatus();
    // 获取未读消息数量
    this.getUnreadMessageCount();
    // 获取待处理订单数量
    this.getPendingOrderCount();
    
    // 只有在使用自定义TabBar时才设置selected状态
    const app = getApp();
    if (app.globalData.useCustomTabBar && typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      });
    }
  },
  checkLoginStatus: function() {
    const app = getApp();
    // 从本地存储获取登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn') || false;
    const userInfo = wx.getStorageSync('userInfo') || null;

    console.log('检查登录状态:', {
      isLoggedIn,
      userInfo: userInfo ? '存在' : '不存在',
      currentPageIsLoggedIn: this.data.isLoggedIn
    });

    // 如果已登录，补充用户数据
    if (isLoggedIn && userInfo) {
      // 在实际应用中，这些数据应该从服务器获取
      userInfo.completedOrders = userInfo.completedOrders || 12;
      userInfo.rating = userInfo.rating || '4.9';
      userInfo.followers = userInfo.followers || 5;
    }

    // 确保登录状态正确设置
    if (isLoggedIn !== this.data.isLoggedIn || userInfo !== this.data.userInfo) {
      this.setData({
        isLoggedIn: isLoggedIn,
        userInfo: userInfo
      }, () => {
        console.log('登录状态已更新:', {
          isLoggedIn: this.data.isLoggedIn,
          userInfo: this.data.userInfo ? '存在' : '不存在'
        });
      });
    }
  },
  onLoginTap: function(callback) {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const app = getApp();
        // 保存用户信息
        const userInfo = res.userInfo;
        // 添加额外的用户数据
        userInfo.completedOrders = 12;
        userInfo.rating = '4.9';
        userInfo.followers = 5;
        
        // 保存到本地存储
        wx.setStorageSync('isLoggedIn', true);
        wx.setStorageSync('userInfo', userInfo);
        
        console.log('登录成功，更新存储:', {
          isLoggedIn: wx.getStorageSync('isLoggedIn'),
          userInfo: wx.getStorageSync('userInfo') ? '存在' : '不存在'
        });
        
        // 更新页面状态
        this.setData({
          isLoggedIn: true,
          userInfo: userInfo
        }, () => {
          console.log('页面状态已更新:', {
            isLoggedIn: this.data.isLoggedIn,
            userInfo: this.data.userInfo ? '存在' : '不存在'
          });
          
          // 登录成功后执行回调函数
          if (typeof callback === 'function') {
            callback();
          }
        });

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '登录失败',
          icon: 'error'
        });
      }
    });
  },
  onLogoutTap: function() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('isLoggedIn');
          wx.removeStorageSync('userInfo');
          
          this.setData({
            isLoggedIn: false,
            userInfo: null
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },
  // 获取未读消息数量
  getUnreadMessageCount: function() {
    // 模拟获取未读消息数量
    // 实际应用中应该从服务器获取
    if (this.data.isLoggedIn) {
      this.setData({
        unreadMessageCount: Math.floor(Math.random() * 10)
      });
    }
  },
  // 获取待处理订单数量
  getPendingOrderCount: function() {
    // 模拟获取待处理订单数量
    // 实际应用中应该从服务器获取
    if (this.data.isLoggedIn) {
      this.setData({
        pendingCount: Math.floor(Math.random() * 5)
      });
    }
  },
  navigateToMyNeeds: function() {
    if (!this.data.isLoggedIn) {
      this.showLoginTip();
      return;
    }
    wx.navigateTo({
      url: '/pages/my-carries/my-carries'
    });
  },
  navigateToMyTrips: function() {
    if (!this.data.isLoggedIn) {
      this.showLoginTip();
      return;
    }
    wx.navigateTo({
      url: '/pages/my-trips/my-trips'
    });
  },
  navigateToMessages: function() {
    console.log("点击了系统通知按钮");
    
    // 检查是否登录
    if (!this.data.isLoggedIn) {
      console.log("用户未登录，显示登录提示");
      this.showLoginTip();
      return;
    }
    
    console.log("用户已登录，正在导航到系统通知页面");
    
    // 直接显示加载提示
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 导航到系统通知页面
    const that = this; // 保存this引用
    wx.navigateTo({
      url: '/pages/system-notifications/system-notifications',
      success: function() {
        console.log("导航成功");
        wx.hideLoading();
      },
      fail: function(err) {
        console.error("导航失败:", err);
        wx.hideLoading();
        
        wx.showToast({
          title: '打开失败，请重试',
          icon: 'none'
        });
      }
    });
  },
  navigateToFavorites: function() {
    if (!this.data.isLoggedIn) {
      this.showLoginTip();
      return;
    }
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    });
  },
  navigateToOrders: function(e) {
    if (!this.data.isLoggedIn) {
      this.showLoginTip();
      return;
    }
    const status = e.currentTarget.dataset.status;
    wx.navigateTo({
      url: `/pages/order-management/order-management?status=${status}`
    });
  },
  navigateToSettings: function() {
    if (!this.data.isLoggedIn) {
      this.showLoginTip(() => {
        wx.navigateTo({
          url: '/pages/settings/settings'
        });
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },
  navigateToSecurity: function() {
    if (!this.data.isLoggedIn) {
      this.showLoginTip();
      return;
    }
    wx.navigateTo({
      url: '/pages/security/security'
    });
  },
  navigateToPrivacy: function() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
  },
  contactCustomerService: function() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00',
      showCancel: false
    });
  },
  showFeedback: function() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },
  showAbout: function() {
    wx.showModal({
      title: '关于我们',
      content: '这是一个帮助同学互助捎带物品的平台，让出行更有意义。',
      showCancel: false
    });
  },
  showLoginTip: function(callback) {
    wx.showModal({
      title: '提示',
      content: '请先登录后再使用该功能',
      success: (res) => {
        if (res.confirm) {
          this.onLoginTap(callback);
        }
      }
    });
  },
  /**
   * 跳转到我的评价
   */
  navigateToReviews() {
    wx.navigateTo({
      url: '/pages/reviews/reviews'
    });
  }
})