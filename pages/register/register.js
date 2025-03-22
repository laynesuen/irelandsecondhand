// pages/register/register.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    phone: '',
    email: '',
    code: '',
    password: '',
    passwordConfirm: '',
    registerEnabled: false,
    isCodeSent: false,
    countdown: 0,
    countdownTimer: null,
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
    // 清除倒计时
    this.clearCountdown();
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

  // 手机号输入处理
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
    this.checkRegisterEnabled();
  },

  // 邮箱输入处理
  onEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
    this.checkRegisterEnabled();
  },

  // 验证码输入处理
  onCodeInput(e) {
    this.setData({
      code: e.detail.value
    });
    this.checkRegisterEnabled();
  },

  // 密码输入处理
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
    this.checkRegisterEnabled();
  },

  // 确认密码输入处理
  onPasswordConfirmInput(e) {
    this.setData({
      passwordConfirm: e.detail.value
    });
    this.checkRegisterEnabled();
  },

  // 检查是否可以启用注册按钮
  checkRegisterEnabled() {
    const { phone, email, password, passwordConfirm, isCodeSent, code } = this.data;
    
    // 简单的表单验证
    let registerEnabled = false;
    
    if (this.validatePhone(phone) && 
        this.validateEmail(email) && 
        password.length >= 6 && 
        password === passwordConfirm) {
      
      if (isCodeSent) {
        // 如果已发送验证码，需要验证码输入
        registerEnabled = code.length === 6;
      } else {
        registerEnabled = true;
      }
    }
    
    this.setData({
      registerEnabled
    });
  },

  // 验证手机号
  validatePhone(phone) {
    // 简单的爱尔兰手机号验证（以08或+353开头）
    return /^(08\d{8}|\+?353\d{9})$/.test(phone.replace(/\s/g, ''));
  },

  // 验证邮箱
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // 发送验证码
  sendVerificationCode() {
    if (this.data.countdown > 0 || this.data.loading) return;
    
    const { phone } = this.data;
    
    if (!this.validatePhone(phone)) {
      wx.showToast({
        title: '请输入有效的手机号码',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    // 调用发送验证码的云函数
    wx.cloud.callFunction({
      name: 'sendVerificationCode',
      data: {
        phone: phone
      }
    }).then(res => {
      console.log('发送验证码结果', res);
      if (res.result && res.result.success) {
        // 验证码发送成功
        this.setData({
          isCodeSent: true
        });
        
        // 开始倒计时（60秒）
        this.startCountdown(60);
        
        wx.showToast({
          title: '验证码已发送',
          icon: 'success'
        });
      } else {
        // 发送失败
        wx.showToast({
          title: res.result.error || '验证码发送失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('发送验证码失败', err);
      wx.showToast({
        title: '验证码发送失败，请稍后再试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 开始倒计时
  startCountdown(seconds) {
    this.setData({
      countdown: seconds
    });
    
    this.clearCountdown();
    
    this.data.countdownTimer = setInterval(() => {
      if (this.data.countdown > 0) {
        this.setData({
          countdown: this.data.countdown - 1
        });
      } else {
        this.clearCountdown();
      }
    }, 1000);
  },

  // 清除倒计时
  clearCountdown() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
      this.setData({
        countdownTimer: null
      });
    }
  },

  // 注册
  register() {
    if (!this.data.registerEnabled || this.data.loading) return;
    
    const { phone, email, code, password, passwordConfirm, isCodeSent } = this.data;
    
    // 再次校验数据
    if (!this.validatePhone(phone)) {
      wx.showToast({
        title: '请输入有效的手机号码',
        icon: 'none'
      });
      return;
    }
    
    if (!this.validateEmail(email)) {
      wx.showToast({
        title: '请输入有效的邮箱地址',
        icon: 'none'
      });
      return;
    }
    
    if (password.length < 6) {
      wx.showToast({
        title: '密码长度不能少于6位',
        icon: 'none'
      });
      return;
    }
    
    if (password !== passwordConfirm) {
      wx.showToast({
        title: '两次输入的密码不一致',
        icon: 'none'
      });
      return;
    }
    
    if (isCodeSent && code.length !== 6) {
      wx.showToast({
        title: '请输入6位验证码',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    // 调用注册的云函数
    wx.cloud.callFunction({
      name: 'register',
      data: {
        phone: phone,
        email: email,
        password: password,
        code: isCodeSent ? code : ''
      }
    }).then(res => {
      console.log('注册结果', res);
      if (res.result && res.result.success) {
        // 注册成功
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });
        
        // 延迟跳转到登录页
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }, 1500);
      } else {
        // 注册失败
        wx.showToast({
          title: res.result.error || '注册失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('注册失败', err);
      wx.showToast({
        title: '注册失败，请稍后再试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 跳转到登录页面
  navigateToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
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
  }
})