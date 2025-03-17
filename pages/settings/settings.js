Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    isLoggedIn: false,
    notificationEnabled: true,
    darkModeEnabled: false,
    cacheSize: '0 KB',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.checkLoginStatus();
    this.calculateCacheSize();
    this.loadUserPreferences();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.checkLoginStatus();
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function () {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true
      });
    } else {
      this.setData({
        userInfo: null,
        isLoggedIn: false
      });
      
      // 如果未登录，返回到个人页面
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    }
  },

  /**
   * 计算缓存大小
   */
  calculateCacheSize: function () {
    // 模拟计算缓存大小，实际开发中可根据存储内容估算
    let cacheSize = '2.5 MB';
    this.setData({
      cacheSize: cacheSize
    });
  },

  /**
   * 加载用户偏好设置
   */
  loadUserPreferences: function () {
    const preferences = wx.getStorageSync('userPreferences');
    if (preferences) {
      this.setData({
        notificationEnabled: preferences.notificationEnabled !== false,
        darkModeEnabled: preferences.darkModeEnabled || false
      });
    }
  },

  /**
   * 保存用户偏好设置
   */
  saveUserPreferences: function () {
    wx.setStorageSync('userPreferences', {
      notificationEnabled: this.data.notificationEnabled,
      darkModeEnabled: this.data.darkModeEnabled
    });
  },

  /**
   * 切换通知设置
   */
  toggleNotification: function (e) {
    this.setData({
      notificationEnabled: e.detail.value
    });
    this.saveUserPreferences();
    wx.showToast({
      title: e.detail.value ? '已开启通知' : '已关闭通知',
      icon: 'none'
    });
  },

  /**
   * 切换深色模式
   */
  toggleDarkMode: function (e) {
    this.setData({
      darkModeEnabled: e.detail.value
    });
    this.saveUserPreferences();
    
    // 提醒用户刷新页面或重启应用以应用深色模式
    wx.showToast({
      title: e.detail.value ? '深色模式已开启，重启应用生效' : '深色模式已关闭',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 清除缓存
   */
  clearCache: function () {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？这不会影响您的账户信息和偏好设置。',
      confirmColor: '#3cc51f',
      success: (res) => {
        if (res.confirm) {
          // 清除缓存数据，但保留用户信息和偏好设置
          const userInfo = wx.getStorageSync('userInfo');
          const preferences = wx.getStorageSync('userPreferences');
          
          wx.clearStorageSync();
          
          if (userInfo) {
            wx.setStorageSync('userInfo', userInfo);
          }
          
          if (preferences) {
            wx.setStorageSync('userPreferences', preferences);
          }
          
          this.setData({
            cacheSize: '0 KB'
          });
          
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 导航到个人资料编辑页
   */
  navigateToProfileEdit: function () {
    wx.navigateTo({
      url: '/pages/profile-edit/profile-edit',
    });
  },

  /**
   * 导航到联系信息管理页
   */
  navigateToContactInfo: function () {
    wx.navigateTo({
      url: '/pages/contact-info/contact-info'
    });
  },

  /**
   * 显示关于页
   */
  showAbout: function () {
    wx.showModal({
      title: '关于捎带我',
      content: '捎带我 v1.0.0\n\n捎带我是一款专注于顺路捎带的社交平台，让您的出行更加便捷、高效。\n\n© 2023 捎带我 保留所有权利',
      confirmText: '确定',
      confirmColor: '#3cc51f',
      showCancel: false
    });
  },

  /**
   * 联系客服
   */
  contactCustomerService: function () {
    wx.showActionSheet({
      itemList: ['拨打客服电话', '发送邮件'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567',
            fail: () => {
              wx.showToast({
                title: '拨号失败',
                icon: 'none'
              });
            }
          });
        } else if (res.tapIndex === 1) {
          wx.setClipboardData({
            data: 'support@shaodaiwo.com',
            success: () => {
              wx.showToast({
                title: '邮箱已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  /**
   * 退出登录
   */
  logout: function () {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmColor: '#ff4f4f',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('userPreferences');
          
          // 返回上一页
          wx.navigateBack();
        }
      }
    });
  }
}) 