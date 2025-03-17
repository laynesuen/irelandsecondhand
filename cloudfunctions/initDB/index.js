// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 创建users集合
    await db.createCollection('users')
    
    // 创建用户相关索引
    await db.collection('users').createIndex({
      keys: {
        _openid: 1
      },
      unique: true
    })
    
    await db.collection('users').createIndex({
      keys: {
        token: 1
      }
    })
    
    await db.collection('users').createIndex({
      keys: {
        tokenExpireTime: 1
      }
    })
    
    await db.collection('users').createIndex({
      keys: {
        status: 1
      }
    })
    
    // 创建trips集合
    await db.createCollection('trips')
    await db.collection('trips').createIndex({
      keys: {
        createTime: -1
      }
    })
    await db.collection('trips').createIndex({
      keys: {
        status: 1,
        createTime: -1
      }
    })
    await db.collection('trips').createIndex({
      keys: {
        creatorId: 1,
        createTime: -1
      }
    })
    
    // 创建carries集合
    await db.createCollection('carries')
    await db.collection('carries').createIndex({
      keys: {
        createTime: -1
      }
    })
    await db.collection('carries').createIndex({
      keys: {
        status: 1,
        createTime: -1
      }
    })
    await db.collection('carries').createIndex({
      keys: {
        creatorId: 1,
        createTime: -1
      }
    })
    
    // 创建orders集合
    await db.createCollection('orders')
    await db.collection('orders').createIndex({
      keys: {
        createTime: -1
      }
    })
    await db.collection('orders').createIndex({
      keys: {
        status: 1,
        createTime: -1
      }
    })
    await db.collection('orders').createIndex({
      keys: {
        userId: 1,
        createTime: -1
      }
    })
    
    // 创建会话集合
    await db.createCollection('conversations').catch(err => {
      if (err.errCode !== -501001) {
        throw err;
      }
      console.log('conversations 集合已存在');
    });
    
    // 创建消息集合
    await db.createCollection('messages').catch(err => {
      if (err.errCode !== -501001) {
        throw err;
      }
      console.log('messages 集合已存在');
    });
    
    // 创建索引 - 会话集合
    await db.collection('conversations').createIndexes([
      {
        key: {
          participants: 1
        },
        name: 'participants_index'
      },
      {
        key: {
          lastMessageTime: -1
        },
        name: 'lastMessageTime_index'
      },
      {
        key: {
          postId: 1
        },
        name: 'postId_index'
      }
    ]).catch(console.error);
    
    // 创建索引 - 消息集合
    await db.collection('messages').createIndexes([
      {
        key: {
          conversationId: 1,
          createdAt: -1
        },
        name: 'conversationId_createdAt_index'
      },
      {
        key: {
          sender: 1
        },
        name: 'sender_index'
      },
      {
        key: {
          receiver: 1
        },
        name: 'receiver_index'
      }
    ]).catch(console.error);
    
    // 添加示例数据
    await addSampleData()
    
    return {
      success: true,
      message: '数据库初始化成功'
    }
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 添加示例数据
async function addSampleData() {
  const db = cloud.database()
  
  // 添加示例用户
  await db.collection('users').add({
    data: {
      _openid: 'system',
      userInfo: {
        nickName: '系统管理员',
        avatarUrl: '',
        gender: 0,
        country: 'Ireland',
        language: 'en'
      },
      role: 'admin',
      status: 'active',
      token: 'system_token',
      tokenExpireTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })
  
  // 添加示例行程信息
  await db.collection('trips').add({
    data: {
      title: '示例行程信息',
      description: '这是一个示例行程信息',
      fromLocation: '都柏林',
      toLocation: '科克',
      departureTime: new Date(),
      availableWeight: 20,
      acceptableItems: ['文件', '衣服', '数码产品'],
      rewardRequirement: '20欧元',
      status: 'active',
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      creatorId: 'system'
    }
  })
  
  // 添加示例捎带信息
  await db.collection('carries').add({
    data: {
      title: '示例捎带信息',
      description: '这是一个示例捎带信息',
      fromLocation: '都柏林',
      toLocation: '科克',
      departureTime: new Date(),
      price: 20,
      status: 'active',
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      creatorId: 'system',
      maxWeight: 10,
      availableSpace: '后备箱',
      contactInfo: {
        phone: '1234567890',
        wechat: 'example_wechat'
      }
    }
  })
  
  // 添加示例订单
  await db.collection('orders').add({
    data: {
      carryId: 'example_carry_id',
      userId: 'example_user_id',
      status: 'pending',
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      price: 20,
      paymentStatus: 'unpaid',
      orderNo: 'ORDER' + Date.now()
    }
  })
  
  // 添加示例消息
  await db.collection('messages').add({
    data: {
      title: '系统通知',
      content: '欢迎使用爱尔兰二手交易平台',
      type: 'system',
      receiverId: 'example_user_id',
      isRead: false,
      createTime: db.serverDate()
    }
  })
} 