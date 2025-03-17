// pages/index/index.js
Page({
  data: {
    activeTab: 1, // 0: 捎带需求, 1: 行程信息
    needsList: [], // 捎带需求列表
    tripsList: [], // 行程信息列表
    loading: false,
    hasMore: true,
    pageNum: 1,
    pageSize: 10,
    searchKeyword: '',
    bannerList: [
      {
        imageUrl: '/images/banner1.png',
        linkUrl: '/pages/detail/detail?id=banner1'
      },
      {
        imageUrl: '/images/banner2.png',
        linkUrl: '/pages/detail/detail?id=banner2'
      },
      {
        imageUrl: '/images/banner3.png',
        linkUrl: '/pages/detail/detail?id=banner3'
      }
    ]
  },
  
  onLoad: function() {
    this.loadInitialData();
  },
  
  onShow: function() {
    // 每次页面显示时刷新数据
    this.refreshData();
    
    // 只有在使用自定义TabBar时才设置selected状态
    const app = getApp();
    if (app.globalData.useCustomTabBar && typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  },
  
  onPullDownRefresh: function() {
    // 下拉刷新
    this.refreshData();
    wx.stopPullDownRefresh();
  },
  
  onReachBottom: function() {
    // 上拉加载更多
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreData();
    }
  },
  
  // 切换标签页
  switchTab: function(e) {
    const tabIndex = parseInt(e.currentTarget.dataset.index);
    if (tabIndex !== this.data.activeTab) {
      this.setData({
        activeTab: tabIndex,
        pageNum: 1,
        hasMore: true
      });
      console.log('切换到标签页:', tabIndex);
      this.loadInitialData();
    }
  },
  
  // 初始加载数据
  loadInitialData: function() {
    this.setData({
      loading: true,
      pageNum: 1
    });
    
    // 根据当前标签页加载不同数据
    if (this.data.activeTab === 0) {
      this.loadNeedsData();
    } else {
      this.loadTripsData();
    }
  },
  
  // 刷新数据
  refreshData: function() {
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    this.loadInitialData();
  },
  
  // 加载更多数据
  loadMoreData: function() {
    if (!this.data.hasMore || this.data.loading) return;
    
    this.setData({
      pageNum: this.data.pageNum + 1,
      loading: true
    });
    
    if (this.data.activeTab === 0) {
      this.loadNeedsData(true);
    } else {
      this.loadTripsData(true);
    }
  },
  
  // 加载捎带需求数据
  loadNeedsData: function(isLoadMore = false, isSearch = false) {
    // 模拟数据加载，实际开发中应该调用API
    setTimeout(() => {
      // 模拟数据
      let mockData = this.generateMockNeedsData();
      
      // 如果是搜索操作，根据关键词筛选数据
      if (isSearch && this.data.searchKeyword) {
        const keyword = this.data.searchKeyword.toLowerCase();
        mockData = mockData.filter(item => {
          return item.fromLocation.toLowerCase().includes(keyword) ||
                 item.toLocation.toLowerCase().includes(keyword) ||
                 item.itemType.some(type => type.toLowerCase().includes(keyword));
        });
      }
      
      this.setData({
        needsList: isLoadMore ? this.data.needsList.concat(mockData) : mockData,
        loading: false,
        hasMore: this.data.pageNum < 3 && mockData.length > 0 // 模拟只有3页数据
      });
    }, 500);
  },
  
  // 加载行程信息数据
  loadTripsData: function(isLoadMore = false, isSearch = false) {
    // 模拟数据加载，实际开发中应该调用API
    setTimeout(() => {
      // 模拟数据
      let mockData = this.generateMockTripsData();
      
      // 如果是搜索操作，根据关键词筛选数据
      if (isSearch && this.data.searchKeyword) {
        const keyword = this.data.searchKeyword.toLowerCase();
        mockData = mockData.filter(item => {
          return item.fromLocation.toLowerCase().includes(keyword) ||
                 item.toLocation.toLowerCase().includes(keyword) ||
                 (item.acceptableItems && item.acceptableItems.some(item => item.toLowerCase().includes(keyword)));
        });
      }
      
      this.setData({
        tripsList: isLoadMore ? this.data.tripsList.concat(mockData) : mockData,
        loading: false,
        hasMore: this.data.pageNum < 3 && mockData.length > 0 // 模拟只有3页数据
      });
    }, 500);
  },
  
  // 生成模拟捎带需求数据
  generateMockNeedsData: function() {
    const mockData = [];
    const itemTypes = ['文件', '衣服', '食品', '药品', '箱包', '数码产品', '其他'];
    
    for (let i = 0; i < 10; i++) {
      // 随机选择1-2个物品类型
      const shuffledItems = [...itemTypes].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, Math.floor(Math.random() * 2) + 1);
      
      mockData.push({
        id: `need_${this.data.pageNum}_${i}`,
        fromLocation: '北京',
        toLocation: '都柏林',
        itemType: selectedItems,
        weight: Math.floor(Math.random() * 10 + 1) + 'kg',
        size: ['小', '中', '大'][Math.floor(Math.random() * 3)],
        expectedTime: '2023-' + (Math.floor(Math.random() * 12) + 1) + '-' + (Math.floor(Math.random() * 28) + 1),
        reward: '€' + (Math.floor(Math.random() * 500) + 100),
        description: '需要帮忙带一些个人物品，详情可私聊',
        publisher: {
          name: '用户' + Math.floor(Math.random() * 1000),
          avatar: '/images/default-avatar.png',
          rating: (Math.random() * 2 + 3).toFixed(1)
        },
        createTime: '2023-05-' + (Math.floor(Math.random() * 30) + 1)
      });
    }
    return mockData;
  },
  
  // 生成模拟行程信息数据
  generateMockTripsData: function() {
    const mockData = [];
    const itemTypes = ['文件', '衣服', '食品', '药品', '箱包', '数码产品', '其他'];
    
    for (let i = 0; i < 10; i++) {
      // 随机选择2-4个可接受物品类型
      const shuffledItems = [...itemTypes].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, Math.floor(Math.random() * 3) + 2);
      
      // 生成每公斤价格
      const pricePerKg = Math.floor(Math.random() * 50) + 20; // 20-70欧元/公斤的随机价格
      
      mockData.push({
        id: `trip_${this.data.pageNum}_${i}`,
        fromLocation: ['北京', '上海', '广州'][Math.floor(Math.random() * 3)],
        toLocation: ['都柏林', '科克', '戈尔韦'][Math.floor(Math.random() * 3)],
        departureTime: '2023-' + (Math.floor(Math.random() * 12) + 1) + '-' + (Math.floor(Math.random() * 28) + 1),
        availableWeight: Math.floor(Math.random() * 20 + 1) + 'kg',
        acceptableItems: selectedItems,
        rewardRequirement: '€' + pricePerKg + '/kg',
        traveler: {
          name: '用户' + Math.floor(Math.random() * 1000),
          avatar: '/images/default-avatar.png',
          rating: (Math.random() * 2 + 3).toFixed(1)
        },
        createTime: '2023-05-' + (Math.floor(Math.random() * 30) + 1)
      });
    }
    return mockData;
  },
  
  // 点击搜索按钮
  onSearchTap: function() {
    this.performSearch();
  },
  
  // 搜索确认（回车键）
  onSearchConfirm: function() {
    this.performSearch();
  },
  
  // 执行搜索
  performSearch: function() {
    // 显示加载中提示
    wx.showLoading({
      title: '搜索中...',
    });
    
    // 重置分页参数
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    
    // 根据当前标签页执行不同的搜索
    if (this.data.activeTab === 0) {
      this.loadNeedsData(false, true);
    } else {
      this.loadTripsData(false, true);
    }
    
    // 隐藏加载提示
    setTimeout(function() {
      wx.hideLoading();
    }, 500);
  },
  
  // 搜索关键词输入
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },
  
  // 刷新按钮点击事件
  onRefreshTap: function() {
    wx.showLoading({
      title: '刷新中...',
    });
    
    // 根据当前标签页刷新对应内容
    if (this.data.activeTab === 0) {
      this.setData({
        needsList: [],
        pageNum: 1,
        hasMore: true
      });
      this.loadNeedsData();
    } else {
      this.setData({
        tripsList: [],
        pageNum: 1,
        hasMore: true
      });
      this.loadTripsData();
    }
    
    setTimeout(function() {
      wx.hideLoading();
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    }, 1000);
  },
  
  // 点击列表项
  onItemTap: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&type=${this.data.activeTab === 0 ? 'need' : 'trip'}`
    });
  },
  
  // 点击轮播图
  onBannerTap: function(e) {
    const index = e.currentTarget.dataset.index;
    const banner = this.data.bannerList[index];
    if (banner && banner.linkUrl) {
      wx.navigateTo({
        url: banner.linkUrl
      });
    }
  },
  
  // 点击发布按钮
  onPublishTap: function() {
    wx.switchTab({
      url: '/pages/publish-menu/publish-menu'
    });
  },
  
  // 测试云函数
  testCloudFunction() {
    wx.cloud.callFunction({
      name: 'messageNotify',
      data: {
        action: 'sendSystemNotification',
        title: '测试通知',
        content: '这是一条测试通知',
        userId: 'test_user_id'
      }
    }).then(res => {
      console.log('云函数调用成功：', res);
      wx.showToast({
        title: '通知发送成功',
        icon: 'success'
      });
    }).catch(err => {
      console.error('云函数调用失败：', err);
      wx.showToast({
        title: '通知发送失败',
        icon: 'error'
      });
    });
  }
})