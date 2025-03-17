const db = wx.cloud.database();

// 订单集合
const ordersCollection = db.collection('orders');

// 支付记录集合
const paymentsCollection = db.collection('payments');

// 物流信息集合
const logisticsCollection = db.collection('logistics');

// 通知消息集合
const notificationsCollection = db.collection('notifications');

module.exports = {
  ordersCollection,
  paymentsCollection,
  logisticsCollection,
  notificationsCollection
}; 