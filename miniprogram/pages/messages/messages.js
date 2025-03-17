const app = getApp()

Page({
  data: {
    conversations: [], // 会话列表
    loading: false, // 加载状态
    userInfo: null, // 用户信息
    isLoggedIn: false // 登录状态
  },

  onLoad: function (options) {
    // 获取用户登录状态
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo
    })

    // 监听登录状态变化
    app.watch('isLoggedIn', (newValue) => {
      this.setData({
        isLoggedIn: newValue
      })
      
      if (newValue) {
        this.loadConversations()
      } else {
        this.setData({
          conversations: []
        })
      }
    })
  },

  onShow: function () {
    // 页面显示时，如果已登录则加载会话列表
    if (app.globalData.isLoggedIn) {
      this.loadConversations()
    }
  },

  // 加载会话列表
  loadConversations: function () {
    if (!app.globalData.isLoggedIn) {
      return
    }

    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'getConversationList',
      data: {}
    }).then(res => {
      const result = res.result
      
      if (result.code === 200) {
        this.setData({
          conversations: result.data.conversations || [],
          loading: false
        })
      } else {
        this.showError(result.message || '获取会话列表失败')
        this.setData({ loading: false })
      }
    }).catch(err => {
      console.error('获取会话列表失败', err)
      this.showError('获取会话列表失败，请检查网络')
      this.setData({ loading: false })
    })
  },

  // 跳转到聊天页面
  navigateToChat: function (e) {
    const { id, targetid } = e.currentTarget.dataset
    
    if (!app.globalData.isLoggedIn) {
      this.showLogin()
      return
    }

    wx.navigateTo({
      url: `/pages/chat/chat?conversationId=${id}&targetId=${targetid}`
    })
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    if (app.globalData.isLoggedIn) {
      this.loadConversations()
      setTimeout(() => {
        wx.stopPullDownRefresh()
      }, 1000)
    } else {
      wx.stopPullDownRefresh()
    }
  },

  // 删除会话
  onDeleteConversation: function (e) {
    const { id } = e.currentTarget.dataset
    
    wx.showModal({
      title: '删除会话',
      content: '确定要删除此会话吗？删除后将无法恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'deleteConversation',
            data: {
              conversationId: id
            }
          }).then(res => {
            const result = res.result
            
            if (result.code === 200) {
              // 从列表中移除被删除的会话
              const conversations = this.data.conversations.filter(
                conv => conv._id !== id
              )
              
              this.setData({ conversations })
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
            } else {
              this.showError(result.message || '删除失败')
            }
          }).catch(err => {
            console.error('删除会话失败', err)
            this.showError('删除失败，请检查网络')
          })
        }
      }
    })
  },

  // 显示登录提示
  showLogin: function () {
    wx.showModal({
      title: '提示',
      content: '请先登录后再查看消息',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/profile/profile'
          })
        }
      }
    })
  },

  // 显示错误提示
  showError: function (message) {
    wx.showToast({
      title: message,
      icon: 'none'
    })
  },

  // 格式化时间
  formatTime: function (date) {
    const now = new Date()
    const messageDate = new Date(date)
    
    if (now.toDateString() === messageDate.toDateString()) {
      // 今天的消息，只显示时间
      return messageDate.toTimeString().substring(0, 5)
    } else {
      // 其他日期，显示月日
      return `${messageDate.getMonth() + 1}/${messageDate.getDate()}`
    }
  }
}) 