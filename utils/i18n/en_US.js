// English language pack
module.exports = {
  __name: 'English',
  
  // Common text
  common: {
    app: {
      name: 'Aidao Shaodai',
      slogan: 'Cross-border Carrying Service Platform'
    },
    button: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      back: 'Back',
      submit: 'Submit',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      next: 'Next',
      prev: 'Previous',
      search: 'Search',
      filter: 'Filter',
      loading: 'Loading...',
      reload: 'Reload',
      retry: 'Retry',
      login: 'Login',
      logout: 'Logout',
      register: 'Register'
    },
    time: {
      now: 'Just now',
      minutesAgo: '{{count}} minutes ago',
      hoursAgo: '{{count}} hours ago',
      daysAgo: '{{count}} days ago',
      weeksAgo: '{{count}} weeks ago',
      monthsAgo: '{{count}} months ago',
      yearsAgo: '{{count}} years ago'
    },
    placeholder: {
      search: 'Search...',
      date: 'Please select a date',
      time: 'Please select a time',
      select: 'Please select',
      input: 'Please input'
    },
    validation: {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid phone number',
      length: 'Length should be between {{min}} and {{max}} characters',
      number: 'Please enter a valid number',
      password: 'Password must be at least 8 characters',
      passwordMatch: 'Passwords do not match'
    },
    message: {
      success: 'Operation successful',
      error: 'Operation failed',
      networkError: 'Network error, please check your connection',
      loading: 'Loading...',
      saved: 'Saved successfully',
      deleted: 'Deleted successfully',
      updated: 'Updated successfully',
      noData: 'No data available',
      welcome: 'Welcome to Aidao Shaodai'
    }
  },
  
  // Page titles
  pageTitle: {
    home: 'Home',
    login: 'Login',
    register: 'Register',
    profile: 'Profile',
    settings: 'Settings',
    publish: 'Publish',
    tripList: 'Trip List',
    tripDetail: 'Trip Details',
    carryList: 'Carry List',
    carryDetail: 'Carry Details',
    orderDetail: 'Order Details',
    chat: 'Chat',
    verification: 'Identity Verification',
    payment: 'Payment',
    wallet: 'Wallet',
    language: 'Language Settings',
    about: 'About Us',
    help: 'Help Center',
    feedback: 'Feedback'
  },
  
  // Home page
  home: {
    search: {
      placeholder: 'Search origin, destination',
      filter: 'Filter'
    },
    category: {
      all: 'All',
      popular: 'Popular',
      nearby: 'Nearby',
      new: 'Latest',
      price: 'Price'
    },
    banner: {
      title: 'Safe Carrying, Honest Trading',
      subtitle: 'Cross-border Carrying, Easy and Reliable'
    },
    section: {
      recentTrip: 'Latest Trips',
      hotCarry: 'Popular Carries',
      recommended: 'Recommended Services',
      viewMore: 'View More'
    }
  },
  
  // User center
  user: {
    profile: {
      title: 'Profile',
      avatar: 'Avatar',
      nickname: 'Nickname',
      gender: 'Gender',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      birthday: 'Birthday',
      male: 'Male',
      female: 'Female',
      unknown: 'Unknown'
    },
    auth: {
      title: 'Identity Verification',
      status: {
        verified: 'Verified',
        unverified: 'Unverified',
        pending: 'Pending'
      },
      button: 'Verify Now',
      success: 'Verification Successful',
      fail: 'Verification Failed'
    },
    wallet: {
      title: 'My Wallet',
      balance: 'Balance',
      deposit: 'Deposit',
      income: 'Income',
      expense: 'Expense',
      recharge: 'Recharge',
      withdraw: 'Withdraw',
      history: 'Transaction History'
    },
    order: {
      title: 'My Orders',
      all: 'All',
      pending: 'Pending Payment',
      processing: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      refunding: 'Refunding'
    },
    settings: {
      title: 'Settings',
      notification: 'Notification Settings',
      language: 'Language Settings',
      currency: 'Currency Settings',
      privacy: 'Privacy Settings',
      about: 'About Us',
      feedback: 'Feedback',
      logout: 'Logout'
    }
  },
  
  // Carry related
  carry: {
    publish: {
      title: 'Publish Carry',
      from: 'Origin',
      to: 'Destination',
      date: 'Departure Date',
      time: 'Departure Time',
      space: 'Available Space',
      weight: 'Acceptable Weight',
      reward: 'Reward Amount',
      description: 'Description',
      submit: 'Publish',
      draft: 'Save Draft',
      preview: 'Preview'
    },
    detail: {
      title: 'Carry Details',
      route: 'Route',
      date: 'Date & Time',
      space: 'Available Space',
      weight: 'Acceptable Weight',
      reward: 'Reward Amount',
      publisher: 'Publisher',
      status: 'Status',
      contactUser: 'Contact User',
      makeOrder: 'Place Order',
      share: 'Share'
    },
    status: {
      open: 'Available',
      inProgress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    }
  },
  
  // Order related
  order: {
    create: {
      title: 'Create Order',
      item: 'Item Information',
      quantity: 'Quantity',
      weight: 'Weight',
      size: 'Size',
      reward: 'Reward',
      note: 'Note',
      submit: 'Submit Order'
    },
    detail: {
      title: 'Order Details',
      orderNo: 'Order Number',
      createTime: 'Creation Time',
      status: 'Order Status',
      item: 'Item Information',
      reward: 'Reward',
      contact: 'Contact',
      cancel: 'Cancel Order',
      confirm: 'Confirm Completion',
      payNow: 'Pay Now',
      applyRefund: 'Apply for Refund'
    },
    status: {
      pendingPayment: 'Pending Payment',
      paid: 'Paid',
      inProgress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      refunding: 'Refunding',
      refunded: 'Refunded'
    }
  },
  
  // Message related
  message: {
    center: {
      title: 'Message Center',
      chat: 'Chat Messages',
      notification: 'System Notifications',
      order: 'Order Messages',
      noMessage: 'No Messages'
    },
    chat: {
      send: 'Send',
      inputPlaceholder: 'Type a message...',
      image: 'Image',
      voice: 'Voice',
      location: 'Location'
    },
    notification: {
      orderStatusChange: 'Order Status Change',
      newMessage: 'New Message',
      systemNotice: 'System Notice'
    }
  },
  
  // Payment related
  payment: {
    method: {
      wechat: 'WeChat Pay',
      applePay: 'Apple Pay',
      bankCard: 'Bank Card'
    },
    currency: {
      cny: 'CNY',
      eur: 'EUR'
    },
    status: {
      success: 'Payment Successful',
      fail: 'Payment Failed',
      processing: 'Processing',
      cancelled: 'Cancelled'
    },
    button: {
      pay: 'Pay Now',
      cancel: 'Cancel Payment'
    }
  },
  
  // Verification related
  verification: {
    title: 'Identity Verification',
    subtitle: 'Complete identity verification to post information, ensuring transaction security',
    info: {
      title: 'Verification Instructions',
      item1: 'Identity verification information is only used for identification',
      item2: 'All information is kept confidential and will not be disclosed to third parties',
      item3: 'After verification, you can publish and accept carrying services',
      item4: 'Verification cannot be revoked or modified once completed'
    },
    method: {
      title: 'Verification Method',
      wechat: 'WeChat Quick Verification',
      wechatDesc: 'Complete verification quickly with WeChat identity information'
    },
    status: {
      verified: 'You have completed identity verification',
      unverified: 'You have not completed identity verification',
      inProgress: 'Verification in progress'
    },
    button: {
      goLogin: 'Go to Login',
      startVerify: 'Start Verification'
    },
    message: {
      success: 'Verification Successful',
      fail: 'Verification Failed',
      needLogin: 'Please login first'
    }
  },
  
  // Settings related
  settings: {
    language: {
      title: 'Language Settings',
      auto: 'System Language',
      zhCN: '简体中文',
      enUS: 'English',
      current: 'Current Language'
    }
  }
}; 