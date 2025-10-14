// pages/invoice/invoice.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    selectedType: null, // 'personal' 或 'company'
    canSubmit: false,
    totalAmount: '2,580.00',
    invoicedAmount: '1,200.00',
    availableAmount: '1,380.00',
    
    // 个人发票数据
    personalData: {
      amount: '',
      title: '',
      email: '',
      contentIndex: null,
      receiverName: '',
      receiverPhone: '',
      receiverAddress: '',
      remark: ''
    },
    
    // 企业发票数据
    companyData: {
      amount: '',
      companyName: '',
      taxNumber: '',
      companyAddress: '',
      companyPhone: '',
      bankName: '',
      bankAccount: '',
      email: '',
      contentIndex: null,
      receiverName: '',
      receiverPhone: '',
      receiverAddress: '',
      remark: ''
    },
    
    invoiceTypes: [
      {
        id: 'personal',
        name: '个人发票',
        description: '适用于个人用户',
        icon: '👤'
      },
      {
        id: 'company',
        name: '企业发票',
        description: '适用于企业用户，可抵扣税款',
        icon: '🏢'
      }
    ],
    invoiceContents: [
      '宽带服务费',
      '安装服务费',
      '设备租赁费',
      '维护服务费',
      '其他服务费'
    ]
  },

  onLoad() {
    console.log('开票页面加载');
  },

  onShow() {
    console.log('开票页面显示');
  },

  // 选择发票类型
  selectInvoiceType(e) {
    const typeId = e.currentTarget.dataset.id;
    this.setData({
      selectedType: typeId
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 输入开票金额
  onAmountInput(e) {
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
    
    const field = this.data.selectedType === 'personal' ? 'personalData.amount' : 'companyData.amount';
    this.setData({
      [field]: value
    });
    this.checkCanSubmit();
  },

  // 设置最大金额
  setMaxAmount() {
    const field = this.data.selectedType === 'personal' ? 'personalData.amount' : 'companyData.amount';
    this.setData({
      [field]: this.data.availableAmount.replace(',', '')
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 通用输入处理
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    if (this.data.selectedType === 'personal') {
      this.setData({
        [`personalData.${field}`]: value
      });
    } else {
      this.setData({
        [`companyData.${field}`]: value
      });
    }
    this.checkCanSubmit();
  },

  // 选择发票内容
  onContentChange(e) {
    const field = this.data.selectedType === 'personal' ? 'personalData.contentIndex' : 'companyData.contentIndex';
    this.setData({
      [field]: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { selectedType, personalData, companyData } = this.data;
    
    if (!selectedType) {
      this.setData({ canSubmit: false });
      return;
    }

    let formData = selectedType === 'personal' ? personalData : companyData;
    let canSubmit = false;

    if (selectedType === 'personal') {
      // 个人发票验证
      const hasAmount = formData.amount && parseFloat(formData.amount) > 0;
      const hasTitle = formData.title && formData.title.trim().length > 0;
      const hasEmail = formData.email && formData.email.trim().length > 0;
      const hasContent = formData.contentIndex !== null;
      const hasReceiverName = formData.receiverName && formData.receiverName.trim().length > 0;
      const hasReceiverPhone = formData.receiverPhone && formData.receiverPhone.trim().length > 0;
      const hasReceiverAddress = formData.receiverAddress && formData.receiverAddress.trim().length > 0;

      // 金额验证
      const amount = parseFloat(formData.amount);
      const availableAmount = parseFloat(this.data.availableAmount.replace(',', ''));
      const isValidAmount = amount > 0 && amount <= availableAmount;

      // 手机号验证
      const isValidPhone = this.validatePhone(formData.receiverPhone);

      // 邮箱验证
      const isValidEmail = this.validateEmail(formData.email);

      canSubmit = hasAmount && hasTitle && hasEmail && hasContent && 
                  hasReceiverName && hasReceiverPhone && hasReceiverAddress &&
                  isValidAmount && isValidPhone && isValidEmail;
    } else {
      // 企业发票验证
      const hasAmount = formData.amount && parseFloat(formData.amount) > 0;
      const hasCompanyName = formData.companyName && formData.companyName.trim().length > 0;
      const hasTaxNumber = formData.taxNumber && formData.taxNumber.trim().length > 0;
      const hasCompanyAddress = formData.companyAddress && formData.companyAddress.trim().length > 0;
      const hasCompanyPhone = formData.companyPhone && formData.companyPhone.trim().length > 0;
      const hasBankName = formData.bankName && formData.bankName.trim().length > 0;
      const hasBankAccount = formData.bankAccount && formData.bankAccount.trim().length > 0;
      const hasEmail = formData.email && formData.email.trim().length > 0;
      const hasContent = formData.contentIndex !== null;
      const hasReceiverName = formData.receiverName && formData.receiverName.trim().length > 0;
      const hasReceiverPhone = formData.receiverPhone && formData.receiverPhone.trim().length > 0;
      const hasReceiverAddress = formData.receiverAddress && formData.receiverAddress.trim().length > 0;

      // 金额验证
      const amount = parseFloat(formData.amount);
      const availableAmount = parseFloat(this.data.availableAmount.replace(',', ''));
      const isValidAmount = amount > 0 && amount <= availableAmount;

      // 手机号验证
      const isValidPhone = this.validatePhone(formData.receiverPhone);
      const isValidCompanyPhone = this.validatePhone(formData.companyPhone);

      // 纳税人识别号验证
      const isValidTaxNumber = this.validateTaxNumber(formData.taxNumber);

      // 邮箱验证
      const isValidEmail = this.validateEmail(formData.email);

      canSubmit = hasAmount && hasCompanyName && hasTaxNumber && hasCompanyAddress && 
                  hasCompanyPhone && hasBankName && hasBankAccount && hasEmail && hasContent && 
                  hasReceiverName && hasReceiverPhone && hasReceiverAddress &&
                  isValidAmount && isValidPhone && isValidCompanyPhone && isValidTaxNumber && isValidEmail;
    }
    
    this.setData({ canSubmit });
  },

  // 验证手机号
  validatePhone(phone) {
    if (!phone) return false;
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // 验证纳税人识别号
  validateTaxNumber(taxNumber) {
    if (!taxNumber) return false;
    // 统一社会信用代码：18位，包含数字和字母
    const taxRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
    // 或者简单的15位或18位数字
    const simpleRegex = /^\d{15}$|^\d{18}$/;
    return taxRegex.test(taxNumber) || simpleRegex.test(taxNumber);
  },

  // 验证邮箱
  validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '开票相关问题请联系客服咨询。\n\n客服电话：400-123-4567\n工作时间：9:00-18:00',
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

  // 提交开票申请
  submitInvoice() {
    if (!this.data.canSubmit) {
      message.error('请完善开票信息');
      return;
    }

    const { selectedType, personalData, companyData } = this.data;
    const invoiceType = this.data.invoiceTypes.find(type => type.id === selectedType);
    const formData = selectedType === 'personal' ? personalData : companyData;
    const amount = parseFloat(formData.amount);
    const availableAmount = parseFloat(this.data.availableAmount.replace(',', ''));
    
    if (amount > availableAmount) {
      message.error('开票金额不能超过可开票金额');
      return;
    }

    if (!this.validatePhone(formData.receiverPhone)) {
      message.error('请输入正确的收票人手机号码');
      return;
    }

    if (!this.validateEmail(formData.email)) {
      message.error('请输入正确的邮箱地址');
      return;
    }

    if (selectedType === 'company') {
      if (!this.validateTaxNumber(formData.taxNumber)) {
        message.error('请输入正确的纳税人识别号');
        return;
      }
      if (!this.validatePhone(formData.companyPhone)) {
        message.error('请输入正确的企业电话');
        return;
      }
    }

    let content = `发票类型：${invoiceType.name}\n开票金额：¥${formData.amount}\n`;
    if (selectedType === 'personal') {
      content += `发票抬头：${formData.title}\n收票人：${formData.receiverName}\n`;
    } else {
      content += `企业名称：${formData.companyName}\n收票人：${formData.receiverName}\n`;
    }
    content += `\n确认提交开票申请？`;

    wx.showModal({
      title: '确认开票',
      content: content,
      confirmText: '确认提交',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processInvoice();
        }
      }
    });
  },

  // 处理开票申请
  processInvoice() {
    wx.showLoading({
      title: '正在提交...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      message.success('开票申请提交成功');
      
      setTimeout(() => {
        const invoiceId = 'INV' + Date.now().toString().slice(-8);
        const invoiceType = this.data.invoiceTypes.find(type => type.id === this.data.selectedType);
        const formData = this.data.selectedType === 'personal' ? this.data.personalData : this.data.companyData;
        
        wx.showModal({
          title: '申请已受理',
          content: `您的开票申请已成功提交！\n\n申请编号：${invoiceId}\n发票类型：${invoiceType.name}\n开票金额：¥${formData.amount}\n\n电子发票将在3-5个工作日内开具并发送至邮箱。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 清空表单数据
            this.setData({
              selectedType: null,
              personalData: {
                amount: '',
                title: '',
                email: '',
                contentIndex: null,
                receiverName: '',
                receiverPhone: '',
                receiverAddress: '',
                remark: ''
              },
              companyData: {
                amount: '',
                companyName: '',
                taxNumber: '',
                companyAddress: '',
                companyPhone: '',
                bankName: '',
                bankAccount: '',
                email: '',
                contentIndex: null,
                receiverName: '',
                receiverPhone: '',
                receiverAddress: '',
                remark: ''
              },
              canSubmit: false
            });
            // 返回首页
            navigation.switchTab('/pages/home/home');
          }
        });
      }, 1000);
    }, 2000);
  }
});