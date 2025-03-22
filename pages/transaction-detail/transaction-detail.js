const paymentApi = require('../../utils/api/payment');
const orderApi = require('../../utils/api/order');
const notificationApi = require('../../utils/api/notification');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    transaction: null,
    transactionId: '',
    timeline: [],
    loading: true,
    showActions: false,
    canRefund: false,
    canRetry: false,
    relatedOrder: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 从options获取交易ID
    if (options.id) {
      this.setData({
        transactionId: options.id
      });
      this.loadTransactionDetail(options.id);
    } else {
      // 从本地存储获取交易对象
      const transaction = wx.getStorageSync('currentTransaction');
      if (transaction) {
        this.setData({
          transaction: transaction,
          transactionId: transaction.id,
          loading: false
        });
        this.generateTimeline(transaction);
        this.checkActionPermissions(transaction);
        
        // 如果有关联订单ID，加载订单详情
        if (transaction.relatedOrderId) {
          this.loadRelatedOrder(transaction.relatedOrderId);
        }
      } else {
        wx.showToast({
          title: '交易记录不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }
  },

  /**
   * 加载交易详情
   */
  async loadTransactionDetail(id) {
    try {
      wx.showLoading({
        title: '加载中'
      });

      // 模拟API调用，实际项目中应该调用真实的API
      // const res = await paymentApi.getTransactionDetail(id);
      
      // 模拟数据，实际项目中应替换成API返回的数据
      setTimeout(() => {
        const transaction = {
          id: id,
          amount: '+50.00',
          typeText: '订单收入',
          type: 'order_income',
          statusText: '交易成功',
          status: 'success',
          date: '2023-03-15',
          time: '14:30:25',
          completedTime: '2023-03-15 14:32:05',
          description: '用户支付了订单费用',
          relatedOrderId: 'ORDER123456',
          paymentMethod: '微信支付'
        };

        this.setData({
          transaction: transaction,
          loading: false
        });

        this.generateTimeline(transaction);
        this.checkActionPermissions(transaction);
        
        // 如果有关联订单ID，加载订单详情
        if (transaction.relatedOrderId) {
          this.loadRelatedOrder(transaction.relatedOrderId);
        }

        wx.hideLoading();
      }, 1000);
    } catch (error) {
      console.error('加载交易详情失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 加载关联订单
   */
  async loadRelatedOrder(orderId) {
    try {
      // 模拟加载订单详情
      // const res = await orderApi.getOrderDetail(orderId);
      
      // 模拟数据，实际项目中应替换成API返回的数据
      setTimeout(() => {
        const order = {
          id: orderId,
          status: 'completed',
          // 其他订单详情...
        };

        this.setData({
          relatedOrder: order
        });
      }, 500);
    } catch (error) {
      console.error('加载关联订单失败:', error);
    }
  },

  /**
   * 生成交易流程时间线
   */
  generateTimeline(transaction) {
    const timeline = [];
    const createTime = `${transaction.date} ${transaction.time}`;
    
    // 根据不同类型的交易生成不同的时间线
    if (transaction.type === 'recharge') {
      // 充值交易时间线
      timeline.push({
        step: 1,
        title: '创建充值订单',
        time: createTime,
        active: true
      });
      
      timeline.push({
        step: 2,
        title: '发起支付',
        time: createTime,
        active: transaction.status !== 'pending'
      });
      
      timeline.push({
        step: 3,
        title: '充值完成',
        time: transaction.completedTime || '--',
        active: transaction.status === 'success'
      });
    } else if (transaction.type === 'withdraw') {
      // 提现交易时间线
      timeline.push({
        step: 1,
        title: '创建提现申请',
        time: createTime,
        active: true
      });
      
      timeline.push({
        step: 2,
        title: '审核中',
        time: createTime,
        active: transaction.status !== 'pending'
      });
      
      timeline.push({
        step: 3,
        title: '提现到账',
        time: transaction.completedTime || '--',
        active: transaction.status === 'success'
      });
    } else if (transaction.type.includes('order')) {
      // 订单相关交易时间线
      timeline.push({
        step: 1,
        title: '创建交易',
        time: createTime,
        active: true
      });
      
      timeline.push({
        step: 2,
        title: transaction.type === 'order_payment' ? '支付订单' : '确认收入',
        time: transaction.status !== 'pending' ? createTime : '--',
        active: transaction.status !== 'pending'
      });
      
      timeline.push({
        step: 3,
        title: '交易完成',
        time: transaction.completedTime || '--',
        active: transaction.status === 'success'
      });
    }
    
    this.setData({
      timeline: timeline
    });
  },

  /**
   * 检查交易可执行的操作权限
   */
  checkActionPermissions(transaction) {
    let canRefund = false;
    let canRetry = false;
    let showActions = false;
    
    // 检查是否可以申请退款
    if (transaction.type === 'order_payment' && transaction.status === 'success') {
      const createDate = new Date(transaction.date);
      const now = new Date();
      const daysDiff = (now - createDate) / (1000 * 60 * 60 * 24);
      
      // 假设交易成功后7天内可以申请退款
      canRefund = daysDiff <= 7;
    }
    
    // 检查是否可以重新支付
    if ((transaction.type === 'order_payment' || transaction.type === 'recharge') && 
        transaction.status === 'failed') {
      canRetry = true;
    }
    
    // 如果有任何可执行的操作，显示操作区域
    showActions = canRefund || canRetry || true; // 总是显示联系客服选项
    
    this.setData({
      canRefund,
      canRetry,
      showActions
    });
  },

  /**
   * 复制交易ID
   */
  copyTransactionId() {
    const id = this.data.transaction.orderId || this.data.transaction.id;
    wx.setClipboardData({
      data: id,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 查看关联订单
   */
  viewRelatedOrder() {
    if (this.data.transaction.relatedOrderId) {
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?orderId=${this.data.transaction.relatedOrderId}`
      });
    }
  },

  /**
   * 申请退款
   */
  applyRefund() {
    wx.navigateTo({
      url: `/pages/refund-apply/refund-apply?transactionId=${this.data.transactionId}`
    });
  },

  /**
   * 重新支付
   */
  retryPayment() {
    const transaction = this.data.transaction;
    
    if (transaction.type === 'recharge') {
      // 重新充值
      wx.navigateBack({
        success: () => {
          // 设置要充值的金额，去掉金额前面的符号
          const amount = transaction.amount.replace(/[+-]/g, '');
          wx.setStorageSync('rechargeAmount', amount);
        }
      });
    } else if (transaction.type === 'order_payment' && transaction.relatedOrderId) {
      // 重新支付订单
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?orderId=${transaction.relatedOrderId}&action=pay`
      });
    }
  },

  /**
   * 联系客服
   */
  contactCustomerService() {
    wx.showModal({
      title: '联系客服',
      content: '您确定要联系客服处理该笔交易吗？',
      success: (res) => {
        if (res.confirm) {
          // 拨打客服电话
          wx.makePhoneCall({
            phoneNumber: '4001234567' // 客服电话
          });
        }
      }
    });
  }
}); 