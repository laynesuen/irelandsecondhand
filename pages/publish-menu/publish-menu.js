Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoggedIn: false // 登录状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 检查登录状态
    this.checkLoginStatus();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 更新登录状态
    this.checkLoginStatus();
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function() {
    const app = getApp();
    const isLoggedIn = app.globalData.isLoggedIn;
    
    this.setData({
      isLoggedIn: isLoggedIn
    });
    
    return isLoggedIn;
  },

  /**
   * 跳转到发布行程信息页面
   */
  onTripPublishTap: function() {
    // 判断是否已登录
    if (!this.data.isLoggedIn) {
      this.showLoginDialog();
      return;
    }

    // 跳转到发布页面，并传递参数指定是行程信息标签页
    wx.navigateTo({
      url: '/pages/publish/publish?type=trip'
    });
  },

  /**
   * 跳转到发布捎带需求页面
   */
  onNeedPublishTap: function() {
    // 判断是否已登录
    if (!this.data.isLoggedIn) {
      this.showLoginDialog();
      return;
    }

    // 跳转到发布页面，并传递参数指定是捎带需求标签页
    wx.navigateTo({
      url: '/pages/publish/publish?type=need'
    });
  },

  /**
   * 显示登录对话框
   */
  showLoginDialog: function() {
    wx.showModal({
      title: '提示',
      content: '请先登录后再发布信息',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到个人中心页面进行登录
          wx.switchTab({
            url: '/pages/profile/profile'
          });
        }
      }
    });
  }
}); 