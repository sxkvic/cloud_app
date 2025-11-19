// pages/pre-recharge/pre-recharge.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const app = getApp();

Page({
    data: {
    currentBalance: '128.50',
    selectedAmount: null,
    customAmount: '',
    selectedMethod: 'wechat',
    finalAmount: '0.00',
    bonusAmount: 0,
    canRecharge: false,
    paymentOrderId: null, // 支付订单ID
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
  async processRecharge() {
    const { finalAmount, bonusAmount, selectedMethod } = this.data;

    // 只支持微信支付
    if (selectedMethod !== 'wechat') {
      message.error('当前仅支持微信支付');
      return;
    }

    try {
      wx.showLoading({ title: '正在创建订单...' });
      console.log('创建支付订单，金额:', finalAmount);

      // 1. 创建支付订单
      const paymentResult = await API.createMiniprogramPayment({
        amount: parseFloat(finalAmount),
        description: `账户充值 ¥${finalAmount}`,
        openid: app.globalData.openid
      });

      wx.hideLoading();
      console.log('支付订单创建成功:', paymentResult.data);

      const { orderId, paymentParams } = paymentResult.data;
      this.setData({ paymentOrderId: orderId });

      // 2. 调起微信支付
      wx.showLoading({ title: '正在调起支付...' });

      await new Promise((resolve, reject) => {
        wx.requestPayment({
          timeStamp: paymentParams.timeStamp,
          nonceStr: paymentParams.nonceStr,
          package: paymentParams.package,
          signType: paymentParams.signType || 'RSA',
          paySign: paymentParams.paySign,
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();
      console.log('用户完成支付');

      // 3. 查询支付状态
      wx.showLoading({ title: '正在确认支付...' });
      await this.checkPaymentStatus(orderId);

    } catch (error) {
      wx.hideLoading();
      console.error('支付失败:', error);

      // 用户取消支付
      if (error.errMsg && error.errMsg.includes('cancel')) {
        message.error('支付已取消');

        // 取消订单
        if (this.data.paymentOrderId) {
          try {
            await API.cancelPayment(this.data.paymentOrderId);
            console.log('订单已取消');
          } catch (cancelError) {
            console.error('取消订单失败:', cancelError);
          }
        }
      } else {
        const errorMsg = error.message || '支付失败，请重试';
        message.error(errorMsg);
      }
    }
  },

  // 查询支付状态
  async checkPaymentStatus(orderId) {
    try {
      const statusResult = await API.getPaymentStatus(orderId);
      const status = statusResult.data.status;

      wx.hideLoading();
      console.log('支付状态:', status);

      if (status === 'success' || status === 'paid') {
        // 支付成功
        message.success('充值成功！');

        const { finalAmount, bonusAmount } = this.data;
        const totalAmount = (parseFloat(finalAmount) + bonusAmount).toFixed(2);

        setTimeout(() => {
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
                id: orderId,
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
                canRecharge: false,
                paymentOrderId: null
              });
            }
          });
        }, 1000);

      } else if (status === 'pending') {
        // 支付处理中
        message.error('支付处理中，请稍后查看充值记录');
      } else {
        // 支付失败
        message.error('支付失败，请重试');
      }

    } catch (error) {
      wx.hideLoading();
      console.error('查询支付状态失败:', error);
      message.error('支付状态查询失败，请稍后在充值记录中查看');
    }
  }
});