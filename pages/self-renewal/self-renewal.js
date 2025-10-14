// pages/self-renewal/self-renewal.js
const { navigation, message } = require('../../utils/common');

Page({
    data: {
    expiryDate: '2025-01-15',
    selectedPackage: null,
    selectedDuration: null,
    selectedMethod: 'wechat',
    packagePrice: '0.00',
    discountAmount: 0,
    finalAmount: '0.00',
    canRenew: false,
    renewalPackages: [
      {
        id: 'basic_100m',
        name: '基础套餐',
        price: '128',
        bandwidth: '100M',
        duration: '1个月',
        bonus: ''
      },
      {
        id: 'standard_200m',
        name: '标准套餐',
        price: '168',
        bandwidth: '200M',
        duration: '1个月',
        bonus: '送1个月'
      },
      {
        id: 'premium_500m',
        name: '高级套餐',
        price: '228',
        bandwidth: '500M',
        duration: '1个月',
        bonus: '送2个月'
      }
    ],
    durationOptions: [
      { value: '1', label: '1个月', discount: '' },
      { value: '3', label: '3个月', discount: '9.5折' },
      { value: '6', label: '6个月', discount: '9折' },
      { value: '12', label: '12个月', discount: '8.5折' }
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
      },
      {
        id: 'balance',
        name: '账户余额',
        description: '使用账户余额支付',
        icon: 'balance'
      }
    ],
    renewalHistory: [
      {
        id: '1',
        date: '2024-11-15 14:30',
        package: '标准套餐 200M',
        amount: '168.00'
      },
      {
        id: '2',
        date: '2024-10-15 09:20',
        package: '基础套餐 100M',
        amount: '128.00'
      },
      {
        id: '3',
        date: '2024-09-15 16:45',
        package: '标准套餐 200M',
        amount: '168.00'
      }
    ]
  },

  onLoad() {
    console.log('自助续费页面加载');
  },

  onShow() {
    console.log('自助续费页面显示');
  },

  // 选择套餐
  selectPackage(e) {
    const packageId = e.currentTarget.dataset.id;
    this.setData({
      selectedPackage: packageId,
      selectedDuration: null
    });
    this.calculatePrice();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 选择续费时长
  selectDuration(e) {
    const duration = e.currentTarget.dataset.value;
    this.setData({
      selectedDuration: duration
    });
    this.calculatePrice();
    
    // 触觉反馈
    wx.vibrateShort();
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

  // 计算价格
  calculatePrice() {
    const { selectedPackage, selectedDuration } = this.data;
    
    if (!selectedPackage || !selectedDuration) {
      this.setData({
        packagePrice: '0.00',
        discountAmount: 0,
        finalAmount: '0.00',
        canRenew: false
      });
      return;
    }

    const packageInfo = this.data.renewalPackages.find(pkg => pkg.id === selectedPackage);
    const durationInfo = this.data.durationOptions.find(dur => dur.value === selectedDuration);
    
    if (!packageInfo || !durationInfo) return;

    let basePrice = parseFloat(packageInfo.price);
    let months = parseInt(selectedDuration);
    let totalPrice = basePrice * months;
    
    // 计算折扣
    let discount = 0;
    switch (selectedDuration) {
      case '3':
        discount = totalPrice * 0.05; // 9.5折
        break;
      case '6':
        discount = totalPrice * 0.1; // 9折
        break;
      case '12':
        discount = totalPrice * 0.15; // 8.5折
        break;
    }
    
    let finalPrice = totalPrice - discount;
    
    this.setData({
      packagePrice: totalPrice.toFixed(2),
      discountAmount: discount.toFixed(2),
      finalAmount: finalPrice.toFixed(2),
      canRenew: true
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '续费相关问题请联系客服咨询。\n\n客服电话：400-123-4567\n工作时间：9:00-18:00',
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

  // 开始续费
  startRenewal() {
    if (!this.data.canRenew) {
      message.error('请选择套餐和续费时长');
      return;
    }

    const { selectedPackage, selectedDuration, selectedMethod, finalAmount } = this.data;
    const packageInfo = this.data.renewalPackages.find(pkg => pkg.id === selectedPackage);
    const durationInfo = this.data.durationOptions.find(dur => dur.value === selectedDuration);
    const paymentMethod = this.data.paymentMethods.find(method => method.id === selectedMethod);
    
    let content = `套餐：${packageInfo.name} ${packageInfo.bandwidth}\n`;
    content += `时长：${durationInfo.label}\n`;
    content += `金额：¥${finalAmount}\n`;
    content += `支付方式：${paymentMethod.name}\n\n确认续费？`;

    wx.showModal({
      title: '确认续费',
      content: content,
      confirmText: '确认支付',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processRenewal();
        }
      }
    });
  },

  // 处理续费
  processRenewal() {
    wx.showLoading({
      title: '正在处理...'
    });

    // 模拟支付过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟支付成功
      const success = Math.random() > 0.1; // 90% 成功率
      
      if (success) {
        message.success('续费成功');
        
        setTimeout(() => {
          const { selectedPackage, selectedDuration, finalAmount } = this.data;
          const packageInfo = this.data.renewalPackages.find(pkg => pkg.id === selectedPackage);
          const durationInfo = this.data.durationOptions.find(dur => dur.value === selectedDuration);
          
          // 计算新的到期时间
          const currentDate = new Date();
          const months = parseInt(selectedDuration);
          const newExpiryDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + months, currentDate.getDate());
          const formattedDate = newExpiryDate.toISOString().split('T')[0];
          
          wx.showModal({
            title: '续费成功',
            content: `套餐：${packageInfo.name} ${packageInfo.bandwidth}\n时长：${durationInfo.label}\n金额：¥${finalAmount}\n\n新的到期时间：${formattedDate}\n服务已自动续期，可立即使用。`,
            showCancel: false,
            confirmText: '知道了',
            success: () => {
              // 更新到期时间
              this.setData({
                expiryDate: formattedDate
              });
              
              // 添加到续费记录
              const newRecord = {
                id: Date.now().toString(),
                date: new Date().toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }).replace(/\//g, '-'),
                package: `${packageInfo.name} ${packageInfo.bandwidth}`,
                amount: finalAmount
              };
              
              this.setData({
                renewalHistory: [newRecord, ...this.data.renewalHistory]
              });
              
              // 清空选择
              this.setData({
                selectedPackage: null,
                selectedDuration: null,
                packagePrice: '0.00',
                discountAmount: 0,
                finalAmount: '0.00',
                canRenew: false
              });
            }
          });
        }, 1000);
      } else {
        message.error('续费失败，请重试');
        
        setTimeout(() => {
          wx.showModal({
            title: '续费失败',
            content: '支付过程中出现问题，请检查支付方式或联系客服。\n\n如已扣费但未续费，请联系客服处理。',
            showCancel: false,
            confirmText: '知道了'
          });
        }, 1000);
      }
    }, 2000);
  }
});