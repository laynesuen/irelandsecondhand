const app = getApp();
const { t } = require('../../utils/i18n/index');

Page({
  data: {
    isLoggedIn: false,
    user: null,
    verificationStatus: 'unverified', // unverified, verified, inProgress
    loading: false,
    error: null,
    stepIndex: 0,
    steps: [
      { title: '实名认证', desc: '验证身份信息' },
      { title: '上传证件', desc: '上传身份证明' },
      { title: '提交审核', desc: '等待系统审核' }
    ]
  },

  onLoad: function(options) {
    // 检查用户是否已登录
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        isLoggedIn: true,
        user: userInfo
      });
      
      // 获取认证状态
      this.checkVerificationStatus();
    }
    
    // 更新多语言
    this.updatePageText();
  },
  
  onShow: function() {
    // 当页面显示时，更新多语言文本
    this.updatePageText();
  },
  
  updatePageText: function() {
    this.setData({
      steps: [
        { title: t('verification.title'), desc: t('verification.info.item1') },
        { title: t('verification.info.item2'), desc: t('verification.info.item3') },
        { title: t('verification.info.item4'), desc: '' }
      ],
      pageTitle: t('verification.title'),
      pageSubtitle: t('verification.subtitle'),
      verifiedText: t('verification.status.verified'),
      unverifiedText: t('verification.status.unverified'),
      inProgressText: t('verification.status.inProgress'),
      startVerifyBtn: t('verification.button.startVerify'),
      goLoginBtn: t('verification.button.goLogin')
    });
  },

  // 检查用户的实名认证状态
  checkVerificationStatus: function() {
    this.setData({ loading: true, error: null });
    
    wx.cloud.callFunction({
      name: 'checkVerificationStatus',
      data: {}
    }).then(res => {
      if (res.result && res.result.code === 0) {
        this.setData({
          verificationStatus: res.result.data.status || 'unverified',
          loading: false
        });
      } else {
        this.setData({
          error: res.result.message || '获取认证状态失败',
          loading: false
        });
      }
    }).catch(err => {
      console.error('[验证状态] 调用失败', err);
      this.setData({
        error: '网络错误，请重试',
        loading: false
      });
    });
  },

  // 前往登录页面
  goToLogin: function() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },
  
  // 开始实名认证流程
  startVerification: function() {
    if (app.globalData.realNameAuthRequired) {
      // 更新步骤
      this.setData({
        stepIndex: 1
      });
      
      // 使用微信实名认证快捷方式（小程序实名认证）
      wx.startVerify({
        name: this.data.user.nickName,
        complete: (res) => {
          if (res.errMsg === 'startVerify:ok') {
            this.submitVerification(res.verifyResult);
          } else {
            this.setData({
              error: '认证失败，请重试',
              stepIndex: 0
            });
          }
        }
      });
    } else {
      // 进入手动认证流程
      wx.navigateTo({
        url: '/pages/verification/manual-verification'
      });
    }
  },
  
  // 提交认证结果
  submitVerification: function(verifyResult) {
    this.setData({
      loading: true,
      error: null,
      stepIndex: 2
    });
    
    wx.cloud.callFunction({
      name: 'submitVerification',
      data: {
        verifyResult: verifyResult
      }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        // 认证成功
        wx.showToast({
          title: t('verification.message.success'),
          icon: 'success'
        });
        
        // 更新状态
        this.setData({
          verificationStatus: 'verified',
          loading: false
        });
        
        // 延迟返回
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        this.setData({
          error: res.result.message || t('verification.message.fail'),
          loading: false,
          stepIndex: 0
        });
      }
    }).catch(err => {
      console.error('[提交认证] 调用失败', err);
      this.setData({
        error: '网络错误，请重试',
        loading: false,
        stepIndex: 0
      });
    });
  }
}); 