// pages/security/security.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    notificationEnabled: true,
    locationEnabled: true,
    version: '1.0.0',
    fingerprintEnabled: false,
    faceIdEnabled: false,
    loginAlertEnabled: true,
    transactionAlertEnabled: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 从本地存储获取设置状态
    const notificationEnabled = wx.getStorageSync('notificationEnabled');
    const locationEnabled = wx.getStorageSync('locationEnabled');
    
    this.setData({
      notificationEnabled: notificationEnabled === '' ? true : notificationEnabled,
      locationEnabled: locationEnabled === '' ? true : locationEnabled
    });

    this.loadSecuritySettings();
  },

  loadSecuritySettings: function () {
    const settings = wx.getStorageSync('securitySettings') || {};
    this.setData({
      fingerprintEnabled: settings.fingerprintEnabled || false,
      faceIdEnabled: settings.faceIdEnabled || false,
      loginAlertEnabled: settings.loginAlertEnabled !== false,
      transactionAlertEnabled: settings.transactionAlertEnabled !== false
    });
  },

  saveSecuritySettings: function () {
    wx.setStorageSync('securitySettings', {
      fingerprintEnabled: this.data.fingerprintEnabled,
      faceIdEnabled: this.data.faceIdEnabled,
      loginAlertEnabled: this.data.loginAlertEnabled,
      transactionAlertEnabled: this.data.transactionAlertEnabled
    });
  },

  /**
   * 跳转到隐私政策页面
   */
  navigateToPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
  },

  /**
   * 清除缓存
   */
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '清理中...',
          });
          
          // 清除缓存
          wx.clearStorageSync();
          
          // 保留必要的用户信息
          const userInfo = wx.getStorageSync('userInfo');
          const token = wx.getStorageSync('token');
          if (userInfo) wx.setStorageSync('userInfo', userInfo);
          if (token) wx.setStorageSync('token', token);
          
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '清理完成',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },

  /**
   * 切换消息通知状态
   */
  onNotificationChange(e) {
    const enabled = e.detail.value;
    this.setData({
      notificationEnabled: enabled
    });
    
    // 保存设置
    wx.setStorageSync('notificationEnabled', enabled);
    
    // 更新系统通知权限
    if (enabled) {
      wx.requestSubscribeMessage({
        tmplIds: ['your-template-id'], // 替换为实际的模板ID
        success: (res) => {
          console.log('订阅消息成功', res);
        },
        fail: (err) => {
          console.error('订阅消息失败', err);
          wx.showToast({
            title: '订阅失败，请重试',
            icon: 'none'
          });
        }
      });
    }
  },

  /**
   * 切换位置服务状态
   */
  onLocationChange(e) {
    const enabled = e.detail.value;
    this.setData({
      locationEnabled: enabled
    });
    
    // 保存设置
    wx.setStorageSync('locationEnabled', enabled);
    
    if (enabled) {
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.userLocation']) {
            wx.authorize({
              scope: 'scope.userLocation',
              success: () => {
                wx.showToast({
                  title: '位置权限已开启',
                  icon: 'success'
                });
              },
              fail: () => {
                wx.showModal({
                  title: '提示',
                  content: '请在设置中开启位置权限',
                  success: (res) => {
                    if (res.confirm) {
                      wx.openSetting();
                    }
                  }
                });
                this.setData({
                  locationEnabled: false
                });
                wx.setStorageSync('locationEnabled', false);
              }
            });
          }
        }
      });
    }
  },

  /**
   * 显示关于我们
   */
  showAboutUs() {
    wx.showModal({
      title: '关于我们',
      content: '捎带我 v1.0.0\n\n捎带我是一款专注于顺路捎带的社交平台，让您的出行更加便捷、高效。\n\n© 2023 捎带我 保留所有权利',
      showCancel: false
    });
  },

  /**
   * 联系客服
   */
  contactCustomerService() {
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
   * 检查更新
   */
  checkUpdate() {
    wx.showLoading({
      title: '检查中...',
    });
    
    // 模拟检查更新
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '版本信息',
        content: '当前已是最新版本',
        showCancel: false
      });
    }, 1000);
  },

  /**
   * 临时函数，用于修复语法
   */
  tempFix() {
    // 这是一个临时函数，用于修复语法错误
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

  // 修改密码
  changePassword: function () {
    wx.navigateTo({
      url: '/pages/change-password/change-password'
    });
  },

  // 设置支付密码
  setPaymentPassword: function () {
    wx.navigateTo({
      url: '/pages/set-payment-password/set-payment-password'
    });
  },

  // 绑定手机
  bindPhone: function () {
    wx.showModal({
      title: '绑定手机',
      content: '请输入手机号码进行绑定',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          // TODO: 实现手机绑定逻辑
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  // 切换指纹解锁
  toggleFingerprint: function (e) {
    if (e.detail.value) {
      wx.checkIsSoterAuthenticationAvailable({
        checkAuthMode: ['fingerPrint'],
        success: (res) => {
          if (res.isAvailable) {
            this.setData({
              fingerprintEnabled: true
            });
            this.saveSecuritySettings();
            wx.showToast({
              title: '已开启指纹解锁',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '设备不支持指纹解锁',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '检查指纹解锁失败',
            icon: 'none'
          });
        }
      });
    } else {
      this.setData({
        fingerprintEnabled: false
      });
      this.saveSecuritySettings();
      wx.showToast({
        title: '已关闭指纹解锁',
        icon: 'success'
      });
    }
  },

  // 切换面容解锁
  toggleFaceId: function (e) {
    if (e.detail.value) {
      wx.checkIsSoterAuthenticationAvailable({
        checkAuthMode: ['facial'],
        success: (res) => {
          if (res.isAvailable) {
            this.setData({
              faceIdEnabled: true
            });
            this.saveSecuritySettings();
            wx.showToast({
              title: '已开启面容解锁',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '设备不支持面容解锁',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '检查面容解锁失败',
            icon: 'none'
          });
        }
      });
    } else {
      this.setData({
        faceIdEnabled: false
      });
      this.saveSecuritySettings();
      wx.showToast({
        title: '已关闭面容解锁',
        icon: 'success'
      });
    }
  },

  // 查看登录历史
  viewLoginHistory: function () {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 切换登录提醒
  toggleLoginAlert: function (e) {
    this.setData({
      loginAlertEnabled: e.detail.value
    });
    this.saveSecuritySettings();
    wx.showToast({
      title: e.detail.value ? '已开启登录提醒' : '已关闭登录提醒',
      icon: 'none'
    });
  },

  // 切换交易提醒
  toggleTransactionAlert: function (e) {
    this.setData({
      transactionAlertEnabled: e.detail.value
    });
    this.saveSecuritySettings();
    wx.showToast({
      title: e.detail.value ? '已开启交易提醒' : '已关闭交易提醒',
      icon: 'none'
    });
  },

  // 清除登录设备
  clearLoginDevices: function () {
    wx.showModal({
      title: '清除登录设备',
      content: '确定要清除所有已登录设备吗？清除后需要重新登录。',
      confirmColor: '#ff4f4f',
      success: (res) => {
        if (res.confirm) {
          // TODO: 实现清除登录设备逻辑
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  // 查看安全日志
  viewSecurityLog: function () {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
})
