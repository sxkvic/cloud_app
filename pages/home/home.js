// pages/home/home.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');

Page({
  data: {
    slides: [],
    articles: [],
    loading: true,
    commonServices: [
      {
        title: '套餐订购',
        subtitle: '升级您的网络',
        iconClass: 'icon-gouwuche',
        bgColor: '#f0f6ff',
        iconBgColor: '#409eff',
        route: '/pages/package-order/package-order'
      },
      {
        title: '我的账单',
        subtitle: '查看消费明细',
        iconClass: 'icon-zhangdan',
        bgColor: '#f0f9f3',
        iconBgColor: '#52c41a',
        route: '/pages/my-bill/my-bill'
      },
      {
        title: '在线客服',
        subtitle: '7x24小时支持',
        iconClass: 'icon-kefu',
        bgColor: '#f6f2ff',
        iconBgColor: '#722ed1',
        route: '/pages/customer-service/customer-service'
      },
      {
        title: '业务退订',
        subtitle: '退订业务',
        iconClass: 'icon-tuiding',
        bgColor: '#fffbe6',
        iconBgColor: '#faad14',
        route: '/pages/business-cancellation/business-cancellation'
      }
    ],
    allFeatures: [
      { iconClass: 'icon-chaxun', text: '产品查询', color: '#409eff', route: '/pages/product-query/product-query' },
      { iconClass: 'icon-chongzhi', text: '预充值', color: '#52c41a', route: '/pages/pre-recharge/pre-recharge' },
      { iconClass: 'icon-guohu', text: '变更过户', color: '#722ed1', route: '/pages/change-transfer/change-transfer' },
      { iconClass: 'icon-xufei', text: '自助续费', color: '#f5222d', route: '/pages/self-renewal/self-renewal' },
      { iconClass: 'icon-shenqing', text: '业务申请', color: '#3071a9', route: '/pages/business-application/business-application' },
      { iconClass: 'icon-xieyi', text: '电子协议', color: '#13c2c2', route: '/pages/electronic-agreement/electronic-agreement' },
      { iconClass: 'icon-kaipiao', text: '开票', color: '#fa8c16', route: '/pages/invoice/invoice' },
      { iconClass: 'icon-tousu', text: '举报投诉', color: '#8c8c8c', route: '/pages/complaint/complaint' },
      { iconClass: 'icon-pingjia', text: '服务评价', color: '#faad14', route: '/pages/service-evaluation/service-evaluation' },
      { iconClass: 'icon-daikou', text: '代缴代扣', color: '#eb2f96', route: '/pages/payment-collection/payment-collection' }
    ]
  },

  async onLoad() {
    console.log('首页加载');
    await this.loadBanners();
  },

  async onShow() {
    console.log('首页显示');
    // 页面显示时不自动刷新，避免与onLoad重复调用接口
    // 如需刷新数据，可使用下拉刷新功能
  },

  // 加载Banner轮播图
  async loadBanners() {
    try {
      console.log('开始加载Banner...');

      // 调用API获取Banner列表（传递位置参数 1 = 首页）
      const result = await API.getBannersList(1);

      console.log('Banner加载成功:', result.data);

      // 检查是否有数据
      if (result.data && result.data.banners && result.data.banners.length > 0) {
        const app = getApp();
        const baseUrl = app.globalData.apiBaseUrl;

        // 转换数据格式以匹配UI需求
        const slides = result.data.banners.map(banner => {
          // 拼接完整的图片URL
          let imageUrl = banner.image_url;  // 使用后端返回的字段名 image_url
          if (imageUrl && !imageUrl.startsWith('http')) {
            // 如果不是完整URL，拼接baseUrl
            imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
          }

          return {
            id: banner.id,
            image: imageUrl,  // 拼接后的完整图片URL
            title: banner.title,
            subtitle: banner.subtitle || banner.description || '',
            link: banner.link || ''
          };
        });

        this.setData({ slides: slides });
        console.log('Banner数据已设置:', slides.length, '个');
      } else {
        console.warn('Banner列表为空，使用默认数据');
        this.loadDefaultBanners();
      }

    } catch (error) {
      console.error('加载Banner失败:', error);
      this.loadDefaultBanners();
    }
  },

  // 加载默认Banner（降级方案）
  loadDefaultBanners() {
    this.setData({
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
      ]
    });
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
      // 统一使用直接跳转
      navigation.navigateTo(route);
    } else {
      message.error('功能开发中，敬请期待');
    }
  },

  // Tabbar切换事件
  onTabChange(event) {
    const index = event.detail;
    if (index === 1) {
      // 直接切换Tab
      navigation.switchTab('/pages/my/my');
    }
  }
});
