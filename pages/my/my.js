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
    await this.loadDeviceAndCustomerInfo();
    this.setData({ isFirstLoad: false });
  },

  async onShow() {
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
        this.setData({ loading: false });
        return;
      }
      
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
      } else {
        throw new Error(result.message || '获取设备信息失败');
      }

    } catch (error) {
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
        return;
      }

      const deviceNo = DataManager.getDeviceCode();
      if (!deviceNo) {
        return;
      }
      
      // 调用接口验证设备码是否有效
      const result = await API.getCustomerByDeviceCode(deviceNo);
      
      if (!result.success || !result.data) {
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
      }
    } catch (error) {
      message.error('验证设备绑定状态失败');
    }
  },

  // 导航到服务页面
  navigateToService(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      navigation.navigateTo(url);
    }
  },

  // 重新绑定设备（先查询用户绑定的设备列表）
  async rebindDevice() {
    const currentDeviceNo = DataManager.getDeviceCode();
    
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 查询用户绑定的所有设备
      const devicesResult = await API.getUserDevices();
      const devices = devicesResult.data?.devices || [];
      
      wx.hideLoading();
      
      // 过滤掉当前设备，获取其他可切换的设备
      const otherDevices = devices.filter(d => {
        const deviceNo = d.deviceCode || d.device_no;
        return deviceNo !== currentDeviceNo;
      });
      
      if (otherDevices.length > 0) {
        // 有其他设备，显示切换选项
        this.showDeviceSwitchOptions(currentDeviceNo, otherDevices);
      } else {
        // 没有其他设备，直接跳转绑定页面
        this.showBindNewDeviceConfirm(currentDeviceNo);
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('获取设备列表失败:', error);
      // 获取失败时，直接显示绑定新设备选项
      this.showBindNewDeviceConfirm(currentDeviceNo);
    }
  },
  
  // 显示设备切换选项（有多个设备时）
  showDeviceSwitchOptions(currentDeviceNo, otherDevices) {
    const currentName = this.data.deviceInfo?.device_name || '当前设备';
    
    // 构建选项列表
    const itemList = otherDevices.map(d => {
      const name = d.device_name || d.deviceName || '未命名设备';
      const code = d.deviceCode || d.device_no;
      return `切换到：${name}（${code}）`;
    });
    itemList.push('绑定其他设备码');
    
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        if (res.tapIndex < otherDevices.length) {
          // 切换到其他已绑定的设备
          const selectedDevice = otherDevices[res.tapIndex];
          this.switchToDevice(selectedDevice);
        } else {
          // 绑定其他设备码
          navigation.navigateTo('/pages/bind-device-code/bind-device-code?rebind=true');
        }
      }
    });
  },
  
  // 切换到指定设备
  async switchToDevice(device) {
    const deviceCode = device.deviceCode || device.device_no;
    const deviceName = device.device_name || device.deviceName || '未命名设备';
    
    wx.showModal({
      title: '切换设备',
      content: `确定切换到设备：${deviceName}？`,
      confirmText: '确定切换',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          // 保存新的设备码
          DataManager.saveDeviceCode(deviceCode);
          
          // 更新全局数据
          const app = getApp();
          app.globalData.device_no = deviceCode;
          
          message.success('设备切换成功');
          
          // 刷新页面数据
          await this.loadDeviceAndCustomerInfo();
        }
      }
    });
  },
  
  // 显示绑定新设备确认（只有一个设备时）
  showBindNewDeviceConfirm(currentDeviceNo) {
    const currentName = this.data.deviceInfo?.device_name || '当前设备';
    
    wx.showModal({
      title: '绑定其他设备',
      content: `当前绑定：${currentName}\n设备码：${currentDeviceNo || '无'}\n\n确定要绑定其他设备吗？`,
      confirmText: '去绑定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
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