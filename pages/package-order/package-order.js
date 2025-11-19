// pages/package-order/package-order.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');

Page({
  data: {
    selectedPackage: null,
    selectedPackageName: '暂无',
    packages: [],
    loading: true
  },

  async onLoad() {
    console.log('套餐订购页面加载');
    await this.loadPackages();
  },

  async onShow() {
    console.log('套餐订购页面显示');
  },

  // 加载套餐列表
  async loadPackages() {
    try {
      this.setData({ loading: true });
      console.log('开始加载套餐列表...');

      const result = await API.getPackagesList({
        status: 'active', // 只获取激活状态的套餐
        page: 1,
        pageSize: 20
      });

      console.log('套餐列表加载成功:', result.data);

      // 转换数据格式以适配现有UI
      const packages = result.data.packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        speed: pkg.speed || '100',
        price: pkg.price,
        isPopular: pkg.isPopular || false,
        features: pkg.features || []
      }));

      this.setData({
        packages: packages,
        loading: false
      });

    } catch (error) {
      console.error('加载套餐失败:', error);
      this.setData({ loading: false });

      // 如果加载失败，使用默认套餐数据
      message.error('加载套餐失败，显示默认套餐');
      this.setData({
        packages: [
          {
            id: 'basic',
            name: '基础套餐',
            speed: '100',
            price: '88',
            isPopular: false,
            features: [
              '100Mbps 高速上网',
              '免费WiFi路由器',
              '7×24小时技术支持',
              '免费上门安装'
            ]
          },
          {
            id: 'standard',
            name: '标准套餐',
            speed: '200',
            price: '128',
            isPopular: true,
            features: [
              '200Mbps 极速上网',
              '免费WiFi路由器',
              '7×24小时技术支持',
              '免费上门安装',
              '免费IPTV机顶盒',
              '家庭云存储10GB'
            ]
          },
          {
            id: 'premium',
            name: '豪华套餐',
            speed: '500',
            price: '188',
            isPopular: false,
            features: [
              '500Mbps 超高速上网',
              '高端WiFi路由器',
              '7×24小时技术支持',
              '免费上门安装',
              '4K IPTV机顶盒',
              '家庭云存储50GB',
              '智能家居控制',
              '优先技术支持'
            ]
          },
          {
            id: 'ultimate',
            name: '旗舰套餐',
            speed: '1000',
            price: '288',
            isPopular: false,
            features: [
              '1000Mbps 极速上网',
              '专业级WiFi路由器',
              '7×24小时技术支持',
              '免费上门安装',
              '4K IPTV机顶盒',
              '家庭云存储100GB',
              '智能家居控制',
              '优先技术支持',
              '专线客服',
              '免费设备维护'
            ]
          }
        ]
      });
    }
  },

  // 选择套餐
  selectPackage(e) {
    const packageId = e.currentTarget.dataset.id;
    const selectedPackage = this.data.packages.find(pkg => pkg.id === packageId);
    
    this.setData({
      selectedPackage: packageId,
      selectedPackageName: selectedPackage.name
    });

    // 触觉反馈
    wx.vibrateShort();
  },

  // 确认订购
  confirmOrder() {
    if (!this.data.selectedPackage) {
      message.error('请先选择套餐');
      return;
    }

    const selectedPackage = this.data.packages.find(pkg => pkg.id === this.data.selectedPackage);
    
    wx.showModal({
      title: '确认订购',
      content: `您即将订购 ${selectedPackage.name}，月费 ¥${selectedPackage.price}，是否确认？`,
      confirmText: '确认订购',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          this.processOrder();
        }
      }
    });
  },

  // 处理订购
  async processOrder() {
    const selectedPackage = this.data.packages.find(pkg => pkg.id === this.data.selectedPackage);

    if (!selectedPackage) {
      message.error('请选择套餐');
      return;
    }

    try {
      wx.showLoading({ title: '正在处理订单...' });
      console.log('创建订单，套餐:', selectedPackage);

      // 创建订单
      const result = await API.createOrder({
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        amount: parseFloat(selectedPackage.price),
        remark: '小程序订购'
      });

      wx.hideLoading();
      console.log('订单创建成功:', result.data);
      message.success('订购成功！');

      setTimeout(() => {
        wx.showModal({
          title: '订购完成',
          content: `${selectedPackage.name} 订购成功！\n订单号：${result.data.orderId || result.data.orderNo || '已生成'}\n月费：¥${selectedPackage.price}\n我们将尽快为您安排安装。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 返回首页
            navigation.switchTab('/pages/home/home');
          }
        });
      }, 1000);

    } catch (error) {
      wx.hideLoading();
      console.error('订购失败:', error);

      const errorMsg = error.message || '订购失败，请重试';
      message.error(errorMsg);
    }
  }
});