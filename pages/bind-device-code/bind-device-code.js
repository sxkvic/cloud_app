// pages/bind-device-code/bind-device-code.js
const { navigation, message } = require('../../utils/common');

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
  onManualSubmit() {
    const { deviceCode } = this.data;
    
    if (deviceCode.length < 16) {
      message.error('请输入16位设备绑定码');
      return;
    }
    
    this.setData({ isLoading: true });
    
    console.log('Binding with code:', deviceCode);
    
    // 模拟网络请求
    setTimeout(() => {
      this.setData({ isLoading: false });
      message.success('设备绑定成功！');
      
      // 保存绑定状态
      wx.setStorageSync('deviceBound', true);
      wx.setStorageSync('deviceCode', deviceCode);
      
      // 清空输入框
      this.setData({ deviceCode: '' });
      
      setTimeout(() => {
        // 使用switchTab跳转到tabBar页面
        navigation.switchTab('/pages/home/home');
      }, 800);
    }, 1500);
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

