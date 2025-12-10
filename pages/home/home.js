// pages/home/home.js
const { navigation, message, cacheManager } = require('../../utils/common');
const API = require('../../utils/api');
const DataManager = require('../../utils/dataManager');
const { getShareConfig, getTimelineShareConfig } = require('../../utils/share');

Page({
  data: {
    customerName: '',
    balance: '0.00',
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
        title: '订单管理',
        subtitle: '查看订单状态',
        iconClass: 'icon-dingdanguanli',
        bgColor: '#fff7e6',
        iconBgColor: '#fa8c16',
        route: '/pages/order-management/order-management'
      }
      // 暂时隐藏业务退订入口
      // {
      //   title: '业务退订',
      //   subtitle: '退订业务',
      //   iconClass: 'icon-tuiding',
      //   bgColor: '#fffbe6',
      //   iconBgColor: '#faad14',
      //   route: '/pages/business-cancellation/business-cancellation'
      // }
    ],
    allFeatures: [
      { iconClass: 'icon-chaxun', text: '产品查询', color: '#409eff', route: '/pages/product-query/product-query' },
      { iconClass: 'icon-chongzhi', text: '预充值', color: '#52c41a', route: '/pages/pre-recharge/pre-recharge' },
      { iconClass: 'icon-guohu', text: '变更过户', color: '#722ed1', route: '/pages/change-transfer/change-transfer' },
      { iconClass: 'icon-xufei', text: '自助续费', color: '#f5222d', route: '/pages/self-renewal/self-renewal' },
      { iconClass: 'icon-shenqing', text: '业务申请', color: '#3071a9', route: '/pages/business-application/business-application' },
      { iconClass: 'icon-xieyi', text: '电子协议', color: '#13c2c2', route: '/pages/electronic-agreement/electronic-agreement' },
      { iconClass: 'icon-kaipiao', text: '开票申请', color: '#fa8c16', route: '/pages/invoice/invoice' },
      { iconClass: 'icon-tousu', text: '举报投诉', color: '#8c8c8c', route: '/pages/complaint/complaint' },
      { iconClass: 'icon-pingjia', text: '服务评价', color: '#faad14', route: '/pages/service-evaluation/service-evaluation' }
      // 暂时隐藏代缴代扣入口
      // { iconClass: 'icon-daikou', text: '代缴代扣', color: '#eb2f96', route: '/pages/payment-collection/payment-collection' }
    ]
  },

  async onLoad() {
    console.log('首页加载');
    try {
      await this.loadBanners();
      await this.loadAccountInfo();
    } catch (error) {
      console.error('首页数据加载失败:', error);
    } finally {
      // 无论成功或失败，都要关闭骨架屏
      this.setData({ loading: false });
    }
  },

  async onShow() {
    console.log('首页显示，刷新数据...');
    
    // 每次显示页面都获取最新数据，确保数据始终是最新的
    await this.loadAccountInfo();
  },

  // 验证设备绑定状态（简化版：只检查设备码是否有效）
  async validateDeviceBinding() {
    try {
      const app = getApp();
      
      // 检查是否已登录
      if (!app.globalData.isLoggedIn || !app.globalData.token) {
        console.log('⚠️ 用户未登录，跳过设备验证');
        return;
      }

      const deviceNo = DataManager.getDeviceCode();
      if (!deviceNo) {
        console.log('⚠️ 未绑定设备');
        return;
      }

      console.log('🔍 验证设备绑定状态...');
      
      // 调用接口验证设备码是否有效
      const result = await API.getCustomerByDeviceCode(deviceNo);
      
      if (!result.success || !result.data) {
        console.log('❌ 设备已解绑或无效，清除本地绑定');
        cacheManager.clearDeviceCache();
        
        // 提示用户并跳转到绑定页面
        wx.showModal({
          title: '设备已解绑',
          content: '您的设备绑定已失效，请重新绑定设备',
          showCancel: false,
          confirmText: '去绑定',
          success: () => {
            navigation.navigateTo('/pages/bind-device-code/bind-device-code');
          }
        });
      } else {
        console.log('✅ 设备绑定状态正常');
      }
    } catch (error) {
      console.error('❌ 验证设备绑定状态失败:', error);
    }
  },

  // 加载账户信息（实时从服务器获取）
  async loadAccountInfo() {
    try {
      const deviceNo = DataManager.getDeviceCode();
      
      if (!deviceNo) {
        console.log('未绑定设备');
        return;
      }

      console.log('📊 实时获取账户信息，设备码:', deviceNo);
      
      // 实时获取完整客户信息
      const result = await DataManager.getCompleteCustomerInfo(deviceNo);
      
      if (result.success && result.data) {
        const { customer, account } = result.data;
        
        this.setData({
          customerName: customer?.customer_name || '用户名称',
          balance: account?.balance || '0.00'
        });
        
        console.log('✅ 账户信息已更新:', {
          customerName: customer?.customer_name,
          balance: account?.balance
        });
      }
      
    } catch (error) {
      console.error('加载账户信息失败:', error);
    }
  },

  // 跳转到充值页面
  navigateToRecharge() {
    navigation.navigateTo('/pages/pre-recharge/pre-recharge');
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
  },

  // 下拉刷新
  async onPullDownRefresh() {    
    try {
      // 并行刷新数据
      await Promise.all([
        this.loadAccountInfo(),
        this.loadBanners()
      ]);
      
      message.success('刷新成功');
    } catch (error) {
      message.error('刷新失败，请重试');
    } finally {
      // 停止下拉刷新动画
      wx.stopPullDownRefresh();
    }
  },

  // 分享给好友
  onShareAppMessage() {
    return getShareConfig({
      title: '云宽带 - 智能网络管理',
      path: '/pages/splash/splash'
    });
  },

  // 分享到朋友圈
  onShareTimeline() {
    return getTimelineShareConfig({
      title: '云宽带 - 智能网络管理'
    });
  }
});
