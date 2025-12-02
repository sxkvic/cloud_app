// pages/self-renewal/self-renewal.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');

Page({
  data: {
    loading: true,
    submitLoading: false,
    deviceCode: '',
    packageInfo: null
  },

  async onLoad(options) {
    console.log('自助续费页面加载', options);
    
    // 获取设备码（与项目中其他页面保持一致）
    const deviceCode = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
    
    if (!deviceCode) {
      message.error('未找到设备信息，请先绑定设备');
      setTimeout(() => {
        navigation.back();
      }, 1500);
      return;
    }

    this.setData({ deviceCode });
    await this.loadPackageInfo();
  },

  // 加载套餐信息
  async loadPackageInfo() {
    try {
      this.setData({ loading: true });
      
      const result = await API.getCustomerByDeviceCode(this.data.deviceCode);
      console.log('设备信息:', result);
      
      if (result.success && result.data && result.data.binding_info) {
        const binding = result.data.binding_info;
        
        this.setData({
          packageInfo: {
            package_name: binding.current_package_name || '未知套餐',
            expire_time: binding.expire_time || '未知'
          }
        });
        
      } else {
        message.error(result.message || '加载套餐信息失败');
        setTimeout(() => {
          navigation.back();
        }, 1500);
      }
    } catch (error) {
      console.error('加载套餐信息失败:', error);
      message.error('加载套餐信息失败');
      setTimeout(() => {
        navigation.back();
      }, 1500);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 提交续费
  async submitRenew() {
    if (!this.data.packageInfo) {
      message.error('套餐信息不完整');
      return;
    }

    // 确认对话框
    wx.showModal({
      title: '确认续费',
      content: `确认续费套餐"${this.data.packageInfo.package_name}"吗？`,
      confirmText: '确认',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          await this.doRenew();
        }
      }
    });
  },

  // 执行续费
  async doRenew() {
    try {
      this.setData({ submitLoading: true });

      console.log('提交续费:', {
        deviceCode: this.data.deviceCode,
        packageName: this.data.packageInfo.package_name
      });

      // 从缓存获取必要信息
      const customerInfo = wx.getStorageSync('customer_info');
      const bindingInfo = wx.getStorageSync('binding_info');
      
      if (!customerInfo || !bindingInfo || !bindingInfo.current_package_id) {
        message.error('套餐信息不完整，无法续费');
        return;
      }

      // 调用续费API - 创建续费订单
      const result = await API.createOrder({
        customer_id: customerInfo.id,
        device_no: this.data.deviceCode,
        package_id: bindingInfo.current_package_id,  // 续费当前套餐
        orderType: 1,  // 套餐订购
        payment_type: '1',  // 微信支付
        remark: '小程序续费'
      });

      console.log('续费订单创建结果:', result);
      
      message.success('续费申请提交成功！');
      
      setTimeout(() => {
        navigation.back();
      }, 1500);

    } catch (error) {
      console.error('提交续费失败:', error);
      message.error(error.message || '提交续费失败');
    } finally {
      this.setData({ submitLoading: false });
    }
  },

  onShow() {
    console.log('自助续费页面显示');
  }

});