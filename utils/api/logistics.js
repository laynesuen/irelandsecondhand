const { logisticsCollection } = require('../db');

/**
 * 查询物流信息
 */
const queryLogistics = async (trackingNumber, carrier) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'logistics',
      data: {
        trackingNumber,
        carrier
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
    console.error('查询物流信息失败:', error);
    return {
      success: false,
      message: error.message || '查询物流失败'
    };
  }
};

/**
 * 更新物流信息
 */
const updateLogistics = async (orderId, trackingNumber, carrier) => {
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
      return {
        success: true,
        data: res.result.data
      };
    }
    throw new Error(res.result.message);
  } catch (error) {
    console.error('更新物流信息失败:', error);
    return {
      success: false,
      message: error.message || '更新物流失败'
    };
  }
};

/**
 * 获取物流状态
 */
const getLogisticsStatus = async (orderId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'logistics',
      data: {
        action: 'getLogisticsStatus',
        orderId
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
    console.error('获取物流状态失败:', error);
    return {
      success: false,
      message: error.message || '获取物流状态失败'
    };
  }
};

/**
 * 同步物流信息
 */
const syncLogistics = async (orderId) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'logistics',
      data: {
        action: 'syncLogistics',
        orderId
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
    console.error('同步物流信息失败:', error);
    return {
      success: false,
      message: error.message || '同步物流失败'
    };
  }
};

/**
 * 获取物流轨迹
 * @param {String} orderId 订单ID
 * @returns {Promise} 返回物流轨迹
 */
const getLogisticsTrack = async (orderId) => {
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
};

/**
 * 更新快递单号
 */
const updateTrackingNumber = async (orderId, trackingNumber, carrier) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'logistics',
      data: {
        action: 'updateTrackingNumber',
        orderId,
        trackingNumber,
        carrier
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
    console.error('更新快递单号失败:', error);
    return {
      success: false,
      message: error.message || '更新快递单号失败'
    };
  }
};

module.exports = {
  queryLogistics,
  updateLogistics,
  getLogisticsStatus,
  syncLogistics,
  getLogisticsTrack,
  updateTrackingNumber
}; 