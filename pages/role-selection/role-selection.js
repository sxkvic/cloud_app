// pages/role-selection/role-selection.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    loading: false,
    activeRole: 'user', // 'user' or 'worker'
    roles: {
      user: {
        title: '欢迎用户',
        description: '办理业务、查询账单、联系客服'
      },
      worker: {
        title: '欢迎安装师傅',
        description: '工单管理、日程安排、材料申请'
      }
    }
  },

  onLoad() {
    console.log('角色选择页加载');
  },

  onShow() {
    console.log('角色选择页显示');
  },

  // 选择角色
  selectRole(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({
      activeRole: role
    });
  },

  // 确认角色并跳转
  confirmRole() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    setTimeout(() => {
      this.setData({ loading: false });
      
      const role = this.data.activeRole;
      if (role === 'user') {
        message.success('选择用户身份成功！');
        setTimeout(() => {
          navigation.navigateTo('/pages/bind-device-code/bind-device-code');
        }, 800);
      } else {
        message.success('进入安装师傅系统成功！');
        setTimeout(() => {
          navigation.navigateTo('/pages/master-home/master-home');
        }, 800);
      }
    }, 1500);
  },

  // 显示用户协议
  showAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '这里是用户协议的内容...\n\n请您仔细阅读并同意相关条款后继续使用我们的服务。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 显示隐私政策
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策的内容...\n\n我们承诺保护您的个人信息安全，详细条款请查看完整版本。',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});

