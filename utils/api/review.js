const { request } = require('../request')

/**
 * 提交评价
 * @param {Object} params - 评价参数
 * @param {string} params.orderId - 订单ID
 * @param {string} params.targetUserId - 目标用户ID
 * @param {number} params.rating - 评分（1-5）
 * @param {string} params.content - 评价内容
 * @param {Array<string>} params.tags - 评价标签
 * @returns {Promise} - 返回评价提交结果
 */
async function submitReview(params) {
  try {
    const { orderId, targetUserId, rating, content, tags } = params
    
    // 参数校验
    if (!orderId) {
      throw new Error('缺少订单ID参数')
    }
    
    if (!targetUserId) {
      throw new Error('缺少目标用户ID参数')
    }
    
    if (!content) {
      throw new Error('评价内容不能为空')
    }
    
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('评分必须在1-5之间')
    }
    
    const result = await request({
      name: 'createReview',
      data: {
        orderId,
        targetUserId,
        rating,
        content,
        tags: tags || []
      }
    })
    
    if (result.code !== 200) {
      throw new Error(result.message || '提交评价失败')
    }
    
    return result.data
  } catch (error) {
    console.error('提交评价失败:', error)
    throw error
  }
}

/**
 * 获取评价列表
 * @param {Object} params - 查询参数
 * @param {string} params.type - 评价类型: received-收到的评价, created-发出的评价
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.lastId - 上一页最后一条评价的ID
 * @returns {Promise} - 返回评价列表结果
 */
async function getReviews(params) {
  try {
    const { type = 'received', pageSize = 10, lastId } = params
    
    if (!['received', 'created'].includes(type)) {
      throw new Error('评价类型参数错误')
    }
    
    const result = await request({
      name: 'getReviews',
      data: {
        type,
        pageSize,
        lastId
      }
    })
    
    if (result.code !== 200) {
      throw new Error(result.message || '获取评价列表失败')
    }
    
    return result.data
  } catch (error) {
    console.error('获取评价列表失败:', error)
    throw error
  }
}

/**
 * 获取订单评价
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 返回订单评价结果
 */
async function getOrderReview(orderId) {
  try {
    if (!orderId) {
      throw new Error('缺少订单ID参数')
    }
    
    const result = await request({
      name: 'getReviews',
      data: {
        orderId
      }
    })
    
    if (result.code !== 200) {
      throw new Error(result.message || '获取订单评价失败')
    }
    
    return result.data
  } catch (error) {
    console.error('获取订单评价失败:', error)
    throw error
  }
}

module.exports = {
  submitReview,
  getReviews,
  getOrderReview
} 