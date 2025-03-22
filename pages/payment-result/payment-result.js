const formatTime = require('../../utils/formatTime');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    status: 'success', // success, fail
    orderId: '',
    transactionId: '',
    amount: '0.00',
    method: '微信支付',
    reason: '',
    payTime: '',
    type: 'order' // order, recharge
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取传递的参数
    const status = options.status || 'success';
    const orderId = options.orderId || '';
    const transactionId = options.transactionId || '';
    const amount = options.amount || '0.00';
    const method = options.method || '微信支付';
    const reason = options.reason || '';
    const type = options.type || 'order';
    
    // 设置支付时间
    const now = new Date();
    const payTime = formatTime.formatDateTime(now);
    
    this.setData({
      status,
      orderId,
      transactionId,
      amount,
      method,
      reason,
      payTime,
      type
    });
    
    // 更新订单状态（如果是支付成功）
    if (status === 'success' && orderId) {
      this.updateOrderStatus(orderId);
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  /**
   * 开始进度条动画
   */
  startProgressBar() {
    // 设置一个定时器，每0.5秒更新一次进度
    const timer = setInterval(() => {
      let progress = this.data.progress;
      
      if (progress < 95) {
        // 逐渐减慢增长速度
        if (progress < 50) {
          progress += 5;
        } else if (progress < 80) {
          progress += 2;
        } else {
          progress += 1;
        }
        
        this.setData({
          progress
        });
      } else {
        clearInterval(timer);
      }
    }, 500);

    this.setData({
      timer
    });
  },

  /**
   * 检查支付状态
   */
  async checkPaymentStatus() {
    try {
      const { orderId, transactionId, checkCount } = this.data;
      
      // 如果已经查询了10次，停止查询，展示失败结果
      if (checkCount >= 10) {
        this.setData({
          status: 'fail',
          failReason: '支付结果查询超时',
          failDetail: '系统无法确认您的支付结果，如已完成支付，请联系客服处理。'
        });
        
        if (this.data.timer) {
          clearInterval(this.data.timer);
        }
        return;
      }
      
      // 调用API查询支付状态
      // const res = await paymentApi.getPaymentStatus(transactionId || orderId);
      
      // 模拟API调用
      setTimeout(() => {
        // 模拟随机支付结果
        const randomResult = Math.random();
        
        if (randomResult > 0.3) {
          // 支付成功
          this.setData({
            status: 'success',
            progress: 100
          });
          
          if (this.data.timer) {
            clearInterval(this.data.timer);
          }
        } else if (randomResult > 0.1) {
          // 继续查询
          this.setData({
            checkCount: checkCount + 1
          });
          setTimeout(() => {
            this.checkPaymentStatus();
          }, 2000);
        } else {
          // 支付失败
          this.setData({
            status: 'fail',
            failReason: '支付未成功',
            failDetail: '您取消了支付或支付过程中出现了问题。'
          });
          
          if (this.data.timer) {
            clearInterval(this.data.timer);
          }
        }
      }, 2000);
      
    } catch (error) {
      console.error('查询支付状态失败:', error);
      
      // 查询失败，增加查询次数后继续查询
      this.setData({
        checkCount: this.data.checkCount + 1
      });
      
      if (this.data.checkCount < 10) {
        setTimeout(() => {
          this.checkPaymentStatus();
        }, 2000);
      } else {
        this.setData({
          status: 'fail',
          failReason: '网络异常',
          failDetail: '查询支付结果时发生网络错误，请检查网络连接后重试。'
        });
        
        if (this.data.timer) {
          clearInterval(this.data.timer);
        }
      }
    }
  },

  /**
   * 更新订单状态
   */
  updateOrderStatus(orderId) {
    // 可以调用 API 更新订单状态，这里根据实际情况实现
    console.log('更新订单状态: ', orderId);
  },

  /**
   * 查看订单
   */
  onViewOrder() {
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${this.data.orderId}`
    });
  },

  /**
   * 申请退款
   */
  onApplyRefund() {
    wx.navigateTo({
      url: `/pages/refund-apply/refund-apply?transactionId=${this.data.transactionId}&orderId=${this.data.orderId}`
    });
  },

  /**
   * 重新支付
   */
  onRetryPayment() {
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${this.data.orderId}`
    });
  },

  /**
   * 返回首页
   */
  onBackToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '爱到哪，带到哪 - 美好出行体验',
      path: '/pages/index/index'
    };
  },

  /**
   * 联系客服
   */
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '您确定要联系客服解决支付问题吗？',
      success: (res) => {
        if (res.confirm) {
          // 拨打客服电话
          wx.makePhoneCall({
            phoneNumber: '4001234567' // 客服电话号码
          });
        }
      }
    });
  }
}); 