Page({
  data: {
    password: '',
    confirmPassword: ''
  },

  onPasswordInput(e) {
    // 只允许输入数字
    const value = e.detail.value.replace(/\D/g, '');
    this.setData({
      password: value
    });
  },

  onConfirmPasswordInput(e) {
    // 只允许输入数字
    const value = e.detail.value.replace(/\D/g, '');
    this.setData({
      confirmPassword: value
    });
  },

  submitSet() {
    const { password, confirmPassword } = this.data;

    // 验证输入
    if (!password || !confirmPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    // 验证密码长度
    if (password.length !== 6) {
      wx.showToast({
        title: '支付密码必须为6位数字',
        icon: 'none'
      });
      return;
    }

    // 验证两次密码是否一致
    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      });
      return;
    }

    // 获取当前用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 设置支付密码
    wx.showLoading({
      title: '设置中...',
    });

    // 模拟API调用
    setTimeout(() => {
      // 更新本地存储的用户信息
      userInfo.paymentPassword = password;
      wx.setStorageSync('userInfo', userInfo);

      wx.hideLoading();
      wx.showToast({
        title: '支付密码设置成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    }, 1500);
  }
}); 