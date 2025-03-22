// pages/login/login.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: '',
    password: '',
    loginEnabled: false,
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查是否已登录
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const tokenExpireTime = wx.getStorageSync('tokenExpireTime');
    
    if (token && tokenExpireTime) {
      const now = new Date().getTime();
      const expireTime = new Date(tokenExpireTime).getTime();
      
      if (now < expireTime) {
        // token有效，跳转至首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    }
  },

  // 用户名输入处理
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
    this.checkLoginEnabled();
  },

  // 密码输入处理
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
    this.checkLoginEnabled();
  },

  // 检查是否可以启用登录按钮
  checkLoginEnabled() {
    const { username, password } = this.data;
    const loginEnabled = username.trim() !== '' && password.trim() !== '';
    
    this.setData({
      loginEnabled
    });
  },

  // 账号密码登录
  login() {
    if (!this.data.loginEnabled || this.data.loading) return;
    
    const { username, password } = this.data;
    
    this.setData({ loading: true });
    
    // 调用账号密码登录的云函数
    wx.cloud.callFunction({
      name: 'accountLogin',
      data: {
        username: username,
        password: password
      }
    }).then(res => {
      console.log('登录结果', res);
      if (res.result && res.result.success) {
        // 登录成功，保存用户信息和token
        const { token, expireTime, userInfo } = res.result.data;
        wx.setStorageSync('token', token);
        wx.setStorageSync('tokenExpireTime', expireTime);
        wx.setStorageSync('userInfo', userInfo);
        
        // 提示登录成功
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      } else {
        // 登录失败
        wx.showToast({
          title: res.result.error || '登录失败，请检查账号密码',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('登录失败', err);
      wx.showToast({
        title: '登录失败，请稍后再试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 微信登录
  wechatLogin() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (userRes) => {
        const userInfo = userRes.userInfo;
        
        // 获取登录code
        wx.login({
          success: (loginRes) => {
            const code = loginRes.code;
            
            // 调用云函数进行登录
            wx.cloud.callFunction({
              name: 'login',
              data: {
                code: code,
                userInfo: userInfo
              }
            }).then(res => {
              console.log('微信登录结果', res);
              if (res.result && res.result.success) {
                // 登录成功，保存用户信息和token
                const { token, expireTime, userInfo } = res.result.data;
                wx.setStorageSync('token', token);
                wx.setStorageSync('tokenExpireTime', expireTime);
                wx.setStorageSync('userInfo', userInfo);
                
                // 提示登录成功
                wx.showToast({
                  title: '登录成功',
                  icon: 'success'
                });
                
                // 跳转到首页
                setTimeout(() => {
                  wx.switchTab({
                    url: '/pages/index/index'
                  });
                }, 1500);
              } else {
                // 登录失败
                wx.showToast({
                  title: res.result.error || '登录失败',
                  icon: 'none'
                });
              }
            }).catch(err => {
              console.error('微信登录调用失败', err);
              wx.showToast({
                title: '登录失败，请稍后再试',
                icon: 'none'
              });
            });
          },
          fail: (err) => {
            console.error('获取登录code失败', err);
            wx.showToast({
              title: '登录失败，请稍后再试',
              icon: 'none'
            });
            this.setData({ loading: false });
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    });
  },

  // 跳转到注册页面
  navigateToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  // 跳转到找回密码页面
  navigateToResetPassword() {
    wx.navigateTo({
      url: '/pages/reset-password/reset-password'
    });
  },

  // 跳转到用户协议页面
  navigateToUserAgreement() {
    wx.navigateTo({
      url: '/pages/user-agreement/user-agreement'
    });
  },

  // 跳转到隐私政策页面
  navigateToPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
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

  }
})