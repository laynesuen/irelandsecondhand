Page({
  /**
   * 页面的初始数据
   */
  data: {
    trips: [], // 行程列表
    loading: false, // 是否正在加载
    hasMore: true, // 是否有更多数据
    page: 1, // 当前页码
    pageSize: 10, // 每页数量
    searchKeyword: '' // 搜索关键词
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '我的行程'
    });
    
    // 加载行程数据
    this.loadTripsData();
    
    // 添加过渡动画效果
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('我的行程页面显示');
    
    // 强制清除搜索关键词，避免搜索状态影响数据显示
    if (this.data.searchKeyword) {
      this.setData({
        searchKeyword: ''
      });
    }
    
    // 强制停止任何可能存在的加载状态
    if (this.data.loading) {
      console.log('停止现有加载状态');
      this.stopLoading();
    }
    
    // 获取当前页面路由栈，以便在控制台查看
    const pages = getCurrentPages();
    console.log('当前页面栈深度:', pages.length);
    console.log('页面栈路径:', pages.map(p => p.route));
    
    // 检查是否从编辑页面保存后返回
    const savedSuccess = wx.getStorageSync('my_trips_saved_success');
    if (savedSuccess) {
      console.log('检测到保存成功标记，静默刷新数据');
      
      // 立即清除标记
      wx.removeStorageSync('my_trips_saved_success');
      
      // 重置页面状态但不显示加载中状态
      this.setData({
        page: 1,
        hasMore: true,
        trips: [],
        loading: false
      });
      
      // 静默加载数据
      this.loadDataSilently();
      return; // 提前返回，避免执行后续逻辑
    }
    
    // 检查是否由其他页面传入了常规刷新标记
    const needRefreshFromStorage = wx.getStorageSync('my_trips_need_refresh');
    console.log('缓存中的刷新标记:', needRefreshFromStorage);
    
    // 有刷新标记时直接刷新页面数据
    if (needRefreshFromStorage) {
      console.log('从缓存中检测到刷新标记，强制刷新数据');
      
      // 清除刷新标记
      wx.removeStorageSync('my_trips_need_refresh');
      
      // 先重置状态，避免UI冲突
      this.setData({
        page: 1,
        hasMore: true,
        trips: [],
        loading: false  // 先设为false，避免refreshData中的判断阻止加载
      });
      
      // 直接开始刷新，不使用延迟
      this.refreshData();
      return; // 提前返回，避免执行后续逻辑
    }
    
    // 如果页面栈只有一个页面（作为首页加载）或当前还没有数据，则刷新数据
    if (pages.length === 1 || this.data.trips.length === 0) {
      console.log('作为首页加载或当前无数据，刷新我的行程数据');
      
      // 先重置状态，避免刷新时卡住
      this.setData({
        page: 1,
        hasMore: true,
        trips: [],
        loading: false
      });
      
      // 直接刷新数据
      this.refreshData();
    } else {
      console.log('常规显示，不需要刷新我的行程数据，当前数据数量:', this.data.trips.length);
    }
  },

  /**
   * 停止加载状态
   */
  stopLoading: function() {
    this.setData({
      loading: false
    });
    wx.hideNavigationBarLoading();
    wx.hideLoading();
    wx.stopPullDownRefresh();
  },

  /**
   * 刷新数据
   */
  refreshData: function () {
    console.log('开始刷新数据流程');
    
    // 避免重复加载
    if (this.data.loading) {
      console.log('当前已在加载状态，不重复刷新');
      return;
    }
    
    // 清除旧的计时器
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = null;
    }
    
    // 重置页面状态
    this.setData({
      page: 1,
      hasMore: true,
      trips: [],
      loading: true
    });
    
    // 显示加载UI
    wx.showNavigationBarLoading();
    wx.showLoading({
      title: '刷新数据中...',
      mask: true
    });
    
    // 设置超时处理，避免加载无限等待
    this.loadingTimer = setTimeout(() => {
      console.log('刷新超时，自动结束加载状态');
      if (this.data.loading) {
        // 使用友好的错误提示
        this.showErrorTip('加载超时，请下拉刷新重试', 2500);
        
        // 尝试再次加载数据，但直接调用loadTripsData
        // 可能首次加载超时，但二次加载能成功
        try {
          setTimeout(() => {
            // 重置加载状态
            this.setData({
              loading: false
            });
            
            console.log('尝试再次加载数据');
            // 直接加载数据，不再进入刷新流程
            this.loadTripsData();
          }, 500);
        } catch (error) {
          console.error('尝试再次加载数据失败:', error);
        }
      }
    }, 3000); // 3秒超时，更快响应
    
    // 立即开始加载数据
    this.loadTripsData();
  },

  /**
   * 静默加载数据 - 不显示加载状态和提示，用于保存后返回自动刷新
   */
  loadDataSilently: function() {
    console.log('开始静默加载行程数据');
    
    // 设置为加载状态，但不显示UI提示
    this.setData({ loading: true });
    
    // 这里使用模拟数据，实际应用中应从服务器获取用户发布的行程数据
    setTimeout(() => {
      try {
        // 获取模拟数据
        const newTrips = this.getMockTripsData();
        console.log('静默加载获取到数据数量:', newTrips.length);
        
        // 更新数据
        this.setData({
          trips: newTrips,
          loading: false,
          hasMore: this.data.page < 3
        });
        
        if (this.data.page < 3) {
          this.setData({
            page: this.data.page + 1
          });
        }
      } catch (err) {
        console.error('静默加载数据出错:', err);
        this.setData({
          loading: false
        });
      }
    }, 200); // 进一步缩短延迟，保证快速加载
  },

  /**
   * 搜索输入事件
   */
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 搜索确认事件
   */
  onSearchConfirm: function () {
    this.setData({
      page: 1,
      hasMore: true,
      trips: [],
      loading: true
    });
    
    wx.showToast({
      title: '搜索中...',
      icon: 'loading',
      duration: 800
    });
    
    this.loadTripsData(true);
  },

  /**
   * 加载行程数据
   */
  loadTripsData: function (isSearch = false) {
    console.log('开始加载行程数据，是否搜索模式:', isSearch);
    
    // 如果是搜索模式，允许重复加载；否则避免重复加载
    if (this.data.loading && !isSearch) {
      console.log('当前已在加载状态，且不是搜索模式，终止加载');
      return;
    }
    
    // 设置为加载状态
    this.setData({ loading: true });
    
    // 这里使用模拟数据，实际应用中应从服务器获取用户发布的行程
    // 减少延迟时间加快显示
    setTimeout(() => {
      try {
        console.log('模拟数据已加载，准备处理数据');
        
        // 如果已经不处于加载状态，可能是被取消了
        if (!this.data.loading) {
          console.log('加载已被取消，不再处理数据');
          return;
        }
        
        // 获取模拟数据
        const newTrips = this.getMockTripsData();
        console.log('获取到模拟数据数量:', newTrips.length);
        
        // 如果是搜索，根据关键词筛选
        let resultTrips = newTrips;
        if (isSearch && this.data.searchKeyword) {
          const keyword = this.data.searchKeyword.toLowerCase();
          resultTrips = newTrips.filter(item => {
            return item.fromLocation.toLowerCase().includes(keyword) ||
                  item.toLocation.toLowerCase().includes(keyword) ||
                  (item.flightNumber && item.flightNumber.toLowerCase().includes(keyword));
          });
          console.log('搜索筛选后数据数量:', resultTrips.length);
        }
        
        // 更新数据
        this.setData({
          trips: this.data.page === 1 ? resultTrips : [...this.data.trips, ...resultTrips],
          loading: false,
          hasMore: this.data.page < 3 // 模拟只有3页数据
        });
        
        if (this.data.page < 3) {
          this.setData({
            page: this.data.page + 1
          });
        }
        
        // 隐藏导航栏加载状态和加载提示
        wx.hideNavigationBarLoading();
        wx.hideLoading();
        wx.stopPullDownRefresh();
        
        // 如果是搜索且结果为空，提示用户
        if (isSearch && resultTrips.length === 0) {
          wx.showToast({
            title: '未找到匹配结果',
            icon: 'none',
            duration: 2000
          });
        }
        
        // 如果是首次加载且数据为空，显示相应提示
        if (this.data.page === 2 && this.data.trips.length === 0) {
          console.log('没有检测到行程数据');
          wx.showToast({
            title: '暂无行程数据',
            icon: 'none',
            duration: 2000
          });
        }
      } catch (err) {
        console.error('数据处理错误:', err);
        // 发生错误时，确保结束加载状态
        this.stopLoading();
        
        // 显示错误提示
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    }, 300); // 缩短模拟延迟时间
  },

  /**
   * 获取模拟行程数据
   */
  getMockTripsData: function () {
    const trips = [];
    const statuses = {
      'published': { text: '已发布', color: '#ffc107' },
      'ongoing': { text: '进行中', color: '#2196f3' },
      'completed': { text: '已完成', color: '#4caf50' }
    };
    
    const fromLocations = ['北京', '上海', '广州', '深圳', '成都'];
    const toLocations = ['都柏林', '伦敦', '巴黎', '纽约', '东京'];
    const flightNumbers = ['CA123', 'MU456', 'CZ789', 'HU012', 'FM345'];
    const availableWeights = ['1kg', '2kg', '3kg', '5kg', '8kg', '10kg'];
    const rewards = ['100', '200', '300', '400', '500'];
    const departureTimes = ['2023-07-15', '2023-07-20', '2023-07-25', '2023-08-01', '2023-08-05'];
    
    // 更新可接受物品类型选项，与编辑页面选项一致
    const acceptableItemsOptions = [
      ['文件', '衣服', '食品'],
      ['文件', '药品', '箱包'],
      ['数码产品', '饰品', '其他'],
      ['文件', '数码产品'],
      ['衣服', '食品', '药品', '箱包']
    ];
    
    // 生成模拟数据
    for (let i = 0; i < this.data.pageSize; i++) {
      // 随机生成状态，但主要是已发布状态
      const statusKeys = Object.keys(statuses);
      const randomIndex = Math.floor(Math.random() * 100) % statusKeys.length;
      const status = randomIndex < 2 ? statusKeys[randomIndex] : 'published';
      
      const fromLocation = fromLocations[Math.floor(Math.random() * fromLocations.length)];
      const toLocation = toLocations[Math.floor(Math.random() * toLocations.length)];
      const flightNumber = flightNumbers[Math.floor(Math.random() * flightNumbers.length)];
      const availableWeight = availableWeights[Math.floor(Math.random() * availableWeights.length)];
      const rewardRequirement = rewards[Math.floor(Math.random() * rewards.length)];
      const departureTime = departureTimes[Math.floor(Math.random() * departureTimes.length)];
      const acceptableItemsIndex = Math.floor(Math.random() * acceptableItemsOptions.length);
      const acceptableItems = acceptableItemsOptions[acceptableItemsIndex];
      
      trips.push({
        id: `trip_${this.data.page}_${i}`,
        status: status,
        statusText: statuses[status].text,
        statusColor: statuses[status].color,
        fromLocation: fromLocation,
        toLocation: toLocation,
        flightNumber: flightNumber,
        availableWeight: availableWeight,
        rewardRequirement: rewardRequirement,
        departureTime: departureTime,
        acceptableItems: acceptableItems,
        createTime: '2023-05-01', // 固定的创建时间
        orders: Math.floor(Math.random() * 3) // 随机的订单数量，0-2
      });
    }
    
    return trips;
  },

  /**
   * 加载更多数据
   */
  onLoadMore: function () {
    if (!this.data.hasMore || this.data.loading) return;
    
    wx.showToast({
      title: '加载更多...',
      icon: 'loading',
      duration: 500
    });
    
    this.loadTripsData();
  },
  
  /**
   * 查看行程详情 - 已禁用
   */
  viewDetail: function (e) {
    // 此功能已禁用
    console.log('查看详情功能已禁用');
  },

  /**
   * 编辑行程
   */
  editTrip: function (e) {
    const id = e.currentTarget.dataset.id;
    
    // 查找要编辑的行程项
    const trip = this.data.trips.find(item => item.id === id);
    
    if (!trip) {
      wx.showToast({
        title: '未找到对应行程',
        icon: 'none'
      });
      return;
    }
    
    // 检查状态，只有已发布状态可以编辑
    if (trip.status !== 'published') {
      wx.showToast({
        title: trip.status === 'ongoing' ? '进行中的行程不能编辑' : '已完成的行程不能编辑',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载中提示
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    try {
      // 保存要编辑的行程信息到本地缓存，避免使用全局数据可能带来的问题
      wx.setStorageSync('editTripData', {
        id: id,
        tripData: trip,
        fromPage: 'my-trips'
      });
      
      // 修改为navigateTo，保留页面栈以显示返回按钮（与我的捎带页面保持一致）
      wx.navigateTo({
        url: `/pages/publish/publish?type=edit&id=${id}&isTrip=true`,
        success: () => {
          wx.hideLoading();
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('跳转失败:', err);
          
          // 尝试不带参数跳转到发布页
          wx.showToast({
            title: '正在尝试其他方式打开',
            icon: 'none',
            duration: 1500
          });
          
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/publish-menu/publish-menu',
              fail: (switchErr) => {
                wx.showToast({
                  title: '无法打开编辑页面',
                  icon: 'none'
                });
                console.error('所有导航方法均失败:', switchErr);
              }
            });
          }, 1500);
        }
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '打开编辑页面失败',
        icon: 'none'
      });
      console.error('导航处理错误:', err);
    }
  },
  
  /**
   * 取消行程
   */
  cancelTrip: function (e) {
    const id = e.currentTarget.dataset.id;
    // 由于使用了catchtap，不需要阻止事件冒泡
    
    // 查找要取消的行程项
    const trip = this.data.trips.find(item => item.id === id);
    
    if (!trip) {
      wx.showToast({
        title: '未找到对应行程',
        icon: 'none'
      });
      return;
    }
    
    // 检查状态，只有已发布状态可以取消
    if (trip.status !== 'published') {
      wx.showToast({
        title: trip.status === 'ongoing' ? '进行中的行程不能取消' : '已完成的行程不能取消',
        icon: 'none'
      });
      return;
    }
    
    // 检查是否有相关订单
    if (trip.orders && trip.orders > 0) {
      wx.showModal({
        title: '无法取消',
        content: `此行程已有${trip.orders}个相关订单，无法直接取消。请先联系与您达成共识的用户。`,
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }
    
    wx.showModal({
      title: '取消行程',
      content: '确定要取消发布这个行程吗？取消后将从列表中删除。',
      cancelText: '再想想',
      confirmText: '确定取消',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          // 显示加载状态
          wx.showLoading({
            title: '处理中...',
            mask: true
          });
          
          // 这里可以添加实际的API调用，取消行程
          // 示例：调用取消行程的API
          // wx.request({
          //   url: 'https://api.example.com/trips/cancel',
          //   method: 'POST',
          //   data: { tripId: id },
          //   success: (res) => {
          //     if (res.data.success) {
          //       this.removeTripItem(id);
          //       wx.showToast({ title: '已取消发布', icon: 'success' });
          //     } else {
          //       wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
          //     }
          //   },
          //   fail: (err) => {
          //     wx.showToast({ title: '网络错误，请重试', icon: 'none' });
          //     console.error('API调用失败：', err);
          //   },
          //   complete: () => {
          //     wx.hideLoading();
          //   }
          // });
          
          // 模拟API调用延迟
          setTimeout(() => {
            // 从列表中删除该行程项
            this.removeTripItem(id);
            
            wx.hideLoading();
            wx.showToast({
              title: '已取消发布',
              icon: 'success',
              duration: 2000
            });
          }, 800);
        }
      }
    });
  },
  
  /**
   * 从列表中删除行程项
   */
  removeTripItem: function (tripId) {
    const trips = this.data.trips;
    const index = trips.findIndex(item => item.id === tripId);
    
    if (index !== -1) {
      trips.splice(index, 1);
      this.setData({
        trips: trips
      });
    }
  },
  
  /**
   * 显示地点提示
   */
  showLocationTip: function(e) {
    // 使用catchtap，已自动阻止事件冒泡
    
    const location = e.currentTarget.dataset.location;
    const type = e.currentTarget.dataset.type;
    
    let title = type === 'from' ? '出发地' : '目的地';
    
    wx.showModal({
      title: title,
      content: location,
      showCancel: false,
      confirmText: '我知道了'
    });
  },
  
  /**
   * 去发布行程
   */
  goToPublish: function () {
    wx.switchTab({
      url: '/pages/publish-menu/publish-menu' // 进入发布菜单页面
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('用户下拉刷新');
    
    // 强制清除搜索关键词
    this.setData({
      searchKeyword: ''
    });
    
    this.refreshData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.onLoadMore();
  },
  
  /**
   * 分享到朋友圈
   */
  onShareAppMessage: function () {
    return {
      title: '查看我的行程信息',
      path: '/pages/my-trips/my-trips',
      imageUrl: '/images/share-cover.png'
    };
  },

  /**
   * 显示友好的错误提示
   */
  showErrorTip: function(message, duration = 2000) {
    console.log('显示错误提示:', message);
    
    // 先确保停止加载状态
    this.stopLoading();
    
    // 显示错误提示
    wx.showToast({
      title: message || '加载失败，请重试',
      icon: 'none',
      duration: duration
    });
    
    // 更新页面状态，显示空状态
    if (this.data.trips.length === 0) {
      this.setData({
        loading: false,
        hasMore: false
      });
    }
  },

  // 发布新行程
  onPublishNewTrip: function() {
    // 跳转到发布页面
    wx.switchTab({
      url: '/pages/publish-menu/publish-menu' // 改为跳转到发布菜单页面
    });
  },
}) 