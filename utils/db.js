const db = wx.cloud.database()

// 数据库集合引用
const usersCollection = db.collection('users');
const ordersCollection = db.collection('orders');
const messagesCollection = db.collection('messages');
const paymentsCollection = db.collection('payments');

// 数据库操作工具类
const DB = {
  // 用户相关操作
  user: {
    // 获取用户信息
    async getUserInfo(openid) {
      try {
        const result = await db.collection('users').where({
          _openid: openid
        }).get()
        return result.data[0]
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return null
      }
    },
    
    // 更新用户信息
    async updateUserInfo(openid, userInfo) {
      try {
        await db.collection('users').where({
          _openid: openid
        }).update({
          data: {
            ...userInfo,
            updateTime: db.serverDate()
          }
        })
        return true
      } catch (error) {
        console.error('更新用户信息失败:', error)
        return false
      }
    }
  },
  
  // 捎带信息相关操作
  carry: {
    // 创建捎带信息
    async createCarry(carryData) {
      try {
        const result = await db.collection('carries').add({
          data: {
            ...carryData,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
        return result._id
      } catch (error) {
        console.error('创建捎带信息失败:', error)
        return null
      }
    },
    
    // 获取捎带列表
    async getCarryList(options = {}) {
      const { page = 1, pageSize = 10, status = 'active' } = options
      try {
        const result = await db.collection('carries')
          .where({ status })
          .orderBy('createTime', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get()
        return result.data
      } catch (error) {
        console.error('获取捎带列表失败:', error)
        return []
      }
    },
    
    // 更新捎带状态
    async updateCarryStatus(carryId, status) {
      try {
        await db.collection('carries').doc(carryId).update({
          data: {
            status,
            updateTime: db.serverDate()
          }
        })
        return true
      } catch (error) {
        console.error('更新捎带状态失败:', error)
        return false
      }
    }
  },
  
  // 订单相关操作
  order: {
    // 创建订单
    async createOrder(orderData) {
      try {
        const result = await db.collection('orders').add({
          data: {
            ...orderData,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
        return result._id
      } catch (error) {
        console.error('创建订单失败:', error)
        return null
      }
    },
    
    // 获取订单列表
    async getOrderList(options = {}) {
      const { page = 1, pageSize = 10, status } = options
      try {
        let query = db.collection('orders')
        if (status) {
          query = query.where({ status })
        }
        const result = await query
          .orderBy('createTime', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get()
        return result.data
      } catch (error) {
        console.error('获取订单列表失败:', error)
        return []
      }
    },
    
    // 更新订单状态
    async updateOrderStatus(orderId, status) {
      try {
        await db.collection('orders').doc(orderId).update({
          data: {
            status,
            updateTime: db.serverDate()
          }
        })
        return true
      } catch (error) {
        console.error('更新订单状态失败:', error)
        return false
      }
    }
  },
  
  // 消息相关操作
  message: {
    // 发送消息
    async sendMessage(messageData) {
      try {
        const result = await db.collection('messages').add({
          data: {
            ...messageData,
            createTime: db.serverDate()
          }
        })
        return result._id
      } catch (error) {
        console.error('发送消息失败:', error)
        return null
      }
    },
    
    // 获取消息列表
    async getMessageList(options = {}) {
      const { page = 1, pageSize = 10, isRead } = options
      try {
        let query = db.collection('messages')
        if (isRead !== undefined) {
          query = query.where({ isRead })
        }
        const result = await query
          .orderBy('createTime', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get()
        return result.data
      } catch (error) {
        console.error('获取消息列表失败:', error)
        return []
      }
    },
    
    // 标记消息为已读
    async markMessageAsRead(messageId) {
      try {
        await db.collection('messages').doc(messageId).update({
          data: {
            isRead: true
          }
        })
        return true
      } catch (error) {
        console.error('标记消息已读失败:', error)
        return false
      }
    }
  }
}

// 导出数据库操作工具和集合引用
module.exports = {
  ...DB,
  usersCollection,
  ordersCollection,
  messagesCollection,
  paymentsCollection
} 