// pages/my/my.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    userInfo: {
      name: '王女士',
      phone: '138****8888',
      avatar: '/images/avatar-placeholder.png',
      level: 'VIP会员',
      levelText: '黄金'
    },
    accountInfo: {
      balance: '128.50',
      points: '2580',
      coupons: '3'
    },
    serviceMenus: [
      { id: '1', name: '我的账单', icon: '📋', url: '/pages/my-bill/my-bill', badge: '' },
      { id: '2', name: '套餐订购', icon: '📦', url: '/pages/package-order/package-order', badge: '' },
      { id: '3', name: '业务申请', icon: '📝', url: '/pages/business-application/business-application', badge: '' },
      { id: '4', name: '变更过户', icon: '🔄', url: '/pages/change-transfer/change-transfer', badge: '' },
      { id: '5', name: '开票申请', icon: '🧾', url: '/pages/invoice/invoice', badge: '' },
      { id: '6', name: '代缴代扣', icon: '💳', url: '/pages/payment-collection/payment-collection', badge: '' },
      { id: '7', name: '预充值', icon: '💰', url: '/pages/pre-recharge/pre-recharge', badge: '' },
      { id: '8', name: '自助续费', icon: '🔄', url: '/pages/self-renewal/self-renewal', badge: '' }
    ],
    orderTab: 'all',
    orderTabs: [
      { key: 'all', name: '全部订单', count: 12 },
      { key: 'pending', name: '待处理', count: 2 },
      { key: 'processing', name: '进行中', count: 1 },
      { key: 'completed', name: '已完成', count: 9 }
    ],
    myDevices: [
      {
        id: '1',
        name: '家庭宽带路由器',
        status: 'online',
        statusText: '在线',
        icon: '📡'
      },
      {
        id: '2',
        name: '智能机顶盒',
        status: 'offline',
        statusText: '离线',
        icon: '📺'
      }
    ],
    commonFunctions: [
      {
        id: '1',
        name: '网络测速',
        description: '检测网络速度和稳定性',
        icon: '⚡',
        url: '/pages/network-test/network-test'
      },
      {
        id: '2',
        name: '故障报修',
        description: '快速报修网络故障',
        icon: '🔧',
        url: '/pages/fault-report/fault-report'
      },
      {
        id: '3',
        name: '服务评价',
        description: '评价服务质量',
        icon: '⭐',
        url: '/pages/service-evaluation/service-evaluation'
      },
      {
        id: '4',
        name: '举报投诉',
        description: '举报投诉相关问题',
        icon: '📢',
        url: '/pages/complaint/complaint'
      }
    ],
    settingsList: [
      {
        id: '1',
        name: '个人资料',
        description: '修改个人信息',
        icon: '👤',
        action: 'profile'
      },
      {
        id: '2',
        name: '账户安全',
        description: '密码、手机号等安全设置',
        icon: '🔒',
        action: 'security'
      },
      {
        id: '3',
        name: '消息通知',
        description: '推送通知设置',
        icon: '🔔',
        action: 'notification'
      },
      {
        id: '4',
        name: '隐私设置',
        description: '隐私保护相关设置',
        icon: '🛡️',
        action: 'privacy'
      },
      {
        id: '5',
        name: '关于我们',
        description: '版本信息和帮助',
        icon: 'ℹ️',
        action: 'about'
      }
    ]
  },

  onLoad() {
    console.log('我的页面加载');
    this.loadUserData();
  },

  onShow() {
    console.log('我的页面显示');
  },

  // 加载用户数据
  loadUserData() {
    // 模拟从服务器加载用户数据
    console.log('加载用户数据');
  },

  // 编辑个人资料
  editProfile() {
    message.success('跳转到编辑资料页面');
    // 这里可以跳转到编辑资料页面
  },

  // 导航到服务页面
  navigateToService(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      navigation.navigateTo(url);
    }
  },

  // 切换订单标签
  switchOrderTab(e) {
    const tab = e.currentTarget.dataset.tab;
      this.setData({
      orderTab: tab
    });
    
    // 触觉反馈
    wx.vibrateShort();
    
    // 这里可以根据标签加载不同的订单数据
    message.success(`切换到${this.data.orderTabs.find(t => t.key === tab).name}`);
  },

  // 查看所有设备
  viewAllDevices() {
    message.success('跳转到设备管理页面');
    // 这里可以跳转到设备管理页面
  },

  // 查看设备详情
  viewDeviceDetail(e) {
    const deviceId = e.currentTarget.dataset.id;
    const device = this.data.myDevices.find(d => d.id === deviceId);
    
    if (device) {
      wx.showModal({
        title: '设备详情',
        content: `设备名称：${device.name}\n设备状态：${device.statusText}\n\n是否进行设备管理？`,
        confirmText: '设备管理',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            message.success('跳转到设备管理页面');
          }
        }
      });
    }
  },

  // 导航到功能页面
  navigateToFunction(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      navigation.navigateTo(url);
    }
  },

  // 处理设置操作
  handleSetting(e) {
    const action = e.currentTarget.dataset.action;
    
    switch (action) {
      case 'profile':
        this.editProfile();
        break;
      case 'security':
        this.showSecuritySettings();
        break;
      case 'notification':
        this.showNotificationSettings();
        break;
      case 'privacy':
        this.showPrivacySettings();
        break;
      case 'about':
        this.showAboutInfo();
        break;
    }
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 显示安全设置
  showSecuritySettings() {
    wx.showActionSheet({
      itemList: ['修改密码', '更换手机号', '实名认证', '登录设备管理'],
      success: (res) => {
        const options = ['修改密码', '更换手机号', '实名认证', '登录设备管理'];
        const selected = options[res.tapIndex];
        message.success(`跳转到${selected}页面`);
      }
    });
  },

  // 显示通知设置
  showNotificationSettings() {
    wx.showModal({
      title: '消息通知设置',
      content: '是否开启推送通知？\n\n开启后将接收订单状态、服务提醒等重要消息。',
      confirmText: '开启通知',
      cancelText: '暂不开启',
      success: (res) => {
        if (res.confirm) {
          message.success('通知已开启');
        } else {
          message.success('通知已关闭');
        }
      }
    });
  },

  // 显示隐私设置
  showPrivacySettings() {
    wx.showActionSheet({
      itemList: ['隐私政策', '数据使用说明', '第三方服务', '清除缓存'],
      success: (res) => {
        const options = ['隐私政策', '数据使用说明', '第三方服务', '清除缓存'];
        const selected = options[res.tapIndex];
        message.success(`跳转到${selected}页面`);
      }
    });
  },

  // 显示关于信息
  showAboutInfo() {
    wx.showModal({
      title: '关于我们',
      content: '宽带服务小程序\n版本：v1.0.0\n\n为您提供便捷的宽带服务管理功能。\n\n如有问题请联系客服：400-123-4567',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00\n\n选择联系方式：',
      confirmText: '拨打电话',
      cancelText: '在线咨询',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567'
          });
        } else {
          message.success('正在为您转接在线客服...');
        }
      }
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？\n\n退出后需要重新登录才能使用服务。',
      confirmText: '确认退出',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processLogout();
        }
      }
    });
  },

  // 处理退出登录
  processLogout() {
    wx.showLoading({
      title: '正在退出...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      message.success('已退出登录');
      
      setTimeout(() => {
        // 清除用户数据
        wx.removeStorageSync('userInfo');
        wx.removeStorageSync('token');
        
        // 跳转到登录页面
        navigation.redirectTo('/pages/login/login');
      }, 1000);
    }, 1500);
  }
});