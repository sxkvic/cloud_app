// pages/pre-recharge/pre-recharge.js
const { navigation, message } = require('../../utils/common');

Page({
    data: {
    currentBalance: '128.50',
    selectedAmount: null,
    customAmount: '',
    selectedMethod: 'wechat',
    finalAmount: '0.00',
    bonusAmount: 0,
    canRecharge: false,
    amountOptions: [
      { value: '50', bonus: '' },
      { value: '100', bonus: '10' },
      { value: '200', bonus: '25' },
      { value: '500', bonus: '80' },
      { value: '1000', bonus: '200' }
    ],
    paymentMethods: [
      {
        id: 'wechat',
        name: '微信支付',
        description: '使用微信零钱或绑定的银行卡',
        icon: 'wechat'
      },
      {
        id: 'alipay',
        name: '支付宝',
        description: '使用支付宝余额或绑定的银行卡',
        icon: 'alipay'
      }
    ],
    rechargeHistory: [
      {
        id: '1',
        date: '2024-12-10 14:30',
        amount: '200.00',
        status: 'success',
        statusText: '成功'
      },
      {
        id: '2',
        date: '2024-11-15 09:20',
        amount: '100.00',
        status: 'success',
        statusText: '成功'
      },
      {
        id: '3',
        date: '2024-10-20 16:45',
        amount: '500.00',
        status: 'success',
        statusText: '成功'
      },
      {
        id: '4',
        date: '2024-09-25 11:15',
        amount: '200.00',
        status: 'failed',
        statusText: '失败'
      }
    ]
  },

  onLoad() {
    console.log('预充值页面加载');
  },

  onShow() {
    console.log('预充值页面显示');
  },

  // 选择充值金额
  selectAmount(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      selectedAmount: value,
      customAmount: ''
    });
    this.calculateAmount();
    
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
      customAmount: value,
      selectedAmount: value ? 'custom' : null
    });
    this.calculateAmount();
  },

  // 计算充值金额和赠送金额
  calculateAmount() {
    const { selectedAmount, customAmount } = this.data;
    let amount = 0;
    let bonus = 0;
    
    if (selectedAmount === 'custom' && customAmount) {
      amount = parseFloat(customAmount) || 0;
    } else if (selectedAmount && selectedAmount !== 'custom') {
      amount = parseFloat(selectedAmount) || 0;
      // 计算赠送金额
      const option = this.data.amountOptions.find(opt => opt.value === selectedAmount);
      if (option && option.bonus) {
        bonus = parseFloat(option.bonus) || 0;
      }
    }
    
    this.setData({
      finalAmount: amount.toFixed(2),
      bonusAmount: bonus,
      canRecharge: amount > 0
    });
  },

  // 选择支付方式
  selectPaymentMethod(e) {
    const methodId = e.currentTarget.dataset.id;
    this.setData({
      selectedMethod: methodId
    });
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '充值相关问题请联系客服咨询。\n\n客服电话：400-123-4567\n工作时间：9:00-18:00',
      confirmText: '拨打电话',
      cancelText: '在线咨询',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567'
          });
        } else {
          message.success('正在为您转接在线客服...');
        }
      }
    });
  },

  // 开始充值
  startRecharge() {
    if (!this.data.canRecharge) {
      message.error('请选择充值金额');
      return;
    }

    const { selectedMethod, finalAmount, bonusAmount } = this.data;
    const paymentMethod = this.data.paymentMethods.find(method => method.id === selectedMethod);
    
    let content = `充值金额：¥${finalAmount}\n`;
    if (bonusAmount > 0) {
      content += `赠送金额：¥${bonusAmount}\n`;
    }
    content += `支付方式：${paymentMethod.name}\n\n确认充值？`;

    wx.showModal({
      title: '确认充值',
      content: content,
      confirmText: '确认支付',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processRecharge();
        }
      }
    });
  },

  // 处理充值
  processRecharge() {
    wx.showLoading({
      title: '正在处理...'
    });

    // 模拟支付过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟支付成功
      const success = Math.random() > 0.1; // 90% 成功率
      
      if (success) {
        message.success('充值成功');
        
        setTimeout(() => {
          const { finalAmount, bonusAmount } = this.data;
          const totalAmount = (parseFloat(finalAmount) + bonusAmount).toFixed(2);
          
          wx.showModal({
            title: '充值成功',
            content: `充值金额：¥${finalAmount}\n${bonusAmount > 0 ? `赠送金额：¥${bonusAmount}\n` : ''}到账金额：¥${totalAmount}\n\n余额已更新，可立即使用。`,
            showCancel: false,
            confirmText: '知道了',
            success: () => {
              // 更新余额
              const currentBalance = parseFloat(this.data.currentBalance);
              const newBalance = (currentBalance + parseFloat(totalAmount)).toFixed(2);
              this.setData({
                currentBalance: newBalance
              });
              
              // 添加到充值记录
              const newRecord = {
                id: Date.now().toString(),
                date: new Date().toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }).replace(/\//g, '-'),
                amount: totalAmount,
                status: 'success',
                statusText: '成功'
              };
              
              this.setData({
                rechargeHistory: [newRecord, ...this.data.rechargeHistory]
              });
              
              // 清空选择
              this.setData({
                selectedAmount: null,
                customAmount: '',
                finalAmount: '0.00',
                bonusAmount: 0,
                canRecharge: false
              });
            }
          });
        }, 1000);
      } else {
        message.error('充值失败，请重试');
        
        setTimeout(() => {
          wx.showModal({
            title: '充值失败',
            content: '支付过程中出现问题，请检查支付方式或联系客服。\n\n如已扣费但未到账，请联系客服处理。',
            showCancel: false,
            confirmText: '知道了'
          });
        }, 1000);
      }
    }, 2000);
  }
});