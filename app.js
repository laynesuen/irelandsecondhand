// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    serverUrl: 'https://express-yrin-147698-5-1348651097.sh.run.tcloudbase.com', // 云托管服务地址
    useCustomTabBar: false // 是否使用自定义TabBar，设置为false使用系统默认
  },
  onLaunch: function() {
    // 小程序启动时执行的逻辑
    this.checkLoginStatus();
  },
  
  // 全局返回按钮处理函数，配合app.json中的handleBackFunction使用
  navigateBack: function(e) {
    // 获取当前页面路径
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const route = currentPage.route;
    
    // 如果当前页面是编辑捎带页面，则执行取消编辑逻辑
    if (route === 'pages/publish/publish' && currentPage.data.isEditMode) {
      // 如果已经是正常保存流程，则不进行额外处理，直接返回
      if (currentPage.data.isSaved) {
        return false; // 返回false让系统执行默认返回逻辑
      }
      
      // 清除编辑数据缓存
      wx.removeStorageSync('editCarryData');
      
      // 设置为取消操作
      currentPage.setData({
        isSaved: false
      });
      
      // 显示提示
      wx.showToast({
        title: '已取消修改',
        icon: 'none',
        duration: 1500
      });
      
      // 查找我的捎带页面实例
      const myCarriesPage = pages.find(page => page.route === 'pages/my-carries/my-carries');
      
      if (myCarriesPage) {
        // 直接设置页面的刷新标记为false，不需要刷新
        myCarriesPage.setData({
          needRefresh: false
        });
        
        // 返回到我的捎带页面
        wx.navigateBack({
          delta: 1,
          fail: () => {
            // 如果返回失败，则重新打开页面
            wx.redirectTo({
              url: '/pages/my-carries/my-carries',
              fail: () => {
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }
            });
          }
        });
      } else {
        // 如果找不到页面实例，使用重定向方式打开页面
        wx.redirectTo({
          url: '/pages/my-carries/my-carries',
          fail: () => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        });
      }
      
      // 返回true表示已处理返回事件
      return true;
    }
    
    // 其他页面正常返回
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果返回失败，可能是因为没有上一页，尝试跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
    
    // 返回true表示已处理返回事件
    return true;
  },
  
  checkLoginStatus: function() {
    // 检查用户登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = userInfo;
      
      // 可以在这里验证token有效性
      // 实际开发中，应该向后端发起请求验证token是否有效
      this.verifyToken(token);
    }
  },
  verifyToken: function(token) {
    // 向后端验证token有效性
    // 这里是模拟验证，实际开发中需要向后端发起请求
    console.log('验证token：', token);
    
    // 模拟token过期情况（实际中应该由后端判断）
    // 当token存在但过期时，应该清除本地存储并更新登录状态
    const tokenExpired = false; // 模拟token未过期
    
    if (tokenExpired) {
      this.globalData.isLoggedIn = false;
      this.globalData.userInfo = null;
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
      
      // 可以在这里添加提示用户需要重新登录的逻辑
    }
  },
  login: function(callback) {
    // 用户登录逻辑
    wx.login({
      success: res => {
        if (res.code) {
          // 发送code到后端换取openId和token
          // 实际开发中需要对接后端API
          console.log('登录成功，获取到code:', res.code);
          
          // 模拟登录成功
          this.globalData.isLoggedIn = true;
          
          // 设置一个临时的token，实际应该使用后端返回的token
          const mockToken = 'mock_token_' + new Date().getTime();
          wx.setStorageSync('token', mockToken);
          
          if (callback) callback(true);
        } else {
          console.log('登录失败：' + res.errMsg);
          if (callback) callback(false);
        }
      },
      fail: () => {
        if (callback) callback(false);
      }
    });
  },
  getUserInfo: function(callback) {
    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: res => {
        const userInfo = res.userInfo;
        this.globalData.userInfo = userInfo;
        
        // 将用户信息存储到本地
        wx.setStorageSync('userInfo', userInfo);
        
        if (callback) callback(userInfo);
      },
      fail: () => {
        if (callback) callback(null);
      }
    });
  },
  
  logout: function(callback) {
    // 用户登出逻辑
    // 清除本地存储的登录信息
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    
    // 更新全局状态
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
    
    if (callback) callback(true);
  }
});

const express = require('express');
const cloud = require('wx-server-sdk');

const app = express();
app.use(express.json());

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 健康检查接口
app.get('/health', (req, res) => {
  console.log('收到健康检查请求');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 订阅消息发送接口
app.post('/api/subscribe-message', async (req, res) => {
  try {
    console.log('收到订阅消息请求:', req.body);
    
    const { touser, templateId, page, data } = req.body;
    
    if (!touser || !templateId || !data) {
      console.error('缺少必要参数:', { touser, templateId, data });
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 使用微信云开发SDK发送订阅消息
    const result = await cloud.openapi.subscribeMessage.send({
      touser,
      templateId,
      page,
      data
    });
    
    console.log('订阅消息发送成功:', result);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('发送订阅消息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// 404 处理
app.use((req, res) => {
  console.log('收到未处理的请求:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

const port = process.env.PORT || 80;
app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`);
});