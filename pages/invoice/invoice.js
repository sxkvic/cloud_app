// pages/invoice/invoice.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const app = getApp();

Page({
  data: {
    titleType: '2', // "2"=个人, "1"=企业
    invoiceType: 1, // 1=增值税普通发票, 2=增值税专用发票
    invoiceTitle: '', // 发票抬头
    socialCreditCode: '', // 统一社会信用代码
    receiveEmail: '', // 接收邮箱
    bankName: '', // 开户银行
    bankAccount: '', // 银行账号
    customerName: '', // 客户名称
    deviceNo: '', // 设备号
    canSubmit: false,
    totalAmount: '2,580.00',
    invoicedAmount: '1,200.00',
    availableAmount: '1,380.00',
    invoiceList: [], // 发票列表
    loading: true,
    invoiceContents: [
      '宽带服务费',
      '安装服务费',
      '设备租赁费',
      '维护服务费',
      '其他服务费'
    ]
  },

  async onLoad() {
    console.log('开票页面加载');
    await this.loadInvoiceList();
    await this.loadInvoiceInfo();
  },

  async onShow() {
    console.log('开票页面显示');
    await this.loadInvoiceList();
  },

  // 加载发票列表
  async loadInvoiceList() {
    try {
      this.setData({ loading: true });
      console.log('开始加载发票列表...');

      const result = await API.getInvoiceList({
        page: 1,
        pageSize: 20
      });

      console.log('发票列表加载成功:', result.data);
      this.setData({
        invoiceList: result.data.invoices || [],
        loading: false
      });

    } catch (error) {
      console.error('加载发票列表失败:', error);
      this.setData({ loading: false });
    }
  },

  // 加载开票信息（如果设备已绑定）
  async loadInvoiceInfo() {
    // 获取设备号和客户名称
    if (app.globalData.deviceCode) {
      this.setData({
        deviceNo: app.globalData.deviceCode
      });
    }
    
    if (app.globalData.customerName) {
      this.setData({
        customerName: app.globalData.customerName
      });
    }

    if (!app.globalData.deviceCode) {
      console.log('设备未绑定，跳过加载开票信息');
      return;
    }

    try {
      console.log('加载设备开票信息...');
      const result = await API.getInvoiceInfoByDevice(app.globalData.deviceCode);

      if (result.data) {
        console.log('开票信息:', result.data);
        const info = result.data;

        // 填充表单
        this.setData({
          titleType: info.title_type || '2',
          invoiceTitle: info.invoice_title || '',
          socialCreditCode: info.social_credit_code || '',
          receiveEmail: info.receive_email || '',
          bankName: info.bankName || '',
          bankAccount: info.bankAccount || ''
        });
      }

    } catch (error) {
      console.error('加载开票信息失败:', error);
    }
  },

  // 选择抬头类型
  selectTitleType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      titleType: type,
      socialCreditCode: '', // 切换类型时清空社会信用代码
      bankName: '',
      bankAccount: ''
    });
    this.checkCanSubmit();
    wx.vibrateShort();
  },

  // 选择发票类型
  selectInvoiceType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    this.setData({
      invoiceType: type
    });
    this.checkCanSubmit();
    wx.vibrateShort();
  },

  // 输入发票抬头
  onInvoiceTitleInput(e) {
    this.setData({
      invoiceTitle: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入统一社会信用代码
  onSocialCreditCodeInput(e) {
    this.setData({
      socialCreditCode: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入接收邮箱
  onReceiveEmailInput(e) {
    this.setData({
      receiveEmail: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入开户银行
  onBankNameInput(e) {
    this.setData({
      bankName: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入银行账号
  onBankAccountInput(e) {
    this.setData({
      bankAccount: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { titleType, invoiceTitle, receiveEmail, socialCreditCode } = this.data;
    
    let canSubmit = false;

    // 基本验证
    const hasTitle = invoiceTitle && invoiceTitle.trim().length > 0;
    const hasEmail = receiveEmail && receiveEmail.trim().length > 0;
    const isValidEmail = this.validateEmail(receiveEmail);

    if (titleType === '2') {
      // 个人发票验证
      canSubmit = hasTitle && hasEmail && isValidEmail;
    } else {
      // 企业发票验证
      const hasSocialCode = socialCreditCode && socialCreditCode.trim().length > 0;
      const isValidSocialCode = this.validateTaxNumber(socialCreditCode);
      
      canSubmit = hasTitle && hasEmail && hasSocialCode && 
                  isValidEmail && isValidSocialCode;
    }
    
    this.setData({ canSubmit });
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

    const { titleType, invoiceType, invoiceTitle, receiveEmail, socialCreditCode } = this.data;

    // 验证邮箱
    if (!this.validateEmail(receiveEmail)) {
      message.error('请输入正确的邮箱地址');
      return;
    }

    // 企业发票验证社会信用代码
    if (titleType === '1') {
      if (!this.validateTaxNumber(socialCreditCode)) {
        message.error('请输入正确的统一社会信用代码');
        return;
      }
    }

    const typeText = titleType === '2' ? '个人' : '企业';
    const invoiceTypeText = invoiceType === 1 ? '增值税普通发票' : '增值税专用发票';
    
    let content = `抬头类型：${typeText}\n发票抬头：${invoiceTitle}\n发票类型：${invoiceTypeText}\n接收邮箱：${receiveEmail}\n`;
    if (titleType === '1') {
      content += `社会信用代码：${socialCreditCode}\n`;
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
  async processInvoice() {
    const { titleType, invoiceType, invoiceTitle, socialCreditCode, receiveEmail, bankName, bankAccount, customerName, deviceNo } = this.data;

    try {
      wx.showLoading({ title: '正在提交...' });
      console.log('提交开票申请');

      // 构建API参数
      const invoiceInfo = {
        title_type: titleType,
        invoice_title: invoiceTitle,
        invoice_type: invoiceType,
        customer_name: customerName || invoiceTitle,
        device_no: deviceNo || '',
        receive_email: receiveEmail
      };

      // 企业发票额外参数
      if (titleType === '1') {
        invoiceInfo.social_credit_code = socialCreditCode;
        if (bankName) {
          invoiceInfo.bankName = bankName;
        }
        if (bankAccount) {
          invoiceInfo.bankAccount = bankAccount;
        }
      }

      console.log('开票参数:', invoiceInfo);

      // 调用API
      const result = await API.createOrUpdateInvoiceInfo(invoiceInfo);

      wx.hideLoading();
      console.log('开票申请成功:', result);
      message.success('开票申请提交成功');

      setTimeout(() => {
        const typeText = titleType === '2' ? '个人' : '企业';
        const invoiceTypeText = invoiceType === 1 ? '增值税普通发票' : '增值税专用发票';

        wx.showModal({
          title: '申请已受理',
          content: `您的开票申请已成功提交！\n\n抬头类型：${typeText}\n发票抬头：${invoiceTitle}\n发票类型：${invoiceTypeText}\n\n电子发票将在3-5个工作日内开具并发送至邮箱。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 清空表单数据
            this.setData({
              titleType: '2',
              invoiceType: 1,
              invoiceTitle: '',
              socialCreditCode: '',
              receiveEmail: '',
              bankName: '',
              bankAccount: '',
              canSubmit: false
            });

            // 刷新发票列表
            this.loadInvoiceList();

            // 返回首页
            navigation.navigateTo('/pages/home/home');
          }
        });
      }, 1000);

    } catch (error) {
      wx.hideLoading();
      console.error('开票申请失败:', error);

      const errorMsg = error.message || '开票申请失败，请重试';
      message.error(errorMsg);
    }
  }
});