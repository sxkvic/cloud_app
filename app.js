// app.js
App({
  onLaunch() {
    console.log('云网宽带小程序启动');
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 登录
    wx.login({
      success: res => {
        console.log('登录成功', res.code);
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    });
  },
  
  onShow() {
    console.log('小程序显示');
  },
  
  onHide() {
    console.log('小程序隐藏');
  },
  
  onError(msg) {
    console.error('小程序错误', msg);
  },
  
  globalData: {
    userInfo: null,
    userRole: null, // 'user' 或 'master'
    isLoggedIn: false
  }
})

