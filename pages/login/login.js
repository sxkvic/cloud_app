// pages/login/login.js
const { navigation, message, cacheManager } = require('../../utils/common');
const API = require('../../utils/api');
const DataManager = require('../../utils/dataManager');
const app = getApp();

Page({
  data: {
    loading: false,
    agreed: false  // 隐私协议同意状态
  },

  onLoad() {
    // 每次进入登录页都要求用户重新登录，不做自动跳转
  },

  onShow() {
  },

  // 隐私协议勾选变化
  onAgreeChange(e) {
    const agreed = e.detail.value.length > 0;
    this.setData({ agreed });
  },

  // 跳转到用户协议
  navigateToUserAgreement(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    wx.navigateTo({
      url: '/pages/user-agreement/user-agreement',
      fail: (err) => {
        console.error('跳转用户协议失败:', err);
      }
    });
  },

  // 跳转到隐私政策
  navigateToPrivacyPolicy(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    wx.navigateTo({
      url: '/pages/privacy-policy/privacy-policy',
      fail: (err) => {
        console.error('跳转隐私政策失败:', err);
      }
    });
  },

  // 微信登录
  async onWeChatLogin() {
    // 检查是否同意协议
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意用户协议和隐私政策',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 防止重复调用
    if (this.data.loading) {
      return;
    }

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

      // 2. 通过code获取openid
      const openidResult = await API.getOpenidByCode(code);
      const openid = openidResult.data.openid;

      // 保存openid
      app.globalData.openid = openid;
      wx.setStorageSync('openid', openid);

      // 3. 尝试生成token（如果用户已存在）
      try {
        const tokenResult = await API.generateTokenByOpenid(openid);
        const token = tokenResult.data.token;

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

        // 新用户直接跳转到设备绑定页面，不显示中间提示避免闪烁
        this.setData({ loading: false });
        
        setTimeout(() => {
          navigation.navigateTo('/pages/bind-device-code/bind-device-code');
        }, 300);
      }

    } catch (error) {
      console.error('登录失败:', error);
      this.setData({ loading: false });

      // 显示友好的错误提示，延长显示时间到3秒
      const errorMsg = error.message || '登录失败，请重试';
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000  // 错误提示停留3秒
      });
    }
  },

  // 检查设备绑定状态并导航（简化版：只保存设备码）
  async checkDeviceBindingAndNavigate() {
    try {
      // 调用API获取用户绑定的设备列表
      const devicesResult = await API.getUserDevices();
      const devices = devicesResult.data.devices || [];
      
      if (devices.length > 0) {
        // 用户已绑定设备，只保存设备码
        const firstDevice = devices[0];
        const deviceCode = firstDevice.deviceCode || firstDevice.device_no;
        
        // 只保存设备码，其他数据实时获取
        DataManager.saveDeviceCode(deviceCode);
        app.globalData.deviceBound = true;
        app.globalData.device_no = deviceCode;
        
        // 跳转首页
        setTimeout(() => {
          this.setData({ loading: false });
          navigation.switchTab('/pages/home/home');
        }, 300);
      } else {
        // 用户未绑定设备
        cacheManager.clearDeviceCache();
        
        setTimeout(() => {
          this.setData({ loading: false });
          navigation.navigateTo('/pages/bind-device-code/bind-device-code');
        }, 300);
      }
    } catch (error) {
      console.error('检查设备绑定失败:', error);
      setTimeout(() => {
        this.setData({ loading: false });
        navigation.navigateTo('/pages/bind-device-code/bind-device-code');
      }, 300);
    }
  },


  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话: 4009677726\n工作时间: 9:00-18:00',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});

