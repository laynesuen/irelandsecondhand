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
  
  const { orderId } = event
  
  if (!orderId) {
    return {
      code: 400,
      message: '订单ID不能为空'
    }
  }
  
  try {
    // 获取订单详情
    const orderRes = await db.collection('orders').doc(orderId).get()
    
    if (!orderRes.data) {
      return {
        code: 404,
        message: '订单不存在'
      }
    }

    const order = orderRes.data

    // 检查用户权限（只有买家或卖家可以查看）
    if (order.buyerId !== openid && order.sellerId !== openid) {
      return {
        code: 403,
        message: '无权查看此订单'
      }
    }

    // 获取商品信息
    let productInfo = null
    if (order.productId) {
      const productRes = await db.collection('products').doc(order.productId).get()
      if (productRes.data) {
        productInfo = {
          _id: productRes.data._id,
          title: productRes.data.title,
          price: productRes.data.price,
          coverImage: productRes.data.images && productRes.data.images.length > 0 
            ? productRes.data.images[0] 
            : '',
          category: productRes.data.category
        }
      }
    }

    // 获取用户信息（另一方）
    const targetId = order.buyerId === openid ? order.sellerId : order.buyerId
    const userRes = await db.collection('users').where({
      _openid: targetId
    }).get()

    let targetUserInfo = null
    if (userRes.data && userRes.data.length > 0) {
      const userData = userRes.data[0]
      targetUserInfo = {
        userId: userData._openid,
        nickName: userData.nickName,
        avatarUrl: userData.avatarUrl,
        avgRating: userData.avgRating || 0,
        reviewCount: userData.reviewCount || 0
      }
    }

    // 检查是否已评价
    const reviewRes = await db.collection('reviews').where({
      orderId: orderId,
      userId: openid
    }).get()

    const hasReviewed = reviewRes.data && reviewRes.data.length > 0

    return {
      code: 200,
      message: '获取订单详情成功',
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          productId: order.productId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          totalAmount: order.totalAmount,
          status: order.status,
          createTime: order.createTime,
          payTime: order.payTime,
          completeTime: order.completeTime,
          buyerReviewed: order.buyerReviewed || false,
          sellerReviewed: order.sellerReviewed || false,
          address: order.address
        },
        product: productInfo,
        targetUserInfo: targetUserInfo,
        hasReviewed: hasReviewed,
        userRole: order.buyerId === openid ? 'buyer' : 'seller'
      }
    }
  } catch (err) {
    console.error('[getOrderDetail]', err)
    return {
      code: 500,
      message: '获取订单详情失败',
      error: err.message
    }
  }
} 