// pages/login/login.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const app = getApp();

Page({
  data: {
    loading: false
  },

  onLoad() {
    console.log('登录页加载');
    // 每次进入登录页都要求用户重新登录，不做自动跳转
  },

  onShow() {
    console.log('登录页显示');
  },

  // 微信登录
  async onWeChatLogin() {
    // 防止重复调用
    if (this.data.loading) {
      console.log('登录进行中，忽略重复调用');
      return;
    }

    console.log("Starting WeChat Login...");
    this.setData({ loading: true });

    try {
      // 1. 调用微信登录获取code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      if (!loginRes.code) {
        throw new Error('获取微信授权失败');
      }

      const code = loginRes.code;
      console.log('获取到微信code:', code);

      // 2. 通过code获取openid
      const openidResult = await API.getOpenidByCode(code);
      const openid = openidResult.data.openid;
      console.log('获取到openid:', openid);

      // 保存openid
      app.globalData.openid = openid;
      wx.setStorageSync('openid', openid);

      // 3. 尝试生成token（如果用户已存在）
      try {
        const tokenResult = await API.generateTokenByOpenid(openid);
        const token = tokenResult.data.token;
        console.log('用户已存在，获取到token');

        // 保存token
        app.globalData.token = token;
        app.globalData.isLoggedIn = true;
        wx.setStorageSync('token', token);

        // 4. 获取用户信息
        const userInfoResult = await API.getUserInfo();
        app.globalData.userInfo = userInfoResult.data;
        wx.setStorageSync('userInfo', userInfoResult.data);

        // 5. 检查设备绑定状态（老用户也需要检查）
        await this.checkDeviceBindingAndNavigate();

      } catch (tokenError) {
        // 用户不存在，创建新用户
        console.log('用户不存在，创建新用户');

        const createUserResult = await API.createUser({
          openid: openid,
          nickname: '微信用户',
          avatar: ''
        });

        const token = createUserResult.data.token;
        app.globalData.token = token;
        app.globalData.isLoggedIn = true;
        wx.setStorageSync('token', token);

        // 保存用户信息
        if (createUserResult.data.userInfo) {
          app.globalData.userInfo = createUserResult.data.userInfo;
          wx.setStorageSync('userInfo', createUserResult.data.userInfo);
        }

        this.setData({ loading: false });
        message.success('注册成功！');

        // 新用户直接跳转到设备绑定页面
        setTimeout(() => {
          navigation.navigateTo('/pages/bind-device-code/bind-device-code');
        }, 800);
      }

    } catch (error) {
      console.error('登录失败:', error);
      this.setData({ loading: false });

      // 显示友好的错误提示
      const errorMsg = error.message || '登录失败，请重试';
      message.error(errorMsg);
    }
  },

  // 检查设备绑定状态并导航
  async checkDeviceBindingAndNavigate() {
    try {
      console.log('检查用户设备绑定状态...');
      
      // 调用API获取用户绑定的设备列表
      const devicesResult = await API.getUserDevices();
      const devices = devicesResult.data.devices || [];
      
      console.log('用户绑定的设备:', devices);
      
      if (devices.length > 0) {
        // 用户已绑定设备
        const deviceCode = devices[0].deviceCode;
        app.globalData.deviceBound = true;
        app.globalData.deviceCode = deviceCode;
        wx.setStorageSync('deviceBound', true);
        wx.setStorageSync('deviceCode', deviceCode);
        
        this.setData({ loading: false });
        message.success('登录成功！');
        
        console.log('用户已绑定设备，跳转首页');
        setTimeout(() => {
          navigation.switchTab('/pages/home/home');
        }, 800);
      } else {
        // 用户未绑定设备
        this.setData({ loading: false });
        message.success('登录成功，请绑定设备');
        
        console.log('用户未绑定设备，跳转设备绑定页面');
        setTimeout(() => {
          navigation.navigateTo('/pages/bind-device-code/bind-device-code');
        }, 800);
      }
    } catch (error) {
      console.error('检查设备绑定失败:', error);
      // 如果检查失败，也跳转到设备绑定页面
      this.setData({ loading: false });
      message.success('登录成功，请绑定设备');
      
      setTimeout(() => {
        navigation.navigateTo('/pages/bind-device-code/bind-device-code');
      }, 800);
    }
  },


  // 显示协议
  showAgreement(e) {
    e.stopPropagation();
    wx.showModal({
      title: '用户服务协议',
      content: '这里是用户服务协议的内容...\n\n1. 服务条款\n2. 隐私政策\n3. 免责声明',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话: 400-123-4567\n工作时间: 9:00-18:00',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});

