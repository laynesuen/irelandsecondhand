// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  if (!openid) {
    return {
      code: 401,
      message: '未登录'
    }
  }
  
  const { orderId, targetUserId, content, rating, tags } = event
  
  // 参数验证
  if (!orderId || !targetUserId || !content || !rating) {
    return {
      code: 400,
      message: '参数不完整'
    }
  }
  
  // 检查评分范围
  if (rating < 1 || rating > 5) {
    return {
      code: 400,
      message: '评分范围应为1-5'
    }
  }
  
  try {
    // 检查订单是否存在
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return {
        code: 404,
        message: '订单不存在'
      }
    }
    
    const order = orderRes.data
    
    // 验证订单是否属于当前用户
    if (order.buyerId !== openid && order.sellerId !== openid) {
      return {
        code: 403,
        message: '无权评价此订单'
      }
    }
    
    // 验证评价目标用户是否为订单相关方
    if (targetUserId !== order.buyerId && targetUserId !== order.sellerId) {
      return {
        code: 403,
        message: '无法评价非订单参与方'
      }
    }
    
    // 检查是否已评价
    const existingReview = await db.collection('reviews').where({
      orderId,
      userId: openid,
      targetUserId
    }).get()
    
    if (existingReview.data && existingReview.data.length > 0) {
      return {
        code: 400,
        message: '已提交过评价'
      }
    }
    
    // 创建评价
    const reviewData = {
      orderId,
      userId: openid,
      targetUserId,
      content,
      rating,
      tags: tags || [],
      createTime: db.serverDate()
    }
    
    const result = await db.collection('reviews').add({
      data: reviewData
    })
    
    // 更新订单评价状态
    let updateField = {}
    if (openid === order.buyerId) {
      updateField = { buyerReviewed: true }
    } else {
      updateField = { sellerReviewed: true }
    }
    
    await db.collection('orders').doc(orderId).update({
      data: updateField
    })
    
    // 计算用户新的平均评分
    const userReviews = await db.collection('reviews')
      .where({
        targetUserId
      })
      .get()
    
    if (userReviews.data && userReviews.data.length > 0) {
      const ratings = userReviews.data.map(review => review.rating)
      const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      
      // 更新用户的平均评分
      await db.collection('users').where({
        _openid: targetUserId
      }).update({
        data: {
          avgRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: userReviews.data.length
        }
      })
    }
    
    return {
      code: 200,
      message: '评价提交成功',
      data: {
        reviewId: result._id
      }
    }
  } catch (err) {
    console.error('[createReview]', err)
    return {
      code: 500,
      message: '评价提交失败',
      error: err.message
    }
  }
} 