// app.js
App({
  onLaunch() {
    console.log('云网宽带小程序启动');

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 恢复本地存储的数据
    this.restoreLocalData();
  },

  /**
   * 恢复本地存储的数据
   */
  restoreLocalData() {
    try {
      // 恢复token
      const token = wx.getStorageSync('token');
      if (token) {
        this.globalData.token = token;
        this.globalData.isLoggedIn = true;
        console.log('Token已恢复');
      }

      // 恢复openid
      const openid = wx.getStorageSync('openid');
      if (openid) {
        this.globalData.openid = openid;
        console.log('OpenID已恢复');
      }

      // 恢复用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
        console.log('用户信息已恢复');
      }

      // 恢复设备绑定状态
      const deviceBound = wx.getStorageSync('deviceBound');
      const deviceCode = wx.getStorageSync('deviceCode');
      if (deviceBound && deviceCode) {
        this.globalData.deviceBound = true;
        this.globalData.deviceCode = deviceCode;
        console.log('设备绑定状态已恢复');
      }
    } catch (error) {
      console.error('恢复本地数据失败:', error);
    }
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
    // API配置
    apiBaseUrl: 'https://www.chmura.cn/node', // API服务器地址

    // 用户信息
    userInfo: null,
    userRole: null, // 'user' 或 'master'
    isLoggedIn: false,

    // 认证信息
    token: null,
    openid: null,

    // 设备信息
    deviceCode: null,
    deviceBound: false
  }
})

