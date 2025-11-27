// app.js
App({
  onLaunch() {
    console.log('云宽带小程序启动');

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

      // 恢复设备绑定状态和完整设备信息
      const deviceBound = wx.getStorageSync('deviceBound');
      const device_no = wx.getStorageSync('device_no');
      const device_info = wx.getStorageSync('device_info');
      const customer_info = wx.getStorageSync('customer_info');
      const binding_info = wx.getStorageSync('binding_info');
      
      if (deviceBound && device_no) {
        this.globalData.deviceBound = true;
        this.globalData.device_no = device_no;
        this.globalData.device_info = device_info;
        this.globalData.customer_info = customer_info;
        this.globalData.binding_info = binding_info;
        console.log('✅ 设备绑定状态已恢复:', {
          device_no,
          device_name: device_info?.device_name
        });
      }
      
      // 清理旧的 deviceCode 缓存（如果存在）
      const oldDeviceCode = wx.getStorageSync('deviceCode');
      if (oldDeviceCode) {
        console.log('⚠️ 检测到旧的 deviceCode 缓存，正在清除...');
        wx.removeStorageSync('deviceCode');
        console.log('✅ 旧缓存已清除');
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

    // 设备信息（使用 device_no 替代旧的 deviceCode）
    device_no: null,
    device_info: null,
    customer_info: null,
    binding_info: null,
    deviceBound: false
  }
})

