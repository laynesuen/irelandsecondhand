// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const MAX_LIMIT = 10

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

  try {
    const { type, pageSize = MAX_LIMIT, lastId } = event
    let query = {}
    
    // 检查参数
    if (!['received', 'created'].includes(type)) {
      return {
        code: 400,
        message: '参数错误'
      }
    }

    // 构建查询条件
    if (type === 'received') {
      query = { targetUserId: openid }
    } else {
      query = { userId: openid }
    }

    // 处理分页
    let reviewsQuery = db.collection('reviews')
      .where(query)
      .orderBy('createTime', 'desc')
      .limit(pageSize + 1) // 多查一条用于判断是否还有更多数据
    
    if (lastId) {
      const lastReview = await db.collection('reviews').doc(lastId).get()
      if (lastReview.data) {
        reviewsQuery = reviewsQuery.where({
          createTime: _.lt(lastReview.data.createTime)
        })
      }
    }
    
    // 执行查询
    const reviewsRes = await reviewsQuery.get()
    let reviews = reviewsRes.data
    
    // 判断是否还有更多数据
    const hasMore = reviews.length > pageSize
    if (hasMore) {
      reviews = reviews.slice(0, pageSize)
    }
    
    // 如果没有数据，则直接返回
    if (reviews.length === 0) {
      return {
        code: 200,
        message: '获取成功',
        data: {
          reviews: [],
          hasMore: false,
          lastId: null
        }
      }
    }
    
    // 获取关联用户信息
    const userIds = Array.from(new Set(
      reviews.map(review => 
        type === 'received' ? review.userId : review.targetUserId
      )
    ))
    
    const usersRes = await db.collection('users')
      .where({
        _openid: _.in(userIds)
      })
      .get()
    
    const users = usersRes.data
    const userMap = {}
    users.forEach(user => {
      userMap[user._openid] = {
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        userId: user._openid
      }
    })
    
    // 组装数据
    const reviewsWithUserInfo = reviews.map(review => {
      let userId = type === 'received' ? review.userId : review.targetUserId
      return {
        reviewId: review._id,
        orderId: review.orderId,
        content: review.content,
        rating: review.rating,
        tags: review.tags || [],
        createTime: review.createTime,
        user: userMap[userId] || {
          nickName: '用户已删除',
          avatarUrl: '',
          userId: userId
        }
      }
    })
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        reviews: reviewsWithUserInfo,
        hasMore,
        lastId: hasMore ? reviews[reviews.length - 1]._id : null
      }
    }
  } catch (err) {
    console.error('[getReviews]', err)
    return {
      code: 500,
      message: '获取评价失败',
      error: err.message
    }
  }
} 