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
    searchKeyword: '' // 搜索关键词
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
    // 模拟加载数据
    setTimeout(() => {
      // 模拟聊天数据
      const newChats = this.getMockChatList();
      
      // 根据搜索关键词过滤数据
      let filteredChats = newChats;
      
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
        page: this.data.page + 1
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
      const time = `${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
      const unreadCount = Math.floor(Math.random() * 10); // 0-9条未读消息
      const postType = Math.random() > 0.5 ? 'trip' : 'delivery'; // 随机生成发布类型
      
      chatList.push({
        id: `chat_${this.data.page}_${i}`,
        userId: `user_${Math.floor(Math.random() * 100)}`,
        userName: userName,
        avatar: avatar,
        lastMessage: lastMessage,
        time: time,
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
    
    // 跳转到聊天详情页
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${userId}&name=${userName}&postType=${postType}`
    });
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({loading: true});
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
  }
})