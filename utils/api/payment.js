const { paymentsCollection } = require('../db');
const { getExchangeRate } = require('./exchange');

/**
 * 欧元转人民币
 * @param {number} euroAmount - 欧元金额
 * @returns {number} 人民币金额
 */
const convertEuroToCNY = async (euroAmount) => {
  try {
    const rate = await getExchangeRate();
    return euroAmount * rate;
  } catch (error) {
    console.error('货币转换失败:', error);
    throw error;
  }
};

/**
 * 获取可用支付方式
 * @returns {Promise} 支付方式列表
 */
const getPaymentMethods = async () => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'getPaymentMethods'
      }
    });

    if (res.result.success) {
      return {
        success: true,
        data: res.result.data
      };
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('获取支付方式失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 创建支付订单
 * @param {string} orderId - 订单ID
 * @param {number} amount - 金额
 * @param {string} paymentMethod - 支付方式
 * @returns {Promise} 支付结果
 */
const createPayment = async (orderId, amount, paymentMethod) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'createPayment',
        orderId,
        amount,
        paymentMethod
      }
    });

    if (res.result.success) {
      return {
        success: true,
        data: res.result.data
      };
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('创建支付失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 获取支付状态
 * @param {string} paymentId - 支付ID
 * @returns {Promise} 支付状态
 */
const getPaymentStatus = async (paymentId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'getPaymentStatus',
        paymentId
      }
    });

    if (res.result.success) {
      return {
        success: true,
        data: res.result.data
      };
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('获取支付状态失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 处理支付结果
 * @param {string} paymentId - 支付ID
 * @param {string} status - 支付状态
 * @returns {Promise} 处理结果
 */
const handlePaymentResult = async (paymentId, status) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'handlePaymentResult',
        paymentId,
        status
      }
    });

    if (res.result.success) {
      return {
        success: true,
        data: res.result.data
      };
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('处理支付结果失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 申请退款
 * @param {Object} refundData - 退款数据
 * @returns {Promise} 处理结果
 */
const applyRefund = async (refundData) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'applyRefund',
        ...refundData
      }
    });

    if (res.result.success) {
      return {
        success: true,
        data: res.result.data
      };
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('申请退款失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 获取退款状态
 * @param {string} refundId - 退款ID
 * @returns {Promise} 退款状态
 */
const getRefundStatus = async (refundId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'getRefundStatus',
        refundId
      }
    });

    if (res.result.success) {
      return {
        success: true,
        data: res.result.data
      };
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('获取退款状态失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 获取交易详情
 * @param {string} transactionId - 交易ID
 * @returns {Promise} 交易详情
 */
const getTransactionDetail = async (transactionId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'getTransactionDetail',
        transactionId
      }
    });

    if (res.result.success) {
      return {
        success: true,
        data: res.result.data
      };
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('获取交易详情失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  convertEuroToCNY,
  getPaymentMethods,
  createPayment,
  getPaymentStatus,
  handlePaymentResult,
  applyRefund,
  getRefundStatus,
  getTransactionDetail
}; 