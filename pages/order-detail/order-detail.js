const app = getApp()
const orderApi = require('../../utils/api/order');
const paymentApi = require('../../utils/api/payment');
const logisticsApi = require('../../utils/api/logistics');
const notificationApi = require('../../utils/api/notification');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderId: '', // 订单ID
    orderData: null, // 订单数据
    loading: true, // 是否正在加载
    paymentMethods: [],
    selectedPaymentMethod: null,
    logisticsStatus: null,
    trackingNumber: '',
    carrier: '',
    notifications: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 从options中获取订单ID，兼容id和orderId两种参数名
    const orderId = options.id || options.orderId;
    
    if (!orderId) {
      wx.showToast({
        title: '订单ID不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    // 设置订单ID
    this.setData({
      orderId: orderId,
      loading: true
    });
    
    console.log('加载订单详情，ID:', orderId);
    
    // 加载订单详情
    this.loadOrderDetail();
    this.loadPaymentMethods();
    this.loadLogisticsStatus();
    this.loadNotifications();
  },

  /**
   * 加载订单详情
   */
  loadOrderDetail() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    // 使用API获取订单详情
    orderApi.getOrderDetail(this.data.orderId)
      .then(res => {
        wx.hideLoading();
        
        if (res.success) {
          const orderData = res.data;
          
          this.setData({
            orderData,
            loading: false
          });
          
          // 设置页面标题
          wx.setNavigationBarTitle({
            title: `订单详情 #${this.data.orderId.substring(0, 8)}`
          });
        } else {
          this.setData({
            loading: false
          });
          
          wx.showToast({
            title: '获取订单详情失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('获取订单详情失败:', err);
        
        this.setData({
          loading: false
        });
        
        wx.hideLoading();
        
        wx.showToast({
          title: '获取订单详情失败: ' + (err.message || '未知错误'),
          icon: 'none'
        });
      });
  },
  
  /**
   * 联系用户
   */
  contactUser(e) {
    const { userid, username } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${userid}&name=${username}`
    });
  },
  
  /**
   * 取消订单
   */
  cancelOrder() {
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
          orderApi.updateOrderStatus(this.data.orderId, 'cancelled')
            .then(res => {
              wx.hideLoading();
              
              if (res.success) {
                wx.showToast({
                  title: '订单已取消',
                  icon: 'success'
                });
                
                // 重新加载订单详情
                setTimeout(() => {
                  this.loadOrderDetail();
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
   * 接受订单
   */
  acceptOrder() {
    wx.showModal({
      title: '确认接单',
      content: '确定要接受该订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...',
            mask: true
          });
          
          // 调用API更新订单状态
          orderApi.updateOrderStatus(this.data.orderId, 'accepted')
            .then(res => {
              wx.hideLoading();
              
              if (res.success) {
                wx.showToast({
                  title: '已接受订单',
                  icon: 'success'
                });
                
                // 重新加载订单详情
                setTimeout(() => {
                  this.loadOrderDetail();
                }, 1500);
              } else {
                wx.showToast({
                  title: '接受订单失败',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              
              wx.showToast({
                title: '接受订单失败: ' + (err.message || '未知错误'),
                icon: 'none'
              });
            });
        }
      }
    });
  },
  
  /**
   * 完成订单
   */
  completeOrder() {
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
          orderApi.updateOrderStatus(this.data.orderId, 'completed')
            .then(res => {
              wx.hideLoading();
              
              if (res.success) {
                wx.showToast({
                  title: '订单已完成',
                  icon: 'success'
                });
                
                // 重新加载订单详情
                setTimeout(() => {
                  this.loadOrderDetail();
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
   * 支付订单
   */
  payOrder() {
    const amount = this.data.orderData.totalAmount;
    
    wx.showModal({
      title: '确认支付',
      content: `确定要支付该订单吗？金额：¥${amount.toFixed(2)}`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '获取支付参数...',
            mask: true
          });
          
          // 调用API获取支付参数
          orderApi.getPaymentParams(this.data.orderId)
            .then(res => {
              wx.hideLoading();
              
              if (res.success) {
                // 获取到支付参数，调用微信支付
                const payParams = res.data;
                
                wx.requestPayment({
                  timeStamp: payParams.timeStamp,
                  nonceStr: payParams.nonceStr,
                  package: payParams.package,
                  signType: payParams.signType,
                  paySign: payParams.paySign,
                  success: (payRes) => {
                    // 支付成功，跳转到支付结果页面
                    wx.redirectTo({
                      url: `/pages/payment-result/payment-result?status=success&orderId=${this.data.orderId}&transactionId=${payParams.transactionId || ''}&amount=${amount.toFixed(2)}&method=微信支付&type=${this.data.orderData.orderType || 'order'}`
                    });
                  },
                  fail: (payErr) => {
                    // 支付失败或用户取消
                    if (payErr.errMsg !== 'requestPayment:fail cancel') {
                      // 非用户取消的失败
                      wx.redirectTo({
                        url: `/pages/payment-result/payment-result?status=fail&orderId=${this.data.orderId}&amount=${amount.toFixed(2)}&method=微信支付&reason=${encodeURIComponent('支付过程中出现错误')}&type=${this.data.orderData.orderType || 'order'}`
                      });
                    } else {
                      // 用户取消
                      wx.showToast({
                        title: '支付已取消',
                        icon: 'none'
                      });
                    }
                  }
                });
              } else {
                wx.showToast({
                  title: '获取支付参数失败',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              
              wx.showToast({
                title: '支付失败: ' + (err.message || '未知错误'),
                icon: 'none'
              });
            });
        }
      }
    });
  },
  
  /**
   * 前往评价
   */
  gotoReview() {
    wx.navigateTo({
      url: `/pages/review/review?orderId=${this.data.orderId}&type=${this.data.orderData.orderType}`
    });
  },

  // 加载支付方式
  async loadPaymentMethods() {
    try {
      const res = await paymentApi.getPaymentMethods();
      if (res.success) {
        this.setData({
          paymentMethods: res.data,
          selectedPaymentMethod: res.data[0] // 默认选择第一个支付方式
        });
      }
    } catch (error) {
      console.error('加载支付方式失败:', error);
    }
  },

  // 选择支付方式
  onPaymentMethodChange(e) {
    const methodId = e.detail.value;
    const selectedMethod = this.data.paymentMethods.find(m => m.id === methodId);
    this.setData({
      selectedPaymentMethod: selectedMethod
    });
  },

  // 处理支付
  async handlePayment() {
    try {
      const { orderId, orderData } = this.data;
      const { selectedPaymentMethod } = this.data;
      
      const res = await paymentApi.createPayment(
        orderId, 
        orderData.totalAmount, 
        selectedPaymentMethod.id
      );
      
      if (res.success) {
        // 发送支付成功通知
        await notificationApi.sendPaymentSuccessNotification(
          orderId,
          orderData.totalAmount,
          selectedPaymentMethod.id
        );
        
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        });
        
        // 刷新订单状态
        this.loadOrderDetail();
      } else {
        wx.showToast({
          title: res.message || '支付失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('支付失败:', error);
      wx.showToast({
        title: '支付失败',
        icon: 'error'
      });
    }
  },

  // 加载物流状态
  async loadLogisticsStatus() {
    try {
      const { orderId } = this.data;
      const res = await logisticsApi.getLogisticsStatus(orderId);
      if (res.success) {
        this.setData({
          logisticsStatus: res.data
        });
      }
    } catch (error) {
      console.error('加载物流状态失败:', error);
    }
  },

  // 更新快递单号
  async updateTrackingNumber() {
    try {
      const { orderId, trackingNumber, carrier } = this.data;
      const res = await logisticsApi.updateTrackingNumber(orderId, trackingNumber, carrier);
      if (res.success) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
        this.loadLogisticsStatus();
      }
    } catch (error) {
      console.error('更新快递单号失败:', error);
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    }
  },
  
  // 跳转到物流跟踪页面
  goToLogisticsTracking() {
    const { orderId } = this.data;
    wx.navigateTo({
      url: `/pages/logistics-tracking/logistics-tracking?orderId=${orderId}`
    });
  },

  // 加载通知列表
  async loadNotifications() {
    try {
      const { userId } = this.data;
      const res = await notificationApi.getUserNotifications(userId);
      if (res.success) {
        this.setData({
          notifications: res.data.notifications
        });
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    }
  },

  // 标记通知为已读
  async markNotificationAsRead(notificationId) {
    try {
      const res = await notificationApi.markNotificationAsRead(notificationId);
      if (res.success) {
        this.loadNotifications();
      }
    } catch (error) {
      console.error('标记通知已读失败:', error);
    }
  }
}) 