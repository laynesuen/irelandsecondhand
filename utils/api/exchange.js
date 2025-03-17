const cloud = require('wx-server-sdk');

/**
 * 获取实时汇率
 * @returns {Promise} 返回欧元兑人民币汇率
 */
export const getExchangeRate = async () => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'exchange',
      data: {
        action: 'getExchangeRate'
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('获取汇率失败:', error);
    throw error;
  }
};

/**
 * 货币转换
 */
export const convertCurrency = async (amount, from, to) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'exchange',
      data: {
        action: 'convertCurrency',
        amount,
        from,
        to
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('货币转换失败:', error);
    throw error;
  }
};

/**
 * 批量货币转换
 */
export const batchConvertCurrency = async (amounts, from, to) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'exchange',
      data: {
        action: 'batchConvertCurrency',
        amounts,
        from,
        to
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('批量货币转换失败:', error);
    throw error;
  }
};

module.exports = {
  getExchangeRate,
  convertCurrency,
  batchConvertCurrency
}; 