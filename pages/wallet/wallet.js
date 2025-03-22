// pages/wallet/wallet.js
Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    balance: 0, // 钱包余额
    transactions: [], // 交易记录
    activeTab: 'all', // 当前选中的标签: all, recharge, withdraw
    loading: false,
    page: 1,
    hasMore: true,
    withdrawAmount: '', // 提现金额
    rechargeAmount: '', // 充值金额
    rechargeOptions: [10, 50, 100, 200, 500], // 快速充值选项
    withdrawOptions: [10, 50, 100, 200, 500], // 快速提现选项
    showRechargeModal: false, // 是否显示充值弹窗
    showWithdrawModal: false, // 是否显示提现弹窗
    withdrawFeeRate: 0.01, // 提现手续费率
    minWithdrawFee: 1, // 最低提现手续费
    withdrawFee: 0, // 当前提现手续费
    actualWithdrawAmount: 0, // 实际到账金额
    allTransactions: [] // 所有交易记录
  },

  onLoad: function() {
    this.checkLoginStatus();
    this.loadTransactions();
  },

  onShow: function() {
    this.checkLoginStatus();
    // 刷新钱包余额
    this.getWalletBalance();
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const app = getApp();
    const isLoggedIn = app.globalData.isLoggedIn;
    const userInfo = app.globalData.userInfo;

    this.setData({
      isLoggedIn: isLoggedIn,
      userInfo: userInfo
    });

    if (!isLoggedIn) {
      this.showLoginTip();
    }
  },

  // 获取钱包余额
  getWalletBalance: function() {
    // 模拟获取钱包余额
    // 实际应用中应该从服务器获取
    if (this.data.isLoggedIn) {
      // 模拟余额，实际应从服务器获取
      const mockBalance = (Math.random() * 1000).toFixed(2);
      
      this.setData({
        balance: mockBalance
      });
    }
  },

  // 加载交易记录
  loadTransactions: function() {
    if (!this.data.isLoggedIn) return;
    
    this.setData({ loading: true });
    
    // 模拟加载数据
    setTimeout(() => {
      // 模拟交易数据
      const newTransactions = this.getMockTransactions();
      
      // 根据当前标签过滤数据
      let filteredTransactions = newTransactions;
      
      if (this.data.activeTab !== 'all') {
        filteredTransactions = filteredTransactions.filter(item => item.type === this.data.activeTab);
      }
      
      this.setData({
        transactions: this.data.page === 1 ? filteredTransactions : [...this.data.transactions, ...filteredTransactions],
        loading: false,
        hasMore: this.data.page < 3, // 模拟只有3页数据
        page: this.data.page + 1,
        allTransactions: [...this.data.allTransactions, ...newTransactions]
      });
    }, 1000);
  },

  // 获取模拟交易记录数据
  getMockTransactions: function() {
    const transactions = [];
    const types = ['recharge', 'withdraw', 'income', 'expense'];
    const typeTexts = {
      'recharge': '充值',
      'withdraw': '提现',
      'income': '收入',
      'expense': '支出'
    };
    const statusOptions = ['success', 'pending', 'failed'];
    const statusTexts = {
      'success': '成功',
      'pending': '处理中',
      'failed': '失败'
    };
    
    // 生成模拟数据
    for (let i = 0; i < 10; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const amount = (Math.random() * 500 + 10).toFixed(2);
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      
      transactions.push({
        id: `trans_${this.data.page}_${i}`,
        type: type,
        typeText: typeTexts[type],
        amount: type === 'withdraw' || type === 'expense' ? `-${amount}` : amount,
        status: status,
        statusText: statusTexts[status],
        date: formattedDate,
        time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
        description: this.getTransactionDescription(type)
      });
    }
    
    return transactions;
  },

  // 获取交易描述
  getTransactionDescription: function(type) {
    switch(type) {
      case 'recharge':
        return '钱包充值';
      case 'withdraw':
        return '提现到微信钱包';
      case 'income':
        return '订单收入';
      case 'expense':
        return '订单支出';
      default:
        return '交易';
    }
  },

  // 切换标签
  switchTab: function(e) {
    const type = e.currentTarget.dataset.type;
    
    if (type === this.data.activeTab) return;
    
    this.setData({
      activeTab: type,
      transactions: [],
      loading: true,
      hasMore: true,
      page: 1
    });
    
    this.loadTransactions();
  },

  // 显示充值弹窗
  showRecharge: function() {
    if (!this.data.isLoggedIn) {
      this.showLoginTip();
      return;
    }
    
    this.setData({
      showRechargeModal: true,
      rechargeAmount: ''
    });
  },

  // 关闭充值弹窗
  closeRechargeModal: function() {
    this.setData({
      showRechargeModal: false
    });
  },

  // 选择充值金额
  selectRechargeAmount: function(e) {
    const amount = e.currentTarget.dataset.amount;
    
    this.setData({
      rechargeAmount: amount.toString()
    });
  },

  // 输入充值金额
  inputRechargeAmount: function(e) {
    const value = e.detail.value;
    
    this.setData({
      rechargeAmount: value
    });
  },

  // 确认充值
  confirmRecharge: function() {
    const amount = parseFloat(this.data.rechargeAmount);
    
    if (isNaN(amount) || amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }
    
    // 模拟调用微信支付
    wx.showLoading({
      title: '请求支付中'
    });
    
    // 模拟支付过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 更新余额
      const newBalance = parseFloat(this.data.balance) + amount;
      
      this.setData({
        balance: newBalance.toFixed(2),
        showRechargeModal: false
      });
      
      // 添加新的交易记录
      const now = new Date();
      const newTransaction = {
        id: `trans_new_${now.getTime()}`,
        type: 'recharge',
        typeText: '充值',
        amount: amount.toFixed(2),
        status: 'success',
        statusText: '成功',
        date: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        description: '钱包充值'
      };
      
      this.setData({
        transactions: [newTransaction, ...this.data.transactions]
      });
      
      wx.showToast({
        title: '充值成功',
        icon: 'success'
      });
    }, 2000);
  },

  // 显示提现弹窗
  showWithdraw: function() {
    if (!this.data.isLoggedIn) {
      this.showLoginTip();
      return;
    }
    
    this.setData({
      showWithdrawModal: true,
      withdrawAmount: '',
      withdrawFee: 0,
      actualWithdrawAmount: 0
    });
  },

  // 关闭提现弹窗
  closeWithdrawModal: function() {
    this.setData({
      showWithdrawModal: false
    });
  },

  // 选择提现金额
  selectWithdrawAmount: function(e) {
    const amount = e.currentTarget.dataset.amount;
    
    this.setData({
      withdrawAmount: amount.toString()
    });
    
    this.calculateWithdrawFee(amount);
  },

  // 输入提现金额
  inputWithdrawAmount: function(e) {
    const value = e.detail.value;
    
    this.setData({
      withdrawAmount: value
    });
    
    this.calculateWithdrawFee(value);
  },

  // 计算提现手续费
  calculateWithdrawFee: function(amountStr) {
    const amount = parseFloat(amountStr);
    
    if (isNaN(amount) || amount <= 0) {
      this.setData({
        withdrawFee: 0,
        actualWithdrawAmount: 0
      });
      return;
    }
    
    // 计算手续费，1%，最低1元
    let fee = amount * this.data.withdrawFeeRate;
    if (fee < this.data.minWithdrawFee) {
      fee = this.data.minWithdrawFee;
    }
    
    // 计算实际到账金额
    const actualAmount = amount - fee;
    
    this.setData({
      withdrawFee: fee.toFixed(2),
      actualWithdrawAmount: actualAmount > 0 ? actualAmount.toFixed(2) : 0
    });
  },

  // 确认提现
  confirmWithdraw: function() {
    const amount = parseFloat(this.data.withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }
    
    if (amount > parseFloat(this.data.balance)) {
      wx.showToast({
        title: '余额不足',
        icon: 'none'
      });
      return;
    }
    
    // 模拟提现过程
    wx.showLoading({
      title: '处理中'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      
      // 更新余额
      const newBalance = parseFloat(this.data.balance) - amount;
      
      this.setData({
        balance: newBalance.toFixed(2),
        showWithdrawModal: false
      });
      
      // 添加新的交易记录
      const now = new Date();
      const newTransaction = {
        id: `trans_new_${now.getTime()}`,
        type: 'withdraw',
        typeText: '提现',
        amount: `-${amount.toFixed(2)}`,
        status: 'success',
        statusText: '成功',
        date: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        description: '提现到微信钱包'
      };
      
      this.setData({
        transactions: [newTransaction, ...this.data.transactions]
      });
      
      wx.showToast({
        title: '提现申请已提交',
        icon: 'success'
      });
    }, 2000);
  },

  /**
   * 查看交易详情
   */
  viewTransactionDetail(e) {
    const transactionId = e.currentTarget.dataset.id;
    const transaction = this.data.transactions.find(item => item.id === transactionId);
    
    if (!transaction) return;
    
    // 记录当前选中的交易记录，用于详情页显示
    wx.setStorageSync('currentTransaction', transaction);
    
    // 导航到交易详情页
    wx.navigateTo({
      url: `/pages/transaction-detail/transaction-detail?id=${transactionId}`
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      page: 1,
      transactions: [],
      hasMore: true
    });
    
    this.getWalletBalance();
    this.loadTransactions();
    
    wx.stopPullDownRefresh();
  },
  
  // 上拉加载更多
  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadTransactions();
    }
  },
  
  // 显示登录提示
  showLoginTip: function() {
    wx.showModal({
      title: '提示',
      content: '请先登录后再使用该功能',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 导出交易记录
  exportTransactions() {
    wx.showLoading({
      title: '正在准备导出...'
    });
    
    // 过滤当前选中类型的交易记录
    const records = this.filterTransactionsByType(this.data.activeTab);
    
    // 设置要导出的数据
    wx.setStorageSync('exportTransactions', {
      records: records,
      date: new Date().toISOString(),
      type: this.data.activeTab,
      userName: this.data.userInfo.nickName || '用户'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.navigateTo({
        url: '/pages/export-transactions/export-transactions'
      });
    }, 1000);
  },
  
  /**
   * 根据类型过滤交易记录
   */
  filterTransactionsByType(type) {
    if (type === 'all') {
      return this.data.allTransactions;
    }
    
    return this.data.allTransactions.filter(item => {
      switch(type) {
        case 'recharge': return item.type === 'recharge';
        case 'withdraw': return item.type === 'withdraw';
        case 'income': return ['order_income', 'refund', 'reward'].includes(item.type);
        case 'expense': return ['order_payment', 'fee', 'penalty'].includes(item.type);
        default: return true;
      }
    });
  },

  // 这里可能缺少了一些方法
  // 添加一个临时的空方法以修复语法错误
  tempFixMethod: function() {
    // 这是一个临时方法，用于修复语法错误
  }
})