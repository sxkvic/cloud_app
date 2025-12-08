// pages/order-management/order-management.js
const { message } = require('../../utils/common');
const API = require('../../utils/api');

Page({
  data: {
    activeTab: 'package', // 当前激活的Tab: package-套餐订购, recharge-预充值
    loading: true,
    deviceCode: '',
    
    // 套餐订购订单
    packageOrders: [],
    packagePage: 1,
    packagePageSize: 10,
    packageTotal: 0,
    
    // 预充值订单
    rechargeOrders: [],
    rechargePage: 1,
    rechargePageSize: 10,
    rechargeTotal: 0,
    
    hasMore: true
  },

  async onLoad(options) {
    console.log('订单管理页面加载', options);
    
    // 获取设备码
    const deviceCode = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
    
    if (!deviceCode) {
      message.error('未找到设备信息');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ deviceCode });
    await this.loadOrders();
  },

  // 下拉刷新
  async onPullDownRefresh() {
    console.log('下拉刷新');
    await this.refreshOrders();
    wx.stopPullDownRefresh();
  },

  // 切换Tab
  async switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;

    console.log('切换Tab:', tab);
    this.setData({ 
      activeTab: tab,
      loading: true 
    });

    // 如果当前Tab没有数据，则加载
    if (tab === 'package' && this.data.packageOrders.length === 0) {
      await this.loadPackageOrders();
    } else if (tab === 'recharge' && this.data.rechargeOrders.length === 0) {
      await this.loadRechargeOrders();
    } else {
      this.setData({ loading: false });
    }

    this.updateHasMore();
  },

  // 加载订单（首次加载）
  async loadOrders() {
    try {
      this.setData({ loading: true });
      
      // 默认加载套餐订购订单
      await this.loadPackageOrders();
      
    } catch (error) {
      console.error('加载订单失败:', error);
      message.error('加载订单失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 刷新订单
  async refreshOrders() {
    try {
      if (this.data.activeTab === 'package') {
        this.setData({ packagePage: 1, packageOrders: [] });
        await this.loadPackageOrders();
      } else {
        this.setData({ rechargePage: 1, rechargeOrders: [] });
        await this.loadRechargeOrders();
      }
      message.success('刷新成功');
    } catch (error) {
      console.error('刷新订单失败:', error);
      message.error('刷新失败');
    }
  },

  // 加载套餐订购订单
  async loadPackageOrders() {
    try {
      const { deviceCode, packagePage, packagePageSize } = this.data;
      
      console.log('加载套餐订购订单:', { deviceCode, page: packagePage, pageSize: packagePageSize });
      
      const result = await API.getOrderList({
        page: packagePage,
        pageSize: packagePageSize,
        device_no: deviceCode,
        customer_name: ''
      });

      console.log('套餐订购订单返回:', result);

      if (result.success && result.data) {
        const orders = result.data.orders || [];
        const total = result.data.total || 0;
        
        this.setData({
          packageOrders: packagePage === 1 ? orders : [...this.data.packageOrders, ...orders],
          packageTotal: total,
          loading: false
        });

        this.updateHasMore();
      } else {
        throw new Error(result.message || '获取订单列表失败');
      }
    } catch (error) {
      console.error('加载套餐订购订单失败:', error);
      this.setData({ loading: false });
      throw error;
    }
  },

  // 加载预充值订单
  async loadRechargeOrders() {
    try {
      const { deviceCode, rechargePage, rechargePageSize } = this.data;
      
      console.log('加载预充值订单:', { deviceCode, page: rechargePage, pageSize: rechargePageSize });
      
      const result = await API.getPreRechargeOrderList({
        page: rechargePage,
        pageSize: rechargePageSize,
        device_no: deviceCode,
        customer_name: ''
      });

      console.log('预充值订单返回:', result);

      if (result.success && result.data) {
        const orders = result.data.list || [];
        const total = result.data.total || 0;
        
        this.setData({
          rechargeOrders: rechargePage === 1 ? orders : [...this.data.rechargeOrders, ...orders],
          rechargeTotal: total,
          loading: false
        });

        this.updateHasMore();
      } else {
        throw new Error(result.message || '获取订单列表失败');
      }
    } catch (error) {
      console.error('加载预充值订单失败:', error);
      this.setData({ loading: false });
      throw error;
    }
  },

  // 加载更多
  async loadMore() {
    if (!this.data.hasMore) return;

    try {
      if (this.data.activeTab === 'package') {
        const nextPage = this.data.packagePage + 1;
        this.setData({ packagePage: nextPage });
        await this.loadPackageOrders();
      } else {
        const nextPage = this.data.rechargePage + 1;
        this.setData({ rechargePage: nextPage });
        await this.loadRechargeOrders();
      }
    } catch (error) {
      console.error('加载更多失败:', error);
      message.error('加载更多失败');
    }
  },

  // 更新是否有更多数据
  updateHasMore() {
    const { activeTab, packageOrders, packageTotal, rechargeOrders, rechargeTotal } = this.data;
    
    let hasMore = false;
    if (activeTab === 'package') {
      hasMore = packageOrders.length < packageTotal;
    } else {
      hasMore = rechargeOrders.length < rechargeTotal;
    }
    
    this.setData({ hasMore });
  }
});
