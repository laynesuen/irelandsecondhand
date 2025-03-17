// pages/publish/publish.js
Page({
  data: {
    activeTab: 0, // 0: 发布行程信息, 1: 发布捎带需求
    formWrapperHeight: 1000, // 表单容器高度，单位rpx
    isLoggedIn: false, // 登录状态
    showLoginTip: false, // 是否显示登录提示
    isLoginRequired: false, // 是否需要登录才能继续操作
    showDraftTip: false, // 是否显示草稿提示
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
      flightNumber: false, // 添加航班号字段的焦点状态
      itemType: false,
      weight: false,
      size: false,
      expectedTime: false,
      reward: false,
      description: false,
      departureTime: false,
      availableWeight: false,
      rewardRequirement: false,
      description: false
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
    // 设置日期选择器的开始日期为当前日期
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const startDate = `${year}-${month}-${day}`;
    
    this.setData({
      startDate: startDate
    });
    
    // 处理编辑模式
    let isEditMode = false;
    
    // 检查是否从其他页面跳转过来的编辑请求
    if (options && options.type === 'edit' && options.id) {
      isEditMode = true;
      
      // 根据是否为行程编辑设置activeTab
      if (options.isTrip === 'true' || options.isTrip === true) {
        this.setData({ activeTab: 0 }); // 设置为行程信息表单
        
        // 尝试从缓存获取行程编辑数据
        const editTripData = wx.getStorageSync('editTripData');
        if (editTripData && editTripData.id === options.id) {
          // 将行程数据填充到表单
          this.fillFormWithTripData(editTripData.tripData);
          
          // 设置编辑模式标识
          this.setData({
            isEditMode: true,
            editTripId: options.id
          });
          
          wx.setNavigationBarTitle({
            title: '编辑行程'
          });
        } else {
          console.error('未找到待编辑的行程数据或ID不匹配', editTripData ? editTripData.id : null, options.id);
          wx.showToast({
            title: '未找到行程数据',
            icon: 'none'
          });
        }
      } else {
        this.setData({ activeTab: 1 }); // 设置为捎带需求表单
      
        // 尝试从缓存获取编辑数据
        const editCarryData = wx.getStorageSync('editCarryData');
        if (editCarryData && editCarryData.id === options.id) {
          // 将捎带数据填充到表单
          this.fillFormWithCarryData(editCarryData.carryData);
          
          // 设置编辑模式标识
        this.setData({
            isEditMode: true,
            editCarryId: options.id
          });
          
          wx.setNavigationBarTitle({
            title: '编辑捎带'
          });
        }
      }
    }
    
    // 如果不是编辑模式，按正常逻辑处理
    if (!isEditMode) {
      // 根据传入的类型参数设置对应的表单
      if (options && options.type) {
        if (options.type === 'trip') {
          this.setData({
            activeTab: 0
          });
          wx.setNavigationBarTitle({
            title: '发布行程信息'
          });
        } else if (options.type === 'need') {
          this.setData({
            activeTab: 1
          });
          wx.setNavigationBarTitle({
            title: '发布捎带需求'
        });
      }
    }
    
    // 检查登录状态
    this.checkLoginStatus();
      
      // 尝试恢复本地保存的草稿数据
      this.loadDraftData();
    }
  },
  
  onShow: function() {
    this.checkLoginStatus();
    
    // 只有在使用自定义TabBar时才设置selected状态
    const app = getApp();
    if (app.globalData.useCustomTabBar && typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
    
    // 设置登录要求状态，与登录状态相反
    this.setData({
      isLoginRequired: !this.data.isLoggedIn
    });
    
    // 页面显示时，立即显示登录提示（如果未登录）
    if (!this.data.isLoggedIn) {
      this.setData({
        showLoginTip: true
      });
    }
    
    // 只有当页面不在编辑模式，且通过正常方式进入编辑模式时，才尝试读取编辑数据
    // 这样可以防止从编辑模式切换到其他页面后，再返回时自动进入编辑模式
    if (!this.data.isEditMode && !this.data.editCarryId && !this.data.editTripId) {
      try {
        // 先检查是否有行程编辑数据
        const editTripData = wx.getStorageSync('editTripData');
        if (editTripData && editTripData.id) {
          console.log('检测到行程编辑数据，切换到行程编辑模式');
          // 将行程数据填充到表单
          this.fillFormWithTripData(editTripData.tripData);
          
          // 设置编辑模式标识
          this.setData({
            isEditMode: true,
            editTripId: editTripData.id,
            activeTab: 0 // 行程编辑固定为0标签
          });
          
          wx.setNavigationBarTitle({
            title: '编辑行程'
          });
          return; // 已处理行程数据，直接返回
        }
        
        // 如果没有行程编辑数据，再检查捎带编辑数据
        const editCarryData = wx.getStorageSync('editCarryData');
        if (editCarryData && editCarryData.id) {
          console.log('检测到捎带编辑数据，切换到捎带编辑模式');
          // 将捎带数据填充到表单
          this.fillFormWithCarryData(editCarryData.carryData);
          
          // 设置编辑模式标识
          this.setData({
            isEditMode: true,
            editCarryId: editCarryData.id,
            activeTab: 1 // 捎带编辑固定为1标签
          });
          
          wx.setNavigationBarTitle({
            title: '编辑捎带'
          });
        }
      } catch (err) {
        console.error('获取编辑数据失败:', err);
      }
    }
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
  
  // 检查登录状态并在需要时显示提示
  checkLoginAndShowTip: function() {
    // 检查是否已登录
    const isLoggedIn = this.checkLoginStatus();
    
    // 如果未登录且需要登录
    if (!isLoggedIn && this.data.isLoginRequired) {
      this.setData({
        showLoginTip: true
      });
      return false;
    }
    
    return isLoggedIn;
  },
  
  // 检查登录状态
  checkLoginStatus: function() {
    const app = getApp();
    const isLoggedIn = app.globalData.isLoggedIn;
    
    this.setData({
      isLoggedIn: isLoggedIn
    });
    
    return isLoggedIn;
  },
  
  // 隐藏登录提示
  hideLoginTip: function() {
    this.setData({
      showLoginTip: false,
      // 添加一个新的状态，用于标记用户只是暂时关闭了提示，但仍未登录
      isLoginRequired: !this.data.isLoggedIn
    });
  },
  
  // 直接在当前页面进行登录
  onLoginTap: function() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const app = getApp();
        // 保存用户信息
        const userInfo = res.userInfo;
        app.globalData.userInfo = userInfo;
        app.globalData.isLoggedIn = true;
        
        // 登录成功后，保存token到本地存储
        wx.setStorageSync('token', 'mock_token');
        wx.setStorageSync('userInfo', userInfo);
        
        this.setData({
          isLoggedIn: true,
          showLoginTip: false,
          isLoginRequired: false
        });
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.log('登录失败:', err);
        wx.showToast({
          title: '登录失败',
          icon: 'error'
        });
      }
    });
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
    const errors = {};
    
    // 验证必填字段
    if (!formData.fromLocation) {
      errors.fromLocation = '请输入出发地';
    }
    
    if (!formData.toLocation) {
      errors.toLocation = '请输入目的地';
    }
    
    if (type === 'need') {
      if (!formData.itemType) {
        errors.itemType = '请选择物品类型';
      }
      
      if (!formData.weight) {
        errors.weight = '请输入物品重量';
      } else if (formData.weight && formData.weight.includes && formData.weight.includes('.')) {
        errors.weight = '请输入整数重量';
      }
      
      if (!formData.expectedTime) {
        errors.expectedTime = '请选择期望时间';
      }
    } else {
      if (!formData.departureTime) {
        errors.departureTime = '请选择出发时间';
      }
      
      if (!formData.availableWeight) {
        errors.availableWeight = '请输入可携带重量';
      } else if (formData.availableWeight && formData.availableWeight.includes && formData.availableWeight.includes('.')) {
        errors.availableWeight = '请输入整数重量';
      }
      
      if (formData.acceptableItems.length === 0) {
        errors.acceptableItems = '请选择可接受物品类型';
      }
    }
    
    this.setData({
      errors: errors
    });
    
    // 如果没有错误，返回true
    return Object.keys(errors).length === 0;
  },
  
  // 提交表单
  submitForm: function() {
    // 检查登录状态
    if (!this.checkLoginStatus()) {
      this.setData({
        showLoginTip: true
      });
      return;
    }
    
    // 表单验证
    if (!this.validateForm()) {
      // 添加视觉反馈
      wx.showToast({
        title: '请完善表单信息',
        icon: 'error',
        duration: 1500
      });
      
      // 震动反馈
      wx.vibrateLong();
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: this.data.isEditMode ? '保存中...' : '提交中...',
      mask: true
    });
    
    const type = this.data.activeTab === 0 ? 'trip' : 'need';
    const formData = this.data.formData[type];
    
    // 如果是编辑模式，走编辑流程
    if (this.data.isEditMode) {
      // 根据正在编辑的是行程还是捎带，调用不同的更新函数
      if (type === 'trip') {
        this.updateTrip(formData);
      } else {
        this.updateCarry(formData);
      }
    } else {
      // 正常发布新内容
      this.publishNewCarry(formData, type);
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
    // 提交成功后清除草稿
    wx.removeStorageSync('formDraft');
    
    // 模拟网络请求延迟
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
      
      // 延迟后返回上一页或跳转到列表页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            });
      }, 1000); // 缩短等待时间
    }, 1000); // 缩短模拟延迟
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
  }
});