// pages/login/login.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const app = getApp();

Page({
  data: {
    agreed: false,
    loading: false
  },

  onLoad() {
    console.log('登录页加载');

    // 检查是否已经登录
    if (app.globalData.token && app.globalData.isLoggedIn) {
      console.log('用户已登录，跳转到首页');
      navigation.switchTab('/pages/home/home');
    }
  },

  onShow() {
    console.log('登录页显示');
  },

  // 微信登录
  async onWeChatLogin() {
    if (!this.data.agreed) {
      message.error('请先阅读并同意用户服务协议');
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

        this.setData({ loading: false });
        message.success('登录成功！');

        // 跳转到首页
        setTimeout(() => {
          navigation.switchTab('/pages/home/home');
        }, 800);

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

        // 跳转到设备绑定页面
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

  // 获取用户信息回调
  onGetUserInfo(e) {
    console.log('用户信息:', e.detail);
    if (e.detail.userInfo) {
      // 用户点击了允许授权
      this.onWeChatLogin();
    } else {
      // 用户点击了拒绝授权
      message.error('需要授权才能继续使用');
    }
  },

  // 切换协议同意状态
  toggleAgreement() {
    this.setData({
      agreed: !this.data.agreed
    });
  },

  // 显示协议
  showAgreement(e) {
    e.stopPropagation();
    wx.showModal({
      title: '用户服务协议',
      content: '这里是用户服务协议的内容...\n\n1. 服务条款\n2. 隐私政策\n3. 免责声明\n\n点击确定表示您已阅读并同意以上条款。',
      showCancel: true,
      cancelText: '取消',
      confirmText: '我同意',
      success: (res) => {
        if (res.confirm) {
          this.setData({ agreed: true });
        }
      }
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

