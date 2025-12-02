// pages/payment-collection/payment-collection.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    serviceStatus: 'active',
    selectedMethod: 'wechat',
    selectedAmount: 'auto',
    customAmount: '',
    paymentDate: '',
    insufficientAction: 'retry',
    canSave: true,
    paymentMethods: [
      {
        id: 'wechat',
        name: '微信支付',
        description: '使用微信零钱或绑定的银行卡',
        icon: '💚'
      },
      {
        id: 'alipay',
        name: '支付宝',
        description: '使用支付宝余额或绑定的银行卡',
        icon: '💙'
      },
      {
        id: 'bank',
        name: '银行卡',
        description: '使用绑定的银行卡直接扣款',
        icon: '💳'
      }
    ],
    amountOptions: [
      { value: 'auto', label: '自动扣费' },
      { value: '100', label: '¥100' },
      { value: '200', label: '¥200' },
      { value: '500', label: '¥500' },
      { value: 'custom', label: '自定义' }
    ],
    insufficientActions: [
      {
        id: 'retry',
        name: '重试扣费',
        description: '余额不足时自动重试3次',
        icon: '🔄'
      },
      {
        id: 'notify',
        name: '发送通知',
        description: '余额不足时发送短信通知',
        icon: '📱'
      },
      {
        id: 'stop',
        name: '停止代扣',
        description: '余额不足时停止代扣服务',
        icon: '⏹️'
      }
    ],
    paymentHistory: [
      {
        id: '1',
        date: '2024-12-15 10:30',
        amount: '128.00',
        status: 'success',
        statusText: '成功'
      },
      {
        id: '2',
        date: '2024-11-15 10:30',
        amount: '128.00',
        status: 'success',
        statusText: '成功'
      },
      {
        id: '3',
        date: '2024-10-15 10:30',
        amount: '128.00',
        status: 'failed',
        statusText: '失败'
      },
      {
        id: '4',
        date: '2024-09-15 10:30',
        amount: '128.00',
        status: 'success',
        statusText: '成功'
      }
    ]
  },

  onLoad() {
    console.log('代缴代扣页面加载');
    this.loadSettings();
  },

  onShow() {
    console.log('代缴代扣页面显示');
  },

  // 加载设置
  loadSettings() {
    // 模拟从服务器加载用户设置
    const settings = {
      serviceStatus: 'active',
      selectedMethod: 'wechat',
      selectedAmount: 'auto',
      paymentDate: '2024-12-20',
      insufficientAction: 'retry'
    };
    
    this.setData(settings);
  },

  // 切换服务状态
  toggleService() {
    const newStatus = this.data.serviceStatus === 'active' ? 'inactive' : 'active';
    
    wx.showModal({
      title: newStatus === 'active' ? '开启代扣服务' : '关闭代扣服务',
      content: newStatus === 'active' ? 
        '开启后系统将自动代缴宽带费用，确认开启？' : 
        '关闭后需要手动缴费，确认关闭？',
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            serviceStatus: newStatus
          });
          
          message.success(newStatus === 'active' ? '代扣服务已开启' : '代扣服务已关闭');
          
          // 触觉反馈
          wx.vibrateShort();
        }
      }
    });
  },

  // 选择代扣方式
  selectPaymentMethod(e) {
    const methodId = e.currentTarget.dataset.id;
    this.setData({
      selectedMethod: methodId
    });
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 选择代扣金额
  selectAmount(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      selectedAmount: value,
      customAmount: value === 'custom' ? this.data.customAmount : ''
    });
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 输入自定义金额
  onCustomAmountInput(e) {
    let value = e.detail.value;
    
    // 只允许数字和小数点
    value = value.replace(/[^\d.]/g, '');
    
    // 确保只有一个小数点
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // 限制小数点后最多两位
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    this.setData({
      customAmount: value
    });
  },

  // 选择代扣日期
  onPaymentDateChange(e) {
    this.setData({
      paymentDate: e.detail.value
    });
  },

  // 选择余额不足处理方式
  selectInsufficientAction(e) {
    const actionId = e.currentTarget.dataset.id;
    this.setData({
      insufficientAction: actionId
    });
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '代缴代扣相关问题请联系客服咨询。\n\n客服电话：4009677726\n工作时间：9:00-18:00',
      confirmText: '拨打电话',
      cancelText: '在线咨询',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '4009677726'
          });
        } else {
          message.success('正在为您转接在线客服...');
        }
      }
    });
  },

  // 保存设置
  saveSettings() {
    if (!this.data.canSave) {
      message.error('请完善代扣设置');
      return;
    }

    const { serviceStatus, selectedMethod, selectedAmount, customAmount, paymentDate, insufficientAction } = this.data;
    
    // 验证设置
    if (serviceStatus === 'active') {
      if (!selectedMethod) {
        message.error('请选择代扣方式');
        return;
      }
      
      if (selectedAmount === 'custom' && (!customAmount || parseFloat(customAmount) <= 0)) {
        message.error('请输入有效的自定义金额');
        return;
      }
      
      if (!paymentDate) {
        message.error('请选择代扣日期');
        return;
      }
      
      if (!insufficientAction) {
        message.error('请选择余额不足处理方式');
        return;
      }
    }

    wx.showModal({
      title: '保存设置',
      content: `代扣方式：${this.data.paymentMethods.find(m => m.id === selectedMethod).name}\n代扣金额：${selectedAmount === 'custom' ? '¥' + customAmount : (selectedAmount === 'auto' ? '自动扣费' : '¥' + selectedAmount)}\n代扣日期：${paymentDate}\n\n确认保存这些设置？`,
      confirmText: '确认保存',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processSaveSettings();
        }
      }
    });
  },

  // 处理保存设置
  processSaveSettings() {
    wx.showLoading({
      title: '正在保存...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      message.success('设置保存成功');
      
      setTimeout(() => {
        wx.showModal({
          title: '设置已保存',
          content: '您的代缴代扣设置已成功保存！\n\n系统将按照您的设置自动执行代扣操作。如有变更，可随时修改设置。',
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 返回首页
            navigation.switchTab('/pages/home/home');
          }
        });
      }, 1000);
    }, 1500);
  }
});