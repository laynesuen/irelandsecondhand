const { paymentsCollection } = require('../db');
const { getExchangeRate } = require('./exchange');
const cloud = require('wx-server-sdk');

/**
 * 获取实时汇率
 * @returns {Promise} 返回欧元兑人民币汇率
 */
function getExchangeRate() {
  // 实际项目中应该调用汇率API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          rate: 7.85, // 模拟汇率
          updateTime: new Date().toISOString()
        }
      });
    }, 500);
  });
}

/**
 * 欧元转人民币
 * @param {Number} euroAmount 欧元金额
 * @returns {Promise} 返回转换后的人民币金额
 */
function convertEuroToCNY(euroAmount) {
  return getExchangeRate().then(res => {
    if (res.success) {
      return {
        success: true,
        data: {
          cnyAmount: (euroAmount * res.data.rate).toFixed(2),
          rate: res.data.rate
        }
      };
    }
    return {
      success: false,
      message: '获取汇率失败'
    };
  });
}

/**
 * 获取支付方式列表
 * @returns {Promise} 返回可用的支付方式
 */
function getPaymentMethods() {
  return new Promise((resolve) => {
    resolve({
      success: true,
      data: [
        {
          id: 'apple_pay',
          name: 'Apple Pay',
          currency: 'EUR',
          priority: 1,
          enabled: true
        },
        {
          id: 'wechat_pay',
          name: '微信支付',
          currency: 'CNY',
          priority: 2,
          enabled: true
        },
        {
          id: 'card_pay',
          name: '银行卡支付',
          currency: 'EUR',
          priority: 3,
          enabled: true
        }
      ]
    });
  });
}

/**
 * 创建支付订单
 * @param {String} orderId 订单ID
 * @param {Number} amount 支付金额（欧元）
 * @param {String} paymentMethod 支付方式
 * @returns {Promise} 返回支付参数
 */
export const createPayment = async (orderId, amount, currency, paymentMethod) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        orderId,
        amount,
        currency,
        paymentMethod
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('创建支付订单失败:', error);
    throw error;
  }
};

/**
 * 获取支付状态
 * @param {String} orderId 订单ID
 * @returns {Promise} 返回支付状态
 */
export const getPaymentStatus = async (orderId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        orderId
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('获取支付状态失败:', error);
    throw error;
  }
};

/**
 * 获取支付方式列表
 */
export const getPaymentMethods = async () => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'getPaymentMethods'
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('获取支付方式失败:', error);
    throw error;
  }
};

/**
 * 处理支付结果
 */
export const handlePaymentResult = async (orderId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'handlePaymentResult',
        orderId
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('处理支付结果失败:', error);
    throw error;
  }
};

module.exports = {
  getExchangeRate,
  convertEuroToCNY,
  getPaymentMethods,
  createPayment,
  getPaymentStatus,
  handlePaymentResult
}; 