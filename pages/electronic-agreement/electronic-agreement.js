// pages/electronic-agreement/electronic-agreement.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const DataManager = require('../../utils/dataManager');

Page({
  data: {
    loading: true,
    deviceCode: '',
    // 订单数据
    orderData: {
      // 头部信息
      orderNo: '',
      currentPage: 1,
      totalPages: 3,
      acceptDate: '',
      
      // 客户信息
      customerName: '',
      contactPhone: '',
      idType: '',
      idNumber: '',
      idAddress: '',
      businessOrderNo: '',
      
      // 套餐信息
      packageName: '',
      packageSpeed: '',
      originalPrice: '',
      discountPrice: '',
      downloadSpeed: '',
      uploadSpeed: '',
      contractMonths: 12,
      
      // 产品信息
      broadbandNo: '',
      gatewayNo: '',
      installAddress: '',
      
      // 费用信息
      prepayAmount: '',
      debugFee: '0',
      actualPayment: '',
      
      // 物品清单
      itemList: [],
      
      // 预约信息
      appointmentTime: '',
      contactPerson: ''
    }
  },

  onLoad(options) {
    // 清理旧的缓存数据，确保数据最新
    this.clearOldCache();
    
    // 获取设备码
    const deviceCode = wx.getStorageSync('device_no');
    this.setData({ deviceCode });
    
    // 如果有传入订单号，则加载对应订单数据
    if (options.orderNo) {
      this.loadOrderData(options.orderNo);
    } 
    // 如果有传入完整数据（JSON字符串），则直接使用
    else if (options.data) {
      try {
        const orderData = JSON.parse(decodeURIComponent(options.data));
        this.setData({ orderData, loading: false });
      } catch (error) {
        console.error('解析订单数据失败:', error);
        this.loadCustomerInfo();
      }
    }
    // 否则从缓存加载客户信息
    else {
      this.loadCustomerInfo();
    }
  },

  onShow() {
  },

  // 清理旧缓存
  clearOldCache() {
    try {
      // 清理可能存在的旧缓存
      wx.removeStorageSync('complete_customer_info');
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  },

  // 加载客户信息（从缓存）
  async loadCustomerInfo() {
    try {
      this.setData({ loading: true });
      
      // 直接从DataManager获取最新数据，不依赖旧缓存
      let customerInfo = null;
      
      if (this.data.deviceCode) {
        const result = await DataManager.getCompleteCustomerInfo(this.data.deviceCode, true);
        customerInfo = result.data;
      }
      
      if (!customerInfo) {
        message.error('未获取到客户信息');
        this.setData({ loading: false });
        return;
      }
      
      // 填充订单数据
      const orderData = this.fillOrderDataFromCustomer(customerInfo);
      this.setData({ 
        orderData,
        loading: false 
      });
      
    } catch (error) {
      console.error('❌ 加载客户信息失败:', error);
      message.error('加载失败');
      this.setData({ loading: false });
    }
  },

  // 从客户信息填充订单数据
  fillOrderDataFromCustomer(customerInfo) {
    const customer = customerInfo.customer || {};
    const device = customerInfo.device || customerInfo.device_info || {};
    const binding = customerInfo.binding_info || {};
    const packageInfo = customerInfo.package || {};
    const account = customerInfo.account || {};
    
    // 生成订单号（如果没有）
    const orderNo = this.generateOrderNo();
    
    // 获取当前日期
    const now = new Date();
    const acceptDate = `${now.getFullYear()} 年 ${String(now.getMonth() + 1).padStart(2, '0')} 月 ${String(now.getDate()).padStart(2, '0')} 日`;
    
    // 判断证件类型
    let idType = '身份证';
    let idNumber = customer.id_number || '';
    if (customer.user_type === 2 || customer.user_type === '2') {
      idType = '统一信用代码';
    }
    
    return {
      // 头部信息
      orderNo: orderNo,
      currentPage: 1,
      totalPages: 3,
      acceptDate: acceptDate,
      
      // 客户信息
      customerName: customer.customer_name || '',
      contactPhone: customer.contact_phone || binding.recharge_account || '',
      idType: idType,
      idNumber: this.maskIdNumber(idNumber),
      idAddress: customer.install_address || '',
      businessOrderNo: orderNo,
      
      // 套餐信息
      packageName: packageInfo.package_name || binding.current_package_name || '',
      packageSpeed: packageInfo.flow || '',
      originalPrice: packageInfo.order_amount || packageInfo.price || '',
      discountPrice: packageInfo.price || packageInfo.order_amount || '',
      downloadSpeed: packageInfo.flow || '',
      uploadSpeed: packageInfo.upload_speed || '', // 不使用默认值
      contractMonths: packageInfo.contract_months || 0, // 不使用默认值
      
      // 产品信息
      broadbandNo: device.device_no || '',
      gatewayNo: device.device_no || '',
      installAddress: customer.install_address || '',
      
      // 费用信息
      prepayAmount: packageInfo.price || packageInfo.order_amount || '',
      debugFee: '0',
      actualPayment: packageInfo.price || packageInfo.order_amount || '',
      
      // 物品清单
      itemList: [], // 不设置默认物品
      
      // 预约信息
      appointmentTime: '',
      contactPerson: customer.contact_person || customer.customer_name || ''
    };
  },

  // 生成订单号
  generateOrderNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return `12${year}${month}${day}000${random}`;
  },

  // 加载订单数据
  loadOrderData(orderNo) {
    wx.showLoading({
      title: '加载中...'
    });
    // 模拟加载
    setTimeout(() => {
      wx.hideLoading();
      message.success('订单数据加载成功');
    }, 1000);
  },

  // 格式化订单数据
  formatOrderData(data) {
    // 将后端返回的数据格式化为页面需要的格式
    return {
      orderNo: data.order_no || '',
      currentPage: 1,
      totalPages: 3,
      acceptDate: this.formatDate(data.accept_date),
      customerName: data.customer_name || '',
      contactPhone: data.contact_phone || '',
      idType: data.id_type || '',
      idNumber: this.maskIdNumber(data.id_number),
      idAddress: data.id_address || '',
      businessOrderNo: data.business_order_no || '',
      packageName: data.package_name || '',
      packageSpeed: data.package_speed || '',
      originalPrice: data.original_price || '',
      discountPrice: data.discount_price || '',
      downloadSpeed: data.download_speed || '',
      uploadSpeed: data.upload_speed || '',
      contractMonths: data.contract_months || 12,
      broadbandNo: data.broadband_no || '',
      gatewayNo: data.gateway_no || '',
      installAddress: data.install_address || '',
      prepayAmount: data.prepay_amount || '',
      debugFee: data.debug_fee || '0',
      actualPayment: data.actual_payment || '',
      itemList: data.item_list || [],
      appointmentTime: data.appointment_time || '',
      contactPerson: data.contact_person || ''
    };
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()} 年 ${String(date.getMonth() + 1).padStart(2, '0')} 月 ${String(date.getDate()).padStart(2, '0')} 日`;
  },

  // 脱敏证件号码
  maskIdNumber(idNumber) {
    if (!idNumber || idNumber.length < 8) return idNumber;
    const start = idNumber.substring(0, 3);
    const end = idNumber.substring(idNumber.length - 3);
    const middle = '*'.repeat(idNumber.length - 6);
    return start + middle + end;
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '业务登记单',
      path: `/pages/business-registration/business-registration?orderNo=${this.data.orderData.orderNo}`
    };
  }
});
