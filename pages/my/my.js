// pages/my/my.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');

Page({
  data: {
    userInfo: {
      name: '王女士',
      phone: '138****8888',
      avatar: '/images/avatar-placeholder.png'
    },
    accountInfo: {
      balance: '128.50',
      points: '2580',
      coupons: '3'
    },
    quickServices: [
      { id: '1', name: '我的账单', icon: '📋', url: '/pages/my-bill/my-bill' },
      { id: '2', name: '套餐订购', icon: '📦', url: '/pages/package-order/package-order' },
      { id: '3', name: '预充值', icon: '💰', url: '/pages/pre-recharge/pre-recharge' },
      { id: '4', name: '业务申请', icon: '📝', url: '/pages/business-application/business-application' },
      { id: '5', name: '服务评价', icon: '⭐', url: '/pages/service-evaluation/service-evaluation' },
      { id: '6', name: '客服中心', icon: '💬', url: '/pages/customer-service/customer-service' }
    ],
    settingsList: [
      { id: '1', name: '个人资料', icon: '👤', action: 'profile' },
      { id: '2', name: '重新绑定设备', icon: '🔄', action: 'rebind' },
      { id: '3', name: '关于我们', icon: 'ℹ️', action: 'about' },
      { id: '4', name: '联系客服', icon: '📞', action: 'contact' }
    ]
  },

  onLoad() {
    console.log('我的页面加载');
    this.loadUserData();
  },

  async onShow() {
    console.log('我的页面显示');
    // 验证设备绑定状态
    await this.validateDeviceBinding();
  },

  // 加载用户数据
  loadUserData() {
    // TODO: 从服务器加载用户信息和账户信息
    console.log('加载用户数据');
  },

  // 验证设备绑定状态
  async validateDeviceBinding() {
    try {
      const app = getApp();
      
      // 检查是否已登录
      if (!app.globalData.isLoggedIn || !app.globalData.token) {
        console.log('⚠️ 用户未登录，跳过设备验证');
        return;
      }

      console.log('🔍 验证设备绑定状态...');
      
      // 调用 getUserDevices 获取最新的设备列表
      const devicesResult = await API.getUserDevices();
      const devices = devicesResult.data.devices || [];
      
      console.log('📋 服务器返回的设备列表:', devices);
      
      // 获取缓存中的设备编号
      const cachedDeviceNo = wx.getStorageSync('device_no');
      
      if (devices.length === 0) {
        // 服务器返回空设备列表
        if (cachedDeviceNo) {
          console.log('❌ 设备已解绑，清除本地缓存');
          
          // 清除所有设备相关缓存
          wx.removeStorageSync('deviceBound');
          wx.removeStorageSync('device_no');
          wx.removeStorageSync('device_info');
          wx.removeStorageSync('customer_info');
          wx.removeStorageSync('binding_info');
          
          // 清除全局数据
          app.globalData.deviceBound = false;
          app.globalData.device_no = null;
          app.globalData.device_info = null;
          app.globalData.customer_info = null;
          app.globalData.binding_info = null;
          
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
        }
      } else {
        // 服务器有设备数据
        const firstDevice = devices[0];
        const serverDeviceNo = firstDevice.deviceCode || firstDevice.device_no;
        
        if (cachedDeviceNo !== serverDeviceNo) {
          console.log('⚠️ 缓存设备码与服务器不一致，更新缓存');
          console.log('缓存设备码:', cachedDeviceNo);
          console.log('服务器设备码:', serverDeviceNo);
          
          // 重新获取完整设备信息
          try {
            const deviceInfoResult = await API.getCustomerByDeviceCode(serverDeviceNo);
            
            if (deviceInfoResult.success && deviceInfoResult.data) {
              const { customer, binding_info, device_info } = deviceInfoResult.data;
              
              // 更新缓存
              wx.setStorageSync('deviceBound', true);
              wx.setStorageSync('device_no', device_info?.device_no || serverDeviceNo);
              wx.setStorageSync('device_info', device_info);
              wx.setStorageSync('customer_info', customer);
              wx.setStorageSync('binding_info', binding_info);
              
              // 更新全局数据
              app.globalData.deviceBound = true;
              app.globalData.device_no = device_info?.device_no || serverDeviceNo;
              app.globalData.device_info = device_info;
              app.globalData.customer_info = customer;
              app.globalData.binding_info = binding_info;
              
              console.log('✅ 设备信息已更新');
            }
          } catch (error) {
            console.error('❌ 更新设备信息失败:', error);
          }
        } else {
          console.log('✅ 设备绑定状态正常');
        }
      }
    } catch (error) {
      console.error('❌ 验证设备绑定状态失败:', error);
      // 验证失败不影响页面正常显示，只记录错误
    }
  },

  // 导航到服务页面
  navigateToService(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      navigation.navigateTo(url);
    }
  },


  // 处理设置操作
  handleSetting(e) {
    const action = e.currentTarget.dataset.action;
    
    switch (action) {
      case 'profile':
        message.success('跳转到个人资料页面');
        break;
      case 'rebind':
        this.rebindDevice();
        break;
      case 'about':
        this.showAboutInfo();
        break;
      case 'contact':
        this.contactService();
        break;
    }
  },

  // 重新绑定设备
  rebindDevice() {
    const currentDeviceNo = wx.getStorageSync('device_no');
    const deviceName = wx.getStorageSync('device_info')?.device_name || '未知设备';
    
    wx.showModal({
      title: '重新绑定设备',
      content: `当前绑定：${deviceName}\n设备码：${currentDeviceNo || '无'}\n\n确定要重新绑定设备吗？`,
      confirmText: '重新绑定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到绑定页面，带上 rebind 参数
          navigation.navigateTo('/pages/bind-device-code/bind-device-code?rebind=true');
        }
      }
    });
  },

  // 显示关于信息
  showAboutInfo() {
    wx.showModal({
      title: '关于我们',
      content: '云宽带小程序\n版本：v1.0.0\n\n为您提供便捷的宽带服务管理功能。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00',
      confirmText: '拨打电话',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567'
          });
        }
      }
    });
  },

  // Tabbar切换事件
  onTabChange(event) {
    const index = event.detail;
    if (index === 0) {
      wx.redirectTo({
        url: '/pages/home/home'
      });
    }
  }
});