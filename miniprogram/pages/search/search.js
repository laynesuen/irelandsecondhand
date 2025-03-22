Page({
  data: {
    // 搜索关键词
    searchKeyword: '',
    autoFocus: true,
    
    // 搜索历史和热门搜索
    searchHistory: [],
    hotSearchTags: ['都柏林', '北京', '衣服', '文件', '数码产品', '箱包', '医药用品', '低价捎带'],
    
    // 搜索结果相关
    showSearchResults: false,
    searchResults: [],
    searching: false,
    hasMore: true,
    pageNum: 1,
    pageSize: 10,
    
    // 筛选相关
    activeFilter: 'all',
    showTypeFilter: false,
    showTimeFilter: false,
    showPriceFilter: false,
    showWeightFilter: false,
    showRatingFilter: false,
    
    // 筛选条件选项
    itemTypeOptions: ['文件', '衣服', '食品', '药品', '箱包', '数码产品', '其他'],
    itemTypeFilter: [],
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    minWeight: '',
    maxWeight: '',
    minRating: 3.0,
    
    // 排序相关
    sortBy: 'recent',
    showSortOptions: false,
    currentSort: { value: 'recent', text: '最新发布' },
    
    // 缓存原始搜索结果，用于筛选
    originalResults: []
  },

  onLoad: function(options) {
    // 如果有传入的关键词，自动进行搜索
    if (options.keyword) {
      this.setData({
        searchKeyword: options.keyword,
        autoFocus: false
      });
      this.performSearch();
    }
    
    // 从本地存储加载搜索历史
    this.loadSearchHistory();
  },

  // 搜索输入事件
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },
  
  // 搜索确认（回车键）事件
  onSearchConfirm: function() {
    this.performSearch();
  },
  
  // 搜索按钮点击事件
  onSearchTap: function() {
    this.performSearch();
  },
  
  // 取消搜索
  onCancelSearch: function() {
    wx.navigateBack();
  },
  
  // 执行搜索
  performSearch: function() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) return;
    
    // 显示加载中
    wx.showLoading({
      title: '搜索中...',
    });
    
    this.setData({
      searching: true,
      showSearchResults: true,
      pageNum: 1,
      hasMore: true,
      searchResults: []
    });
    
    // 保存到搜索历史
    this.saveSearchHistory(keyword);
    
    // 模拟搜索请求
    setTimeout(() => {
      // 生成模拟搜索结果
      this.generateMockSearchResults(keyword);
      
      wx.hideLoading();
      this.setData({
        searching: false
      });
    }, 800);
  },
  
  // 生成模拟搜索结果数据
  generateMockSearchResults: function(keyword) {
    const mockResults = [];
    const itemTypes = ['文件', '衣服', '食品', '药品', '箱包', '数码产品', '其他'];
    
    // 模拟行程信息
    for (let i = 0; i < 15; i++) {
      const fromLocations = ['北京', '上海', '广州', '深圳', '成都'];
      const toLocations = ['都柏林', '科克', '戈尔韦', '利默里克', '基尔肯尼'];
      
      const fromLocation = fromLocations[Math.floor(Math.random() * fromLocations.length)];
      const toLocation = toLocations[Math.floor(Math.random() * toLocations.length)];
      
      // 只有当搜索关键词匹配目的地、出发地或物品类型时才添加到结果中
      const acceptableItems = this.getRandomSubarray(itemTypes, Math.floor(Math.random() * 3) + 2);
      
      if (keyword && !(
        fromLocation.includes(keyword) ||
        toLocation.includes(keyword) ||
        acceptableItems.some(item => item.includes(keyword))
      )) {
        continue;
      }
      
      // 生成每公斤价格
      const pricePerKg = Math.floor(Math.random() * 50) + 20; // 20-70欧元/公斤的随机价格
      
      mockResults.push({
        id: `trip_${i}`,
        type: 'trip',
        fromLocation,
        toLocation,
        departureTime: this.getRandomFutureDate(),
        availableWeight: Math.floor(Math.random() * 20 + 1) + 'kg',
        acceptableItems,
        rewardRequirement: '€' + pricePerKg + '/kg',
        traveler: {
          name: '用户' + Math.floor(Math.random() * 1000),
          avatar: '/images/default-avatar.png',
          rating: (Math.random() * 2 + 3).toFixed(1)
        },
        publishTime: this.getRandomPastTime(),
        priceValue: pricePerKg,
        weightValue: parseInt(Math.floor(Math.random() * 20 + 1)),
        ratingValue: parseFloat((Math.random() * 2 + 3).toFixed(1))
      });
    }
    
    // 模拟捎带需求
    for (let i = 0; i < 15; i++) {
      const fromLocations = ['北京', '上海', '广州', '深圳', '成都'];
      const toLocations = ['都柏林', '科克', '戈尔韦', '利默里克', '基尔肯尼'];
      
      const fromLocation = fromLocations[Math.floor(Math.random() * fromLocations.length)];
      const toLocation = toLocations[Math.floor(Math.random() * toLocations.length)];
      
      // 随机选择1-2个物品类型
      const selectedItems = this.getRandomSubarray(itemTypes, Math.floor(Math.random() * 2) + 1);
      
      // 只有当搜索关键词匹配目的地、出发地或物品类型时才添加到结果中
      if (keyword && !(
        fromLocation.includes(keyword) ||
        toLocation.includes(keyword) ||
        selectedItems.some(item => item.includes(keyword))
      )) {
        continue;
      }
      
      const weight = Math.floor(Math.random() * 10 + 1);
      const price = Math.floor(Math.random() * 500) + 100;
      
      mockResults.push({
        id: `need_${i}`,
        type: 'need',
        fromLocation,
        toLocation,
        itemType: selectedItems,
        weight: weight + 'kg',
        size: ['小', '中', '大'][Math.floor(Math.random() * 3)],
        expectedTime: this.getRandomFutureDate(),
        reward: '€' + price,
        description: '需要帮忙带一些个人物品，详情可私聊',
        publisher: {
          name: '用户' + Math.floor(Math.random() * 1000),
          avatar: '/images/default-avatar.png',
          rating: (Math.random() * 2 + 3).toFixed(1)
        },
        publishTime: this.getRandomPastTime(),
        priceValue: price,
        weightValue: weight,
        ratingValue: parseFloat((Math.random() * 2 + 3).toFixed(1))
      });
    }
    
    // 如果没有结果，显示一些默认结果
    if (mockResults.length === 0) {
      for (let i = 0; i < 5; i++) {
        const fromLocations = ['北京', '上海', '广州'];
        const toLocations = ['都柏林', '科克', '戈尔韦'];
        
        mockResults.push({
          id: `default_${i}`,
          type: Math.random() > 0.5 ? 'trip' : 'need',
          fromLocation: fromLocations[Math.floor(Math.random() * fromLocations.length)],
          toLocation: toLocations[Math.floor(Math.random() * toLocations.length)],
          departureTime: this.getRandomFutureDate(),
          availableWeight: Math.floor(Math.random() * 20 + 1) + 'kg',
          acceptableItems: this.getRandomSubarray(itemTypes, Math.floor(Math.random() * 3) + 2),
          rewardRequirement: '€' + (Math.floor(Math.random() * 50) + 20) + '/kg',
          traveler: {
            name: '用户' + Math.floor(Math.random() * 1000),
            avatar: '/images/default-avatar.png',
            rating: (Math.random() * 2 + 3).toFixed(1)
          },
          publishTime: this.getRandomPastTime()
        });
      }
    }
    
    // 保存原始结果用于筛选
    this.setData({
      searchResults: this.sortResults(mockResults, this.data.sortBy),
      originalResults: mockResults,
      hasMore: false
    });
  },
  
  // 获取随机子数组
  getRandomSubarray: function(arr, size) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  },
  
  // 获取随机未来日期
  getRandomFutureDate: function() {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + Math.floor(Math.random() * 90) + 1); // 1到90天后的随机日期
    
    return futureDate.toISOString().split('T')[0]; // YYYY-MM-DD 格式
  },
  
  // 获取随机过去时间
  getRandomPastTime: function() {
    const times = ['刚刚', '1分钟前', '5分钟前', '30分钟前', '1小时前', '3小时前', '今天', '昨天', '2天前', '3天前', '一周前'];
    return times[Math.floor(Math.random() * times.length)];
  },

  // 搜索历史相关方法
  loadSearchHistory: function() {
    try {
      const history = wx.getStorageSync('searchHistory');
      if (history) {
        this.setData({
          searchHistory: JSON.parse(history)
        });
      }
    } catch (e) {
      console.error('读取搜索历史失败', e);
    }
  },
  
  saveSearchHistory: function(keyword) {
    if (!keyword) return;
    
    try {
      let history = this.data.searchHistory;
      
      // 如果已存在，则移除再添加到头部
      const index = history.indexOf(keyword);
      if (index !== -1) {
        history.splice(index, 1);
      }
      
      // 添加到头部
      history.unshift(keyword);
      
      // 限制数量
      if (history.length > 10) {
        history = history.slice(0, 10);
      }
      
      this.setData({
        searchHistory: history
      });
      
      // 保存到本地存储
      wx.setStorageSync('searchHistory', JSON.stringify(history));
    } catch (e) {
      console.error('保存搜索历史失败', e);
    }
  },
  
  clearSearchHistory: function() {
    wx.showModal({
      title: '提示',
      content: '确定要清除所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            searchHistory: []
          });
          wx.removeStorageSync('searchHistory');
        }
      }
    });
  },
  
  onHistoryTagTap: function(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchKeyword: keyword
    });
    this.performSearch();
  },
  
  onHotTagTap: function(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchKeyword: keyword
    });
    this.performSearch();
  },

  // 筛选功能相关方法
  onFilterTap: function(e) {
    const filter = e.currentTarget.dataset.filter;
    
    // 若点击当前筛选项，则切换显示状态
    if (filter === this.data.activeFilter) {
      // 根据点击的是哪个筛选项，切换对应的显示状态
      switch (filter) {
        case 'type':
          this.setData({ showTypeFilter: !this.data.showTypeFilter });
          break;
        case 'time':
          this.setData({ showTimeFilter: !this.data.showTimeFilter });
          break;
        case 'price':
          this.setData({ showPriceFilter: !this.data.showPriceFilter });
          break;
        case 'weight':
          this.setData({ showWeightFilter: !this.data.showWeightFilter });
          break;
        case 'rating':
          this.setData({ showRatingFilter: !this.data.showRatingFilter });
          break;
      }
    } else {
      // 点击不同的筛选项，则关闭其他筛选项的显示，打开当前点击的筛选项
      this.setData({
        activeFilter: filter,
        showTypeFilter: filter === 'type',
        showTimeFilter: filter === 'time',
        showPriceFilter: filter === 'price',
        showWeightFilter: filter === 'weight',
        showRatingFilter: filter === 'rating'
      });
    }
  },
  
  // 物品类型筛选相关
  onItemTypeSelect: function(e) {
    const selectedType = e.currentTarget.dataset.type;
    const itemTypeFilter = [...this.data.itemTypeFilter];
    
    // 若已选中，则移除；否则添加
    const index = itemTypeFilter.indexOf(selectedType);
    if (index !== -1) {
      itemTypeFilter.splice(index, 1);
    } else {
      itemTypeFilter.push(selectedType);
    }
    
    this.setData({
      itemTypeFilter
    });
  },
  
  resetTypeFilter: function() {
    this.setData({
      itemTypeFilter: []
    });
  },
  
  confirmTypeFilter: function() {
    this.applyFilters();
    this.setData({
      showTypeFilter: false
    });
  },
  
  // 时间范围筛选相关
  onStartDateChange: function(e) {
    this.setData({
      startDate: e.detail.value
    });
  },
  
  onEndDateChange: function(e) {
    this.setData({
      endDate: e.detail.value
    });
  },
  
  resetTimeFilter: function() {
    this.setData({
      startDate: '',
      endDate: ''
    });
  },
  
  confirmTimeFilter: function() {
    this.applyFilters();
    this.setData({
      showTimeFilter: false
    });
  },
  
  // 价格区间筛选相关
  onMinPriceInput: function(e) {
    this.setData({
      minPrice: e.detail.value
    });
  },
  
  onMaxPriceInput: function(e) {
    this.setData({
      maxPrice: e.detail.value
    });
  },
  
  resetPriceFilter: function() {
    this.setData({
      minPrice: '',
      maxPrice: ''
    });
  },
  
  confirmPriceFilter: function() {
    this.applyFilters();
    this.setData({
      showPriceFilter: false
    });
  },
  
  // 重量区间筛选相关
  onMinWeightInput: function(e) {
    this.setData({
      minWeight: e.detail.value
    });
  },
  
  onMaxWeightInput: function(e) {
    this.setData({
      maxWeight: e.detail.value
    });
  },
  
  resetWeightFilter: function() {
    this.setData({
      minWeight: '',
      maxWeight: ''
    });
  },
  
  confirmWeightFilter: function() {
    this.applyFilters();
    this.setData({
      showWeightFilter: false
    });
  },
  
  // 评分筛选相关
  onRatingChange: function(e) {
    this.setData({
      minRating: e.detail.value
    });
  },
  
  resetRatingFilter: function() {
    this.setData({
      minRating: 3.0
    });
  },
  
  confirmRatingFilter: function() {
    this.applyFilters();
    this.setData({
      showRatingFilter: false
    });
  },
  
  // 应用所有筛选条件
  applyFilters: function() {
    let filteredResults = [...this.data.originalResults];
    
    // 应用物品类型筛选
    if (this.data.itemTypeFilter.length > 0) {
      filteredResults = filteredResults.filter(item => {
        if (item.type === 'trip') {
          return item.acceptableItems.some(type => this.data.itemTypeFilter.includes(type));
        } else {
          return item.itemType.some(type => this.data.itemTypeFilter.includes(type));
        }
      });
    }
    
    // 应用时间范围筛选
    if (this.data.startDate || this.data.endDate) {
      filteredResults = filteredResults.filter(item => {
        const itemDate = item.type === 'trip' ? item.departureTime : item.expectedTime;
        
        if (this.data.startDate && this.data.endDate) {
          return itemDate >= this.data.startDate && itemDate <= this.data.endDate;
        } else if (this.data.startDate) {
          return itemDate >= this.data.startDate;
        } else if (this.data.endDate) {
          return itemDate <= this.data.endDate;
        }
        
        return true;
      });
    }
    
    // 应用价格区间筛选
    const minPrice = this.data.minPrice ? parseFloat(this.data.minPrice) : null;
    const maxPrice = this.data.maxPrice ? parseFloat(this.data.maxPrice) : null;
    
    if (minPrice !== null || maxPrice !== null) {
      filteredResults = filteredResults.filter(item => {
        const price = item.priceValue;
        
        if (minPrice !== null && maxPrice !== null) {
          return price >= minPrice && price <= maxPrice;
        } else if (minPrice !== null) {
          return price >= minPrice;
        } else if (maxPrice !== null) {
          return price <= maxPrice;
        }
        
        return true;
      });
    }
    
    // 应用重量区间筛选
    const minWeight = this.data.minWeight ? parseFloat(this.data.minWeight) : null;
    const maxWeight = this.data.maxWeight ? parseFloat(this.data.maxWeight) : null;
    
    if (minWeight !== null || maxWeight !== null) {
      filteredResults = filteredResults.filter(item => {
        const weight = item.weightValue;
        
        if (minWeight !== null && maxWeight !== null) {
          return weight >= minWeight && weight <= maxWeight;
        } else if (minWeight !== null) {
          return weight >= minWeight;
        } else if (maxWeight !== null) {
          return weight <= maxWeight;
        }
        
        return true;
      });
    }
    
    // 应用评分筛选
    if (this.data.minRating) {
      filteredResults = filteredResults.filter(item => {
        return item.ratingValue >= this.data.minRating;
      });
    }
    
    // 应用当前排序
    filteredResults = this.sortResults(filteredResults, this.data.sortBy);
    
    this.setData({
      searchResults: filteredResults
    });
  },
  
  // 排序相关方法
  toggleSortOptions: function() {
    this.setData({
      showSortOptions: !this.data.showSortOptions
    });
  },
  
  onSortSelect: function(e) {
    const sortBy = e.currentTarget.dataset.sort;
    let currentSort = { value: sortBy };
    
    switch (sortBy) {
      case 'recent':
        currentSort.text = '最新发布';
        break;
      case 'priceAsc':
        currentSort.text = '价格从低到高';
        break;
      case 'priceDesc':
        currentSort.text = '价格从高到低';
        break;
      case 'ratingDesc':
        currentSort.text = '评分从高到低';
        break;
    }
    
    this.setData({
      sortBy,
      currentSort,
      showSortOptions: false,
      searchResults: this.sortResults(this.data.searchResults, sortBy)
    });
  },
  
  sortResults: function(results, sortBy) {
    const sortedResults = [...results];
    
    switch (sortBy) {
      case 'recent':
        // 按发布时间排序（这里使用模拟数据，所以直接返回原数组）
        return sortedResults;
      
      case 'priceAsc':
        // 按价格从低到高排序
        return sortedResults.sort((a, b) => a.priceValue - b.priceValue);
      
      case 'priceDesc':
        // 按价格从高到低排序
        return sortedResults.sort((a, b) => b.priceValue - a.priceValue);
      
      case 'ratingDesc':
        // 按评分从高到低排序
        return sortedResults.sort((a, b) => b.ratingValue - a.ratingValue);
      
      default:
        return sortedResults;
    }
  },
  
  // 点击列表项
  onItemTap: function(e) {
    const id = e.currentTarget.dataset.id;
    const type = e.currentTarget.dataset.type;
    
    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&type=${type}`
    });
  }
}); 