// pages/privacy/privacy.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    privacySettings: {
      profileVisibilityIndex: 0,
      locationVisibilityIndex: 0,
      orderHistoryVisibilityIndex: 0,
      allowFriendRequests: true,
      allowLocationTracking: true
    },
    visibilityOptions: ['所有人可见', '仅好友可见', '仅自己可见']
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadPrivacySettings();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadPrivacySettings();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 加载隐私设置
  loadPrivacySettings() {
    const privacySettings = wx.getStorageSync('privacySettings');
    if (privacySettings) {
      this.setData({
        privacySettings: privacySettings
      });
    }
  },

  // 保存隐私设置
  savePrivacySettings() {
    wx.setStorageSync('privacySettings', this.data.privacySettings);
  },

  // 个人资料可见性
  onProfileVisibilityChange(e) {
    this.setData({
      'privacySettings.profileVisibilityIndex': e.detail.value
    });
    this.savePrivacySettings();
  },

  // 位置信息可见性
  onLocationVisibilityChange(e) {
    this.setData({
      'privacySettings.locationVisibilityIndex': e.detail.value
    });
    this.savePrivacySettings();
  },

  // 订单历史可见性
  onOrderHistoryVisibilityChange(e) {
    this.setData({
      'privacySettings.orderHistoryVisibilityIndex': e.detail.value
    });
    this.savePrivacySettings();
  },

  // 好友请求设置
  onFriendRequestsChange(e) {
    this.setData({
      'privacySettings.allowFriendRequests': e.detail.value
    });
    this.savePrivacySettings();
  },

  // 位置追踪设置
  onLocationTrackingChange(e) {
    if (e.detail.value) {
      // 如果开启位置追踪，需要获取用户授权
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.userLocation']) {
            wx.authorize({
              scope: 'scope.userLocation',
              success: () => {
                this.setData({
                  'privacySettings.allowLocationTracking': true
                });
                this.savePrivacySettings();
              },
              fail: () => {
                wx.showModal({
                  title: '提示',
                  content: '需要您授权位置信息才能开启此功能',
                  success: (res) => {
                    if (res.confirm) {
                      wx.openSetting();
                    }
                  }
                });
                this.setData({
                  'privacySettings.allowLocationTracking': false
                });
              }
            });
          } else {
            this.setData({
              'privacySettings.allowLocationTracking': true
            });
            this.savePrivacySettings();
          }
        }
      });
    } else {
      this.setData({
        'privacySettings.allowLocationTracking': false
      });
      this.savePrivacySettings();
    }
  },

  // 查看隐私政策
  navigateToPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '欢迎使用捎带我！我们非常重视您的隐私保护。\n\n1. 信息收集\n- 账号信息：手机号、邮箱等\n- 个人资料：昵称、头像、性别等\n- 位置信息：用于提供位置相关服务\n- 设备信息：设备型号、操作系统等\n\n2. 信息使用\n- 提供核心服务：订单匹配、消息通知等\n- 改善用户体验：个性化推荐、服务优化\n- 安全保障：身份验证、风险控制\n- 统计分析：服务使用情况分析\n\n3. 信息共享\n- 仅在必要情况下与第三方共享\n- 不会出售您的个人信息\n- 共享前会获得您的同意\n\n4. 信息保护\n- 采用加密技术保护数据安全\n- 定期更新安全措施\n- 员工签署保密协议\n\n5. 您的权利\n- 访问和更正个人信息\n- 删除账号和相关数据\n- 撤回同意授权\n\n6. 政策更新\n- 定期更新隐私政策\n- 重大变更会通知您\n\n如您有任何疑问，请联系客服。',
      confirmText: '我知道了',
      showCancel: false
    });
  },

  // 查看用户协议
  navigateToUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用捎带我！请仔细阅读以下条款。\n\n1. 服务说明\n- 捎带我是一个顺路捎带信息发布平台\n- 平台仅提供信息对接服务\n- 具体交易由用户双方自行协商\n\n2. 账号规则\n- 实名认证：发布信息需实名认证\n- 账号安全：妥善保管账号密码\n- 账号转让：禁止转让或授权他人使用\n\n3. 信息发布\n- 真实准确：发布的信息必须真实\n- 合法合规：不得发布违法违规内容\n- 及时更新：信息变更及时更新\n\n4. 交易规则\n- 诚信交易：遵守诚实信用原则\n- 合理定价：价格应符合市场行情\n- 及时履约：按约定完成交易\n\n5. 争议处理\n- 友好协商：优先通过协商解决\n- 平台调解：可申请平台介入调解\n- 法律途径：必要时通过法律解决\n\n6. 免责声明\n- 平台不对交易结果负责\n- 不可抗力免责\n- 用户自身原因免责\n\n7. 协议修改\n- 平台保留修改协议的权利\n- 重大变更会通知用户\n\n8. 法律适用\n- 适用中华人民共和国法律\n- 争议解决地：平台所在地\n\n如您同意以上条款，请开始使用我们的服务。',
      confirmText: '我知道了',
      showCancel: false
    });
  }
})