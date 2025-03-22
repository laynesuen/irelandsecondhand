Page({
  /**
   * 页面的初始数据
   */
  data: {
    activeType: 'all', // 当前选中的标签: all, pending, processing, completed
    searchKeyword: '', // 搜索关键词
    orders: [], // 订单列表
    originalOrders: [], // 原始订单列表（用于搜索筛选）
    loading: true, // 是否正在加载
    hasMore: true, // 是否有更多数据
    page: 1, // 当前页码
    pageSize: 10, // 每页数量
    statusText: {
      'pending': '待处理',
      'processing': '进行中',
      'completed': '已完成',
      'canceled': '已取消'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 如果有传入status参数，则切换到对应标签
    if (options.status) {
      this.setData({
        activeType: options.status
      });
    }
    
    // 加载订单数据
    this.loadOrders();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 从其他页面返回时可能需要刷新订单列表
    // 此处可以判断是否需要刷新，例如通过全局变量来标记
    const app = getApp();
    if (app.globalData.needRefreshOrders) {
      this.refreshOrders();
      app.globalData.needRefreshOrders = false;
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.refreshOrders();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreOrders();
    }
  },

  /**
   * 切换标签页
   */
  switchTab: function (e) {
    const type = e.currentTarget.dataset.type;
    if (type !== this.data.activeType) {
      this.setData({
        activeType: type,
        orders: [],
        loading: true,
        hasMore: true,
        page: 1
      });
      
      // 切换标签后重新加载数据
      this.loadOrders();
    }
  },

  /**
   * 搜索输入事件
   */
  onSearchInput: function (e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    
    this.filterOrders();
  },

  /**
   * 清除搜索
   */
  clearSearch: function () {
    this.setData({
      searchKeyword: ''
    });
    
    this.filterOrders();
  },

  /**
   * 根据关键词筛选订单
   */
  filterOrders: function () {
    const { searchKeyword, originalOrders } = this.data;
    
    if (!searchKeyword) {
      // 如果关键词为空，恢复原始订单列表
      this.setData({
        orders: originalOrders
      });
      return;
    }
    
    // 根据关键词筛选订单
    const filteredOrders = originalOrders.filter(order => {
      // 在标题、地点等信息中搜索关键词
      return (
        order.fromLocation.includes(searchKeyword) ||
        order.toLocation.includes(searchKeyword) ||
        (order.itemType && order.itemType.includes(searchKeyword)) ||
        (order.description && order.description.includes(searchKeyword))
      );
    });
    
    this.setData({
      orders: filteredOrders
    });
  },

  /**
   * 加载订单数据
   */
  loadOrders: function () {
    const { activeType, page, pageSize } = this.data;
    
    this.setData({ loading: true });
    
    // 在实际开发中，这里应该调用接口获取数据
    // 这里使用模拟数据
    setTimeout(() => {
      // 生成模拟数据
      const mockOrders = this.generateMockOrders(activeType, page, pageSize);
      
      // 判断是否还有更多数据
      const hasMore = mockOrders.length === pageSize;
      
      this.setData({
        orders: mockOrders,
        originalOrders: mockOrders, // 保存原始数据用于搜索筛选
        loading: false,
        hasMore: hasMore
      });
      
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 加载更多订单
   */
  loadMoreOrders: function () {
    const { activeType, page, pageSize, orders } = this.data;
    
    this.setData({
      loading: true,
      page: page + 1
    });
    
    // 在实际开发中，这里应该调用接口获取更多数据
    // 这里使用模拟数据
    setTimeout(() => {
      // 生成更多模拟数据
      const moreOrders = this.generateMockOrders(activeType, page + 1, pageSize);
      
      // 判断是否还有更多数据
      const hasMore = moreOrders.length === pageSize;
      
      // 合并数据
      const newOrders = [...orders, ...moreOrders];
      
      this.setData({
        orders: newOrders,
        originalOrders: newOrders, // 更新原始数据
        loading: false,
        hasMore: hasMore
      });
    }, 1000);
  },

  /**
   * 刷新订单列表
   */
  refreshOrders: function () {
    this.setData({
      page: 1,
      hasMore: true
    });
    
    this.loadOrders();
  },

  /**
   * 生成模拟订单数据
   */
  generateMockOrders: function (type, page, pageSize) {
    // 模拟订单数据
    const mockOrders = [];
    
    // 订单类型
    const orderTypes = ['need', 'trip'];
    
    // 订单状态
    const statuses = type === 'all' ? ['pending', 'processing', 'completed', 'canceled'] : [type];
    
    // 出发地和目的地
    const locations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '西安', '南京', '武汉'];
    
    // 物品类型
    const itemTypes = ['文件', '小件物品', '电子产品', '服装', '食品', '图书', '礼品'];
    
    // 模拟生成订单数据
    for (let i = 0; i < pageSize; i++) {
      // 模拟数据总量不超过30条
      if ((page - 1) * pageSize + i >= 30) {
        break;
      }
      
      const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // 随机生成出发地和目的地，确保不同
      let fromIndex = Math.floor(Math.random() * locations.length);
      let toIndex = Math.floor(Math.random() * locations.length);
      while (toIndex === fromIndex) {
        toIndex = Math.floor(Math.random() * locations.length);
      }
      
      // 生成随机时间（最近30天内）
      const now = new Date();
      const randomDays = Math.floor(Math.random() * 30);
      const randomTime = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
      const formattedTime = `${randomTime.getFullYear()}-${randomTime.getMonth() + 1}-${randomTime.getDate()}`;
      
      // 生成随机预期时间（未来10天内）
      const expectTime = new Date(now.getTime() + Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000);
      const formattedExpectTime = `${expectTime.getFullYear()}-${expectTime.getMonth() + 1}-${expectTime.getDate()}`;
      
      // 生成随机报酬/重量
      const reward = (20 + Math.floor(Math.random() * 50)).toString();
      const weight = (1 + Math.floor(Math.random() * 10)).toString();
      
      const order = {
        id: (page - 1) * pageSize + i + 1, // 模拟ID
        orderType: orderType,
        status: status,
        fromLocation: locations[fromIndex],
        toLocation: locations[toIndex],
        createTime: formattedTime,
        expectedTime: formattedExpectTime,
        nickName: '用户' + Math.floor(Math.random() * 1000),
        avatarUrl: '',
        description: '这是一个' + (orderType === 'need' ? '需求' : '行程') + '描述'
      };
      
      // 根据订单类型添加特定属性
      if (orderType === 'need') {
        order.itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        order.reward = reward;
      } else {
        order.availableWeight = weight;
        order.acceptableItems = itemTypes.slice(0, 2 + Math.floor(Math.random() * 3)).join('、');
      }
      
      mockOrders.push(order);
    }
    
    return mockOrders;
  },

  /**
   * 导航到订单详情页
   */
  navigateToOrderDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    const order = this.data.orders.find(item => item.id === id);
    
    if (order) {
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${id}`
      });
    }
  },
  
  /**
   * 联系发布者
   */
  contactPublisher: function (e) {
    const id = e.currentTarget.dataset.id;
    const order = this.data.orders.find(item => item.id === id);
    
    if (order) {
      // 实际开发中应该跳转到聊天页面
      wx.navigateTo({
        url: `/pages/chat/chat?targetId=${order.id}&targetName=${order.nickName}`
      });
    }
  },

  /**
   * 取消订单
   */
  cancelOrder: function (e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          // 在实际开发中，这里应该调用接口取消订单
          // 这里使用模拟数据更新状态
          const { orders, originalOrders } = this.data;
          const updatedOrders = orders.map(order => {
            if (order.id === id) {
              return { ...order, status: 'canceled' };
            }
            return order;
          });
          
          const updatedOriginalOrders = originalOrders.map(order => {
            if (order.id === id) {
              return { ...order, status: 'canceled' };
            }
            return order;
          });
          
          this.setData({
            orders: updatedOrders,
            originalOrders: updatedOriginalOrders
          });
          
          wx.showToast({
            title: '订单已取消',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 查看订单详情
   */
  viewOrderDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    const order = this.data.orders.find(item => item.id === id);
    
    if (order) {
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${id}`
      });
    }
  },

  /**
   * 导航到发布页面
   */
  navigateToPublish: function () {
    wx.switchTab({
      url: '/pages/publish-menu/publish-menu'
    });
  }
}) 