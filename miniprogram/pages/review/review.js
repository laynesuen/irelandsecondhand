const app = getApp()

Page({
  data: {
    orderId: '',
    targetUserId: '',
    orderInfo: null,
    targetUserInfo: null,
    loading: true,
    submitting: false,
    rating: 5, // 默认评分为5星
    content: '',
    selectedTags: [],
    availableTags: [
      '服务热情', '沟通顺畅', '商品满意', '物超所值', '描述相符', 
      '发货迅速', '包装完好', '售后优质', '很有耐心', '时间准时'
    ],
    contentLength: 0
  },

  onLoad(options) {
    // 检查参数
    if (!options.orderId || !options.targetUserId) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 保存参数
    this.setData({
      orderId: options.orderId,
      targetUserId: options.targetUserId,
      loading: true
    })

    // 获取订单和用户信息
    this.loadOrderAndUserInfo()
  },

  // 加载订单和用户信息
  loadOrderAndUserInfo() {
    wx.cloud.callFunction({
      name: 'getOrderDetail',
      data: {
        orderId: this.data.orderId
      }
    })
    .then(res => {
      const result = res.result
      if (result.code === 200) {
        // 验证目标用户ID是否匹配
        const { order, targetUserInfo } = result.data
        if (targetUserInfo && targetUserInfo.userId === this.data.targetUserId) {
          this.setData({
            orderInfo: order,
            targetUserInfo: targetUserInfo,
            loading: false
          })
        } else {
          this.showError('用户信息不匹配')
        }
      } else {
        this.showError(result.message || '加载订单信息失败')
      }
    })
    .catch(err => {
      console.error('获取订单详情失败:', err)
      this.showError('网络错误，请稍后重试')
    })
    .finally(() => {
      if (this.data.loading) {
        this.setData({ loading: false })
      }
    })
  },

  // 处理评分变化
  onRatingChange(e) {
    this.setData({
      rating: e.detail.value
    })
  },

  // 处理评价内容输入
  onContentInput(e) {
    const content = e.detail.value
    this.setData({
      content: content,
      contentLength: content.length
    })
  },

  // 处理标签选择
  onTagTap(e) {
    const tagIndex = e.currentTarget.dataset.index
    const tag = this.data.availableTags[tagIndex]
    let selectedTags = [...this.data.selectedTags]
    
    const index = selectedTags.indexOf(tag)
    
    if (index > -1) {
      // 如果已选择，则取消选择
      selectedTags.splice(index, 1)
    } else {
      // 如果未选择且未超过3个，则添加选择
      if (selectedTags.length < 3) {
        selectedTags.push(tag)
      } else {
        wx.showToast({
          title: '最多选择3个标签',
          icon: 'none'
        })
        return
      }
    }
    
    this.setData({
      selectedTags: selectedTags
    })
  },

  // 提交评价
  submitReview() {
    // 检查内容是否为空
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入评价内容',
        icon: 'none'
      })
      return
    }
    
    this.setData({ submitting: true })
    
    wx.cloud.callFunction({
      name: 'createReview',
      data: {
        orderId: this.data.orderId,
        targetUserId: this.data.targetUserId,
        content: this.data.content,
        rating: this.data.rating,
        tags: this.data.selectedTags
      }
    })
    .then(res => {
      const result = res.result
      if (result.code === 200) {
        wx.showToast({
          title: '评价成功',
          icon: 'success'
        })
        // 等待提示显示后返回
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: result.message || '提交失败',
          icon: 'none'
        })
      }
    })
    .catch(err => {
      console.error('提交评价失败:', err)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    })
    .finally(() => {
      this.setData({ submitting: false })
    })
  },
  
  // 显示错误并返回
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'none'
    })
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  // 重新加载数据
  reload() {
    this.setData({ loading: true })
    this.loadOrderAndUserInfo()
  }
}) 