// 中文语言包
module.exports = {
  __name: '简体中文',
  
  // 通用文本
  common: {
    app: {
      name: '爱岛捎带',
      slogan: '跨境捎带服务平台'
    },
    button: {
      confirm: '确认',
      cancel: '取消',
      back: '返回',
      submit: '提交',
      save: '保存',
      edit: '编辑',
      delete: '删除',
      next: '下一步',
      prev: '上一步',
      search: '搜索',
      filter: '筛选',
      loading: '加载中...',
      reload: '重新加载',
      retry: '重试',
      login: '登录',
      logout: '退出登录',
      register: '注册'
    },
    time: {
      now: '刚刚',
      minutesAgo: '{{count}}分钟前',
      hoursAgo: '{{count}}小时前',
      daysAgo: '{{count}}天前',
      weeksAgo: '{{count}}周前',
      monthsAgo: '{{count}}个月前',
      yearsAgo: '{{count}}年前'
    },
    placeholder: {
      search: '搜索...',
      date: '请选择日期',
      time: '请选择时间',
      select: '请选择',
      input: '请输入'
    },
    validation: {
      required: '此项为必填项',
      email: '请输入有效的邮箱地址',
      phone: '请输入有效的手机号码',
      length: '长度应为{{min}}到{{max}}个字符',
      number: '请输入有效的数字',
      password: '密码长度至少为8位',
      passwordMatch: '两次输入的密码不一致'
    },
    message: {
      success: '操作成功',
      error: '操作失败',
      networkError: '网络错误，请检查网络连接',
      loading: '加载中...',
      saved: '保存成功',
      deleted: '删除成功',
      updated: '更新成功',
      noData: '暂无数据',
      welcome: '欢迎使用爱岛捎带'
    }
  },
  
  // 页面标题
  pageTitle: {
    home: '首页',
    login: '登录',
    register: '注册',
    profile: '个人中心',
    settings: '设置',
    publish: '发布',
    tripList: '行程列表',
    tripDetail: '行程详情',
    carryList: '捎带列表',
    carryDetail: '捎带详情',
    orderDetail: '订单详情',
    chat: '聊天',
    verification: '实名认证',
    payment: '支付',
    wallet: '钱包',
    language: '语言设置',
    about: '关于我们',
    help: '帮助中心',
    feedback: '意见反馈'
  },
  
  // 首页
  home: {
    search: {
      placeholder: '搜索出发地、目的地',
      filter: '筛选'
    },
    category: {
      all: '全部',
      popular: '热门',
      nearby: '附近',
      new: '最新',
      price: '价格'
    },
    banner: {
      title: '安全捎带，诚信交易',
      subtitle: '跨境捎带，轻松可靠'
    },
    section: {
      recentTrip: '最新行程',
      hotCarry: '热门捎带',
      recommended: '推荐服务',
      viewMore: '查看更多'
    }
  },
  
  // 用户中心
  user: {
    profile: {
      title: '个人资料',
      avatar: '头像',
      nickname: '昵称',
      gender: '性别',
      phone: '手机号',
      email: '邮箱',
      address: '地址',
      birthday: '生日',
      male: '男',
      female: '女',
      unknown: '未知'
    },
    auth: {
      title: '实名认证',
      status: {
        verified: '已认证',
        unverified: '未认证',
        pending: '认证中'
      },
      button: '前往认证',
      success: '认证成功',
      fail: '认证失败'
    },
    wallet: {
      title: '我的钱包',
      balance: '余额',
      deposit: '保证金',
      income: '收入',
      expense: '支出',
      recharge: '充值',
      withdraw: '提现',
      history: '交易记录'
    },
    order: {
      title: '我的订单',
      all: '全部',
      pending: '待付款',
      processing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      refunding: '退款中'
    },
    settings: {
      title: '设置',
      notification: '通知设置',
      language: '语言设置',
      currency: '货币设置',
      privacy: '隐私设置',
      about: '关于我们',
      feedback: '意见反馈',
      logout: '退出登录'
    }
  },
  
  // 捎带相关
  carry: {
    publish: {
      title: '发布捎带',
      from: '出发地',
      to: '目的地',
      date: '出发日期',
      time: '出发时间',
      space: '可用空间',
      weight: '可接受重量',
      reward: '报酬金额',
      description: '描述',
      submit: '发布',
      draft: '保存草稿',
      preview: '预览'
    },
    detail: {
      title: '捎带详情',
      route: '行程路线',
      date: '日期时间',
      space: '可用空间',
      weight: '可接受重量',
      reward: '报酬金额',
      publisher: '发布者',
      status: '状态',
      contactUser: '联系用户',
      makeOrder: '下单',
      share: '分享'
    },
    status: {
      open: '可接单',
      inProgress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }
  },
  
  // 订单相关
  order: {
    create: {
      title: '创建订单',
      item: '物品信息',
      quantity: '数量',
      weight: '重量',
      size: '尺寸',
      reward: '报酬',
      note: '备注',
      submit: '提交订单'
    },
    detail: {
      title: '订单详情',
      orderNo: '订单编号',
      createTime: '创建时间',
      status: '订单状态',
      item: '物品信息',
      reward: '报酬',
      contact: '联系对方',
      cancel: '取消订单',
      confirm: '确认完成',
      payNow: '立即支付',
      applyRefund: '申请退款'
    },
    status: {
      pendingPayment: '待付款',
      paid: '已付款',
      inProgress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      refunding: '退款中',
      refunded: '已退款'
    }
  },
  
  // 消息相关
  message: {
    center: {
      title: '消息中心',
      chat: '聊天消息',
      notification: '系统通知',
      order: '订单消息',
      noMessage: '暂无消息'
    },
    chat: {
      send: '发送',
      inputPlaceholder: '输入消息...',
      image: '图片',
      voice: '语音',
      location: '位置'
    },
    notification: {
      orderStatusChange: '订单状态变更',
      newMessage: '新消息',
      systemNotice: '系统通知'
    }
  },
  
  // 支付相关
  payment: {
    method: {
      wechat: '微信支付',
      applePay: 'Apple Pay',
      bankCard: '银行卡支付'
    },
    currency: {
      cny: '人民币',
      eur: '欧元'
    },
    status: {
      success: '支付成功',
      fail: '支付失败',
      processing: '处理中',
      cancelled: '已取消'
    },
    button: {
      pay: '立即支付',
      cancel: '取消支付'
    }
  },
  
  // 验证相关
  verification: {
    title: '实名认证',
    subtitle: '发布信息需要完成实名认证，确保交易安全',
    info: {
      title: '认证说明',
      item1: '实名认证信息仅用于身份验证',
      item2: '所有信息严格保密，不会泄露给第三方',
      item3: '认证通过后可发布和接受捎带服务',
      item4: '认证完成后不可撤销或修改'
    },
    method: {
      title: '认证方式',
      wechat: '微信快捷认证',
      wechatDesc: '通过微信实名信息快速完成认证'
    },
    status: {
      verified: '您已完成实名认证',
      unverified: '您尚未完成实名认证',
      inProgress: '认证处理中'
    },
    button: {
      goLogin: '去登录',
      startVerify: '开始认证'
    },
    message: {
      success: '认证成功',
      fail: '认证失败',
      needLogin: '请先登录'
    }
  },
  
  // 设置相关
  settings: {
    language: {
      title: '语言设置',
      auto: '系统语言',
      zhCN: '简体中文',
      enUS: 'English',
      current: '当前语言'
    }
  }
}; 