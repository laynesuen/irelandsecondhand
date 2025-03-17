const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 获取实时汇率
 */
exports.getExchangeRate = async (event, context) => {
  try {
    // 从缓存中获取汇率
    const cache = await db.collection('exchange_rates')
      .where({
        from: 'EUR',
        to: 'CNY'
      })
      .orderBy('updateTime', 'desc')
      .limit(1)
      .get();

    // 如果缓存存在且未过期（1小时内），直接返回
    if (cache.data.length > 0) {
      const rate = cache.data[0];
      const now = new Date();
      const updateTime = rate.updateTime;
      const hoursDiff = (now - updateTime) / (1000 * 60 * 60);
      
      if (hoursDiff < 1) {
        return {
          success: true,
          data: rate
        };
      }
    }

    // 调用外部汇率API
    const res = await cloud.callContainer({
      path: '/api/exchange/rate',
      method: 'GET',
      data: {
        from: 'EUR',
        to: 'CNY'
      },
      header: {
        'X-WX-SERVICE': 'exchange-service',
        'content-type': 'application/json'
      }
    });

    if (res.data.success) {
      // 保存到缓存
      await db.collection('exchange_rates').add({
        data: {
          from: 'EUR',
          to: 'CNY',
          rate: res.data.rate,
          updateTime: db.serverDate()
        }
      });

      return {
        success: true,
        data: {
          from: 'EUR',
          to: 'CNY',
          rate: res.data.rate,
          updateTime: new Date()
        }
      };
    }

    return {
      success: false,
      message: res.data.message || '获取汇率失败'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 货币转换
 */
exports.convertCurrency = async (event, context) => {
  const { amount, from, to } = event;

  try {
    // 获取汇率
    const rateRes = await exports.getExchangeRate();
    
    if (!rateRes.success) {
      return rateRes;
    }

    const rate = rateRes.data.rate;
    const convertedAmount = amount * rate;

    return {
      success: true,
      data: {
        from,
        to,
        amount,
        convertedAmount,
        rate,
        updateTime: new Date()
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 批量货币转换
 */
exports.batchConvertCurrency = async (event, context) => {
  const { amounts, from, to } = event;

  try {
    // 获取汇率
    const rateRes = await exports.getExchangeRate();
    
    if (!rateRes.success) {
      return rateRes;
    }

    const rate = rateRes.data.rate;
    const convertedAmounts = amounts.map(amount => ({
      original: amount,
      converted: amount * rate
    }));

    return {
      success: true,
      data: {
        from,
        to,
        amounts: convertedAmounts,
        rate,
        updateTime: new Date()
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}; 