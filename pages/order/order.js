// pages/order/order.js
const app = getApp()
const orderApi = require('../../utils/api/order')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderList: [], // 订单列表
    loading: true, // 是否正在加载
    hasMore: true, // 是否有更多数据
    page: 1, // 当前页码
    pageSize: 10, // 每页数量
    activeTab: 'all', // 当前选中的标签: all, pending, accepted, inProgress, completed, cancelled
    searchKeyword: '', // 搜索关键词
    orderType: '' // 订单类型: 'trip' 或 'delivery'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取订单类型参数
    const { type } = options;
    
    this.setData({
      orderType: type || ''
    });
    
    this.loadOrderList();
  },

  /**
   * 切换标签
   */
  switchTab(e) {
    const type = e.currentTarget.dataset.type;
    
    if (type === this.data.activeTab) return;
    
    this.setData({
      activeTab: type,
      orderList: [],
      loading: true,
      hasMore: true,
      page: 1
    });
    
    this.loadOrderList();
  },

  /**
   * 搜索输入事件
   */
  onSearchInput(e) {
    const value = e.detail.value;
    
    this.setData({
      searchKeyword: value
    });
    
    // 防抖处理，500ms后执行搜索
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    this.searchTimer = setTimeout(() => {
      this.setData({
        orderList: [],
        loading: true,
        hasMore: true,
        page: 1
      });
      
      this.loadOrderList();
    }, 500);
  },

  /**
   * 加载订单列表
   */
  loadOrderList() {
    this.setData({ loading: true });
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 构建请求参数
    const params = {
      page: this.data.page,
      pageSize: this.data.pageSize,
      keyword: this.data.searchKeyword,
      orderType: this.data.orderType
    };
    
    // 根据当前标签设置状态过滤
    if (this.data.activeTab !== 'all') {
      params.status = this.data.activeTab;
    }
    
    // 调用API获取订单列表
    orderApi.getOrderList(params)
      .then(res => {
        wx.hideLoading();
        
        if (res.success) {
          const { list, hasMore } = res.data;
          
          this.setData({
            orderList: this.data.page === 1 ? list : [...this.data.orderList, ...list],
            loading: false,
            hasMore: hasMore
          });
        } else {
          this.setData({
            loading: false,
            hasMore: false
          });
          
          wx.showToast({
            title: '获取订单列表失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        
        this.setData({
          loading: false,
          hasMore: false
        });
        
        wx.showToast({
          title: '获取订单列表失败: ' + (err.message || '未知错误'),
          icon: 'none'
        });
      });
  },

  /**
   * 订单项点击事件
   */
  onOrderTap(e) {
    const orderId = e.currentTarget.dataset.id;
    this.navigateToOrderDetail(orderId);
  },
  
  /**
   * 查看详情按钮点击事件
   */
  onViewDetailTap(e) {
    // 阻止事件冒泡
    e.stopPropagation();
    
    const orderId = e.currentTarget.dataset.id;
    const type = e.currentTarget.dataset.type;
    
    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/detail/detail?id=${orderId}&type=${type}`
    });
  },
  
  /**
   * 联系对方按钮点击事件
   */
  onContactTap(e) {
    // 阻止事件冒泡
    e.stopPropagation();
    
    const { userId, userName } = e.currentTarget.dataset;
    
    // 跳转到聊天页面
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${userId}&name=${userName}`
    });
  },
  
  /**
   * 取消订单按钮点击事件
   */
  onCancelTap(e) {
    // 阻止事件冒泡
    e.stopPropagation();
    
    const orderId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...',
            mask: true
          });
          
          // 调用API更新订单状态
          orderApi.updateOrderStatus(orderId, 'cancelled')
            .then(res => {
              wx.hideLoading();
              
              if (res.success) {
                wx.showToast({
                  title: '订单已取消',
                  icon: 'success'
                });
                
                // 重新加载订单列表
                setTimeout(() => {
                  this.setData({
                    orderList: [],
                    page: 1
                  });
                  this.loadOrderList();
                }, 1500);
              } else {
                wx.showToast({
                  title: '取消订单失败',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              
              wx.showToast({
                title: '取消订单失败: ' + (err.message || '未知错误'),
                icon: 'none'
              });
            });
        }
      }
    });
  },
  
  /**
   * 完成订单按钮点击事件
   */
  onCompleteTap(e) {
    // 阻止事件冒泡
    e.stopPropagation();
    
    const orderId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认完成',
      content: '确定要标记该订单为已完成吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...',
            mask: true
          });
          
          // 调用API更新订单状态
          orderApi.updateOrderStatus(orderId, 'completed')
            .then(res => {
              wx.hideLoading();
              
              if (res.success) {
                wx.showToast({
                  title: '订单已完成',
                  icon: 'success'
                });
                
                // 重新加载订单列表
                setTimeout(() => {
                  this.setData({
                    orderList: [],
                    page: 1
                  });
                  this.loadOrderList();
                }, 1500);
              } else {
                wx.showToast({
                  title: '完成订单失败',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              
              wx.showToast({
                title: '完成订单失败: ' + (err.message || '未知错误'),
                icon: 'none'
              });
            });
        }
      }
    });
  },
  
  /**
   * 跳转到订单详情页
   */
  navigateToOrderDetail(orderId) {
    // 查找订单
    const order = this.data.orderList.find(order => order.id === orderId);
    
    if (order) {
      // 跳转到详情页
      wx.navigateTo({
        url: `/pages/detail/detail?id=${orderId}&type=${order.orderType}`
      });
    }
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({
      page: this.data.page + 1
    });
    
    this.loadOrderList();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({
      orderList: [],
      page: 1,
      hasMore: true
    });
    
    this.loadOrderList();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.loadMore();
  }
})