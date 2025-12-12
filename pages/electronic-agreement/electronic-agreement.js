const DataManager = require('../../utils/dataManager');
const { message } = require('../../utils/common');

Page({
  data: {
    loading: true,
    orderData: {}
  },

  onLoad(options) {
    this.loadCustomerInfo();
  },

  // 加载客户信息
  async loadCustomerInfo() {
    try {
      this.setData({ loading: true });
      
      const result = await DataManager.getCompleteCustomerInfo();
      
      if (!result.success || !result.data) {
        message.error('未获取到客户信息');
        this.setData({ loading: false });
        return;
      }
      
      const customerInfo = result.data;
      const orderData = this.fillOrderData(customerInfo);
      
      console.log('电子协议数据:', orderData);
      
      this.setData({ 
        orderData,
        loading: false 
      });
      
    } catch (error) {
      console.error('加载客户信息失败:', error);
      message.error('加载失败');
      this.setData({ loading: false });
    }
  },

  // 填充订单数据 - 只使用后端返回的数据，不自动生成
  fillOrderData(customerInfo) {
    const customer = customerInfo.customer || {};
    const device = customerInfo.device || customerInfo.device_info || {};
    const binding = customerInfo.binding_info || {};
    const packageInfo = customerInfo.package || {};
    
    return {
      // 客户信息
      customerName: customer.customer_name,
      contactPhone: customer.contact_phone,
      idNumber: customer.id_number,
      installAddress: customer.install_address,
      contactPerson: customer.contact_person,
      userType: customer.user_type,
      
      // 设备信息
      deviceNo: device.device_no,
      deviceName: device.device_name,
      
      // 绑定信息
      rechargeAccount: binding.recharge_account,
      currentPackageName: binding.current_package_name,
      
      // 套餐信息
      packageName: packageInfo.package_name,
      packagePrice: packageInfo.price,
      packageFlow: packageInfo.flow,
      uploadSpeed: packageInfo.upload_speed,
      contractMonths: packageInfo.contract_months,
      orderAmount: packageInfo.order_amount
    };
  },

  onShareAppMessage() {
    return {
      title: '业务登记单',
      path: '/pages/electronic-agreement/electronic-agreement'
    };
  }
})
