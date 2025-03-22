const paymentApi = require('../../utils/api/payment');
const orderApi = require('../../utils/api/order');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    transactionId: '', // 交易ID
    orderId: 'ORD12345678', // 订单ID
    orderAmount: '180.00', // 订单金额
    orderTypeName: '行程捎带', // 订单类型名称
    orderType: 'trip', // 订单类型: trip, delivery
    payTime: '2023-03-15 14:30:25', // 支付时间
    
    // 退款类型选择器
    refundTypes: ['全额退款', '部分退款'],
    refundTypeIndex: 0,
    
    // 退款原因选择器
    refundReasons: ['请选择退款原因', '行程取消', '无法提供服务', '质量问题', '商品信息与描述不符', '未按约定时间交付', '双方协商一致', '其他原因'],
    refundReasonIndex: 0,
    
    refundAmount: '', // 退款金额
    description: '', // 退款说明
    uploadedImages: [], // 上传的图片
    
    canSubmit: false, // 是否可以提交
    isSubmitting: false // 是否正在提交
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.transactionId) {
      this.setData({
        transactionId: options.transactionId
      });
      this.loadTransactionInfo(options.transactionId);
    } else if (options.orderId) {
      this.setData({
        orderId: options.orderId
      });
      this.loadOrderInfo(options.orderId);
    }
  },

  /**
   * 加载交易信息
   */
  async loadTransactionInfo(transactionId) {
    try {
      wx.showLoading({
        title: '加载中'
      });
      
      // 模拟API调用
      // const res = await paymentApi.getTransactionDetail(transactionId);
      
      // 模拟数据
      setTimeout(() => {
        this.setData({
          orderId: 'ORDER123456',
          orderAmount: '180.00',
          orderTypeName: '行程捎带',
          orderType: 'trip',
          payTime: '2023-03-15 14:30:25',
          refundAmount: '180.00'
        });
        
        this.checkCanSubmit();
        wx.hideLoading();
      }, 1000);
    } catch (error) {
      console.error('加载交易信息失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 加载订单信息
   */
  async loadOrderInfo(orderId) {
    try {
      wx.showLoading({
        title: '加载中'
      });
      
      // 模拟API调用
      // const res = await orderApi.getOrderDetail(orderId);
      
      // 模拟数据
      setTimeout(() => {
        this.setData({
          orderAmount: '180.00',
          orderTypeName: '行程捎带',
          orderType: 'trip',
          payTime: '2023-03-15 14:30:25',
          refundAmount: '180.00'
        });
        
        this.checkCanSubmit();
        wx.hideLoading();
      }, 1000);
    } catch (error) {
      console.error('加载订单信息失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 退款类型改变
   */
  onRefundTypeChange(e) {
    const index = e.detail.value;
    
    // 如果选择全额退款，自动填入订单金额
    if (index == 0) {
      this.setData({
        refundTypeIndex: index,
        refundAmount: this.data.orderAmount
      });
    } else {
      this.setData({
        refundTypeIndex: index,
        refundAmount: ''
      });
    }
    
    this.checkCanSubmit();
  },

  /**
   * 退款金额输入
   */
  onRefundAmountInput(e) {
    // 限制只能输入数字和小数点，最多两位小数
    let value = e.detail.value;
    
    // 如果输入的不是数字和小数点，直接返回上一次的值
    if (!/^[0-9.]*$/.test(value)) {
      return this.data.refundAmount;
    }
    
    // 如果输入的值大于订单金额，直接返回订单金额
    const orderAmount = parseFloat(this.data.orderAmount);
    if (parseFloat(value) > orderAmount) {
      value = this.data.orderAmount;
    }
    
    this.setData({
      refundAmount: value
    });
    
    this.checkCanSubmit();
    return value;
  },

  /**
   * 设置全额退款
   */
  setFullRefund() {
    this.setData({
      refundAmount: this.data.orderAmount
    });
    
    this.checkCanSubmit();
  },

  /**
   * 退款原因改变
   */
  onRefundReasonChange(e) {
    this.setData({
      refundReasonIndex: e.detail.value
    });
    
    this.checkCanSubmit();
  },

  /**
   * 退款说明输入
   */
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    });
  },

  /**
   * 选择图片
   */
  chooseImage() {
    const { uploadedImages } = this.data;
    const remainCount = 3 - uploadedImages.length;
    
    if (remainCount <= 0) {
      return;
    }
    
    wx.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 将选择的图片添加到已上传图片数组
        this.setData({
          uploadedImages: [...uploadedImages, ...res.tempFilePaths]
        });
      }
    });
  },

  /**
   * 删除图片
   */
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const { uploadedImages } = this.data;
    
    // 从数组中移除该图片
    uploadedImages.splice(index, 1);
    
    this.setData({
      uploadedImages
    });
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const { uploadedImages } = this.data;
    
    wx.previewImage({
      current: uploadedImages[index],
      urls: uploadedImages
    });
  },

  /**
   * 检查是否可以提交
   */
  checkCanSubmit() {
    const { refundTypeIndex, refundAmount, refundReasonIndex } = this.data;
    
    // 验证必填项
    let canSubmit = true;
    
    // 验证退款金额
    if (refundAmount === '' || parseFloat(refundAmount) <= 0) {
      canSubmit = false;
    }
    
    // 验证退款原因
    if (refundReasonIndex == 0) {
      canSubmit = false;
    }
    
    this.setData({
      canSubmit
    });
  },

  /**
   * 提交退款申请
   */
  async submitRefund() {
    const {
      isSubmitting,
      canSubmit,
      transactionId,
      orderId,
      refundTypeIndex,
      refundAmount,
      refundReasonIndex,
      refundReasons,
      description,
      uploadedImages
    } = this.data;
    
    // 防止重复提交
    if (isSubmitting || !canSubmit) {
      return;
    }
    
    // 二次确认
    wx.showModal({
      title: '确认提交',
      content: `确定要申请退款￥${refundAmount}吗？提交后将不能修改。`,
      confirmText: '确认提交',
      confirmColor: '#07c160',
      success: async (res) => {
        if (res.confirm) {
          this.setData({
            isSubmitting: true
          });
          
          wx.showLoading({
            title: '提交中'
          });
          
          try {
            // 上传退款凭证图片
            const uploadedFileIDs = [];
            
            // 如果有图片需要上传，先上传图片
            if (uploadedImages.length > 0) {
              for (let i = 0; i < uploadedImages.length; i++) {
                const filePath = uploadedImages[i];
                
                // 模拟上传过程
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // 实际项目中应该调用云函数上传图片
                // const res = await wx.cloud.uploadFile({
                //   cloudPath: `refund/${Date.now()}_${i}.jpg`,
                //   filePath: filePath
                // });
                
                uploadedFileIDs.push(`cloud://refund/${Date.now()}_${i}.jpg`);
              }
            }
            
            // 提交退款申请
            // 模拟API调用
            // const res = await paymentApi.applyRefund({
            //   transactionId,
            //   orderId,
            //   refundType: refundTypeIndex === 0 ? 'full' : 'partial',
            //   refundAmount,
            //   refundReason: refundReasons[refundReasonIndex],
            //   description,
            //   images: uploadedFileIDs
            // });
            
            // 模拟提交成功
            setTimeout(() => {
              wx.hideLoading();
              
              wx.showToast({
                title: '申请提交成功',
                icon: 'success',
                duration: 2000
              });
              
              // 2秒后返回上一页
              setTimeout(() => {
                wx.navigateBack();
              }, 2000);
            }, 1500);
          } catch (error) {
            console.error('提交退款申请失败:', error);
            wx.hideLoading();
            
            wx.showModal({
              title: '提交失败',
              content: error.message || '网络异常，请重试',
              showCancel: false
            });
            
            this.setData({
              isSubmitting: false
            });
          }
        }
      }
    });
  }
}); 