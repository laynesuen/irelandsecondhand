Page({
  data: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  },

  onCurrentPasswordInput(e) {
    this.setData({
      currentPassword: e.detail.value
    });
  },

  onNewPasswordInput(e) {
    this.setData({
      newPassword: e.detail.value
    });
  },

  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  validatePassword(password) {
    // 密码长度至少8位
    if (password.length < 8) {
      return false;
    }
    // 必须包含字母和数字
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
  },

  submitChange() {
    const { currentPassword, newPassword, confirmPassword } = this.data;

    // 验证输入
    if (!currentPassword || !newPassword || !confirmPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    // 验证新密码格式
    if (!this.validatePassword(newPassword)) {
      wx.showToast({
        title: '新密码格式不正确',
        icon: 'none'
      });
      return;
    }

    // 验证两次密码是否一致
    if (newPassword !== confirmPassword) {
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

    // 验证当前密码
    if (currentPassword !== userInfo.password) {
      wx.showToast({
        title: '当前密码错误',
        icon: 'none'
      });
      return;
    }

    // 更新密码
    wx.showLoading({
      title: '修改中...',
    });

    // 模拟API调用
    setTimeout(() => {
      // 更新本地存储的用户信息
      userInfo.password = newPassword;
      wx.setStorageSync('userInfo', userInfo);

      wx.hideLoading();
      wx.showToast({
        title: '密码修改成功',
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