// pages/bind-device-code/bind-device-code.js
const { navigation, message, cacheManager } = require('../../utils/common');
const API = require('../../utils/api');
const app = getApp();

Page({
  data: {
    deviceCode: '',
    rechargeAccount: '',
    isLoading: false
  },

  onLoad(options) {
    console.log('绑定设备码页面加载', options);

    // 检查是否是重新绑定（从"我的"页面跳转过来）
    const isRebind = options.rebind === 'true';
    
    if (!isRebind) {
      // 只有非重新绑定时才检查已绑定状态
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
    } else {
      // 重新绑定时，立即清除旧的设备缓存数据
      const currentDeviceNo = wx.getStorageSync('device_no');
      if (currentDeviceNo) {
        console.log('当前绑定的设备码:', currentDeviceNo);
        console.log('🗑️ 重新绑定：清除旧设备缓存...');
        cacheManager.clearDeviceCache();
        wx.showToast({
          title: '可以重新绑定设备',
          icon: 'none',
          duration: 2000
        });
      }
    }
  },

  onShow() {
    console.log('绑定设备码页面显示');
  },

  // 输入框内容变化
  onInputChange(e) {
    // 自动去除空格，转换为大写
    const value = e.detail.value.replace(/\s+/g, '').toUpperCase();
    this.setData({
      deviceCode: value
    });
  },

  // 充值账号输入变化
  onRechargeAccountChange(e) {
    const value = e.detail.value.trim();
    this.setData({
      rechargeAccount: value
    });
  },

  // 扫码功能
  handleScan() {
    wx.scanCode({
      scanType: ['barCode', 'qrCode'], // 支持条形码和二维码
      success: (res) => {
        console.log('扫码成功:', res);
        // 将扫码结果填入输入框，去除空格并转换为大写
        const cleanCode = res.result.replace(/\s+/g, '').toUpperCase();
        this.setData({
          deviceCode: cleanCode
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
    let { deviceCode, rechargeAccount } = this.data;

    // 去除所有空格并转换为大写
    deviceCode = deviceCode.replace(/\s+/g, '').toUpperCase();
    rechargeAccount = rechargeAccount.trim();

    // 验证设备码是否为空
    if (!deviceCode || deviceCode.length === 0) {
      message.error('请输入设备绑定码');
      return;
    }

    // 验证设备码格式（可选，根据实际需求调整）
    if (deviceCode.length < 6) {
      message.error('设备码格式不正确，请检查后重试');
      return;
    }

    // 验证充值账号（可选）
    if (rechargeAccount && !/^1[3-9]\d{9}$/.test(rechargeAccount)) {
      message.error('请输入正确的手机号码');
      return;
    }

    this.setData({ isLoading: true });
    console.log('开始绑定设备，设备码:', deviceCode, '充值账号:', rechargeAccount);

    try {
      // 清除旧的设备绑定
      cacheManager.clearDeviceCache();
      
      // 直接调用绑定接口，后端会处理所有验证逻辑
      console.log('调用绑定接口...');
      await API.bindDevice(deviceCode, rechargeAccount);

      // 绑定成功后，只保存设备码（不缓存其他数据，所有数据实时获取）
      wx.setStorageSync('deviceBound', true);
      wx.setStorageSync('device_no', deviceCode);
      
      // 同步到全局数据（只保存设备码）
      app.globalData.deviceBound = true;
      app.globalData.device_no = deviceCode;
      
      console.log('✅ 设备绑定成功，设备码:', deviceCode);

      this.setData({ isLoading: false });
      message.success('设备绑定成功！');

      // 清空输入框
      this.setData({ 
        deviceCode: '',
        rechargeAccount: ''
      });

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
      content: '请查看以下位置：\n\n1. 设备背面标签\n2. 设备包装盒\n3. 安装师父提供的单据\n\n如仍无法找到，请联系客服：4009677726',
      showCancel: true,
      cancelText: '取消',
      confirmText: '联系客服',
      success: (res) => {
        if (res.confirm) {
          // 这里可以跳转到客服页面或拨打电话
          wx.showToast({
            title: '客服电话：4009677726',
            icon: 'none',
            duration: 3000
          });
        }
      }
    });
  },

  // 跳过绑定 - 简化流程，直接跳过
  skipBinding() {
    // 保存跳过状态
    wx.setStorageSync('bindingSkipped', true);
    
    // 显示提示并跳转
    message.success('已跳过绑定');
    
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/home/home'
      });
    }, 500);
  }
});

