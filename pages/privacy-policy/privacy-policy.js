// pages/privacy-policy/privacy-policy.js
Page({
  data: {
    
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '隐私政策'
    });
  },

  onShareAppMessage() {
    return {
      title: '云宽带隐私政策',
      path: '/pages/privacy-policy/privacy-policy'
    };
  }
});
