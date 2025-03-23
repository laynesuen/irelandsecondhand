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
  
  // 获取参数
  const { 
    orderId, 
    targetUserId, 
    content, 
    rating,
    tags = []
  } = event
  
  // 校验参数
  if (!orderId) {
    return {
      code: 400,
      message: '缺少订单ID参数'
    }
  }
  
  if (!targetUserId) {
    return {
      code: 400,
      message: '缺少目标用户ID参数'
    }
  }
  
  if (!content) {
    return {
      code: 400,
      message: '评价内容不能为空'
    }
  }
  
  if (!rating || rating < 1 || rating > 5) {
    return {
      code: 400,
      message: '评分必须在1-5之间'
    }
  }
  
  try {
    // 获取订单信息，确认订单存在且用户有权对此订单进行评价
    const orderRes = await db.collection('orders').doc(orderId).get()
    
    if (!orderRes.data) {
      return {
        code: 404,
        message: '订单不存在'
      }
    }
    
    const order = orderRes.data
    
    // 确认用户为此订单的买家或卖家
    if (order.buyerOpenid !== openid && order.sellerOpenid !== openid) {
      return {
        code: 403,
        message: '无权对此订单进行评价'
      }
    }
    
    // 确认订单已完成
    if (order.status !== 'completed') {
      return {
        code: 400,
        message: '只能对已完成的订单进行评价'
      }
    }
    
    // 确认目标用户是此订单的参与者
    if (targetUserId !== order.buyerId && targetUserId !== order.sellerId) {
      return {
        code: 400,
        message: '目标用户不是此订单的参与者'
      }
    }
    
    // 确认用户没有对此订单进行过评价
    const existingReview = await db.collection('reviews')
      .where({
        orderId: orderId,
        creatorOpenid: openid
      })
      .get()
    
    if (existingReview.data && existingReview.data.length > 0) {
      return {
        code: 400,
        message: '已对此订单进行过评价'
      }
    }
    
    // 创建评价
    const reviewData = {
      orderId,
      targetUserId,
      content,
      rating,
      tags,
      creatorOpenid: openid,
      creatorId: order.buyerOpenid === openid ? order.buyerId : order.sellerId,
      createTime: db.serverDate(),
      status: 'active'
    }
    
    const reviewRes = await db.collection('reviews').add({
      data: reviewData
    })
    
    // 更新订单评价状态
    const updateField = order.buyerOpenid === openid 
      ? { buyerReviewed: true } 
      : { sellerReviewed: true }
    
    await db.collection('orders').doc(orderId).update({
      data: updateField
    })
    
    // 更新用户的评分
    // 1. 获取目标用户的所有评价
    const userReviews = await db.collection('reviews')
      .where({
        targetUserId: targetUserId,
        status: 'active'
      })
      .get()
    
    if (userReviews.data && userReviews.data.length > 0) {
      // 2. 计算平均评分
      const totalRating = userReviews.data.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = (totalRating / userReviews.data.length).toFixed(1)
      
      // 3. 更新用户评分
      await db.collection('users').doc(targetUserId).update({
        data: {
          rating: averageRating,
          reviewCount: userReviews.data.length
        }
      })
    }
    
    return {
      code: 200,
      message: '评价成功',
      data: {
        reviewId: reviewRes._id
      }
    }
    
  } catch (err) {
    console.error('创建评价失败', err)
    return {
      code: 500,
      message: '评价失败，请稍后重试'
    }
  }
} 