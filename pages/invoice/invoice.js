// pages/invoice/invoice.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const DataManager = require('../../utils/dataManager');
const { getShareConfig, getTimelineShareConfig } = require('../../utils/share');
const app = getApp();

Page({
  data: {
    // 设备和客户信息
    deviceNo: '',
    customerInfo: null,
    loading: true,
    
    // 表单数据
    titleType: '1', // "1"=个人, "2"=企业
    invoiceType: 1, // 1=增值税普通发票（固定，不可选择专票）
    invoiceTitle: '',
    socialCreditCode: '',
    receiveEmail: '',
    bankName: '',
    bankAccount: '',
    canSubmit: false,
    
    // 发票历史记录
    invoiceList: [],
    hasMore: true,
    currentPage: 1,
    pageSize: 10
  },

  async onLoad() {
    console.log('开票页面加载');
    await this.init();
  },

  async onShow() {
    console.log('开票页面显示');
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.init();
    wx.stopPullDownRefresh();
  },

  // 初始化页面数据
  async init() {
    // 获取设备号
    const device_no = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
    
    if (!device_no) {
      message.error('未找到设备信息，请先绑定设备');
      this.setData({ loading: false });
      return;
    }
    
    this.setData({ deviceNo: device_no, loading: true });
    
    // 并行加载数据
    await Promise.all([
      this.loadCustomerInfo(),
      this.loadInvoiceInfo(),
      this.loadInvoiceList()
    ]);
    
    this.setData({ loading: false });
  },

  // 加载客户信息（只需要基本信息，使用单接口获取）
  async loadCustomerInfo() {
    try {
      // 开票只需要客户基本信息，使用 getBasicCustomerInfo 只调用一次接口
      const result = await DataManager.getBasicCustomerInfo(this.data.deviceNo);
      
      if (result.success && result.data) {
        this.setData({
          customerInfo: result.data
        });
      }
    } catch (error) {
      console.error('加载客户信息失败:', error);
    }
  },

  // 加载发票列表
  async loadInvoiceList(loadMore = false) {
    try {
      const { currentPage, pageSize, invoiceList } = this.data;
      const page = loadMore ? currentPage + 1 : 1;
      
      console.log('加载发票列表，页码:', page);

      const result = await API.getInvoiceList({
        page,
        limit: pageSize,
        device_no: this.data.deviceNo
      });

      console.log('发票列表加载成功:', result.data);
      
      const newList = result.data.list || [];
      const total = result.data.pagination?.total || 0;
      
      this.setData({
        invoiceList: loadMore ? [...invoiceList, ...newList] : newList,
        currentPage: page,
        hasMore: page * pageSize < total
      });

    } catch (error) {
      console.error('加载发票列表失败:', error);
      message.error('加载发票列表失败');
    }
  },

  // 加载开票信息
  async loadInvoiceInfo() {
    if (!this.data.deviceNo) {
      console.log('设备号为空，跳过加载开票信息');
      return;
    }

    try {
      console.log('加载设备开票信息...');
      const result = await API.getInvoiceInfoByDevice(this.data.deviceNo);

      if (result.data) {
        console.log('开票信息:', result.data);
        const info = result.data;

        // 填充表单，title_type: 1=个人, 2=企业
        const titleType = String(info.title_type || '2');
        this.setData({
          titleType: titleType,
          invoiceTitle: info.invoice_title || '',
          // 企业类型时才填充社会信用代码
          socialCreditCode: titleType == '2' ? (info.social_credit_code || '') : '',
          receiveEmail: info.receive_email || '',
          bankName: info.bank_name || '',
          bankAccount: info.bank_account || ''
        });
        
        this.checkCanSubmit();
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

  // 选择发票类型（专票已禁用）
  selectInvoiceType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    // 只允许选择普票
    if (type === 2) {
      message.info('暂不支持开具增值税专用发票');
      return;
    }
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
      content: '开票相关问题请联系客服咨询。\n\n客服电话：4009677726\n工作时间：9:00-18:00',
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
    const { titleType, invoiceType, invoiceTitle, socialCreditCode, receiveEmail, bankName, bankAccount, deviceNo, customerInfo } = this.data;

    try {
      console.log('提交开票申请');

      // 构建API参数
      const invoiceInfo = {
        title_type: titleType,
        invoice_title: invoiceTitle,
        invoice_type: invoiceType,
        customer_name: customerInfo?.customer?.customer_name || invoiceTitle,
        customer_id: customerInfo?.customer?.id,
        device_no: deviceNo,
        receive_email: receiveEmail
      };

      // 企业发票额外参数
      if (titleType === '1') {
        invoiceInfo.social_credit_code = socialCreditCode;
        if (bankName) {
          invoiceInfo.bank_name = bankName;
        }
        if (bankAccount) {
          invoiceInfo.bank_account = bankAccount;
        }
      }

      console.log('开票参数:', invoiceInfo);

      // 调用API
      await message.withMinLoading(
        async () => {
          return await API.createOrUpdateInvoiceInfo(invoiceInfo);
        },
        {
          minDuration: 800,
          successText: '开票信息保存成功',
          errorText: '保存失败，请重试'
        }
      );

      console.log('开票申请成功');

      setTimeout(() => {
        const typeText = titleType === '2' ? '个人' : '企业';
        const invoiceTypeText = invoiceType === 1 ? '增值税普通发票' : '增值税专用发票';

        wx.showModal({
          title: '申请已受理',
          content: `您的开票信息已成功保存！\n\n抬头类型：${typeText}\n发票抬头：${invoiceTitle}\n发票类型：${invoiceTypeText}\n\n订单完成后，电子发票将在3-5个工作日内开具并发送至邮箱。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 跳转到首页
            navigation.switchTab('/pages/home/home');
          }
        });
      }, 600);

    } catch (error) {
      console.error('开票申请失败:', error);
    }
  },

  // 查看发票详情（小程序不支持查看，点击无效果）
  viewInvoice(e) {
    // 小程序暂不支持查看发票，不做任何操作
  },

  // 分享给好友
  onShareAppMessage() {
    return getShareConfig({
      title: '开票 - 云宽带',
      path: '/pages/invoice/invoice'
    });
  },

  // 分享到朋友圈
  onShareTimeline() {
    return getTimelineShareConfig({
      title: '开票 - 云宽带'
    });
  }
});