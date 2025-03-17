Page({
  data: {
    activeTab: 0, // 默认显示行程信息标签
    needItems: [], // 收藏的捎带需求列表
    tripItems: [], // 收藏的行程信息列表
    isLoading: false
  },

  onLoad: function() {
    this.loadFavorites();
  },

  onShow: function() {
    // 每次页面显示时刷新收藏列表
    this.loadFavorites();
  },

  onPullDownRefresh: function() {
    // 下拉刷新
    this.loadFavorites(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载收藏数据
  loadFavorites: function(callback) {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/profile/profile'
      });
      return;
    }

    this.setData({ isLoading: true });

    // 从本地存储或模拟数据
    const favoritesData = wx.getStorageSync('favorites') || { needs: [], trips: [] };
    
    // 如果本地没有数据，则使用模拟数据
    if (favoritesData.needs.length === 0 && favoritesData.trips.length === 0) {
      // 示例数据 - 实际应用中应该从服务器获取
      const mockNeeds = [
        {
          id: 1,
          fromLocation: '北京',
          toLocation: '上海',
          expectedTime: '2023-04-10',
          itemType: '文件',
          reward: '¥50',
          nickName: '王小明',
          avatarUrl: '/images/default-avatar.png'
        },
        {
          id: 2,
          fromLocation: '广州',
          toLocation: '深圳',
          expectedTime: '2023-04-12',
          itemType: '小件物品',
          reward: '¥30',
          nickName: '李小红',
          avatarUrl: '/images/default-avatar.png'
        }
      ];

      const mockTrips = [
        {
          id: 1,
          fromLocation: '上海',
          toLocation: '杭州',
          departureTime: '2023-04-15',
          availableWeight: '5',
          acceptableItems: '文件、小件物品',
          nickName: '张小强',
          avatarUrl: '/images/default-avatar.png'
        }
      ];

      this.setData({
        needItems: mockNeeds,
        tripItems: mockTrips,
        isLoading: false
      });

      // 保存到本地存储
      wx.setStorageSync('favorites', {
        needs: mockNeeds,
        trips: mockTrips
      });
    } else {
      // 使用本地存储的数据
      this.setData({
        needItems: favoritesData.needs,
        tripItems: favoritesData.trips,
        isLoading: false
      });
    }

    if (callback) callback();
  },

  // 切换标签
  switchTab: function(e) {
    const tabIndex = parseInt(e.currentTarget.dataset.index);
    if (tabIndex !== this.data.activeTab) {
      this.setData({
        activeTab: tabIndex
      });
    }
  },

  // 取消收藏
  unfavorite: function(e) {
    const id = e.currentTarget.dataset.id;
    const type = e.currentTarget.dataset.type;
    const that = this;

    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏此项目吗？',
      success: function(res) {
        if (res.confirm) {
          let favoritesData = wx.getStorageSync('favorites') || { needs: [], trips: [] };
          
          if (type === 'need') {
            // 过滤掉要删除的项目
            favoritesData.needs = favoritesData.needs.filter(item => item.id !== id);
            that.setData({
              needItems: favoritesData.needs
            });
          } else if (type === 'trip') {
            // 过滤掉要删除的项目
            favoritesData.trips = favoritesData.trips.filter(item => item.id !== id);
            that.setData({
              tripItems: favoritesData.trips
            });
          }

          // 更新本地存储
          wx.setStorageSync('favorites', favoritesData);

          wx.showToast({
            title: '已取消收藏',
            icon: 'success'
          });
        }
      }
    });

    // 阻止冒泡，避免点击取消收藏按钮时导航到详情页
    return false;
  },

  // 导航到详情页
  navigateToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&type=${type}`
    });
  },

  // 导航到首页浏览
  navigateToExplore: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
}); 