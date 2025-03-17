Page({
  data: {
    userInfo: {}
  },

  onLoad: function() {
    this.loadUserInfo();
  },

  onShow: function() {
    this.loadUserInfo();
  },

  loadUserInfo: function() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      userInfo: userInfo
    });
  },

  // 修改手机号码
  onPhoneTap: function() {
    wx.showModal({
      title: '修改手机号码',
      content: '请输入新的手机号码',
      editable: true,
      placeholderText: '请输入11位手机号码',
      success: (res) => {
        if (res.confirm && res.content) {
          const phoneNumber = res.content;
          if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
            wx.showToast({
              title: '请输入正确的手机号码',
              icon: 'none'
            });
            return;
          }
          this.updateUserInfo('phoneNumber', phoneNumber);
        }
      }
    });
  },

  // 修改邮箱
  onEmailTap: function() {
    wx.showModal({
      title: '修改邮箱',
      content: '请输入新的邮箱地址',
      editable: true,
      placeholderText: '请输入邮箱地址',
      success: (res) => {
        if (res.confirm && res.content) {
          const email = res.content;
          if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            wx.showToast({
              title: '请输入正确的邮箱地址',
              icon: 'none'
            });
            return;
          }
          this.updateUserInfo('email', email);
        }
      }
    });
  },

  // 修改微信号
  onWechatTap: function() {
    wx.showModal({
      title: '修改微信号',
      content: '请输入新的微信号',
      editable: true,
      placeholderText: '请输入微信号',
      success: (res) => {
        if (res.confirm && res.content) {
          const wechatId = res.content;
          this.updateUserInfo('wechatId', wechatId);
        }
      }
    });
  },

  // 修改QQ
  onQQTap: function() {
    wx.showModal({
      title: '修改QQ',
      content: '请输入新的QQ号码',
      editable: true,
      placeholderText: '请输入QQ号码',
      success: (res) => {
        if (res.confirm && res.content) {
          const qq = res.content;
          if (!/^\d{5,11}$/.test(qq)) {
            wx.showToast({
              title: '请输入正确的QQ号码',
              icon: 'none'
            });
            return;
          }
          this.updateUserInfo('qq', qq);
        }
      }
    });
  },

  // 更新用户信息
  updateUserInfo: function(key, value) {
    const userInfo = this.data.userInfo;
    userInfo[key] = value;
    
    wx.setStorageSync('userInfo', userInfo);
    this.setData({
      userInfo: userInfo
    });

    wx.showToast({
      title: '修改成功',
      icon: 'success'
    });
  }
}); 