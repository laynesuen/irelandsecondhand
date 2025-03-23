Page({
  data: {
    // 搜索关键词
    keyword: '',
    // 筛选条件
    filter: {
      fromLocation: '',
      toLocation: '',
      departureTimeStart: '',
      departureTimeEnd: '',
      itemType: [],
      minWeight: '',
      maxWeight: '',
      minPrice: '',
      maxPrice: '',
      sortType: 'time' // 默认按时间排序
    },
    // 搜索类型（0: 捎带需求, 1: 行程信息）
    searchType: 1,
    // 搜索结果
    searchResults: [],
    // 加载状态
    loading: false,
    hasMore: true,
    // 分页参数
    pageNum: 1,
    pageSize: 10,
    // 物品类型选项
    itemTypeOptions: ['文件', '衣服', '食品', '药品', '箱包', '数码产品', '图书', '礼品', '其他'],
    // 排序选项
    sortOptions: [
      { value: 'time', text: '发布时间' },
      { value: 'price', text: '价格' },
      { value: 'weight', text: '重量' },
      { value: 'departure', text: '出发时间' }
    ],
    // 地区选项
    locationOptions: {
      china: ['北京', '上海', '广州', '深圳', '杭州', '成都', '其他'],
      ireland: ['都柏林', '科克', '戈尔韦', '利默里克', '其他']
    },
    // 日期选择器相关
    showDateStart: false,
    showDateEnd: false,
    minDate: new Date().getTime(),
    maxDate: new Date().getTime() + 365 * 24 * 60 * 60 * 1000, // 一年内
    // 是否展示筛选面板
    showFilterPanel: false
  },
  
  onLoad: function(options) {
    // 接收首页传递的关键词
    if (options.keyword) {
      this.setData({
        keyword: decodeURIComponent(options.keyword)
      });
    }
    
    // 接收搜索类型
    if (options.type) {
      this.setData({
        searchType: parseInt(options.type)
      });
    }
    
    // 初始化搜索
    this.performSearch();
  },
  
  onPullDownRefresh: function() {
    // 下拉刷新
    this.refreshSearch();
    wx.stopPullDownRefresh();
  },
  
  onReachBottom: function() {
    // 上拉加载更多
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreResults();
    }
  },
  
  // 关键词输入
  onKeywordInput: function(e) {
    this.setData({
      keyword: e.detail.value
    });
  },
  
  // 切换搜索类型
  switchSearchType: function(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    this.setData({
      searchType: type,
      pageNum: 1,
      hasMore: true,
      searchResults: []
    });
    this.performSearch();
  },
  
  // 执行搜索
  performSearch: function() {
    wx.showLoading({
      title: '搜索中...',
    });
    
    this.setData({
      loading: true,
      pageNum: 1,
      searchResults: []
    });
    
    // 调用搜索API（这里使用模拟数据）
    if (this.data.searchType === 0) {
      this.searchNeeds();
    } else {
      this.searchTrips();
    }
  },
  
  // 刷新搜索
  refreshSearch: function() {
    this.setData({
      pageNum: 1,
      hasMore: true,
      searchResults: []
    });
    this.performSearch();
  },
  
  // 加载更多结果
  loadMoreResults: function() {
    if (!this.data.hasMore || this.data.loading) return;
    
    this.setData({
      pageNum: this.data.pageNum + 1,
      loading: true
    });
    
    if (this.data.searchType === 0) {
      this.searchNeeds(true);
    } else {
      this.searchTrips(true);
    }
  },
  
  // 搜索捎带需求
  searchNeeds: function(isLoadMore = false) {
    // 模拟API调用，实际开发时替换为真实API
    setTimeout(() => {
      // 生成测试数据
      let mockData = this.generateMockNeedsData();
      
      // 应用筛选条件
      mockData = this.applyNeedsFilter(mockData);
      
      // 应用排序
      mockData = this.applySorting(mockData);
      
      this.setData({
        searchResults: isLoadMore ? this.data.searchResults.concat(mockData) : mockData,
        loading: false,
        hasMore: this.data.pageNum < 3 && mockData.length > 0 // 模拟只有3页数据
      });
      
      wx.hideLoading();
    }, 500);
  },
  
  // 搜索行程信息
  searchTrips: function(isLoadMore = false) {
    // 模拟API调用，实际开发时替换为真实API
    setTimeout(() => {
      // 生成测试数据
      let mockData = this.generateMockTripsData();
      
      // 应用筛选条件
      mockData = this.applyTripsFilter(mockData);
      
      // 应用排序
      mockData = this.applySorting(mockData);
      
      this.setData({
        searchResults: isLoadMore ? this.data.searchResults.concat(mockData) : mockData,
        loading: false,
        hasMore: this.data.pageNum < 3 && mockData.length > 0 // 模拟只有3页数据
      });
      
      wx.hideLoading();
    }, 500);
  },
  
  // 应用捎带需求筛选条件
  applyNeedsFilter: function(data) {
    const filter = this.data.filter;
    const keyword = this.data.keyword.toLowerCase();
    
    return data.filter(item => {
      // 关键词筛选
      const matchesKeyword = !keyword || 
        item.fromLocation.toLowerCase().includes(keyword) ||
        item.toLocation.toLowerCase().includes(keyword) ||
        item.itemType.some(type => type.toLowerCase().includes(keyword));
      
      // 出发地筛选
      const matchesFrom = !filter.fromLocation || 
        item.fromLocation === filter.fromLocation;
      
      // 目的地筛选
      const matchesTo = !filter.toLocation || 
        item.toLocation === filter.toLocation;
      
      // 期望时间筛选
      const itemDate = new Date(item.expectedTime).getTime();
      const matchesTimeStart = !filter.departureTimeStart || 
        itemDate >= new Date(filter.departureTimeStart).getTime();
      const matchesTimeEnd = !filter.departureTimeEnd || 
        itemDate <= new Date(filter.departureTimeEnd).getTime();
      
      // 物品类型筛选
      const matchesItemType = filter.itemType.length === 0 || 
        item.itemType.some(type => filter.itemType.includes(type));
      
      // 价格筛选
      const price = parseFloat(item.reward.replace('€', ''));
      const matchesMinPrice = !filter.minPrice || price >= parseFloat(filter.minPrice);
      const matchesMaxPrice = !filter.maxPrice || price <= parseFloat(filter.maxPrice);
      
      // 重量筛选
      const weight = parseFloat(item.weight.replace('kg', ''));
      const matchesMinWeight = !filter.minWeight || weight >= parseFloat(filter.minWeight);
      const matchesMaxWeight = !filter.maxWeight || weight <= parseFloat(filter.maxWeight);
      
      return matchesKeyword && matchesFrom && matchesTo && matchesTimeStart && 
             matchesTimeEnd && matchesItemType && matchesMinPrice && 
             matchesMaxPrice && matchesMinWeight && matchesMaxWeight;
    });
  },
  
  // 应用行程信息筛选条件
  applyTripsFilter: function(data) {
    const filter = this.data.filter;
    const keyword = this.data.keyword.toLowerCase();
    
    return data.filter(item => {
      // 关键词筛选
      const matchesKeyword = !keyword || 
        item.fromLocation.toLowerCase().includes(keyword) ||
        item.toLocation.toLowerCase().includes(keyword) ||
        (item.acceptableItems && item.acceptableItems.some(itemType => itemType.toLowerCase().includes(keyword))) ||
        (item.flightNumber && item.flightNumber.toLowerCase().includes(keyword));
      
      // 出发地筛选
      const matchesFrom = !filter.fromLocation || 
        item.fromLocation === filter.fromLocation;
      
      // 目的地筛选
      const matchesTo = !filter.toLocation || 
        item.toLocation === filter.toLocation;
      
      // 出发时间筛选
      const itemDate = new Date(item.departureTime).getTime();
      const matchesTimeStart = !filter.departureTimeStart || 
        itemDate >= new Date(filter.departureTimeStart).getTime();
      const matchesTimeEnd = !filter.departureTimeEnd || 
        itemDate <= new Date(filter.departureTimeEnd).getTime();
      
      // 物品类型筛选
      const matchesItemType = filter.itemType.length === 0 || 
        !item.acceptableItems || 
        item.acceptableItems.some(type => filter.itemType.includes(type));
      
      // 价格筛选 (对于行程信息，使用每公斤价格)
      const pricePerKg = parseFloat(item.rewardRequirement.replace('€', '').replace('/kg', ''));
      const matchesMinPrice = !filter.minPrice || pricePerKg >= parseFloat(filter.minPrice);
      const matchesMaxPrice = !filter.maxPrice || pricePerKg <= parseFloat(filter.maxPrice);
      
      // 重量筛选
      const weight = parseFloat(item.availableWeight.replace('kg', ''));
      const matchesMinWeight = !filter.minWeight || weight >= parseFloat(filter.minWeight);
      const matchesMaxWeight = !filter.maxWeight || weight <= parseFloat(filter.maxWeight);
      
      return matchesKeyword && matchesFrom && matchesTo && matchesTimeStart && 
             matchesTimeEnd && matchesItemType && matchesMinPrice && 
             matchesMaxPrice && matchesMinWeight && matchesMaxWeight;
    });
  },
  
  // 应用排序
  applySorting: function(data) {
    const sortType = this.data.filter.sortType;
    
    return data.sort((a, b) => {
      switch (sortType) {
        case 'price':
          // 获取价格并比较
          const priceA = parseFloat(a.reward ? a.reward.replace('€', '') : 
                         a.rewardRequirement.replace('€', '').replace('/kg', ''));
          const priceB = parseFloat(b.reward ? b.reward.replace('€', '') : 
                         b.rewardRequirement.replace('€', '').replace('/kg', ''));
          return priceA - priceB;
        
        case 'weight':
          // 获取重量并比较
          const weightA = parseFloat(a.weight ? a.weight.replace('kg', '') : 
                          a.availableWeight.replace('kg', ''));
          const weightB = parseFloat(b.weight ? b.weight.replace('kg', '') : 
                          b.availableWeight.replace('kg', ''));
          return weightB - weightA; // 重量从大到小排序
        
        case 'departure':
          // 获取时间并比较
          const timeA = new Date(a.expectedTime || a.departureTime).getTime();
          const timeB = new Date(b.expectedTime || b.departureTime).getTime();
          return timeA - timeB;
        
        case 'time':
        default:
          // 默认按发布时间排序（最新的在前面）
          const createTimeA = new Date(a.createTime).getTime();
          const createTimeB = new Date(b.createTime).getTime();
          return createTimeB - createTimeA;
      }
    });
  },
  
  // 生成模拟捎带需求数据
  generateMockNeedsData: function() {
    const mockData = [];
    const itemTypes = ['文件', '衣服', '食品', '药品', '箱包', '数码产品', '图书', '礼品', '其他'];
    
    for (let i = 0; i < 10; i++) {
      // 随机选择1-2个物品类型
      const shuffledItems = [...itemTypes].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, Math.floor(Math.random() * 2) + 1);
      
      mockData.push({
        id: `need_${this.data.pageNum}_${i}`,
        fromLocation: this.data.locationOptions.china[Math.floor(Math.random() * this.data.locationOptions.china.length)],
        toLocation: this.data.locationOptions.ireland[Math.floor(Math.random() * this.data.locationOptions.ireland.length)],
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
    const itemTypes = ['文件', '衣服', '食品', '药品', '箱包', '数码产品', '图书', '礼品', '其他'];
    
    for (let i = 0; i < 10; i++) {
      // 随机选择2-4个可接受物品类型
      const shuffledItems = [...itemTypes].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, Math.floor(Math.random() * 3) + 2);
      
      // 生成每公斤价格
      const pricePerKg = Math.floor(Math.random() * 50) + 20; // 20-70欧元/公斤的随机价格
      
      mockData.push({
        id: `trip_${this.data.pageNum}_${i}`,
        fromLocation: this.data.locationOptions.china[Math.floor(Math.random() * this.data.locationOptions.china.length)],
        toLocation: this.data.locationOptions.ireland[Math.floor(Math.random() * this.data.locationOptions.ireland.length)],
        departureTime: '2023-' + (Math.floor(Math.random() * 12) + 1) + '-' + (Math.floor(Math.random() * 28) + 1),
        availableWeight: Math.floor(Math.random() * 20 + 1) + 'kg',
        acceptableItems: selectedItems,
        rewardRequirement: '€' + pricePerKg + '/kg',
        flightNumber: 'CA' + (Math.floor(Math.random() * 1000) + 100),
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
  
  // 显示筛选面板
  showFilter: function() {
    this.setData({
      showFilterPanel: true
    });
  },
  
  // 隐藏筛选面板
  hideFilter: function() {
    this.setData({
      showFilterPanel: false
    });
  },
  
  // 重置筛选条件
  resetFilter: function() {
    this.setData({
      filter: {
        fromLocation: '',
        toLocation: '',
        departureTimeStart: '',
        departureTimeEnd: '',
        itemType: [],
        minWeight: '',
        maxWeight: '',
        minPrice: '',
        maxPrice: '',
        sortType: 'time'
      }
    });
  },
  
  // 应用筛选条件
  applyFilter: function() {
    this.setData({
      showFilterPanel: false,
      pageNum: 1,
      hasMore: true,
      searchResults: []
    });
    this.performSearch();
  },
  
  // 修改筛选条件
  onFilterChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`filter.${field}`]: value
    });
  },
  
  // 选择物品类型
  onItemTypeChange: function(e) {
    const selectedTypes = e.detail.value;
    this.setData({
      'filter.itemType': selectedTypes
    });
  },
  
  // 选择排序方式
  onSortChange: function(e) {
    this.setData({
      'filter.sortType': e.detail.value
    });
  },
  
  // 日期选择器相关方法
  openDatePicker: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      [`showDate${type}`]: true
    });
  },
  
  closeDatePicker: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      [`showDate${type}`]: false
    });
  },
  
  onDateConfirm: function(e) {
    const type = e.currentTarget.dataset.type;
    const date = new Date(e.detail);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    this.setData({
      [`filter.departureTime${type}`]: formattedDate,
      [`showDate${type}`]: false
    });
  },
  
  // 点击列表项
  onItemTap: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&type=${this.data.searchType === 0 ? 'need' : 'trip'}`
    });
  }
}) 