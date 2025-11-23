// pages/my/my.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    userInfo: {
      name: '王女士',
      phone: '138****8888',
      avatar: '/images/avatar-placeholder.png'
    },
    accountInfo: {
      balance: '128.50',
      points: '2580',
      coupons: '3'
    },
    quickServices: [
      { id: '1', name: '我的账单', icon: '📋', url: '/pages/my-bill/my-bill' },
      { id: '2', name: '套餐订购', icon: '📦', url: '/pages/package-order/package-order' },
      { id: '3', name: '预充值', icon: '💰', url: '/pages/pre-recharge/pre-recharge' },
      { id: '4', name: '业务申请', icon: '📝', url: '/pages/business-application/business-application' },
      { id: '5', name: '服务评价', icon: '⭐', url: '/pages/service-evaluation/service-evaluation' },
      { id: '6', name: '客服中心', icon: '💬', url: '/pages/customer-service/customer-service' }
    ],
    settingsList: [
      { id: '1', name: '个人资料', icon: '👤', action: 'profile' },
      { id: '2', name: '关于我们', icon: 'ℹ️', action: 'about' },
      { id: '3', name: '联系客服', icon: '📞', action: 'contact' }
    ]
  },

  onLoad() {
    console.log('我的页面加载');
    this.loadUserData();
  },

  onShow() {
    console.log('我的页面显示');
  },

  // 加载用户数据
  loadUserData() {
    // TODO: 从服务器加载用户信息和账户信息
    console.log('加载用户数据');
  },

  // 导航到服务页面
  navigateToService(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      navigation.navigateTo(url);
    }
  },


  // 处理设置操作
  handleSetting(e) {
    const action = e.currentTarget.dataset.action;
    
    switch (action) {
      case 'profile':
        message.success('跳转到个人资料页面');
        break;
      case 'about':
        this.showAboutInfo();
        break;
      case 'contact':
        this.contactService();
        break;
    }
  },

  // 显示关于信息
  showAboutInfo() {
    wx.showModal({
      title: '关于我们',
      content: '云网宽带小程序\n版本：v1.0.0\n\n为您提供便捷的宽带服务管理功能。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00',
      confirmText: '拨打电话',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567'
          });
        }
      }
    });
  },

  // Tabbar切换事件
  onTabChange(event) {
    const index = event.detail;
    if (index === 0) {
      wx.redirectTo({
        url: '/pages/home/home'
      });
    }
  }
});