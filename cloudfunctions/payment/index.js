const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 创建支付订单
 */
exports.createPayment = async (event, context) => {
  const { orderId, amount, currency, paymentMethod } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    // 验证订单
    const order = await db.collection('orders')
      .where({
        _id: orderId,
        userId: OPENID
      })
      .get();

    if (!order.data.length) {
      return {
        success: false,
        message: '订单不存在或无权操作'
      };
    }

    // 根据支付方式处理金额
    let finalAmount = amount;
    let finalCurrency = currency;

    if (paymentMethod === 'wechat_pay' && currency === 'EUR') {
      // 获取汇率并转换为人民币
      const rateRes = await cloud.callFunction({
        name: 'exchange',
        data: {
          action: 'convertCurrency',
          amount,
          from: 'EUR',
          to: 'CNY'
        }
      });

      if (!rateRes.result.success) {
        return {
          success: false,
          message: '汇率转换失败'
        };
      }

      finalAmount = rateRes.result.data.convertedAmount;
      finalCurrency = 'CNY';
    }

    // 调用微信支付统一下单接口
    const payRes = await cloud.cloudPay.unifiedOrder({
      body: `订单${orderId}`,
      outTradeNo: orderId,
      spbillCreateIp: '127.0.0.1',
      subMchId: process.env.MCH_ID,
      totalFee: Math.round(finalAmount * 100),
      envId: cloud.DYNAMIC_CURRENT_ENV,
      functionName: 'paymentCallback',
      nonceStr: Math.random().toString(36).substr(2),
      tradeType: 'JSAPI'
    });

    // 保存支付记录
    await db.collection('payments').add({
      data: {
        orderId,
        amount: finalAmount,
        currency: finalCurrency,
        paymentMethod,
        status: 'pending',
        createTime: db.serverDate(),
        paymentParams: payRes
      }
    });

    return {
      success: true,
      data: payRes
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 获取支付状态
 */
exports.getPaymentStatus = async (event, context) => {
  const { orderId } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    const payment = await db.collection('payments')
      .where({
        orderId
      })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get();

    if (!payment.data.length) {
      return {
        success: false,
        message: '未找到支付记录'
      };
    }

    return {
      success: true,
      data: payment.data[0]
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 获取支付方式列表
 */
exports.getPaymentMethods = async (event, context) => {
  return {
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
  };
};

/**
 * 支付回调处理
 */
exports.paymentCallback = async (event, context) => {
  const { outTradeNo, resultCode, transactionId, sign, nonceStr, timestamp } = event;
  const wxContext = cloud.getWXContext();

  try {
    // 1. 验证签名
    const isValidSign = await validateSign(event);
    if (!isValidSign) {
      console.error('支付回调签名验证失败', {
        outTradeNo,
        resultCode,
        transactionId
      });
      return {
        success: false,
        message: '签名验证失败'
      };
    }

    // 2. 检查是否重复回调
    const existingPayment = await db.collection('payments')
      .where({
        orderId: outTradeNo,
        transactionId: transactionId
      })
      .get();

    if (existingPayment.data.length > 0) {
      console.log('重复的支付回调，已处理', {
        outTradeNo,
        transactionId
      });
      return {
        success: true,
        message: '重复回调已处理'
      };
    }

    // 3. 开启事务处理
    const transaction = await db.startTransaction();
    try {
      // 3.1 更新支付记录状态
      await transaction.collection('payments')
        .where({
          orderId: outTradeNo
        })
        .update({
          data: {
            status: resultCode === 'SUCCESS' ? 'success' : 'failed',
            transactionId,
            payTime: db.serverDate(),
            callbackTime: db.serverDate(),
            callbackData: event
          }
        });

      if (resultCode === 'SUCCESS') {
        // 3.2 更新订单状态
        await transaction.collection('orders')
          .doc(outTradeNo)
          .update({
            data: {
              status: 'paid',
              payTime: db.serverDate(),
              paymentMethod: 'wechat_pay',
              transactionId
            }
          });

        // 3.3 发送支付成功通知
        await cloud.callFunction({
          name: 'messageNotify',
          data: {
            action: 'sendOrderStatusNotification',
            orderId: outTradeNo,
            status: 'paid',
            userId: wxContext.OPENID
          }
        });

        // 3.4 记录支付日志
        await transaction.collection('payment_logs').add({
          data: {
            orderId: outTradeNo,
            transactionId,
            status: 'success',
            amount: event.totalFee / 100,
            currency: 'CNY',
            paymentMethod: 'wechat_pay',
            callbackTime: db.serverDate(),
            callbackData: event
          }
        });
      }

      // 4. 提交事务
      await transaction.commit();

      console.log('支付回调处理成功', {
        outTradeNo,
        resultCode,
        transactionId
      });

      return {
        success: true,
        message: '支付回调处理成功'
      };
    } catch (error) {
      // 5. 回滚事务
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    // 6. 记录错误日志
    console.error('支付回调处理失败', {
      error: error.message,
      outTradeNo,
      resultCode,
      transactionId
    });

    // 7. 发送错误通知
    await cloud.callFunction({
      name: 'messageNotify',
      data: {
        action: 'sendSystemNotification',
        title: '支付处理异常',
        content: `订单 ${outTradeNo} 支付处理异常，请及时处理`,
        priority: 'high',
        userId: wxContext.OPENID
      }
    });

    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 验证支付回调签名
 */
async function validateSign(event) {
  try {
    const { sign, nonceStr, timestamp } = event;
    // 1. 验证时间戳（5分钟内有效）
    const now = Date.now();
    const callbackTime = parseInt(timestamp) * 1000;
    if (Math.abs(now - callbackTime) > 5 * 60 * 1000) {
      return false;
    }

    // 2. 验证签名
    const signData = {
      appid: process.env.APPID,
      mch_id: process.env.MCH_ID,
      nonce_str: nonceStr,
      timestamp: timestamp,
      // 其他需要验证的字段...
    };

    // 3. 按照微信支付签名规则生成签名
    const generatedSign = generateSign(signData);
    
    return generatedSign === sign;
  } catch (error) {
    console.error('签名验证失败', error);
    return false;
  }
}

/**
 * 生成签名
 */
function generateSign(data) {
  // 1. 按字典序排序
  const sortedKeys = Object.keys(data).sort();
  
  // 2. 拼接字符串
  let signStr = '';
  sortedKeys.forEach(key => {
    if (data[key] !== undefined && data[key] !== '') {
      signStr += `${key}=${data[key]}&`;
    }
  });
  
  // 3. 加入API密钥
  signStr += `key=${process.env.API_KEY}`;
  
  // 4. MD5加密
  const crypto = require('crypto');
  return crypto.createHash('md5')
    .update(signStr)
    .digest('hex')
    .toUpperCase();
} 