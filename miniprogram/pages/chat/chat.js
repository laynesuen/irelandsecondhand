const app = getApp()

Page({
  data: {
    conversationId: '', // 会话ID
    targetId: '', // 对话对象ID
    targetUser: null, // 对话对象信息
    userInfo: null, // 当前用户信息
    messages: [], // 消息列表
    inputContent: '', // 输入框内容
    loading: false, // 加载状态
    loadingMore: false, // 加载更多状态
    hasMore: false, // 是否还有更多消息
    pageSize: 20, // 每页消息数量
    lastId: null, // 上一页最后一条消息ID
    postId: '', // 帖子ID
    postType: '', // 帖子类型
    keyboardHeight: 0, // 键盘高度
    scrollToMessage: '', // 要滚动到的消息ID
    isAdjusting: false, // 是否正在调整
    tempMessageMap: {} // 临时消息映射
  },

  onLoad: function(options) {
    // 获取页面参数
    const { conversationId, targetId, postId, postType } = options
    
    if (!conversationId && !targetId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 初始化数据
    this.setData({
      conversationId,
      targetId,
      postId: postId || '',
      postType: postType || '',
      userInfo: app.globalData.userInfo
    })

    // 监听键盘高度变化
    wx.onKeyboardHeightChange(res => {
      this.setData({
        keyboardHeight: res.height
      })
      
      if (res.height > 0 && this.data.messages.length > 0) {
        this.setData({
          scrollToMessage: this.data.messages[this.data.messages.length - 1]._id
        })
      }
    })

    // 获取消息列表
    this.loadMessages()
  },

  onUnload: function() {
    // 取消监听键盘高度变化
    wx.offKeyboardHeightChange()
  },

  onShow: function() {
    // 标记消息已读
    if (this.data.conversationId) {
      this.markMessagesAsRead()
    }
  },

  // 加载消息列表
  loadMessages: function() {
    const { conversationId, targetId, postId, postType, pageSize, lastId } = this.data
    
    this.setData({
      loading: !lastId,
      loadingMore: !!lastId
    })

    wx.cloud.callFunction({
      name: 'getMessages',
      data: {
        conversationId,
        targetId,
        postId,
        postType,
        pageSize,
        lastId
      }
    }).then(res => {
      const result = res.result
      
      if (result.code === 200) {
        // 更新会话ID
        if (!this.data.conversationId && result.data.conversation) {
          this.setData({
            conversationId: result.data.conversation._id
          })
          // 标记消息已读
          this.markMessagesAsRead()
        }
        
        // 更新对话目标用户信息
        if (result.data.targetUser) {
          this.setData({
            targetUser: result.data.targetUser
          })
          
          // 设置导航栏标题
          wx.setNavigationBarTitle({
            title: result.data.targetUser.nickName || '聊天'
          })
        }
        
        // 处理消息列表
        const messages = result.data.messages || []
        
        // 合并临时消息和服务器返回的消息
        const mergedMessages = lastId
          ? [...messages, ...this.data.messages]
          : [...messages]
        
        // 更新状态
        this.setData({
          messages: mergedMessages,
          hasMore: result.data.hasMore,
          lastId: messages.length > 0 ? messages[0]._id : null,
          loading: false,
          loadingMore: false
        })
        
        // 如果是第一次加载，滚动到最新消息
        if (!lastId && messages.length > 0) {
          this.setData({
            scrollToMessage: messages[messages.length - 1]._id
          })
        }
      } else {
        this.showError(result.message || '获取消息失败')
      }
    }).catch(err => {
      console.error('获取消息失败', err)
      this.showError('获取消息失败，请检查网络')
      this.setData({
        loading: false,
        loadingMore: false
      })
    })
  },
  
  // 标记消息已读
  markMessagesAsRead: function() {
    if (!this.data.conversationId) return
    
    wx.cloud.callFunction({
      name: 'markMessageRead',
      data: {
        conversationId: this.data.conversationId
      }
    }).catch(err => {
      console.error('标记消息已读失败', err)
    })
  },
  
  // 发送消息
  sendMessage: function() {
    const content = this.data.inputContent.trim()
    if (!content) return
    
    if (!app.globalData.isLoggedIn) {
      this.showError('请先登录')
      return
    }
    
    if (!this.data.targetId && !this.data.conversationId) {
      this.showError('发送失败，会话不存在')
      return
    }
    
    // 生成临时消息ID
    const tempId = Date.now().toString()
    
    // 创建临时消息
    const tempMessage = {
      _id: `temp_${tempId}`,
      sender: app.globalData.openid,
      receiver: this.data.targetId,
      content,
      type: 'text',
      createdAt: new Date(),
      isPending: true,
      isFailed: false
    }
    
    // 添加到消息列表
    const messages = [...this.data.messages, tempMessage]
    this.setData({
      messages,
      inputContent: '',
      scrollToMessage: tempMessage._id
    })
    
    // 发送消息到服务器
    wx.cloud.callFunction({
      name: 'sendMessage',
      data: {
        content,
        type: 'text',
        receiver: this.data.targetId,
        conversationId: this.data.conversationId,
        tempId,
        postId: this.data.postId,
        postType: this.data.postType
      }
    }).then(res => {
      const result = res.result
      
      if (result.code === 200) {
        // 更新会话ID
        if (result.data.conversationId && !this.data.conversationId) {
          this.setData({
            conversationId: result.data.conversationId
          })
        }
        
        // 更新临时消息状态
        this.updateTempMessageStatus(tempId, result.data.messageId)
      } else {
        this.markMessageAsFailed(tempId)
        this.showError(result.message || '发送失败')
      }
    }).catch(err => {
      console.error('发送消息失败', err)
      this.markMessageAsFailed(tempId)
      this.showError('发送失败，请检查网络')
    })
  },
  
  // 更新临时消息状态
  updateTempMessageStatus: function(tempId, realId) {
    const messages = this.data.messages.map(msg => {
      if (msg._id === `temp_${tempId}`) {
        return {
          ...msg,
          _id: realId,
          isPending: false
        }
      }
      return msg
    })
    
    this.setData({ messages })
  },
  
  // 标记消息发送失败
  markMessageAsFailed: function(tempId) {
    const messages = this.data.messages.map(msg => {
      if (msg._id === `temp_${tempId}`) {
        return {
          ...msg,
          isPending: false,
          isFailed: true
        }
      }
      return msg
    })
    
    this.setData({ messages })
  },
  
  // 显示错误提示
  showError: function(message) {
    wx.showToast({
      title: message,
      icon: 'none'
    })
  },
  
  // 输入框内容变化
  onInputChange: function(e) {
    this.setData({
      inputContent: e.detail.value
    })
  },
  
  // 点击发送按钮
  onSendTap: function() {
    this.sendMessage()
  },
  
  // 下拉加载更多
  onScrollToUpper: function() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMessages()
    }
  },
  
  // 重试发送失败的消息
  onRetryTap: function(e) {
    const { id } = e.currentTarget.dataset
    const message = this.data.messages.find(msg => msg._id === id)
    
    if (message) {
      // 重新标记为发送中
      const messages = this.data.messages.map(msg => {
        if (msg._id === id) {
          return {
            ...msg,
            isPending: true,
            isFailed: false
          }
        }
        return msg
      })
      
      this.setData({ messages })
      
      // 重新发送
      wx.cloud.callFunction({
        name: 'sendMessage',
        data: {
          content: message.content,
          type: message.type,
          receiver: this.data.targetId,
          conversationId: this.data.conversationId,
          tempId: id.replace('temp_', ''),
          postId: this.data.postId,
          postType: this.data.postType
        }
      }).then(res => {
        const result = res.result
        
        if (result.code === 200) {
          // 更新临时消息状态
          this.updateTempMessageStatus(id.replace('temp_', ''), result.data.messageId)
        } else {
          this.markMessageAsFailed(id.replace('temp_', ''))
          this.showError(result.message || '发送失败')
        }
      }).catch(err => {
        console.error('重发消息失败', err)
        this.markMessageAsFailed(id.replace('temp_', ''))
        this.showError('发送失败，请检查网络')
      })
    }
  },
  
  // 返回上一页
  onBackTap: function() {
    wx.navigateBack()
  }
}) 