// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const MAX_LIMIT = 100

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
    type = 'received', // received - 收到的评价, created - 发出的评价
    pageSize = 10,
    lastId = null
  } = event
  
  try {
    // 根据类型构建查询条件
    let query = {}
    
    if (type === 'received') {
      // 查询收到的评价
      // 需要先获取用户ID
      const userRes = await db.collection('users')
        .where({
          openid: openid
        })
        .get()
      
      if (!userRes.data || userRes.data.length === 0) {
        return {
          code: 404,
          message: '用户不存在'
        }
      }
      
      const userId = userRes.data[0]._id
      
      query = {
        targetUserId: userId,
        status: 'active'
      }
    } else if (type === 'created') {
      // 查询发出的评价
      query = {
        creatorOpenid: openid,
        status: 'active'
      }
    } else {
      return {
        code: 400,
        message: '类型参数错误'
      }
    }
    
    // 处理分页
    let reviewsQuery = db.collection('reviews')
      .where(query)
      .orderBy('createTime', 'desc')
    
    // 如果有lastId，添加条件
    if (lastId) {
      // 获取lastId对应的评价
      const lastReviewRes = await db.collection('reviews').doc(lastId).get()
      
      if (!lastReviewRes.data) {
        return {
          code: 404,
          message: '指定的lastId评价不存在'
        }
      }
      
      const lastReview = lastReviewRes.data
      
      // 查询创建时间小于lastId评价的评价
      reviewsQuery = reviewsQuery.where({
        createTime: _.lt(lastReview.createTime)
      })
    }
    
    // 执行查询
    const reviewsRes = await reviewsQuery.limit(pageSize).get()
    
    // 检查是否有更多数据
    let hasMore = false
    
    if (reviewsRes.data.length === pageSize) {
      // 再查询一条，看是否还有更多
      const nextReview = await reviewsQuery
        .skip(pageSize)
        .limit(1)
        .get()
      
      hasMore = nextReview.data && nextReview.data.length > 0
    }
    
    // 获取关联的用户信息
    const reviews = reviewsRes.data
    const userIds = new Set()
    
    // 收集所有关联的用户ID
    reviews.forEach(review => {
      if (type === 'received') {
        // 收到的评价，需要获取创建者信息
        userIds.add(review.creatorId)
      } else {
        // 发出的评价，需要获取目标用户信息
        userIds.add(review.targetUserId)
      }
    })
    
    // 批量获取用户信息
    const userInfoMap = {}
    
    if (userIds.size > 0) {
      const userIdsArray = Array.from(userIds)
      
      // 分批获取用户信息，避免超过查询限制
      const batchCount = Math.ceil(userIdsArray.length / MAX_LIMIT)
      
      for (let i = 0; i < batchCount; i++) {
        const start = i * MAX_LIMIT
        const end = Math.min((i + 1) * MAX_LIMIT, userIdsArray.length)
        const batchIds = userIdsArray.slice(start, end)
        
        const usersRes = await db.collection('users')
          .where({
            _id: _.in(batchIds)
          })
          .field({
            _id: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
            reviewCount: true
          })
          .get()
        
        // 将用户信息添加到映射
        usersRes.data.forEach(user => {
          userInfoMap[user._id] = {
            id: user._id,
            name: user.nickname,
            avatar: user.avatarUrl,
            rating: user.rating,
            reviewCount: user.reviewCount
          }
        })
      }
    }
    
    // 整理返回数据
    const formattedReviews = reviews.map(review => {
      const userId = type === 'received' ? review.creatorId : review.targetUserId
      const userInfo = userInfoMap[userId] || {
        id: userId,
        name: '未知用户',
        avatar: '/images/default-avatar.png'
      }
      
      return {
        id: review._id,
        orderId: review.orderId,
        content: review.content,
        rating: review.rating,
        tags: review.tags,
        createTime: review.createTime,
        user: userInfo
      }
    })
    
    return {
      code: 200,
      message: '获取评价成功',
      data: {
        reviews: formattedReviews,
        hasMore,
        lastId: formattedReviews.length > 0 ? formattedReviews[formattedReviews.length - 1].id : null
      }
    }
  } catch (err) {
    console.error('获取评价失败', err)
    return {
      code: 500,
      message: '获取评价失败，请稍后重试'
    }
  }
} 