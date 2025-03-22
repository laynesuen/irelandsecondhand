const app = getApp()

Page({
  data: {
    currentStep: 1,
    phone: '',
    code: '',
    password: '',
    passwordConfirm: '',
    countdown: 0,
    countdownTimer: null,
    loading: false
  },

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

  // 手机号输入处理
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 验证码输入处理
  onCodeInput(e) {
    this.setData({
      code: e.detail.value
    });
  },

  // 密码输入处理
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 确认密码输入处理
  onPasswordConfirmInput(e) {
    this.setData({
      passwordConfirm: e.detail.value
    });
  },

  // 验证手机号
  validatePhone(phone) {
    // 简单的爱尔兰手机号验证（以08或+353开头）
    return /^(08\d{8}|\+?353\d{9})$/.test(phone.replace(/\s/g, ''));
  },

  // 下一步
  nextStep() {
    const { currentStep, phone } = this.data;
    
    if (currentStep === 1) {
      // 验证手机号
      if (!phone || !this.validatePhone(phone)) {
        wx.showToast({
          title: '请输入有效的手机号码',
          icon: 'none'
        });
        return;
      }
      
      // 检查手机号是否存在
      this.checkPhoneExists();
    }
  },

  // 检查手机号是否存在
  checkPhoneExists() {
    const { phone } = this.data;
    
    this.setData({ loading: true });
    
    // 调用云函数检查手机号是否存在
    wx.cloud.callFunction({
      name: 'checkPhoneExists',
      data: {
        phone: phone
      }
    }).then(res => {
      if (res.result && res.result.success) {
        if (res.result.exists) {
          // 手机号存在，进入下一步
          this.setData({
            currentStep: 2
          });
          
          // 自动发送验证码
          this.sendVerificationCode();
        } else {
          // 手机号不存在
          wx.showToast({
            title: '该手机号未注册',
            icon: 'none'
          });
        }
      } else {
        wx.showToast({
          title: res.result.error || '验证失败，请稍后再试',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('检查手机号失败', err);
      wx.showToast({
        title: '系统错误，请稍后再试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 上一步
  prevStep() {
    const { currentStep } = this.data;
    
    if (currentStep > 1) {
      this.setData({
        currentStep: currentStep - 1
      });
    }
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

  // 验证验证码
  verifyCode() {
    const { phone, code } = this.data;
    
    if (code.length !== 6) {
      wx.showToast({
        title: '请输入6位验证码',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    // 调用云函数验证验证码
    wx.cloud.callFunction({
      name: 'verifyCode',
      data: {
        phone: phone,
        code: code
      }
    }).then(res => {
      if (res.result && res.result.success) {
        // 验证成功，进入下一步
        this.setData({
          currentStep: 3
        });
      } else {
        // 验证失败
        wx.showToast({
          title: res.result.error || '验证码错误或已过期',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('验证码验证失败', err);
      wx.showToast({
        title: '验证失败，请稍后再试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 重置密码
  resetPassword() {
    const { phone, code, password, passwordConfirm } = this.data;
    
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
    
    this.setData({ loading: true });
    
    // 调用云函数重置密码
    wx.cloud.callFunction({
      name: 'resetPassword',
      data: {
        phone: phone,
        code: code,
        password: password
      }
    }).then(res => {
      if (res.result && res.result.success) {
        // 重置成功
        wx.showToast({
          title: '密码重置成功',
          icon: 'success'
        });
        
        // 延迟跳转到登录页
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }, 1500);
      } else {
        // 重置失败
        wx.showToast({
          title: res.result.error || '密码重置失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('密码重置失败', err);
      wx.showToast({
        title: '密码重置失败，请稍后再试',
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

  onUnload() {
    // 清除倒计时
    this.clearCountdown();
  }
}) 