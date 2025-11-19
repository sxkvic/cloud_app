// pages/bind-device-code/bind-device-code.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const app = getApp();

Page({
  data: {
    deviceCode: '',
    isLoading: false
  },

  onLoad() {
    console.log('绑定设备码页面加载');

    // 检查是否已经绑定过设备
    const deviceBound = wx.getStorageSync('deviceBound');
    if (deviceBound) {
      // 设备已绑定，直接跳转到首页
      wx.showToast({
        title: '设备已绑定',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        navigation.switchTab('/pages/home/home');
      }, 1500);
      return;
    }
  },

  onShow() {
    console.log('绑定设备码页面显示');
  },

  // 输入框内容变化
  onInputChange(e) {
    this.setData({
      deviceCode: e.detail.value
    });
  },

  // 手动提交绑定
  async onManualSubmit() {
    const { deviceCode } = this.data;

    // 验证设备码长度
    if (deviceCode.length < 16) {
      message.error('请输入16位设备绑定码');
      return;
    }

    this.setData({ isLoading: true });
    console.log('开始绑定设备，设备码:', deviceCode);

    try {
      // 1. 先验证设备码是否有效
      console.log('验证设备码是否有效...');
      const customerInfo = await API.getCustomerByDeviceCode(deviceCode);

      if (!customerInfo.data) {
        this.setData({ isLoading: false });
        message.error('设备码无效或不存在');
        return;
      }

      console.log('设备码有效，客户信息:', customerInfo.data);

      // 2. 绑定设备到用户
      console.log('绑定设备到用户...');
      await API.bindDevice(deviceCode);

      this.setData({ isLoading: false });
      message.success('设备绑定成功！');

      // 保存绑定状态到本地和全局
      wx.setStorageSync('deviceBound', true);
      wx.setStorageSync('deviceCode', deviceCode);
      app.globalData.deviceBound = true;
      app.globalData.deviceCode = deviceCode;

      // 清空输入框
      this.setData({ deviceCode: '' });

      // 跳转到首页
      setTimeout(() => {
        navigation.switchTab('/pages/home/home');
      }, 800);

    } catch (error) {
      console.error('绑定失败:', error);
      this.setData({ isLoading: false });

      // 显示友好的错误提示
      const errorMsg = error.message || '设备绑定失败，请重试';
      message.error(errorMsg);
    }
  },

  // 显示帮助信息
  showHelp() {
    wx.showModal({
      title: '找不到绑定码？',
      content: '请查看以下位置：\n\n1. 设备背面标签\n2. 设备包装盒\n3. 安装师傅提供的单据\n\n如仍无法找到，请联系客服：400-123-4567',
      showCancel: true,
      cancelText: '取消',
      confirmText: '联系客服',
      success: (res) => {
        if (res.confirm) {
          // 这里可以跳转到客服页面或拨打电话
          wx.showToast({
            title: '客服电话：400-123-4567',
            icon: 'none',
            duration: 3000
          });
        }
      }
    });
  },

  // 跳过绑定
  skipBinding() {
    wx.showModal({
      title: '跳过设备绑定',
      content: '您可以稍后在"我的"页面中绑定设备。确定要跳过吗？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '跳过',
      success: (res) => {
        if (res.confirm) {
          // 保存跳过状态
          wx.setStorageSync('bindingSkipped', true);
          message.success('已跳过绑定，您可以稍后绑定');
          setTimeout(() => {
            navigation.switchTab('/pages/home/home');
          }, 800);
        }
      }
    });
  }
});

