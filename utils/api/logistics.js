const { logisticsCollection } = require('../db');
const cloud = require('wx-server-sdk');

/**
 * 查询物流信息
 */
export const queryLogistics = async (trackingNumber, carrier) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'logistics',
      data: {
        trackingNumber,
        carrier
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('查询物流信息失败:', error);
    throw error;
  }
};

/**
 * 更新物流信息
 */
export const updateLogistics = async (orderId, trackingNumber, carrier) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'logistics',
      data: {
        orderId,
        trackingNumber,
        carrier
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('更新物流信息失败:', error);
    throw error;
  }
};

/**
 * 获取物流状态
 */
export const getLogisticsStatus = async (orderId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'logistics',
      data: {
        action: 'getLogisticsStatus',
        orderId
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('获取物流状态失败:', error);
    throw error;
  }
};

/**
 * 同步物流信息
 */
export const syncLogistics = async (orderId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'logistics',
      data: {
        action: 'syncLogistics',
        orderId
      }
    });

    if (res.result.success) {
      return res.result.data;
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('同步物流信息失败:', error);
    throw error;
  }
};

/**
 * 获取物流轨迹
 * @param {String} orderId 订单ID
 * @returns {Promise} 返回物流轨迹
 */
async function getLogisticsTrack(orderId) {
  try {
    const logistics = await logisticsCollection.where({
      orderId
    }).orderBy('updateTime', 'desc').limit(1).get();

    if (logistics.data.length > 0) {
      return {
        success: true,
        data: {
          orderId,
          tracks: logistics.data[0].trackingHistory
        }
      };
    }

    return {
      success: false,
      message: '未找到物流轨迹'
    };
  } catch (error) {
    console.error('获取物流轨迹失败:', error);
    return {
      success: false,
      message: error.message || '获取物流轨迹失败'
    };
  }
}

module.exports = {
  queryLogistics,
  updateLogistics,
  getLogisticsStatus,
  syncLogistics,
  getLogisticsTrack
}; 