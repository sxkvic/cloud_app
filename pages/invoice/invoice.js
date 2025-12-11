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
    
    // 账单信息
    billId: null,
    billNo: '',
    orderNo: '',
    orderAmount: '',
    rechargeAccount: '',
    
    // 表单数据
    titleType: '1', // "1"=个人, "2"=企业
    invoiceType: 1, // 1=增值税普通发票（固定，不可选择专票）
    invoiceTitle: '',
    socialCreditCode: '',
    receiveEmail: '',
    bankName: '',
    bankAccount: '',
    canSubmit: false
  },

  async onLoad(options) {
    
    // 获取账单ID（兼容 bill_id、billId 和 id）
    const billId = options.billId || options.bill_id || options.id;
    
    if (billId) {
      this.setData({ billId: parseInt(billId) });
      // 加载账单详情
      await this.loadBillDetail();
    }
    
    await this.init();
  },

  // 加载账单详情
  async loadBillDetail() {
    try {
      const result = await API.getCustomerBillDetail(this.data.billId);
      
      if (result.success && result.data) {
        const billDetail = result.data;
        
        // 从账单详情中提取所需数据
        this.setData({
          billNo: billDetail.bill_no || '',
          orderNo: billDetail.order_no || billDetail.bill_no || '',
          orderAmount: billDetail.amount || '',
          rechargeAccount: billDetail.recharge_account || ''
        });
      }
    } catch (error) {
      console.error('加载账单详情失败:', error);
      message.error('加载账单信息失败');
    }
  },

  async onShow() {
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
      this.loadInvoiceInfo()
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


  // 加载开票信息
  async loadInvoiceInfo() {
    if (!this.data.deviceNo) {
      return;
    }

    try {
      const result = await API.getInvoiceInfoByDevice(this.data.deviceNo);

      if (result.data) {
        const info = result.data;

        // 填充表单，title_type: 1=个人, 2=企业
        const titleType = String(info.title_type || '1');
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

    if (titleType == '1') {
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
    if (titleType == '2') {
      if (!this.validateTaxNumber(socialCreditCode)) {
        message.error('请输入正确的统一社会信用代码');
        return;
      }
    }

    const typeText = titleType == '1' ? '个人' : '企业';
    const invoiceTypeText = invoiceType == 1 ? '增值税普通发票' : '增值税专用发票';
    
    let content = `抬头类型：${typeText}\n发票抬头：${invoiceTitle}\n发票类型：${invoiceTypeText}\n接收邮箱：${receiveEmail}\n`;
    if (titleType == '2') {
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

  // 处理开票申请 - 完全重构版本
  async processInvoice() {
    const { 
      titleType, invoiceType, invoiceTitle, socialCreditCode, receiveEmail, 
      bankName, bankAccount, deviceNo, customerInfo,
      billId, billNo, orderNo, orderAmount, rechargeAccount 
    } = this.data;

    wx.showLoading({ title: '正在处理...', mask: true });

    try {
      // ============ 步骤1: 保存开票信息 ============
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
      if (titleType == '2') {
        invoiceInfo.social_credit_code = socialCreditCode;
        if (bankName) invoiceInfo.bank_name = bankName;
        if (bankAccount) invoiceInfo.bank_account = bankAccount;
      }

      const saveResult = await API.createOrUpdateInvoiceInfo(invoiceInfo);
      if (!saveResult || !saveResult.success) {
        wx.hideLoading();
        message.error(saveResult?.message || '保存开票信息失败');
        return;
      }

      // 如果没有账单ID，只保存开票信息
      if (!billId) {
        wx.hideLoading();
        message.success('开票信息保存成功');
        setTimeout(() => navigation.switchTab('/pages/home/home'), 1500);
        return;
      }

      // 检查必要参数
      if (!orderNo) {
        wx.hideLoading();
        message.error('缺少订单号，无法开票');
        return;
      }

      // ============ 步骤2: 生成开票订单 ============
      const orderData = {
        OuterOrderId: orderNo,
        CallBackUrl: '',
        MerchantTaxID: '92320508MA7LMLTE51',
        MerchantAddress: '江苏省苏州市姑苏区广济南路288号1003室',
        MerchantPhone: '',
        PurchaserName: invoiceTitle,
        PurchaserTaxID: titleType == '2' ? socialCreditCode : '',
        PurchaserEmail: receiveEmail,
        IsPurchaserNaturalPerson: titleType == '1' ? '1' : '0',
        InvoiceType: 12,
        OrderType: 1,
        ItemList: [{
          ItemName: '电信服务费',
          Amount: orderAmount,
          TaxRate: '0.01',
          CatalogCode: '3030299000000000000'
        }]
      };

      const generateResult = await API.generateInvoiceOrder(orderData);
      
      // 只在Code明确不等于'0'时才认为失败
      if (generateResult && generateResult.Code != '0' && generateResult.Code != 0) {
        wx.hideLoading();
        message.error(generateResult.Msg || '生成开票订单失败');
        return;
      }

      // ============ 步骤3: 更新账单状态为开票中（非关键步骤） ============
      try {
        await API.updateBillStatus(billId, 3);
      } catch (e) {
      }

      // ============ 步骤4: 查询发票信息（带重试机制） ============
      
      // 先隐藏之前的loading
      wx.hideLoading();
      
      // 显示开票进度提示
      wx.showModal({
        title: '正在开具发票',
        content: '发票正在生成中，请耐心等待...\n\n预计需要10-20秒',
        showCancel: false,
        confirmText: '知道了',
        success: (res) => {
          // 用户点击确定后，继续显示loading
        }
      });
      
      // 等待用户确认后再显示loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 创建进度提示
      const stepMessages = [
        '正在提交开票请求...',
        '正在生成电子发票...',
        '正在加盖电子印章...',
        '正在生成PDF文件...',
        '即将完成，请稍候...'
      ];
      
      let invoiceInfoResult = null;
      let pdfFile = null;
      const maxRetries = 15; // 增加到15次重试（总共30秒）
      const retryDelay = 2000; // 每次重试间隔2秒
      
      for (let i = 0; i < maxRetries; i++) {
        // 动态更新提示文字
        const messageIndex = Math.min(Math.floor((i / maxRetries) * stepMessages.length), stepMessages.length - 1);
        const currentMessage = stepMessages[messageIndex];
        
        // 添加进度百分比
        const progress = Math.min(Math.floor(((i + 1) / maxRetries) * 90), 90); // 最多显示90%
        
        wx.showLoading({
          title: `${currentMessage}(${progress}%)`,
          mask: true
        });
        
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          // 第一次查询前等待2秒
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        invoiceInfoResult = await API.getInvoiceInfo(orderNo);
        
        // 检查是否成功获取发票信息
        if (invoiceInfoResult && 
            (invoiceInfoResult.Code == '0' || invoiceInfoResult.Code == 0) &&
            invoiceInfoResult.InvoiceList && 
            invoiceInfoResult.InvoiceList.length > 0) {
          
          const invoice = invoiceInfoResult.InvoiceList[0];
          
          // 查找PDF文件
          pdfFile = invoice.ElecInvoiceFileList?.find(f => {
            return f.FileType == 13 || f.FileType == '13';
          });
          
          if (pdfFile && pdfFile.FileUrl) {
            break; // 成功找到PDF，退出循环
          }
        }
      }
      
      // 检查最终结果
      if (!pdfFile || !pdfFile.FileUrl) {
        wx.hideLoading();
        
        // 显示提示，引导用户去列表或详情页查看
        wx.showModal({
          title: '发票生成中',
          content: '您的发票正在后台生成，通常需要1-2分钟。\n\n请稍后在账单列表或账单详情页查看开票状态。',
          showCancel: false,
          confirmText: '我知道了',
          success: () => {
            navigation.switchTab('/pages/home/home');
          }
        });
        return;
      }

      // ============ 步骤6: 创建发票记录（非关键步骤） ============
      try {
        await API.createInvoiceForOrder({
          orderNo: orderNo,
          fileDownloadUrl: pdfFile.FileUrl
        });
      } catch (e) {
      }

      // ============ 步骤7: 更新账单状态为已开票（非关键步骤） ============
      try {
        await API.updateBillStatus(billId, 2);
      } catch (e) {
      }

      wx.hideLoading();

      // ============ 成功提示（开票已成功） ============
      wx.showModal({
        title: '开票成功',
        content: `电子发票已成功开具！\n\n发票将通过邮件发送至：\n${receiveEmail}\n\n请注意查收。`,
        showCancel: false,
        confirmText: '确定',
        success: () => {
          navigation.switchTab('/pages/home/home');
        }
      });

    } catch (error) {
      wx.hideLoading();
      console.error('开票流程异常:', error);
      message.error('开票失败，请重试');
    }
  },

  // 完成发票流程的后续步骤
  async completeInvoiceProcess(orderNo, fileUrl, billId, receiveEmail) {
    // ============ 步骤6: 创建发票记录（非关键步骤） ============
    try {
      await API.createInvoiceForOrder({
        orderNo: orderNo,
        fileDownloadUrl: fileUrl
      });
    } catch (e) {
    }

    // ============ 步骤7: 更新账单状态为已开票（非关键步骤） ============
    if (billId) {
      try {
        await API.updateBillStatus(billId, 2);
      } catch (e) {
      }
    }

    wx.hideLoading();

    // ============ 成功提示（开票已成功） ============
    wx.showModal({
      title: '开票成功',
      content: `电子发票已成功开具！\n\n发票将通过邮件发送至：\n${receiveEmail}\n\n请注意查收。`,
      showCancel: false,
      confirmText: '确定',
      success: () => {
        navigation.switchTab('/pages/home/home');
      }
    });
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