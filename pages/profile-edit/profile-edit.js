// pages/profile-edit/profile-edit.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    genders: ['男', '女', '保密'],
    genderIndex: 2,
    tempFilePath: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    // 从缓存获取用户信息
    const userInfo = wx.getStorageSync('userInfo') || {};
    
    // 设置性别索引
    let genderIndex = 2; // 默认保密
    if (userInfo.gender === 1) {
      genderIndex = 0; // 男
    } else if (userInfo.gender === 2) {
      genderIndex = 1; // 女
    }
    
    this.setData({
      userInfo: userInfo,
      genderIndex: genderIndex
    });
  },

  /**
   * 更换头像
   */
  changeAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          tempFilePath: tempFilePath
        });
        
        // 上传图片到服务器
        wx.showLoading({
          title: '上传中...',
        });
        
        // 模拟上传
        setTimeout(() => {
          wx.hideLoading();
          this.setData({
            'userInfo.avatarUrl': tempFilePath
          });
          wx.showToast({
            title: '头像更新成功',
            icon: 'success'
          });
        }, 1500);
      }
    });
  },

  /**
   * 输入昵称时更新数据
   */
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    });
  },

  /**
   * 选择性别时更新数据
   */
  onGenderChange(e) {
    this.setData({
      genderIndex: e.detail.value,
      'userInfo.gender': parseInt(e.detail.value) + 1
    });
  },

  /**
   * 输入手机号码时更新数据
   */
  onPhoneInput(e) {
    this.setData({
      'userInfo.phoneNumber': e.detail.value
    });
  },

  /**
   * 输入个人简介时更新数据
   */
  onBioInput(e) {
    this.setData({
      'userInfo.bio': e.detail.value
    });
  },

  /**
   * 保存个人资料
   */
  saveProfile() {
    const userInfo = this.data.userInfo;
    
    // 验证手机号码
    if (userInfo.phoneNumber && !/^1[3-9]\d{9}$/.test(userInfo.phoneNumber)) {
      wx.showToast({
        title: '请输入正确的手机号码',
        icon: 'none'
      });
      return;
    }

    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    
    wx.showToast({
      title: '保存成功',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    });
  },

  /**
   * 取消编辑
   */
  cancelEdit() {
    wx.showModal({
      title: '提示',
      content: '确定要放弃修改吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  }
})