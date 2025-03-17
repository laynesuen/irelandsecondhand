// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    serverUrl: 'https://express-yrin-147698-5-1348651097.sh.run.tcloudbase.com', // 云托管服务地址
    useCustomTabBar: false, // 是否使用自定义TabBar，设置为false使用系统默认
    tokenExpireTime: null
  },
  onLaunch: function() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-9gfzaw5d341a3e6d',
        traceUser: true,
        success: () => {
          console.log('云开发环境初始化成功');
          
          // 初始化数据库
          wx.cloud.callFunction({
            name: 'initDB',
            success: res => {
              console.log('数据库初始化成功', res);
              // 数据库初始化成功后再检查登录状态
              this.checkLoginStatus();
            },
            fail: err => {
              console.error('数据库初始化失败', err);
              // 如果是函数未找到错误，尝试重新部署云函数
              if (err.errCode === -501000) {
                console.log('云函数未找到，请确保已部署initDB云函数');
                wx.showToast({
                  title: '系统初始化中，请稍后重试',
                  icon: 'none',
                  duration: 2000
                });
              }
              // 即使数据库初始化失败，也检查登录状态
              this.checkLoginStatus();
            }
          });
        },
        fail: err => {
          console.error('云开发环境初始化失败', err);
          // 云开发环境初始化失败时，也检查登录状态
          this.checkLoginStatus();
        }
      });
    }
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
  
  // 检查登录状态
  checkLoginStatus: function() {
    try {
      console.log('====== 开始检查登录状态 ======');
      
      // 获取本地存储中的登录信息
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      
      // 如果没有令牌或用户信息，但我们有全局状态，则使用它
      if ((!token || !userInfo) && this.globalData.userInfo) {
        console.log('使用全局状态同步到本地存储');
        if (!userInfo) {
          wx.setStorageSync('userInfo', this.globalData.userInfo);
        }
        if (!token) {
          // 生成一个临时令牌
          const tempToken = Date.now().toString();
          wx.setStorageSync('token', tempToken);
          
          // 设置30天后过期
          const expireTime = new Date();
          expireTime.setDate(expireTime.getDate() + 30);
          wx.setStorageSync('tokenExpireTime', expireTime.toISOString());
        }
      }
      
      // 强制设置登录状态
      this.globalData.isLoggedIn = true;
      wx.setStorageSync('isLoggedIn', true);
      
      console.log('登录检查完成：用户已登录');
      console.log('====== 登录状态检查结束 ======');
      
      // 触发状态更新
      this.triggerLoginStatusChange(true);
      return true;
    } catch (error) {
      console.error('检查登录状态时出错:', error);
      
      // 出错时也强制设置登录状态
      this.globalData.isLoggedIn = true;
      wx.setStorageSync('isLoggedIn', true);
      
      this.triggerLoginStatusChange(true);
      return true;
    }
  },
  
  clearLoginStatus: function() {
    console.log('====== 开始清除登录状态 ======');
    
    // 先清除本地存储
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('isLoggedIn');
    wx.removeStorageSync('tokenExpireTime');
    
    // 再清除全局状态
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
    this.globalData.tokenExpireTime = null;
    
    console.log('登录状态已清除');
    console.log('====== 清除登录状态结束 ======');
    
    // 触发状态变化通知
    this.triggerLoginStatusChange(false);
  },
  
  triggerLoginStatusChange: function(isLoggedIn) {
    try {
      console.log('触发登录状态变化:', isLoggedIn);
      
      // 获取当前页面栈
      const pages = getCurrentPages();
      if (!pages || pages.length === 0) {
        console.log('没有活动页面，无法触发登录状态变化');
        return;
      }
      
      // 遍历所有页面，触发登录状态变化
      pages.forEach((page, index) => {
        if (page && page.onLoginStatusChange) {
          console.log(`触发第 ${index + 1}/${pages.length} 个页面[${page.route}]的登录状态变化:`, isLoggedIn);
          try {
            page.onLoginStatusChange({
              detail: { isLoggedIn }
            });
          } catch (pageError) {
            console.error(`触发页面 ${page.route} 登录状态变化时出错:`, pageError);
          }
        }
      });
    } catch (error) {
      console.error('触发登录状态变化时出错:', error);
    }
  },
  
  // 登录函数
  login: function(callback) {
    wx.login({
      success: res => {
        if (res.code) {
          // 获取用户信息
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: userRes => {
              const userInfo = userRes.userInfo;
              
              // 调用登录云函数
              wx.cloud.callFunction({
                name: 'login',
                data: {
                  code: res.code,
                  userInfo: userInfo
                },
                success: cloudRes => {
                  if (cloudRes.result.success) {
                    // 保存登录信息
                    this.globalData.isLoggedIn = true;
                    this.globalData.userInfo = userInfo;
                    this.globalData.tokenExpireTime = cloudRes.result.data.expireTime;
                    
                    // 保存token和用户信息到本地
                    wx.setStorageSync('token', cloudRes.result.data.token);
                    wx.setStorageSync('userInfo', userInfo);
                    wx.setStorageSync('isLoggedIn', true);
                    wx.setStorageSync('tokenExpireTime', cloudRes.result.data.expireTime);
                    
                    // 触发登录状态变化
                    this.triggerLoginStatusChange(true);
                    
                    // 回调通知登录成功
                    if (typeof callback === 'function') {
                      callback(true);
                    }
                  } else {
                    console.error('登录云函数返回失败:', cloudRes.result.error);
                    if (typeof callback === 'function') {
                      callback(false);
                    }
                  }
                },
                fail: err => {
                  console.error('调用登录云函数失败:', err);
                  if (typeof callback === 'function') {
                    callback(false);
                  }
                }
              });
            },
            fail: err => {
              console.error('获取用户信息失败:', err);
              if (typeof callback === 'function') {
                callback(false);
              }
            }
          });
        } else {
          console.error('微信登录失败:', res);
          if (typeof callback === 'function') {
            callback(false);
          }
        }
      },
      fail: err => {
        console.error('微信登录接口调用失败:', err);
        if (typeof callback === 'function') {
          callback(false);
        }
      }
    });
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
    // 清除登录信息
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('isLoggedIn');
    
    // 更新全局状态
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
    
    // 触发登录状态更新事件
    this.triggerLoginStatusChange(false);
    
    if (callback) callback(true);
  },
});