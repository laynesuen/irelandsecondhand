Page({
  /**
   * 页面的初始数据
   */
  data: {
    notificationList: [], // 系统通知列表
    loading: {
      notification: false
    },
    hasMore: {
      notification: true
    },
    page: {
      notification: 1
    },
    pageSize: 10, // 每页数量
    searchKeyword: '', // 搜索关键词
    notificationIcons: [
      '/images/default-avatar.png',
      '/images/default-avatar.png',
      '/images/default-avatar.png',
      '/images/default-avatar.png'
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('消息中心页面加载');
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '系统通知'
    });
    
    // 初始化并加载通知数据
    this.loadInitialData();
  },
  
  /**
   * 初始加载数据
   */
  loadInitialData() {
    // 初始化数据
    const baseData = this.getBaseNotifications();
    
    this.setData({
      notificationList: baseData,
      'loading.notification': false,
      'hasMore.notification': baseData.length >= this.data.pageSize
    });
    
    console.log('初始数据加载完成，数量:', baseData.length);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('消息中心页面显示');
  },
  
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log('消息中心页面隐藏');
  },
  
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('消息中心页面卸载');
  },
  
  /**
   * 搜索框输入内容变化处理
   */
  onSearchInput(e) {
    const keyword = e.detail.value;
    console.log('搜索关键词:', keyword);
    
    this.setData({
      searchKeyword: keyword
    });
    
    // 防抖处理：如果在输入过程中已经设置了定时器，则清除
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    // 设置新的定时器，500ms后执行搜索
    this.searchTimer = setTimeout(() => {
      // 如果关键词不为空，开始搜索
      if (keyword) {
        this.searchNotifications(keyword);
      } else {
        // 如果关键词清空，重新加载所有通知
        this.refreshNotifications();
      }
    }, 500);
  },

  /**
   * 搜索通知
   */
  searchNotifications(keyword) {
    console.log('搜索通知:', keyword);
    
    // 获取本地基础数据并过滤
    const baseData = this.getBaseNotifications();
    
    let filteredNotifications = baseData.filter(item => 
      (item.title && item.title.includes(keyword)) || 
      (item.content && item.content.includes(keyword))
    );
    
    // 更新UI
    this.setData({
      notificationList: filteredNotifications,
      'loading.notification': false,
      'hasMore.notification': false // 搜索结果不需要分页
    });
    
    console.log('搜索完成，结果数量:', filteredNotifications.length);
  },
  
  /**
   * 重新加载通知列表
   */
  refreshNotifications() {
    console.log('刷新通知列表');
    
    // 重新加载基础数据
    const baseData = this.getBaseNotifications();
    
    this.setData({
      notificationList: baseData,
      'page.notification': 1,
      'hasMore.notification': baseData.length >= this.data.pageSize,
      'loading.notification': false
    });
    
    console.log('刷新完成，数据数量:', baseData.length);
  },
  
  /**
   * 加载更多通知
   */
  loadMore() {
    console.log('加载更多通知');
    
    if (!this.data.hasMore.notification || this.data.loading.notification) {
      console.log('无需加载更多');
      return;
    }
    
    // 设置加载状态
    this.setData({
      'loading.notification': true
    });
    
    // 获取更多本地模拟数据
    const newPage = this.data.page.notification + 1;
    const moreData = this.getBaseNotifications().map(item => ({
      ...item,
      id: `${item.id}_page${newPage}`,
      time: this.getAdjustedTimeByPage(newPage, item.time)
    }));
    
    // 如果是第三页以后，减少返回数据以模拟没有更多数据
    let finalMoreData = moreData;
    if (newPage >= 3) {
      finalMoreData = moreData.slice(0, Math.floor(this.data.pageSize / 2));
    }
    
    // 等待一小段时间模拟网络延迟，然后更新数据
    setTimeout(() => {
      // 更新数据
      this.setData({
        notificationList: [...this.data.notificationList, ...finalMoreData],
        'loading.notification': false,
        'hasMore.notification': newPage < 3,
        'page.notification': newPage
      });
      
      console.log('加载更多完成，新增数据:', finalMoreData.length);
    }, 500);
  },
  
  /**
   * 点击通知项
   */
  onNotificationTap(e) {
    const notificationId = e.currentTarget.dataset.id;
    console.log('点击通知:', notificationId);
    
    // 查找选中的通知
    const notification = this.data.notificationList.find(item => item.id === notificationId);
    
    if (!notification) {
      return;
    }
    
    // 标记为已读
    if (!notification.isRead) {
      this.markNotificationAsRead(notificationId);
    }
    
    // 根据通知类型处理不同的操作
    switch (notification.type) {
      case 0: // 系统消息
        // 显示系统消息详情
        wx.showModal({
          title: notification.title,
          content: notification.content,
          showCancel: false
        });
        break;
      case 1: // 订单状态变更
        // 导航到订单详情页
        wx.navigateTo({
          url: `/pages/order-detail/order-detail?id=${notification.relatedId}`
        });
        break;
      case 2: // 行程通知
        // 导航到行程详情
        wx.navigateTo({
          url: `/pages/trip-detail/trip-detail?id=${notification.relatedId}`
        });
        break;
      case 3: // 其他通知
        // 根据实际需求处理
        wx.showToast({
          title: '查看详情',
          icon: 'none'
        });
        break;
    }
  },
  
  /**
   * 标记通知为已读
   */
  markNotificationAsRead(id) {
    // 查找通知在数组中的索引
    const index = this.data.notificationList.findIndex(item => item.id === id);
    
    if (index === -1) {
      return;
    }
    
    // 更新已读状态
    const updateData = {};
    updateData[`notificationList[${index}].isRead`] = true;
    
    this.setData(updateData);
    
    // 实际应用中应该调用API通知服务器更新已读状态
    console.log('标记通知已读:', id);
  },
  
  /**
   * 标记所有通知为已读
   */
  markAllAsRead() {
    // 如果没有未读通知，则不进行操作
    const hasUnread = this.data.notificationList.some(item => !item.isRead);
    
    if (!hasUnread) {
      wx.showToast({
        title: '没有未读通知',
        icon: 'none'
      });
      return;
    }
    
    // 显示确认对话框
    wx.showModal({
      title: '提示',
      content: '确定将所有通知标记为已读吗？',
      success: (res) => {
        if (res.confirm) {
          // 更新所有通知为已读
          const updatedList = this.data.notificationList.map(item => ({
            ...item,
            isRead: true
          }));
          
          this.setData({
            notificationList: updatedList
          });
          
          // 实际应用中应该调用API通知服务器更新所有通知的已读状态
          wx.showToast({
            title: '已全部标记为已读',
            icon: 'success'
          });
        }
      }
    });
  },
  
  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    console.log('下拉刷新');
    
    // 重新加载数据
    this.refreshNotifications();
    
    // 停止下拉刷新动画
    wx.stopPullDownRefresh();
  },
  
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('页面触底，加载更多通知');
    this.loadMore();
  },
  
  /**
   * 根据页码调整时间显示
   */
  getAdjustedTimeByPage(page, baseTime) {
    if (!baseTime) return '2023-12-15 08:30';
    
    try {
      // 简单处理：每页数据比上一页早1天
      const dateParts = baseTime.split(' ')[0].split('-');
      const timePart = baseTime.split(' ')[1];
      
      if (dateParts.length !== 3) return baseTime;
      
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const day = Math.max(1, parseInt(dateParts[2]) - (page - 1));
      
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${timePart}`;
    } catch (e) {
      return baseTime;
    }
  },
  
  /**
   * 获取基础通知数据 - 直接返回模拟数据，避免复杂处理
   */
  getBaseNotifications() {
    return [
      {
        id: 'notify_001',
        type: 0, // 系统消息
        title: '系统维护通知',
        content: '系统将于2023年12月15日晚上22:00-次日凌晨2:00进行升级维护，期间服务可能不稳定，请提前安排您的行程。',
        time: '2023-12-15 15:30',
        isRead: false,
        relatedId: null
      },
      {
        id: 'notify_002',
        type: 1, // 订单状态变更
        title: '订单状态更新',
        content: '您的订单#OR98765已确认，商家正在准备发货。',
        time: '2023-12-15 09:25',
        isRead: true,
        relatedId: 'OR98765'
      },
      {
        id: 'notify_003',
        type: 2, // 行程通知
        title: '行程提醒',
        content: '您的北京-上海行程将于明天出发，请提前做好准备。',
        time: '2023-12-14 18:42',
        isRead: false,
        relatedId: 'TR12345'
      },
      {
        id: 'notify_004',
        type: 3, // 其他通知
        title: '活动邀请',
        content: '诚邀您参加2023年年终用户体验调查问卷，完成可获得50积分奖励。',
        time: '2023-12-14 12:30',
        isRead: true,
        relatedId: null
      },
      {
        id: 'notify_005',
        type: 0,
        title: '账号安全提醒',
        content: '您的账号今日在新设备上登录，如非本人操作，请立即修改密码。',
        time: '2023-12-13 22:15',
        isRead: false,
        relatedId: null
      },
      {
        id: 'notify_006',
        type: 1,
        title: '订单配送通知',
        content: '您的订单#OR76543已开始配送，预计今天下午送达。',
        time: '2023-12-13 10:05',
        isRead: true,
        relatedId: 'OR76543'
      },
      {
        id: 'notify_007',
        type: 2,
        title: '行程变更提醒',
        content: '您的成都-重庆行程因天气原因可能延误，请关注最新动态。',
        time: '2023-12-12 16:38',
        isRead: false,
        relatedId: 'TR67890'
      },
      {
        id: 'notify_008',
        type: 3,
        title: '新功能上线',
        content: '应用新增了行程共享功能，现在您可以与朋友分享您的行程计划了。',
        time: '2023-12-12 09:20',
        isRead: true,
        relatedId: null
      },
      {
        id: 'notify_009',
        type: 0,
        title: '账户余额提醒',
        content: '您的账户余额不足100元，可能影响后续订单支付，请及时充值。',
        time: '2023-12-11 14:45',
        isRead: false,
        relatedId: null
      },
      {
        id: 'notify_010',
        type: 1,
        title: '评价提醒',
        content: '您有3个订单尚未评价，评价后可获得积分奖励。',
        time: '2023-12-11 08:50',
        isRead: true,
        relatedId: null
      }
    ];
  }
}) 