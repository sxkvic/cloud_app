// pages/my/my.js
const { navigation, message, cacheManager } = require('../../utils/common');
const API = require('../../utils/api');
const DataManager = require('../../utils/dataManager');
const { getShareConfig, getTimelineShareConfig } = require('../../utils/share');

Page({
  data: {
    loading: true,
    deviceInfo: {},
    customerInfo: {},
    isFirstLoad: true
  },

  async onLoad() {
    console.log('我的页面加载');
    await this.loadDeviceAndCustomerInfo();
    this.setData({ isFirstLoad: false });
  },

  async onShow() {
    console.log('我的页面显示');
    // 非首次加载时刷新数据
    if (!this.data.isFirstLoad) {
      await this.loadDeviceAndCustomerInfo();
    }
  },

  // 加载设备和客户信息（实时从服务器获取）
  async loadDeviceAndCustomerInfo() {
    try {
      this.setData({ loading: true });
      
      const deviceNo = DataManager.getDeviceCode();
      if (!deviceNo) {
        console.log('未绑定设备');
        this.setData({ loading: false });
        return;
      }

      console.log('📊 实时获取设备和客户信息...');
      
      // 实时获取完整客户信息
      const result = await DataManager.getCompleteCustomerInfo(deviceNo);
      
      if (result.success && result.data) {
        const { customer, device_info, device } = result.data;
        const deviceData = device_info || device || {};
        
        // 设置设备状态文本
        const statusText = this.getDeviceStatusText(deviceData);
        
        this.setData({
          deviceInfo: {
            ...deviceData,
            status_text: statusText
          },
          customerInfo: customer || {},
          loading: false
        });
        
        console.log('✅ 设备和客户信息已更新');
      } else {
        throw new Error(result.message || '获取设备信息失败');
      }

    } catch (error) {
      console.error('加载设备信息失败:', error);
      this.setData({ loading: false });
      message.error('加载信息失败');
    }
  },

  // 获取设备状态文本
  getDeviceStatusText(deviceInfo) {
    if (!deviceInfo || !deviceInfo.status) {
      return '未知状态';
    }
    
    // status: 1-待分配, 2-运行中
    switch (deviceInfo.status) {
      case '1':
      case 1:
        return '待分配';
      case '2':
      case 2:
        return '运行中';
      default:
        return '未知状态';
    }
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

  // 导航到服务页面
  navigateToService(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      console.log('导航到:', url);
      navigation.navigateTo(url);
    }
  },

  // 重新绑定设备
  rebindDevice() {
    const currentDeviceNo = DataManager.getDeviceCode();
    const deviceName = this.data.deviceInfo?.device_name || '当前设备';
    
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
      content: '客服电话：4009677726\n工作时间：9:00-18:00',
      confirmText: '拨打电话',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '4009677726'
          });
        }
      }
    });
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