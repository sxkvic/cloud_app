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
        wx.redirectTo({
          url: '/pages/home/home'
        });
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

  // 扫码功能
  handleScan() {
    wx.scanCode({
      scanType: ['barCode', 'qrCode'], // 支持条形码和二维码
      success: (res) => {
        console.log('扫码成功:', res);
        // 将扫码结果填入输入框
        this.setData({
          deviceCode: res.result
        });
        message.success('扫码成功');
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        if (err.errMsg.includes('cancel')) {
          message.info('已取消扫码');
        } else {
          message.error('扫码失败，请重试');
        }
      }
    });
  },

  // 手动提交绑定
  async onManualSubmit() {
    const { deviceCode } = this.data;

    // 验证设备码是否为空
    if (!deviceCode || deviceCode.trim().length === 0) {
      message.error('请输入设备绑定码');
      return;
    }

    this.setData({ isLoading: true });
    console.log('开始绑定设备，设备码:', deviceCode);

    try {
      // 直接调用绑定接口，后端会处理所有验证逻辑
      console.log('调用绑定接口...');
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
        wx.redirectTo({
          url: '/pages/home/home'
        });
      }, 800);

    } catch (error) {
      console.error('绑定失败:', error);
      this.setData({ isLoading: false });

      // 提取错误信息，支持多种错误字段格式
      const errorMsg = error.data.error || error.data.message || error.data.details || '设备绑定失败，请重试';
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
            wx.redirectTo({
              url: '/pages/home/home'
            });
          }, 800);
        }
      }
    });
  }
});

