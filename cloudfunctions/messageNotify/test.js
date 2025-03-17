// 本地测试文件
const index = require('./index.js');

// 测试系统通知
async function testSystemNotification() {
  try {
    console.log('\n1. 测试系统通知...');
    const result = await index.main({
      action: 'sendSystemNotification',
      data: {
        title: '系统维护通知',
        content: '系统将于今晚22:00进行维护升级',
        type: 'system',
        userId: 'test_user_id'
      }
    });
    console.log('系统通知测试结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('系统通知测试失败:', error);
  }
}

// 测试订单状态通知
async function testOrderStatusNotification() {
  try {
    console.log('\n2. 测试订单状态通知...');
    const result = await index.main({
      action: 'sendOrderStatusNotification',
      data: {
        orderId: 'test_order_001',
        status: 'paid',
        userId: 'test_user_id'
      }
    });
    console.log('订单状态通知测试结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('订单状态通知测试失败:', error);
  }
}

// 测试安全通知
async function testSecurityNotification() {
  try {
    console.log('\n3. 测试安全通知...');
    const result = await index.main({
      action: 'sendSecurityNotification',
      data: {
        type: 'login',
        content: '检测到新设备登录',
        userId: 'test_user_id'
      }
    });
    console.log('安全通知测试结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('安全通知测试失败:', error);
  }
}

// 测试活动通知
async function testActivityNotification() {
  try {
    console.log('\n4. 测试活动通知...');
    const result = await index.main({
      action: 'sendActivityNotification',
      data: {
        title: '春季特惠活动',
        content: '全场商品8折起',
        activityId: 'activity_001',
        userId: 'test_user_id'
      }
    });
    console.log('活动通知测试结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('活动通知测试失败:', error);
  }
}

// 依次运行所有测试
async function runAllTests() {
  console.log('开始测试所有通知功能...\n');
  
  await testSystemNotification();
  await testOrderStatusNotification();
  await testSecurityNotification();
  await testActivityNotification();
  
  console.log('\n所有测试完成');
}

// 运行测试
runAllTests(); 