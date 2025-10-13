// pages/home/home.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&q=80',
        title: '家庭影院级体验',
        subtitle: '超高清视频流畅播放，无卡顿'
      },
      {
        image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&q=80',
        title: '极速光纤，一键到家',
        subtitle: '全新千兆套餐，畅享数字生活'
      }
    ],
    commonServices: [
      {
        title: '套餐订购',
        subtitle: '升级您的网络',
        iconText: '🛒',
        bgColor: '#f0f6ff',
        iconBgColor: '#409eff',
        route: '/pages/package-order/package-order'
      },
      {
        title: '我的账单',
        subtitle: '查看消费明细',
        iconText: '📄',
        bgColor: '#f0f9f3',
        iconBgColor: '#52c41a',
        route: '/pages/my-bill/my-bill'
      },
      {
        title: '在线客服',
        subtitle: '7x24小时支持',
        iconText: '💬',
        bgColor: '#f6f2ff',
        iconBgColor: '#722ed1',
        route: '/pages/customer-service/customer-service'
      },
      {
        title: '业务退订',
        subtitle: '退订业务',
        iconText: '🔄',
        bgColor: '#fffbe6',
        iconBgColor: '#faad14',
        route: '/pages/business-cancellation/business-cancellation'
      }
    ],
    allFeatures: [
      { iconText: '🔍', text: '产品查询', color: '#409eff', route: '/pages/product-query/product-query' },
      { iconText: '💰', text: '预充值', color: '#52c41a', route: '/pages/pre-recharge/pre-recharge' },
      { iconText: '🔄', text: '变更过户', color: '#722ed1', route: '/pages/change-transfer/change-transfer' },
      { iconText: '📅', text: '自助续费', color: '#f5222d', route: '/pages/self-renewal/self-renewal' },
      { iconText: '📝', text: '业务申请', color: '#3071a9', route: '/pages/business-application/business-application' },
      { iconText: '📋', text: '电子协议', color: '#13c2c2', route: '/pages/electronic-agreement/electronic-agreement' },
      { iconText: '🧾', text: '开票', color: '#fa8c16', route: '/pages/invoice/invoice' },
      { iconText: '⚠️', text: '举报投诉', color: '#8c8c8c', route: '/pages/complaint/complaint' },
      { iconText: '⭐', text: '服务评价', color: '#faad14', route: '/pages/service-evaluation/service-evaluation' },
      { iconText: '💳', text: '代缴代扣', color: '#eb2f96', route: '/pages/payment-collection/payment-collection' }
    ]
  },

  onLoad() {
    console.log('首页加载');
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshData();
  },

  // 刷新数据
  refreshData() {
    // 这里可以添加数据刷新逻辑
    console.log('刷新首页数据');
  },

  // 显示通知
  showNotifications() {
    wx.showModal({
      title: '通知',
      content: '暂无新通知',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 导航到指定页面
  navigateToPage(e) {
    const route = e.currentTarget.dataset.route;
    if (route) {
      navigation.navigateTo(route);
    } else {
      message.error('功能开发中，敬请期待');
    }
  }
});

