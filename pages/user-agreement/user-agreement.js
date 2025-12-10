// pages/user-agreement/user-agreement.js
Page({
  data: {
    
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '用户服务协议'
    });
  },

  onShareAppMessage() {
    return {
      title: '云宽带用户服务协议',
      path: '/pages/user-agreement/user-agreement'
    };
  }
});
