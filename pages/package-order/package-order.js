// pages/package-order/package-order.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');

Page({
  data: {
    selectedPackage: null,
    selectedPackageName: '暂无',
    selectedPackagePrice: '0',
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
        page: 1,
        pageSize: 20
      });

      console.log('套餐列表加载成功:', result.data);

      // 过滤出有效套餐（status === 1）、排序并转换数据格式
      const packages = result.data.list
        .filter(pkg => pkg.status === 1)  // 只保留status为1的有效套餐
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))  // 根据sort字段从小到大排序
        .map(pkg => {
          // 处理流量字段，提取数字部分（如 "1000M" -> "1000"）
          let speed = '100';
          if (pkg.flow) {
            const match = pkg.flow.match(/(\d+)/);
            speed = match ? match[1] : '100';
          }

          // 构建特性列表
          const features = [];
          if (pkg.flow) {
            features.push(`流量: ${pkg.flow}`);
          }
          if (pkg.remark) {
            features.push(pkg.remark);
          }
          if (pkg.package_type === '0') {
            features.push('包月套餐');
          }

          return {
            id: pkg.id,
            name: pkg.package_name || '未命名套餐',
            speed: speed,
            price: pkg.price || '0',
            isPopular: pkg.package_type === '3',  // package_type为3的标记为热门
            features: features
          };
        });

      console.log('有效套餐数量:', packages.length);

      this.setData({
        packages: packages,
        loading: false
      });

    } catch (error) {
      console.error('加载套餐失败:', error);
      this.setData({ loading: false });
      message.error('加载套餐失败，请稍后重试');
    }
  },

  // 选择套餐
  selectPackage(e) {
    const packageId = e.currentTarget.dataset.id;
    const selectedPackage = this.data.packages.find(pkg => pkg.id === packageId);
    
    this.setData({
      selectedPackage: packageId,
      selectedPackageName: selectedPackage.name,
      selectedPackagePrice: selectedPackage.price
    });
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