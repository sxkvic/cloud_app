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
        title: '业务申请',
        subtitle: '新装宽带申请',
        iconClass: 'icon-shenqing',
        bgColor: '#e6f4ff',
        iconBgColor: '#3071a9',
        route: '/pages/business-application/business-application'
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
        title: '我的账单',
        subtitle: '消费明细/开票',
        iconClass: 'icon-zhangdan',
        bgColor: '#f0f9f3',
        iconBgColor: '#52c41a',
        route: '/pages/my-bill/my-bill'
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
      { iconClass: 'icon-dingdanguanli', text: '订单管理', color: '#fa8c16', route: '/pages/order-management/order-management' },
      { iconClass: 'icon-xieyi', text: '电子协议', color: '#13c2c2', route: '/pages/electronic-agreement/electronic-agreement' },
      { iconClass: 'icon-tousu', text: '举报投诉', color: '#8c8c8c', route: '/pages/complaint/complaint' },
      { iconClass: 'icon-pingjia', text: '服务评价', color: '#faad14', route: '/pages/service-evaluation/service-evaluation' }
      // 暂时隐藏的功能入口
      // { iconClass: 'icon-kaipiao', text: '开票申请', color: '#fa8c16', route: '/pages/invoice/invoice' }, // 已移至我的账单页面
      // { iconClass: 'icon-daikou', text: '代缴代扣', color: '#eb2f96', route: '/pages/payment-collection/payment-collection' }
    ]
  },

  async onLoad() {
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
    // 每次显示页面都获取最新数据，确保数据始终是最新的
    await this.loadAccountInfo();
  },

  // 验证设备绑定状态（使用新的验证逻辑）
  async validateDeviceBinding() {
    try {
      const app = getApp();
      
      // 检查是否已登录
      if (!app.globalData.isLoggedIn || !app.globalData.token) {
        return;
      }

      // 使用新的验证逻辑，会自动处理设备切换
      const validDeviceNo = await DataManager.getValidDeviceCode();
      
      if (!validDeviceNo) {
        // 没有任何有效设备，提示用户绑定
        wx.showModal({
          title: '设备未绑定',
          content: '您还没有绑定任何设备，请先绑定设备',
          showCancel: false,
          confirmText: '去绑定',
          success: () => {
            navigation.navigateTo('/pages/bind-device-code/bind-device-code');
          }
        });
      } else {
        console.log('✅ 设备验证成功:', validDeviceNo);
      }
    } catch (error) {
      console.error('❌ 验证设备绑定状态失败:', error);
    }
  },

  // 加载账户信息（实时从服务器获取）
  async loadAccountInfo() {
    try {
      // 使用新的验证逻辑，自动获取有效的设备码
      const deviceNo = await DataManager.getValidDeviceCode();
      
      if (!deviceNo) {
        return;
      }
      
      // 实时获取完整客户信息（已经传入了有效的设备码）
      const result = await DataManager.getCompleteCustomerInfo(deviceNo);
      
      if (result.success && result.data) {
        const { customer, account } = result.data;
        
        // 计算总余额 = balance + recharge_amount
        let totalBalance = '0.00';
        if (account) {
          const balance = parseFloat(account.balance) || 0;
          const rechargeAmount = parseFloat(account.recharge_amount) || 0;
          totalBalance = (balance + rechargeAmount).toFixed(2);
        }
        
        this.setData({
          customerName: customer?.customer_name || '用户名称',
          balance: totalBalance
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
      // 调用API获取Banner列表（传递位置参数 1 = 首页）
      const result = await API.getBannersList(1);

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
      } else {
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
