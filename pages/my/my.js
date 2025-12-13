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
    bindingInfo: {},
    isFirstLoad: true,
    // 设备选择弹窗
    showDeviceModal: false,
    currentDeviceNo: '',
    otherDevices: [],
    // 解绑设备弹窗
    showUnbindModal: false,
    unbindDeviceList: []
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
      
      // 使用新的验证逻辑，自动获取有效的设备码
      const deviceNo = await DataManager.getValidDeviceCode();
      if (!deviceNo) {
        this.setData({ loading: false });
        return;
      }
      
      // 实时获取完整客户信息（已经传入了有效的设备码）
      const result = await DataManager.getCompleteCustomerInfo(deviceNo);
      
      if (result.success && result.data) {
        const { customer, device_info, device, binding_info } = result.data;
        const deviceData = device_info || device || {};
        
        // 设置设备状态文本
        const statusText = this.getDeviceStatusText(deviceData);
        
        this.setData({
          deviceInfo: {
            ...deviceData,
            status_text: statusText
          },
          customerInfo: customer || {},
          bindingInfo: binding_info || {},
          currentDeviceNo: deviceNo,
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
      console.error('验证设备绑定状态失败:', error);
      message.error('验证设备绑定状态失败');
    }
  },

  // 导航到服务页面
  navigateToService(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      message.error('功能开发中，敬请期待');
      return;
    }

    // 绑定设备码相关页面不需要验证设备绑定
    const noAuthPages = ['/pages/bind-device-code/bind-device-code'];
    
    if (!noAuthPages.includes(url)) {
      // 其他页面需要验证设备绑定
      const deviceNo = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
      
      if (!deviceNo) {
        wx.showToast({
          title: '未绑定设备，无此权限',
          icon: 'none',
          duration: 2000
        });
        return;
      }
    }
    
    // 统一使用直接跳转
    navigation.navigateTo(url);
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
      
      // 显示自定义设备选择弹窗
      this.setData({
        showDeviceModal: true,
        currentDeviceNo: currentDeviceNo,
        otherDevices: otherDevices
      });
      
    } catch (error) {
      wx.hideLoading();
      console.error('获取设备列表失败:', error);
      // 获取失败时，也显示弹窗，但没有其他设备
      this.setData({
        showDeviceModal: true,
        currentDeviceNo: currentDeviceNo,
        otherDevices: []
      });
    }
  },
  
  // 隐藏设备选择弹窗
  hideDeviceModal() {
    this.setData({ showDeviceModal: false });
  },
  
  // 选择设备
  onSelectDevice(e) {
    const device = e.currentTarget.dataset.device;
    this.hideDeviceModal();
    this.switchToDevice(device);
  },
  
  // 跳转绑定新设备页面
  goBindNewDevice() {
    this.hideDeviceModal();
    navigation.navigateTo('/pages/bind-device-code/bind-device-code?rebind=true');
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
  
  
  // 显示解绑设备弹窗
  async showUnbindModal() {
    // 验证设备绑定状态
    const deviceNo = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
    
    if (!deviceNo) {
      wx.showToast({
        title: '未绑定设备，无此权限',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    const currentDeviceNo = this.data.currentDeviceNo;
    
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 查询用户绑定的所有设备
      const devicesResult = await API.getUserDevices();
      const devices = devicesResult.data?.devices || [];
      
      wx.hideLoading();
      
      // 过滤掉当前设备，获取其他设备
      const unbindDeviceList = devices.filter(d => {
        const deviceNo = d.deviceCode || d.device_no;
        return deviceNo !== currentDeviceNo;
      });
      
      this.setData({
        showUnbindModal: true,
        unbindDeviceList: unbindDeviceList
      });
      
    } catch (error) {
      wx.hideLoading();
      console.error('获取设备列表失败:', error);
      // 获取失败时，也显示弹窗，但没有其他设备
      this.setData({
        showUnbindModal: true,
        unbindDeviceList: []
      });
    }
  },
  
  // 隐藏解绑设备弹窗
  hideUnbindModal() {
    this.setData({ showUnbindModal: false });
  },
  
  // 执行解绑设备
  onUnbindDevice(e) {
    const { deviceNo, rechargeAccount } = e.currentTarget.dataset;
    
    if (!deviceNo) {
      message.error('设备信息不完整，无法解绑');
      return;
    }
    
    // 缴费账号为空时提示无法解绑
    if (!rechargeAccount) {
      wx.showToast({
        title: '没有缴费账号无法解绑',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    this.hideUnbindModal();
    
    // 构建确认内容
    let confirmContent = `确定要解绑该设备吗？\n\n设备编码：${deviceNo}`;
    if (rechargeAccount) {
      confirmContent += `\n缴费账号：${rechargeAccount}`;
    }
    
    wx.showModal({
      title: '确认解绑',
      content: confirmContent,
      confirmText: '确定',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '解绑中...' });
            
            const result = await API.unbindDevice(rechargeAccount || '', deviceNo);
            
            wx.hideLoading();
            
            if (result.success) {
              // 如果解绑的是当前设备，清除本地缓存
              if (deviceNo === this.data.currentDeviceNo) {
                wx.removeStorageSync('device_no');
                wx.removeStorageSync('deviceCode');
                
                const app = getApp();
                app.globalData.device_no = '';
                
                message.success('解绑成功');
                
                // 跳转到绑定设备页面
                setTimeout(() => {
                  navigation.navigateTo('/pages/bind-device-code/bind-device-code');
                }, 1500);
              } else {
                message.success('解绑成功');
              }
            } else {
              message.error(result.message || '解绑失败，请重试');
            }
          } catch (error) {
            wx.hideLoading();
            console.error('解绑设备失败:', error);
            message.error('解绑失败，请重试');
          }
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