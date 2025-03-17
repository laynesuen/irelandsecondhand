// pages/chat-list/chat-list.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    chatList: [], // 聊天列表
    loading: true, // 是否正在加载
    hasMore: true, // 是否有更多数据
    page: 1, // 当前页码
    pageSize: 10, // 每页数量
    searchKeyword: '', // 搜索关键词
    isEmpty: false // 列表是否为空
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadChatList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次进入页面时，获取最新聊天列表数据
    this.loadChatList();
    
    // 只有在使用自定义TabBar时才设置selected状态
    const app = getApp();
    if (app.globalData.useCustomTabBar && typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
  },

  /**
   * 搜索输入事件
   */
  onSearchInput(e) {
    const value = e.detail.value;
    
    this.setData({
      searchKeyword: value
    });
    
    // 防抖处理，500ms后执行搜索
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    this.searchTimer = setTimeout(() => {
      this.setData({
        chatList: [],
        loading: true,
        hasMore: true,
        page: 1
      });
      
      this.loadChatList();
    }, 500);
  },

  /**
   * 加载聊天列表
   */
  loadChatList() {
    this.setData({ loading: true });
    
    // 检查用户是否登录
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      // 如果未登录，显示登录提示
      this.setData({
        loading: false,
        isEmpty: true
      });
      
      wx.showToast({
        title: '请先登录后查看消息',
        icon: 'none',
        duration: 2000
      });
      
      return;
    }
    
    // 调用云函数获取聊天列表
    wx.cloud.callFunction({
      name: 'getChatList',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      success: res => {
        console.log('获取聊天列表成功:', res);
        
        if (res.result && res.result.success) {
          let chatList = res.result.data || [];
          
          // 根据搜索关键词过滤数据
          if (this.data.searchKeyword) {
            const keyword = this.data.searchKeyword.toLowerCase();
            chatList = chatList.filter(chat => {
              return chat.userName.toLowerCase().includes(keyword) ||
                     (chat.lastMessage && chat.lastMessage.toLowerCase().includes(keyword));
            });
          }
          
          // 格式化时间
          chatList.forEach(chat => {
            if (chat.time && typeof chat.time === 'string') {
              chat.displayTime = this.formatTime(new Date(chat.time));
            } else {
              chat.displayTime = this.formatTime(new Date(chat.lastMessageTime));
            }
          });
          
          this.setData({
            chatList: this.data.page === 1 ? chatList : [...this.data.chatList, ...chatList],
            loading: false,
            hasMore: chatList.length >= this.data.pageSize,
            isEmpty: this.data.page === 1 && chatList.length === 0
          });
        } else {
          this.setData({
            loading: false,
            isEmpty: this.data.page === 1 && this.data.chatList.length === 0
          });
          
          wx.showToast({
            title: '获取聊天列表失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: err => {
        console.error('调用云函数获取聊天列表失败:', err);
        
        this.setData({
          loading: false,
          isEmpty: this.data.page === 1 && this.data.chatList.length === 0
        });
        
        wx.showToast({
          title: '获取列表失败，请重试',
          icon: 'none',
          duration: 2000
        });
        
        // 如果云函数调用失败，使用模拟数据（仅在开发调试阶段使用）
        if (this.data.page === 1 && this.data.chatList.length === 0) {
          this.loadMockChatList();
        }
      }
    });
  },

  /**
   * 获取模拟聊天列表数据
   */
  loadMockChatList() {
    console.log('使用模拟数据');
    // 模拟加载数据
    setTimeout(() => {
      // 模拟聊天数据
      const chatList = this.getMockChatList();
      
      // 根据搜索关键词过滤数据
      let filteredChats = chatList;
      
      if (this.data.searchKeyword) {
        const keyword = this.data.searchKeyword.toLowerCase();
        filteredChats = filteredChats.filter(chat => {
          return chat.userName.toLowerCase().includes(keyword) ||
                 (chat.lastMessage && chat.lastMessage.toLowerCase().includes(keyword));
        });
      }
      
      this.setData({
        chatList: this.data.page === 1 ? filteredChats : [...this.data.chatList, ...filteredChats],
        loading: false,
        hasMore: this.data.page < 3, // 模拟只有3页数据
        page: this.data.page + 1,
        isEmpty: false
      });
    }, 1000);
  },

  /**
   * 获取模拟聊天列表数据
   */
  getMockChatList() {
    const chatList = [];
    const userNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    const avatars = ['/images/default-avatar.png'];
    const lastMessages = [
      '你好，请问什么时候可以发货？',
      '我已经到达目的地了',
      '物品的尺寸是多少？',
      '好的，我会按时送达',
      '请问你现在在哪里？',
      '我可以帮你捎带这个物品',
      '报酬是多少？',
      '我已经收到货了，谢谢！'
    ];
    
    // 生成模拟数据
    for (let i = 0; i < this.data.pageSize; i++) {
      const userName = userNames[Math.floor(Math.random() * userNames.length)];
      const avatar = avatars[Math.floor(Math.random() * avatars.length)];
      const lastMessage = lastMessages[Math.floor(Math.random() * lastMessages.length)];
      const now = new Date();
      const time = now.getTime() - Math.floor(Math.random() * 24 * 60 * 60 * 1000);
      const unreadCount = Math.floor(Math.random() * 10); // 0-9条未读消息
      const postType = Math.random() > 0.5 ? 'trip' : 'delivery'; // 随机生成发布类型
      
      chatList.push({
        id: `chat_${this.data.page}_${i}`,
        userId: `user_${Math.floor(Math.random() * 100)}`,
        userName: userName,
        avatar: avatar,
        lastMessage: lastMessage,
        lastMessageTime: time,
        displayTime: this.formatTime(new Date(time)),
        unreadCount: unreadCount,
        postType: postType // 添加发布类型
      });
    }
    
    return chatList;
  },

  /**
   * 聊天项点击事件
   */
  onChatTap(e) {
    const userId = e.currentTarget.dataset.userId;
    const userName = e.currentTarget.dataset.userName;
    const postType = e.currentTarget.dataset.postType || 'trip'; // 获取发布类型，默认为行程
    const postId = e.currentTarget.dataset.postId || ''; // 获取发布ID
    const conversationId = e.currentTarget.dataset.id || ''; // 获取会话ID
    
    // 跳转到聊天详情页
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${userId}&name=${userName}&postType=${postType}&postId=${postId}&conversationId=${conversationId}`
    });
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({
      page: this.data.page + 1,
      loading: true
    });
    
    this.loadChatList();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({
      chatList: [],
      loading: true,
      hasMore: true,
      page: 1
    });
    
    this.loadChatList();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.loadMore();
  },
  
  /**
   * 格式化时间为友好显示
   */
  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    // 判断是否今天
    const isToday = now.getDate() === date.getDate() 
                  && now.getMonth() === date.getMonth() 
                  && now.getFullYear() === date.getFullYear();
    
    // 一分钟内显示"刚刚"
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    
    // 一小时内显示"xx分钟前"
    if (diff < 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 1000)) + '分钟前';
    }
    
    // 今天显示"HH:MM"
    if (isToday) {
      return this.padZero(date.getHours()) + ':' + this.padZero(date.getMinutes());
    }
    
    // 昨天显示"昨天"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.getDate() === date.getDate() 
                      && yesterday.getMonth() === date.getMonth() 
                      && yesterday.getFullYear() === date.getFullYear();
    
    if (isYesterday) {
      return '昨天';
    }
    
    // 一周内显示"周几"
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return dayNames[date.getDay()];
    }
    
    // 其他显示"MM-DD"
    return (date.getMonth() + 1) + '-' + date.getDate();
  },
  
  /**
   * 补零
   */
  padZero(num) {
    return num < 10 ? '0' + num : num;
  },

  /**
   * 清除搜索关键词
   */
  clearSearch() {
    this.setData({
      searchKeyword: '',
      chatList: [],
      loading: true,
      hasMore: true,
      page: 1
    });
    
    this.loadChatList();
  },
  
  /**
   * 跳转到浏览行程页面
   */
  goToExplore() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },
})