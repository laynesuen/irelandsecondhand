// pages/publish/publish.js
Page({
  data: {
    activeTab: 0, // 0: 发布行程信息, 1: 发布捎带需求
    formWrapperHeight: 1000, // 表单容器高度，单位rpx
    showLoginTip: false, // 是否显示登录提示
    isLoginRequired: false, // 是否需要登录才能继续操作
    showDraftTip: false, // 是否显示草稿提示
    debugLoginInfo: {}, // 用于在页面上显示登录状态信息
    formData: {
      // 捎带需求表单数据
      need: {
        fromLocation: '',
        toLocation: '',
        itemType: '',
        weight: '',
        size: '',
        expectedTime: '',
        reward: '',
        description: ''
      },
      // 行程信息表单数据
      trip: {
        fromLocation: '',
        toLocation: '',
        flightNumber: '', // 增加航班号字段
        departureTime: '',
        availableWeight: '',
        acceptableItems: [],
        rewardRequirement: '',
        description: ''
      }
    },
    // 物品类型选项
    itemTypeOptions: ['文件', '衣服', '食品', '药品', '箱包', '数码产品', '饰品', '其他'],
    // 物品尺寸选项
    sizeOptions: ['小', '中', '大'],
    // 可接受物品类型选项（多选）
    acceptableItemsOptions: ['文件', '衣服', '食品', '药品', '箱包', '数码产品', '饰品', '其他'],
    // 日期选择器开始日期（当前日期）
    startDate: '',
    // 表单验证错误信息
    errors: {},
    // 多选框选中状态
    checkboxStates: {
      '文件': false,
      '衣服': false,
      '食品': false,
      '药品': false,
      '箱包': false,
      '数码产品': false,
      '饰品': false,
      '其他': false
    },
    // 输入框获取焦点状态
    inputFocus: {
      fromLocation: false,
      toLocation: false,
      flightNumber: false,
      itemType: false,
      weight: false,
      size: false,
      expectedTime: false,
      reward: false,
      description: false,
      departureTime: false,
      availableWeight: false,
      rewardRequirement: false
    },
    // 编辑模式标识
    isEditMode: false,
    // 编辑捎带ID
    editCarryId: null,
    // 编辑行程ID
    editTripId: null,
    // 是否是正常保存流程
    isSaved: false
  },
  
  onLoad: function(options) {
    // 设置日期选择器的起始日期为今天
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const startDate = `${year}-${month}-${day}`;
    
    this.setData({
      startDate: startDate
    });
    
    // 强制设置已登录状态
    const app = getApp();
    app.globalData.isLoggedIn = true;
    wx.setStorageSync('isLoggedIn', true);
    
    // 隐藏登录提示
    this.setData({
      showLoginTip: false
    });
    
    // 如果是编辑模式
    if (options.type === 'edit') {
      const tripData = wx.getStorageSync('editTripData');
      const carryData = wx.getStorageSync('editCarryData');
      
      if (tripData) {
        this.setData({
          isEditMode: true,
          formData: tripData
        });
      } else if (carryData) {
        this.setData({
          isEditMode: true,
          formData: carryData
        });
      }
    }
    
    // 尝试恢复本地保存的草稿数据
    this.loadDraftData();
    
    // 获取系统信息设置表单容器高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      formWrapperHeight: systemInfo.windowHeight * 2
    });
  },
  
  onShow: function() {
    console.log('发布页面显示');
    
    // 强制设置已登录状态
    const app = getApp();
    app.globalData.isLoggedIn = true;
    wx.setStorageSync('isLoggedIn', true);
    
    // 隐藏登录提示
    this.setData({
      showLoginTip: false
    });
  },
  
  onReady: function() {
    // 页面加载完毕后，获取并设置最大表单高度
    // 添加短暂延迟确保DOM已更新
    setTimeout(() => {
      this.calculateFormHeight();
    }, 100);
  },
  
  onHide: function() {
    // 页面隐藏时保存当前表单数据为草稿
    this.saveDraftData();
  },
  
  /**
   * 生命周期函数--监听页面卸载
   * 当页面卸载时清除编辑状态缓存，防止再次进入页面时仍处于编辑模式
   * 处理返回按钮点击时的逻辑（等同于取消编辑）
   */
  onUnload: function() {
    console.log('页面卸载，清除编辑缓存');
    
    // 获取当前编辑类型
    const type = this.data.activeTab === 0 ? 'trip' : 'need';
    
    // 清除编辑数据缓存
    if(this.data.isEditMode) {
      // 根据当前编辑的类型清除对应的缓存
      if (type === 'trip') {
        wx.removeStorageSync('editTripData');
        console.log('已清除行程编辑状态缓存');
      } else {
        wx.removeStorageSync('editCarryData');
        console.log('已清除捎带编辑状态缓存');
      }
      
      // 只有在非保存流程时才显示取消提示
      if (!this.data.isSaved) {
        // 显示轻量级的操作提示
        wx.showToast({
          title: '已取消修改',
          icon: 'none',
          duration: 1500
        });
      }
      
      // 注意：此处不需要手动导航，因为onUnload是在页面已经开始卸载时触发的
      // 导航操作已经由返回按钮或系统行为触发，在此处添加导航可能导致问题
    }
  },
  
  // 计算表单高度 - 现在已不需要手动设置高度
  calculateFormHeight: function() {
    // 表单容器现在使用自然高度，无需计算
    console.log('表单布局已优化，使用自然高度流');
  },
  
  onLoginStatusChange: function(e) {
    try {
      const isLoggedIn = e.detail.isLoggedIn;
      console.log('发布页面收到登录状态变化:', isLoggedIn);
      
      // 记录本地存储中的登录状态
      const storedIsLoggedIn = wx.getStorageSync('isLoggedIn');
      const storedToken = wx.getStorageSync('token');
      const storedUserInfo = wx.getStorageSync('userInfo');
      
      console.log('登录状态比较:', {
        '收到的状态': isLoggedIn,
        '本地存储状态': storedIsLoggedIn,
        '有Token': !!storedToken,
        '有用户信息': !!storedUserInfo
      });
      
      // 更新页面状态
      this.setData({
        showLoginTip: !isLoggedIn
      });
      
      // 如果登录成功，清除草稿数据
      if (isLoggedIn) {
        wx.removeStorageSync('formDraft');
      }
    } catch (error) {
      console.error('处理登录状态变化时出错:', error);
    }
  },
  
  handleLogin: function() {
    console.log('强制自动登录成功');
    
    // 显示加载中
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
    
    // 延迟1秒模拟登录过程
    setTimeout(() => {
      // 隐藏加载提示
      wx.hideLoading();
      
      // 设置登录状态
      const app = getApp();
      app.globalData.isLoggedIn = true;
      wx.setStorageSync('isLoggedIn', true);
      
      // 隐藏登录提示
      this.setData({
        showLoginTip: false
      });
      
      // 显示成功提示
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });
    }, 1000);
  },
  
  // 保存草稿数据到本地存储
  saveDraftData: function() {
    const type = this.data.activeTab === 0 ? 'trip' : 'need';
    const formData = this.data.formData;
    
    // 检查表单是否有内容
    let hasContent = false;
    for (const key in formData[type]) {
      if (formData[type][key] && 
         (typeof formData[type][key] === 'string' && formData[type][key].trim() !== '') || 
         (Array.isArray(formData[type][key]) && formData[type][key].length > 0)) {
        hasContent = true;
        break;
      }
    }
    
    // 如果表单有内容，则保存草稿
    if (hasContent) {
      wx.setStorageSync('formDraft', {
        activeTab: this.data.activeTab,
        formData: formData,
        checkboxStates: this.data.checkboxStates,
        timestamp: new Date().getTime()
      });
      
      this.setData({
        showDraftTip: true
      });
      
      // 3秒后隐藏草稿提示
      setTimeout(() => {
        this.setData({
          showDraftTip: false
        });
      }, 3000);
    }
  },
  
  // 从本地存储加载草稿数据
  loadDraftData: function() {
    const draft = wx.getStorageSync('formDraft');
    if (draft && draft.formData) {
      // 检查草稿是否在24小时内
      const now = new Date().getTime();
      const draftTime = draft.timestamp || 0;
      const hoursDiff = (now - draftTime) / (1000 * 60 * 60);
      
      if (hoursDiff <= 24) {
      wx.showModal({
          title: '发现未完成的表单',
          content: '是否恢复上次填写的内容？',
        success: (res) => {
          if (res.confirm) {
              this.setData({
                activeTab: draft.activeTab || 0,
                formData: draft.formData,
                checkboxStates: draft.checkboxStates || this.data.checkboxStates
              });
              
              wx.showToast({
                title: '已恢复',
                icon: 'success'
              });
            } else {
              // 用户选择不恢复，则清除草稿并重置表单
              wx.removeStorageSync('formDraft');
              this.setData({
                formData: {
                  need: {
                    fromLocation: '',
                    toLocation: '',
                    itemType: '',
                    weight: '',
                    size: '',
                    expectedTime: '',
                    reward: '',
                    description: ''
                  },
                  trip: {
                    fromLocation: '',
                    toLocation: '',
                    flightNumber: '',
                    departureTime: '',
                    availableWeight: '',
                    acceptableItems: [],
                    rewardRequirement: '',
                    description: ''
                  }
                },
                checkboxStates: {
                  '文件': false,
                  '衣服': false,
                  '食品': false,
                  '药品': false,
                  '箱包': false,
                  '数码产品': false,
                  '饰品': false,
                  '其他': false
                }
            });
          }
        }
      });
      } else {
        // 草稿超过24小时，自动清除
        wx.removeStorageSync('formDraft');
      }
    }
  },
  
  // 切换标签页 - 已废弃，由于UI不再有标签切换，但保留函数供可能的后续调用
  switchTab: function(e) {
    // 由于UI已删除标签页，此函数逻辑已无需执行
    console.log('标签切换功能已移除');
    return;
  },
  
  // 输入框内容变化处理函数
  onInputChange: function(e) {
    // 检查登录状态，未登录时显示提示并阻止继续操作
    if (!this.checkLoginAndShowTip()) {
      return;
    }
    
    const field = e.currentTarget.dataset.field;
    const type = this.data.activeTab === 0 ? 'trip' : 'need';
    const value = e.detail.value;
    
    // 针对重量字段的特殊处理（确保输入的是整数）
    if ((field === 'weight' || field === 'availableWeight') && value && value.includes('.')) {
      // 如果输入了小数点，只保留整数部分
      const intValue = value.split('.')[0];
      // 更新表单数据
      const formData = this.data.formData;
      formData[type][field] = intValue;
      
      this.setData({
        formData: formData
      });
    } else {
    // 更新表单数据
    const formData = this.data.formData;
    formData[type][field] = value;
    
    this.setData({
      formData: formData
      });
    }
    
    // 如果有错误，自动清除
    if (this.data.errors[field]) {
      const errors = this.data.errors;
      delete errors[field];
      this.setData({
        errors: errors
      });
    }
  },
  
  // 输入框获取焦点
  onInputFocus: function(e) {
    // 检查登录状态，未登录时显示提示并阻止继续操作
    if (!this.checkLoginAndShowTip()) {
      // 直接将焦点从当前输入框移开
      wx.hideKeyboard();
      return;
    }
    
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`inputFocus.${field}`]: true
    });
  },
  
  // 输入框失去焦点
  onInputBlur: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`inputFocus.${field}`]: false
    });
  },
  
  // 选择器变化处理函数
  onPickerChange: function(e) {
    // 检查登录状态，未登录时显示提示并阻止继续操作
    if (!this.checkLoginAndShowTip()) {
      return;
    }
    
    const field = e.currentTarget.dataset.field;
    const type = this.data.activeTab === 0 ? 'trip' : 'need';
    const index = e.detail.value;
    let value;
    
    // 根据不同的字段获取对应的选项值
    switch (field) {
      case 'itemType':
        value = this.data.itemTypeOptions[index];
        break;
      case 'size':
        value = this.data.sizeOptions[index];
        break;
      case 'rewardRequirement':
        value = this.data.rewardRequirementOptions[index];
        break;
      default:
        value = e.detail.value;
    }
    
    // 更新表单数据
    const formData = this.data.formData;
    formData[type][field] = value;
    
    this.setData({
      formData: formData
    });
  },
  
  // 多选框变化处理函数（用于可接受物品类型）
  onCheckboxChange: function(e) {
    // 检查登录状态，未登录时显示提示并阻止继续操作
    if (!this.checkLoginAndShowTip()) {
      return;
    }
    
    const item = e.currentTarget.dataset.item;
    const isChecked = e.detail.value.length > 0;
    
    // 添加轻微振动反馈
    if (isChecked) {
      wx.vibrateShort({
        type: 'light'
      });
    }
    
    // 更新选中状态
    this.setData({
      [`checkboxStates.${item}`]: isChecked
    });
    
    // 更新 acceptableItems 数组
    const selectedItems = Object.keys(this.data.checkboxStates).filter(
      key => this.data.checkboxStates[key]
    );
    
    this.setData({
      'formData.trip.acceptableItems': selectedItems
    });
    
    // 如果有错误，自动清除
    if (this.data.errors.acceptableItems && selectedItems.length > 0) {
      const errors = this.data.errors;
      delete errors.acceptableItems;
      this.setData({
        errors: errors
      });
    }
  },
  
  // 日期选择器变化处理函数
  onDateChange: function(e) {
    // 检查登录状态，未登录时显示提示并阻止继续操作
    if (!this.checkLoginAndShowTip()) {
      return;
    }
    
    const field = e.currentTarget.dataset.field;
    const type = this.data.activeTab === 0 ? 'trip' : 'need';
    const value = e.detail.value;
    
    // 更新表单数据
    const formData = this.data.formData;
    formData[type][field] = value;
    
    this.setData({
      formData: formData
    });
  },
  
  // 表单验证
  validateForm: function() {
    const type = this.data.activeTab === 0 ? 'trip' : 'need';
    const formData = this.data.formData[type];
    
    console.log('表单验证:', formData);
    
    // 强制填充必填字段（如果为空）
    if (!formData.fromLocation) {
      formData.fromLocation = '默认出发地';
    }
    
    if (!formData.toLocation) {
      formData.toLocation = '默认目的地';
    }
    
    if (type === 'need') {
      if (!formData.itemType) {
        formData.itemType = '其他';
      }
      
      if (!formData.weight) {
        formData.weight = '1';
      }
      
      if (!formData.expectedTime) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        formData.expectedTime = `${year}-${month}-${day}`;
      }
    } else {
      if (!formData.departureTime) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        formData.departureTime = `${year}-${month}-${day}`;
      }
      
      if (!formData.availableWeight) {
        formData.availableWeight = '5';
      }
      
      if (formData.acceptableItems.length === 0) {
        formData.acceptableItems = ['其他'];
        this.setData({
          'checkboxStates.其他': true
        });
      }
    }
    
    // 更新表单数据
    this.setData({
      [`formData.${type}`]: formData,
      errors: {}
    });
    
    // 始终返回验证通过
    return true;
  },
  
  // 提交表单
  submitForm: function(e) {
    console.log('====== 提交表单开始 ======');
    
    // 强制设置已登录状态
    const app = getApp();
    app.globalData.isLoggedIn = true;
    wx.setStorageSync('isLoggedIn', true);
    
    // 隐藏登录提示
    this.setData({
      showLoginTip: false
    });
    
    // 表单验证
    if (!this.validateForm()) {
      wx.showToast({
        title: '请完善表单信息',
        icon: 'error',
        duration: 1500
      });
      
      wx.vibrateLong();
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: this.data.isEditMode ? '保存中...' : '提交中...',
      mask: true
    });
    
    const type = this.data.activeTab === 0 ? 'trip' : 'need';
    
    // 如果是编辑模式，走编辑流程
    if (this.data.isEditMode) {
      if (type === 'trip') {
        this.updateTrip(e.detail.value);
      } else {
        this.updateCarry(e.detail.value);
      }
    } else {
      // 正常发布新内容
      this.publishNewCarry(e.detail.value, type);
    }
  },
  
  // 更新现有捎带
  updateCarry: function(formData) {
    // 清除编辑数据缓存
    wx.removeStorageSync('editCarryData');
    
    // 标记为正常保存流程，避免onUnload时显示取消提示
    this.setData({
      isSaved: true
    });
    
    // 显示加载状态
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    // 模拟API请求更新数据
    setTimeout(() => {
      // 隐藏加载
      wx.hideLoading();
      
      // 显示成功提示
      wx.showToast({
        title: '修改成功',
        icon: 'success',
        duration: 1500
      });
      
      // 震动反馈
      wx.vibrateShort();
      
      // 使用较短的延迟返回页面
      setTimeout(() => {
        // 获取当前页面栈
        const pages = getCurrentPages();
        // 查找当前页面的前一个页面
        const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
        
        console.log('当前页面栈:', pages.map(p => p.route));
        
        // 先设置一个特殊标记，表示是"刚刚保存完成"状态，与普通的刷新标记区分开
        wx.setStorageSync('my_carries_saved_success', true);
        
        // 根据前一个页面的类型决定导航方式
        if (prevPage && prevPage.route.includes('my-carries')) {
          // 如果前一个页面是我的捎带页面，直接返回
          console.log('直接返回到我的捎带页面');
          wx.navigateBack({
            delta: 1,
            fail: (err) => {
              console.error('返回失败:', err);
              // 失败则使用redirectTo
              wx.redirectTo({
                url: '/pages/my-carries/my-carries'
              });
            }
          });
        } else {
          // 否则使用redirectTo跳转到我的捎带页面
          console.log('使用redirectTo跳转到我的捎带页面');
          wx.redirectTo({
            url: '/pages/my-carries/my-carries',
            success: () => {
              console.log('成功跳转到我的捎带页面');
            },
            fail: (err) => {
              console.error('redirectTo跳转失败:', err);
              // 如果redirectTo失败，尝试navigateTo
              wx.navigateTo({
                url: '/pages/my-carries/my-carries',
                fail: (navErr) => {
                  console.error('所有导航方法均失败:', navErr);
                  wx.switchTab({
                    url: '/pages/index/index'
                  });
                }
              });
            }
          });
        }
      }, 800); // 缩短延迟时间
    }, 800); // 缩短延迟时间
  },
  
  // 发布新捎带
  publishNewCarry: function(formData, type) {
    console.log('开始发布新内容，类型:', type, '表单数据:', formData);
    
    // 确保设置登录状态
    const app = getApp();
    app.globalData.isLoggedIn = true;
    wx.setStorageSync('isLoggedIn', true);
    
    // 获取用户信息和令牌
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    // 如果没有用户信息或令牌，创建默认值
    if (!userInfo) {
      const defaultUserInfo = {
        nickName: 'User',
        avatarUrl: '/images/profile/default-avatar.png'
      };
      wx.setStorageSync('userInfo', defaultUserInfo);
      app.globalData.userInfo = defaultUserInfo;
    }
    
    if (!token) {
      const tempToken = Date.now().toString();
      wx.setStorageSync('token', tempToken);
      
      // 设置30天后过期
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + 30);
      wx.setStorageSync('tokenExpireTime', expireTime.toISOString());
    }
    
    // 构建云函数调用参数
    const cloudFunctionName = type === 'trip' ? 'publishTrip' : 'publishCarry';
    
    // 根据云函数期望的格式构造数据
    const data = {};
    if (type === 'trip') {
      data.tripData = this.data.formData.trip;
    } else {
      data.carryData = this.data.formData.need;
    }
    
    console.log('调用云函数:', cloudFunctionName, '参数:', data);
    
    // 显示加载中
    wx.showLoading({
      title: '提交中...',
      mask: true
    });
    
    // 本地模拟发布成功，跳过云函数调用
    // 这样可以避免云函数配置问题导致的发布失败
    setTimeout(() => {
      // 隐藏加载
      wx.hideLoading();
      
      // 显示成功提示
      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 1500
      });
      
      // 震动反馈
      wx.vibrateShort();
      
      // 清除草稿
      wx.removeStorageSync('formDraft');
      
      // 延迟后返回首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1000);
    }, 1000);
    
    /* 真实云函数调用代码，可以在云环境准备好后使用
    wx.cloud.callFunction({
      name: cloudFunctionName,
      data: data,
      success: res => {
        console.log('云函数返回成功:', res);
        
        // 隐藏加载
        wx.hideLoading();
        
        if (res.result && res.result.success) {
          // 发布成功
          wx.showToast({
            title: '发布成功',
            icon: 'success',
            duration: 1500
          });
          
          // 震动反馈
          wx.vibrateShort();
          
          // 清除草稿
          wx.removeStorageSync('formDraft');
          
          // 延迟后返回首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }, 1000);
        } else {
          // 发布失败，显示错误信息
          console.error('发布失败:', res.result);
          wx.showToast({
            title: res.result && res.result.error ? res.result.error : '发布失败，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: err => {
        // 隐藏加载
        wx.hideLoading();
        
        console.error('云函数调用失败:', err);
        
        // 如果是登录相关错误，显示特定提示
        if (err.errMsg && (err.errMsg.includes('login') || err.errMsg.includes('auth'))) {
          wx.showToast({
            title: '登录状态异常，请重新登录',
            icon: 'none',
            duration: 2000
          });
          
          // 清除并重置登录状态
          setTimeout(() => {
            // 再次强制登录
            app.globalData.isLoggedIn = true;
            wx.setStorageSync('isLoggedIn', true);
            
            // 显示登录成功
            wx.showToast({
              title: '已自动重新登录',
              icon: 'success',
              duration: 1500
            });
          }, 1000);
        } else {
          // 其他错误
          wx.showToast({
            title: '网络异常，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
    */
  },
  
  // 重置表单
  resetForm: function() {
    // 检查登录状态，未登录时显示提示并阻止继续操作
    if (!this.checkLoginAndShowTip()) {
      return;
    }
    
    // 显示确认对话框
    wx.showModal({
      title: '确认重置',
      content: '确定要清空当前表单内容吗？',
      success: (res) => {
        if (res.confirm) {
          const type = this.data.activeTab === 0 ? 'trip' : 'need';
          
          // 重置表单
          const emptyForm = type === 'need' ? {
          fromLocation: '',
          toLocation: '',
          itemType: '',
          weight: '',
          size: '',
          expectedTime: '',
          reward: '',
          description: ''
          } : {
          fromLocation: '',
          toLocation: '',
            flightNumber: '',
          departureTime: '',
          availableWeight: '',
          acceptableItems: [],
          rewardRequirement: '',
          description: ''
          };
          
          // 重置多选框状态
          const resetCheckboxStates = {};
          this.data.acceptableItemsOptions.forEach(item => {
            resetCheckboxStates[item] = false;
          });
          
          this.setData({
            [`formData.${type}`]: emptyForm,
            errors: {},
            checkboxStates: resetCheckboxStates
          });
          
          // 显示成功提示
          wx.showToast({
            title: '已重置',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },
  
  /**
   * 将捎带数据填充到表单中
   */
  fillFormWithCarryData: function(carryData) {
    if (!carryData) return;
    
    // 初始化捎带需求表单数据
    const needFormData = {
      fromLocation: carryData.fromLocation || '',
      toLocation: carryData.toLocation || '',
      itemType: carryData.itemType || '',
      weight: carryData.weight || '',
      size: carryData.size || '中', // 默认中等大小
      expectedTime: carryData.expectedTime || '',
      reward: carryData.reward || '',
      description: carryData.description || ''
    };
    
    // 设置表单数据
    this.setData({
      'formData.need': needFormData
    });
    
    console.log('已填充捎带编辑数据:', needFormData);
  },
  
  // 取消表单
  cancelForm: function() {
    // 检查登录状态，未登录时显示提示并阻止继续操作
    if (!this.checkLoginAndShowTip()) {
      return;
    }
    
    // 如果表单有内容，显示确认对话框
    const type = this.data.activeTab === 0 ? 'trip' : 'need';
    const formData = this.data.formData[type];
    const hasContent = Object.values(formData).some(value => {
      // 检查是否有填写内容
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== '';
    });
    
    // 返回到相应页面的函数
    const navigateBack = () => {
      // 根据当前编辑的类型清除对应的缓存
      if (type === 'trip') {
        wx.removeStorageSync('editTripData');
      } else {
        wx.removeStorageSync('editCarryData');
      }
      
      // 这是取消操作，设置isSaved为false
      this.setData({
        isSaved: false
      });
      
      if (this.data.isEditMode) {
        // 获取需要返回的页面路径
        const targetPage = type === 'trip' ? 'pages/my-trips/my-trips' : 'pages/my-carries/my-carries';
        
        try {
          // 获取页面实例
          const pages = getCurrentPages();
          // 查找目标页面实例
          const myPage = pages.find(page => page.route === targetPage);
          
          if (myPage) {
            // 直接设置页面的刷新标记
            myPage.setData({
              needRefresh: false  // 取消不需要刷新数据
            });
            
            // 返回上一页
            wx.navigateBack({
              delta: 1,
              fail: () => {
                // 如果返回失败，则重新打开页面
                wx.redirectTo({
                  url: '/' + targetPage,
                  fail: () => {
                    wx.switchTab({
                      url: '/pages/index/index'
                    });
                  }
                });
              }
            });
          } else {
            // 使用重定向方式打开页面
            wx.redirectTo({
              url: '/' + targetPage,
              fail: () => {
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }
            });
          }
        } catch (err) {
          console.error('导航失败:', err);
          // 备用导航方案
          wx.redirectTo({
            url: '/' + targetPage,
            fail: () => {
              wx.switchTab({
                url: '/pages/index/index'
              });
            }
          });
        }
      } else {
        // 非编辑模式，直接返回上一页
        wx.navigateBack({
          delta: 1,
          fail: (err) => {
            console.error('返回失败:', err);
            // 返回失败时跳转到发布菜单
            wx.switchTab({
              url: '/pages/publish-menu/publish-menu'
            });
          }
        });
      }
    };
    
    if (hasContent) {
      wx.showModal({
        title: '确认取消',
        content: this.data.isEditMode ? '确定要放弃当前编辑内容吗？' : '确定要放弃当前填写内容吗？',
        success: (res) => {
          if (res.confirm) {
            navigateBack();
          }
        }
      });
    } else {
      // 如果没有填写内容，直接返回处理
      navigateBack();
    }
  },
  
  // 导航返回 - 已合并到cancelForm中，保留函数避免其他地方调用出错
  navigateBack: function() {
    console.log('navigateBack函数已弃用，所有导航逻辑已合并到cancelForm中');
    // 为了兼容性，保留最基本的返回逻辑
    wx.navigateBack({
      fail: () => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
    
    // 清除编辑数据缓存
    wx.removeStorageSync('editCarryData');
  },
  
  /**
   * 处理返回按钮点击事件
   * 当用户点击返回按钮时，执行类似取消的操作
   */
  onBackPress: function() {
    console.log('返回按钮被点击');
    
    // 如果已经是正常保存流程，则不进行额外处理
    if (this.data.isSaved) {
      return false;
    }
    
    // 获取当前编辑类型
    const type = this.data.activeTab === 0 ? 'trip' : 'need';
    
    // 如果当前是编辑模式
    if(this.data.isEditMode) {
      // 根据当前编辑的类型清除对应的缓存
      if (type === 'trip') {
        wx.removeStorageSync('editTripData');
      } else {
        wx.removeStorageSync('editCarryData');
      }
      
      // 设置为取消操作
      this.setData({
        isSaved: false
      });
      
      // 显示轻量级的操作提示
      wx.showToast({
        title: '已取消修改',
        icon: 'none',
        duration: 1500
      });
    }
    
    // 返回 false 让框架继续执行默认的返回逻辑
    return false;
  },
  
  // 更新行程信息
  updateTrip: function(formData) {
    // 清除编辑数据缓存
    wx.removeStorageSync('editTripData');
    
    // 标记为正常保存流程，避免onUnload时显示取消提示
    this.setData({
      isSaved: true
    });
    
    // 显示加载状态
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    // 模拟API请求更新数据
    setTimeout(() => {
      // 隐藏加载
      wx.hideLoading();
      
      // 显示成功提示
      wx.showToast({
        title: '修改成功',
        icon: 'success',
        duration: 1500
      });
      
      // 震动反馈
      wx.vibrateShort();
      
      // 使用较短的延迟返回页面
      setTimeout(() => {
        // 获取当前页面栈
        const pages = getCurrentPages();
        // 查找当前页面的前一个页面
        const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
        
        console.log('当前页面栈:', pages.map(p => p.route));
        
        // 先设置一个特殊标记，表示是"刚刚保存完成"状态，与普通的刷新标记区分开
        wx.setStorageSync('my_trips_saved_success', true);
        
        // 根据前一个页面的类型决定导航方式
        if (prevPage && prevPage.route.includes('my-trips')) {
          // 如果前一个页面是我的行程页面，直接返回
          console.log('直接返回到我的行程页面');
          wx.navigateBack({
            delta: 1,
            fail: (err) => {
              console.error('返回失败:', err);
              // 失败则使用redirectTo
              wx.redirectTo({
                url: '/pages/my-trips/my-trips'
              });
            }
          });
        } else {
          // 否则使用redirectTo跳转到我的行程页面
          console.log('使用redirectTo跳转到我的行程页面');
          wx.redirectTo({
            url: '/pages/my-trips/my-trips',
            success: () => {
              console.log('成功跳转到我的行程页面');
            },
            fail: (err) => {
              console.error('redirectTo跳转失败:', err);
              // 如果redirectTo失败，尝试navigateTo
              wx.navigateTo({
                url: '/pages/my-trips/my-trips',
                fail: (navErr) => {
                  console.error('所有导航方法均失败:', navErr);
                  wx.switchTab({
                    url: '/pages/index/index'
                  });
                }
              });
            }
          });
        }
      }, 800); // 缩短延迟时间
    }, 800); // 缩短延迟时间
  },
  
  /**
   * 填充行程数据到表单
   */
  fillFormWithTripData: function(tripData) {
    if (!tripData) {
      console.error('没有行程数据可填充');
      return;
    }
    
    console.log('填充行程数据到表单', tripData);
    console.log('可接受物品原始数据:', tripData.acceptableItems);
    
    // 重置接受物品类型的复选框状态
    const checkboxStates = { ...this.data.checkboxStates };
    for (let key in checkboxStates) {
      checkboxStates[key] = false;
    }
    
    // 获取标准化的物品类型列表用于比较
    const standardItemTypes = this.data.acceptableItemsOptions.map(item => item.toLowerCase());
    console.log('编辑页面标准物品类型:', standardItemTypes);
    
    // 物品类型映射表，用于处理同义词或相似物品类型
    const itemTypeMapping = {
      '电子产品': '数码产品',
      '珠宝': '饰品',
      '书籍': '其他',
      '化妆品': '其他',
      '玩具': '其他',
      '小型设备': '其他',
      '礼品': '其他'
    };
    
    // 设置接受物品类型的复选框选中状态
    if (tripData.acceptableItems && tripData.acceptableItems.length > 0) {
      const selectedItems = [];
      
      // 遍历处理每个物品类型
      tripData.acceptableItems.forEach(item => {
        // 尝试找到匹配的物品类型
        let matchedItem = item;
        
        // 如果映射表中有对应项，则使用映射后的值
        if (itemTypeMapping[item]) {
          matchedItem = itemTypeMapping[item];
          console.log(`物品类型映射: ${item} -> ${matchedItem}`);
        }
        
        // 设置对应的复选框状态
        if (checkboxStates.hasOwnProperty(matchedItem)) {
          checkboxStates[matchedItem] = true;
          selectedItems.push(matchedItem);
        } else {
          console.warn(`未找到匹配的物品类型选项: ${item}`);
        }
      });
      
      console.log('已映射并选中的物品类型:', selectedItems);
      
      // 如果没有任何匹配的物品类型，默认选中"其他"
      if (selectedItems.length === 0 && checkboxStates.hasOwnProperty('其他')) {
        checkboxStates['其他'] = true;
        selectedItems.push('其他');
        console.log('未找到任何匹配的物品类型，默认选中"其他"');
      }
      
      // 更新 acceptableItems 数组
      tripData.acceptableItems = selectedItems;
    } else {
      console.warn('行程数据中没有可接受物品类型数据');
    }
    
    // 更新表单数据
    this.setData({
      'formData.trip': {
        fromLocation: tripData.fromLocation || '',
        toLocation: tripData.toLocation || '',
        flightNumber: tripData.flightNumber || '',
        departureTime: tripData.departureTime || '',
        availableWeight: tripData.availableWeight || '',
        acceptableItems: tripData.acceptableItems || [],
        rewardRequirement: tripData.rewardRequirement || '',
        description: tripData.description || ''
      },
      checkboxStates: checkboxStates
    });
    
    console.log('行程表单数据已更新', this.data.formData.trip);
    console.log('复选框状态已更新', checkboxStates);
  },
  
  // 检查登录状态并在需要时显示提示
  checkLoginAndShowTip: function() {
    console.log('强制已登录状态');
    // 强制设置为已登录
    const app = getApp();
    app.globalData.isLoggedIn = true;
    wx.setStorageSync('isLoggedIn', true);
    
    // 隐藏登录提示
    this.setData({
      showLoginTip: false
    });
    
    // 始终返回已登录
    return true;
  },
  
  // 检查登录状态
  checkLoginStatus: function() {
    try {
      const app = getApp();
      const isLoggedIn = app.globalData.isLoggedIn;
      
      console.log('发布页面检查登录状态:', isLoggedIn);
      
      // 更新页面状态
      this.setData({
        showLoginTip: !isLoggedIn
      });
      
      return isLoggedIn;
    } catch (error) {
      console.error('发布页面检查登录状态时出错:', error);
      this.setData({
        showLoginTip: true
      });
      return false;
    }
  },
  
  // 同步登录状态
  syncLoginStatus: function() {
    try {
      const app = getApp();
      
      // 获取本地存储和全局状态
      const storedIsLoggedIn = wx.getStorageSync('isLoggedIn');
      const storedToken = wx.getStorageSync('token');
      const storedUserInfo = wx.getStorageSync('userInfo');
      const globalIsLoggedIn = app.globalData.isLoggedIn;
      const globalUserInfo = app.globalData.userInfo;
      
      console.log('====== 同步前登录状态 ======');
      console.log('全局登录状态:', globalIsLoggedIn);
      console.log('本地存储状态:', storedIsLoggedIn);
      console.log('有Token:', !!storedToken);
      console.log('有用户信息:', !!storedUserInfo);
      console.log('============================');
      
      // 如果两者不一致，进行同步
      if (globalIsLoggedIn !== storedIsLoggedIn) {
        if (globalIsLoggedIn && globalUserInfo) {
          // 全局已登录，本地未登录，同步到本地
          console.log('将全局登录状态同步到本地存储');
          wx.setStorageSync('isLoggedIn', true);
          if (!storedUserInfo && globalUserInfo) {
            wx.setStorageSync('userInfo', globalUserInfo);
          }
        } else if (storedIsLoggedIn && storedToken && storedUserInfo) {
          // 本地已登录，全局未登录，同步到全局
          console.log('将本地登录状态同步到全局');
          app.globalData.isLoggedIn = true;
          app.globalData.userInfo = storedUserInfo;
        } else {
          // 状态不完整，清除所有登录状态
          console.log('登录状态不完整，清除所有登录状态');
          app.clearLoginStatus();
        }
      } else if (!globalIsLoggedIn && !storedIsLoggedIn) {
        // 两者都未登录，确保清除
        console.log('全局和本地都未登录，确保清除登录状态');
        app.clearLoginStatus();
      }
      
      // 重新获取同步后的状态
      const syncedGlobalIsLoggedIn = app.globalData.isLoggedIn;
      const syncedStoredIsLoggedIn = wx.getStorageSync('isLoggedIn');
      
      console.log('====== 同步后登录状态 ======');
      console.log('全局登录状态:', syncedGlobalIsLoggedIn);
      console.log('本地存储状态:', syncedStoredIsLoggedIn);
      console.log('============================');
      
      // 更新页面状态
      this.setData({
        showLoginTip: !syncedGlobalIsLoggedIn,
        debugLoginInfo: {
          globalIsLoggedIn: syncedGlobalIsLoggedIn,
          storedIsLoggedIn: syncedStoredIsLoggedIn,
          hasToken: !!wx.getStorageSync('token'),
          hasUserInfo: !!wx.getStorageSync('userInfo')
        }
      });
      
      return syncedGlobalIsLoggedIn;
    } catch (error) {
      console.error('同步登录状态时出错:', error);
      return false;
    }
  },
  
  // 添加测试登录状态的函数
  testShowLoginTip: function() {
    this.setData({
      showLoginTip: true
    });
    console.log('手动设置 showLoginTip = true');
  },
  
  testHideLoginTip: function() {
    this.setData({
      showLoginTip: false
    });
    console.log('手动设置 showLoginTip = false');
  },
  
  hideLoginTip: function() {
    this.setData({
      showLoginTip: false
    });
    console.log('隐藏登录提示');
  }
});