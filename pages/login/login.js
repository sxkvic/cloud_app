// pages/login/login.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    agreed: false,
    loading: false
  },

  onLoad() {
    console.log('登录页加载');
  },

  onShow() {
    console.log('登录页显示');
  },

  // 微信登录
  onWeChatLogin() {
    if (!this.data.agreed) {
      message.error('请先阅读并同意用户服务协议');
      return;
    }
    
    console.log("Starting WeChat Login...");
    this.setData({ loading: true });

    // 模拟微信授权过程
    setTimeout(() => {
      this.setData({ loading: false });
      message.success("授权成功！即将跳转...");
      setTimeout(() => {
        navigation.navigateTo('/pages/role-selection/role-selection');
      }, 800);
    }, 1500);
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

