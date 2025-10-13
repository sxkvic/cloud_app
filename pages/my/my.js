// pages/my/my.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    activeRole: 'user', // 'user' or 'worker'
    showRoleSheet: false,
    
    // Mock Data
    keyStats: [
      { value: '128.50', unit: '元', label: '话费余额' },
      { value: '80.5', unit: 'GB', label: '剩余流量' },
      { value: '350', unit: '分钟', label: '剩余语音' },
    ],
    mainServices: [
      { iconText: '💰', text: '充值缴费', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { iconText: '📦', text: '套餐余量', color: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
      { iconText: '🧾', text: '电子发票', color: 'linear-gradient(135deg, #16a085 0%, #f4d03f 100%)' },
      { iconText: '📋', text: '我的订单', color: 'linear-gradient(135deg, #d38312 0%, #a83279 100%)' },
    ],
    settingsLinks: [
      { iconText: '📍', text: '地址管理', route: '/pages/address/address' },
      { iconText: '🆔', text: '实名认证', route: '/pages/verify/verify' },
      { iconText: '⚙️', text: '设置', route: '/pages/settings/settings' },
    ],
    roleActions: [
      {
        name: '个人中心',
        value: 'user',
        selected: true
      },
      {
        name: '师傅中心',
        value: 'worker',
        selected: false
      }
    ]
  },

  onLoad() {
    console.log('我的页面加载');
  },

  onShow() {
    console.log('我的页面显示');
  },

  // 显示角色选择面板
  showRoleSheet() {
    this.setData({ showRoleSheet: true });
  },

  // 关闭角色选择面板
  onCloseRoleSheet() {
    this.setData({ showRoleSheet: false });
  },

  // 停止事件冒泡
  stopPropagation() {
    // 阻止事件冒泡
  },

  // 选择角色
  onRoleSelect(e) {
    const item = e.currentTarget.dataset.item;
    
    if (this.data.activeRole !== item.value) {
      this.setData({
        activeRole: item.value,
        'roleActions[0].selected': item.value === 'user',
        'roleActions[1].selected': item.value === 'worker'
      });
      
      message.success(`已切换到${item.name}`);
      
      setTimeout(() => {
        if (item.value === 'worker') {
          navigation.switchTab('/pages/master-home/master-home');
        } else {
          navigation.switchTab('/pages/home/home');
        }
      }, 800);
    }
    
    this.setData({ showRoleSheet: false });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '您确定要退出登录吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          message.success('您已成功退出');
          setTimeout(() => {
            navigation.redirectTo('/pages/login/login');
          }, 1000);
        }
      }
    });
  },

  // 导航到页面
  navigateToPage(e) {
    const route = e.currentTarget.dataset.route;
    if (route) {
      navigation.navigateTo(route);
    } else {
      message.error('功能开发中，敬请期待');
    }
  }
});