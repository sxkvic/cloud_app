// pages/splash/splash.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    loadingText: "正在启动...",
    loadingTexts: [
      "正在启动...",
      "加载资源中...",
      "初始化服务...",
      "准备就绪..."
    ],
    currentTextIndex: 0
  },

  onLoad() {
    console.log('启动页加载');
    this.startLoadingAnimation();
    this.startSplashSequence();
  },

  onUnload() {
    if (this.textTimer) {
      clearInterval(this.textTimer);
    }
    if (this.splashTimer) {
      clearTimeout(this.splashTimer);
    }
  },

  startLoadingAnimation() {
    // 循环切换加载文字
    this.textTimer = setInterval(() => {
      const nextIndex = (this.data.currentTextIndex + 1) % this.data.loadingTexts.length;
      this.setData({
        currentTextIndex: nextIndex,
        loadingText: this.data.loadingTexts[nextIndex]
      });
    }, 800);
  },

  startSplashSequence() {
    // 3秒后跳转到登录页面
    this.splashTimer = setTimeout(() => {
      this.navigateToLogin();
    }, 3000);
  },

  navigateToLogin() {
    // 清理定时器
    if (this.textTimer) {
      clearInterval(this.textTimer);
    }
    
    // 添加淡出效果后跳转
    this.setData({
      fadeOut: true
    });
    
    setTimeout(() => {
      navigation.redirectTo('/pages/login/login');
    }, 500);
  }
});

