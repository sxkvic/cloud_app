// pages/pre-recharge/pre-recharge.js
const { navigation, message } = require("../../utils/common");
const API = require("../../utils/api");
const QRCode = require('../../utils/qrcode');
const DataManager = require("../../utils/dataManager");
const app = getApp();

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    deviceCode: "", // 设备编号，从缓存读取
    rechargeAmount: "",
    paymentType: "1", // 支付类型：1-微信支付
    remark: "",
    isLoading: false,
    isLoadingCustomer: false, // 客户信息加载状态
    selectedIndex: -1,
    customAmount: "",
    payAmount: "0.00",
    amountList: [
      { value: 50, isRecommend: false },
      { value: 100, isRecommend: false },
      { value: 150, isRecommend: false },
      { value: 200, isRecommend: true },
      { value: 300, isRecommend: false },
      { value: 500, isRecommend: false }
    ],
    customerInfo: null, // 客户信息
    // 支付方式选择
    showPaymentModal: false,
    pendingOrderData: null,
    // 二维码支付相关
    showQrcodeModal: false,
    qrcodeUrl: '',
    qrcodeOrderNo: '',
    qrcodeLoading: false,
    qrcodeError: '',
    qrcodeTitle: '',
    qrcodeTips: '请使用微信扫码支付'
  },

  onLoad() {
    console.log("预充值页面加载");

    // 获取系统信息设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2;
    
    this.setData({
      statusBarHeight,
      navBarHeight
    });

    // 从本地缓存读取设备编号
    const device_no =
      wx.getStorageSync("device_no") || wx.getStorageSync("deviceCode");

    if (!device_no) {
      message.error("未找到设备信息，请先绑定设备");
      setTimeout(() => {
        navigation.navigateTo("/pages/bind-device-code/bind-device-code");
      }, 1500);
      return;
    }

    this.setData({ deviceCode: device_no });
    console.log("读取到设备编号:", device_no);

    // 加载客户信息
    this.loadCustomerInfo();
  },

  onShow() {
    console.log("预充值页面显示");
    // 不需要每次都重新加载，使用登录时缓存的数据即可
  },

  // 加载客户信息（优先使用缓存，登录时已获取完整数据）
  async loadCustomerInfo() {
    try {
      this.setData({ isLoadingCustomer: true });
      console.log("� 加载客户信息，设备码:", this.data.deviceCode);

      if (!this.data.deviceCode) {
        message.error("设备码未设置，请重新登录");
        return;
      }

      // 优先从缓存获取（登录时已通过 DataManager 获取完整信息）
      let customerInfo = wx.getStorageSync('complete_customer_info');
      
      if (!customerInfo) {
        // 如果缓存不存在，则重新获取
        console.log("⚠️ 缓存不存在，重新获取完整信息...");
        const result = await DataManager.getCompleteCustomerInfo(this.data.deviceCode, true);
        customerInfo = result.data;
      } else {
        console.log("✅ 使用缓存的客户信息");
      }

      // 存储到页面数据
      this.setData({
        customerInfo: customerInfo,
        isLoadingCustomer: false,
      });

      // 显示客户基本信息
      if (customerInfo && customerInfo.customer) {
        console.log(
          `客户：${customerInfo.customer.customer_name}, 设备：${customerInfo.device_info?.device_name || '未知'}`
        );
      }
    } catch (error) {
      console.error("❌ 加载客户信息失败:", error);
      this.setData({ isLoadingCustomer: false });
      message.error("无法获取客户信息，请稍后重试");
    }
  },

  // 返回上一页
  handleBack() {
    wx.navigateBack();
  },

  // 选择金额
  selectAmount(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.amountList[index];
    this.setData({
      selectedIndex: index,
      customAmount: "",
      rechargeAmount: item.value.toString(),
      payAmount: item.value.toFixed(2)
    });
    wx.vibrateShort();
  },

  // 自定义金额输入
  handleCustomInput(e) {
    let value = e.detail.value;
    // 只允许数字和小数点
    value = value.replace(/[^\d.]/g, "");
    // 确保只有一个小数点
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }
    // 限制小数点后最多两位
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + "." + parts[1].substring(0, 2);
    }

    const numValue = parseFloat(value) || 0;
    this.setData({
      customAmount: value,
      selectedIndex: value ? -1 : this.data.selectedIndex,
      rechargeAmount: value,
      payAmount: numValue.toFixed(2)
    });
  },

  // 立即充值
  handlePay() {
    // 验证充值金额
    if (
      !this.data.rechargeAmount ||
      parseFloat(this.data.rechargeAmount) <= 0
    ) {
      message.error("请选择或输入充值金额");
      return;
    }

    if (!this.data.customerInfo) {
      message.error("客户信息未加载，请稍后重试");
      return;
    }

    const customerData = this.data.customerInfo;
    const customer = customerData.customer;
    const deviceInfo = customerData.device_info;

    // 验证必要的数据
    if (!customer || !customer.id) {
      message.error("客户信息不完整，请重新加载");
      return;
    }

    if (!deviceInfo || !deviceInfo.id) {
      message.error("设备信息不完整，请重新加载");
      return;
    }

    // 直接显示支付方式选择弹窗
    this.setData({
      showPaymentModal: true,
      pendingOrderData: {
        customerInfo: customer,
        deviceInfo: deviceInfo,
        rechargeAmount: parseFloat(this.data.rechargeAmount),
        remark: this.data.remark
      }
    });
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value,
    });
  },

  // 关闭支付方式选择弹窗
  closePaymentModal() {
    this.setData({
      showPaymentModal: false
    });
  },

  // 选择支付方式
  async selectPaymentMethod(e) {
    const method = e.currentTarget.dataset.method;
    console.log('选择支付方式:', method);

    // 关闭支付方式选择弹窗
    this.setData({ showPaymentModal: false });

    const { customerInfo, deviceInfo, rechargeAmount, remark } = this.data.pendingOrderData;

    try {
      switch (method) {
        case 'wechat':
          // 微信小程序支付
          await this.handleWechatPayment(customerInfo, deviceInfo, rechargeAmount, remark);
          break;
        case 'qrcode':
          // 微信二维码支付
          await this.handleQrcodePayment(customerInfo, deviceInfo, rechargeAmount, remark);
          break;
        case 'alipay':
          // 支付宝支付
          await this.handleAlipayPayment(customerInfo, deviceInfo, rechargeAmount, remark);
          break;
        case 'offline':
          // 线下支付
          await this.handleOfflinePayment(customerInfo, deviceInfo, rechargeAmount, remark);
          break;
        default:
          message.error('未知的支付方式');
      }
    } catch (error) {
      console.error('支付处理失败:', error);
      message.error('支付处理失败，请重试');
    } finally {
      // 清空待支付数据
      this.setData({
        pendingOrderData: null
      });
    }
  },

  // 微信小程序支付
  async handleWechatPayment(customerInfo, deviceInfo, rechargeAmount, remark) {
    try {
      console.log('========== 微信小程序支付（预充值） ==========');
      
      wx.showLoading({ title: '正在调起支付...' });

      // 获取微信 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        });
      });

      const code = loginRes.code;
      console.log('获取微信code:', code);

      if (!code) {
        wx.hideLoading();
        console.error('未获取到微信code');
        message.error('获取微信授权失败，请重试');
        return;
      }

      // 获取用户的openid
      const openid = wx.getStorageSync('openid') || app.globalData.openid;
      console.log('获取openid:', openid);

      if (!openid) {
        wx.hideLoading();
        console.error('未获取到openid');
        message.error('未获取到用户信息，请重新登录');
        return;
      }

      // 调用小程序支付接口（会自动创建订单）
      const paymentParams = {
        payment_type: 1, // 微信支付
        order_id: '',
        customer_id: customerInfo.customer?.id || customerInfo.id,
        device_no: this.data.deviceCode,
        orderType: 2, // 预充值
        openid: openid,
        code: code,
        recharge_amount: rechargeAmount,
        remark: remark || ''
      };

      console.log('支付参数:', paymentParams);

      const payResult = await API.createMiniprogramPayment(paymentParams);

      wx.hideLoading();

      console.log('========== 支付接口返回 ==========');
      console.log('完整返回数据:', JSON.stringify(payResult, null, 2));

      if (payResult.success && payResult.data) {
        console.log('========== 准备调起微信支付 ==========');
        
        // 检查必需的支付参数
        const requiredParams = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign'];
        const missingParams = requiredParams.filter(param => !payResult.data[param]);

        if (missingParams.length > 0) {
          console.error('缺少必需的支付参数:', missingParams);
          message.error('支付参数不完整: ' + missingParams.join(', '));
          return;
        }

        console.log('支付参数验证通过，调起微信支付...');

        wx.requestPayment({
          timeStamp: payResult.data.timeStamp,
          nonceStr: payResult.data.nonceStr,
          package: payResult.data.package,
          signType: payResult.data.signType,
          paySign: payResult.data.paySign,
          success: (payRes) => {
            console.log('========== 支付成功 ==========', payRes);
            wx.showToast({
              title: '支付成功',
              icon: 'success',
              duration: 2000,
            });

            // 支付成功回调
            setTimeout(() => {
              this.onPaymentSuccess();
              this.resetForm();
            }, 600);
          },
          fail: (payErr) => {
            console.error('========== 支付失败 ==========');
            console.error('错误信息:', payErr.errMsg);

            if (payErr.errMsg.indexOf('cancel') > -1) {
              message.info('支付已取消');
            } else {
              message.error('支付失败: ' + payErr.errMsg);
            }
          },
        });
      } else {
        console.error('========== 支付接口调用失败 ==========');
        message.error('获取支付参数失败: ' + (payResult.message || '未知错误'));
      }
    } catch (error) {
      wx.hideLoading();
      console.error('========== 微信支付异常 ==========', error);
      message.error('支付失败: ' + (error.message || '未知错误'));
    }
  },

  // 微信二维码支付
  async handleQrcodePayment(customerInfo, deviceInfo, rechargeAmount, remark) {
    console.log('========== 微信二维码支付（预充值） ==========');
    
    try {
      // 显示二维码弹窗（加载状态）
      this.setData({
        showQrcodeModal: true,
        qrcodeLoading: true,
        qrcodeError: '',
        qrcodeUrl: '',
        qrcodeOrderNo: ''
      });
      
      // 创建预充值订单
      const orderData = {
        orderType: 2, // 2=预充值
        device_no: this.data.deviceCode,
        package_id: '',
        customer_id: customerInfo.customer?.id || customerInfo.id,
        device_id: deviceInfo?.id || customerInfo.device_info?.id || customerInfo.device?.id,
        payment_type: 1, // 微信支付
        recharge_amount: rechargeAmount,
        remark: remark || ''
      };

      console.log('创建预充值订单参数:', orderData);
      const orderResponse = await API.createPreRechargeOrder(orderData);
      console.log('订单创建成功:', orderResponse);
      
      if (orderResponse.success && orderResponse.data && orderResponse.data.qr_code_url) {
        const qrCodeUrl = orderResponse.data.qr_code_url;
        const orderNo = orderResponse.data.order_no;
        
        console.log('二维码链接:', qrCodeUrl);
        console.log('订单号:', orderNo);
        
        this.setData({
          qrcodeUrl: qrCodeUrl,
          qrcodeOrderNo: orderNo,
          qrcodeLoading: false,
          qrcodeTitle: '微信扫码支付',
          qrcodeTips: '请使用微信扫码支付'
        });
        
        // 生成二维码
        await this.generateQRCode(qrCodeUrl);
      } else {
        throw new Error(orderResponse.message || '未获取到支付链接');
      }
      
    } catch (error) {
      console.error('生成二维码失败:', error);
      this.setData({
        qrcodeLoading: false,
        qrcodeError: error.message || '生成二维码失败，请重试'
      });
      message.error('生成二维码失败: ' + (error.message || '未知错误'));
    }
  },

  // 生成二维码
  async generateQRCode(url) {
    try {
      console.log('开始生成二维码:', url);
      
      await QRCode.generateQRCode('qrcode-canvas', url, {
        width: 200,
        height: 200
      }, this);
      
      console.log('二维码生成成功');
    } catch (error) {
      console.error('二维码生成失败:', error);
    }
  },

  // 支付宝支付
  async handleAlipayPayment(customerInfo, deviceInfo, rechargeAmount, remark) {
    console.log('========== 支付宝支付（预充值） ==========');
    
    try {
      // 显示二维码弹窗（加载状态）
      this.setData({
        showQrcodeModal: true,
        qrcodeLoading: true,
        qrcodeError: '',
        qrcodeUrl: '',
        qrcodeOrderNo: ''
      });
      
      // 创建预充值订单（支付宝支付）
      const orderData = {
        orderType: 2, // 2=预充值
        device_no: this.data.deviceCode,
        package_id: '',
        customer_id: customerInfo.customer?.id || customerInfo.id,
        device_id: deviceInfo?.id || customerInfo.device_info?.id || customerInfo.device?.id,
        payment_type: 2, // 支付宝支付
        recharge_amount: rechargeAmount,
        remark: remark || ''
      };

      console.log('创建支付宝预充值订单参数:', orderData);
      const orderResponse = await API.createPreRechargeOrder(orderData);
      console.log('支付宝订单创建成功:', orderResponse);
      
      if (orderResponse.success && orderResponse.data && orderResponse.data.qr_code_url) {
        const qrCodeUrl = orderResponse.data.qr_code_url;
        const orderNo = orderResponse.data.order_no;
        
        console.log('支付宝二维码链接:', qrCodeUrl);
        console.log('订单号:', orderNo);
        
        this.setData({
          qrcodeUrl: qrCodeUrl,
          qrcodeOrderNo: orderNo,
          qrcodeLoading: false,
          qrcodeTitle: '支付宝扫码支付',
          qrcodeTips: '请使用支付宝扫码支付'
        });
        
        // 生成二维码
        await this.generateQRCode(qrCodeUrl);
      } else {
        throw new Error(orderResponse.message || '未获取到支付链接');
      }
      
    } catch (error) {
      console.error('生成支付宝二维码失败:', error);
      this.setData({
        qrcodeLoading: false,
        qrcodeError: error.message || '生成二维码失败，请重试'
      });
      message.error('生成支付宝二维码失败: ' + (error.message || '未知错误'));
    }
  },

  // 线下支付
  async handleOfflinePayment(customerInfo, deviceInfo, rechargeAmount, remark) {
    console.log('========== 线下支付（预充值） ==========');
    
    try {
      wx.showLoading({ title: '创建订单中...' });
      
      // 创建预充值订单（线下支付）
      const orderData = {
        customer_id: customerInfo.customer?.id || customerInfo.id,
        device_id: deviceInfo?.id || customerInfo.device_info?.id || customerInfo.device?.id,
        device_no: this.data.deviceCode,
        orderType: 2, // 2=预充值
        package_id: '',
        payment_type: '3', // 线下支付（字符串）
        recharge_amount: rechargeAmount,
        remark: remark || ''
      };

      console.log('创建线下支付订单参数:', orderData);
      const orderResponse = await API.createOfflineRechargeOrder(orderData);
      console.log('线下支付订单创建成功:', orderResponse);
      
      wx.hideLoading();
      
      if (orderResponse.success && orderResponse.data) {
        const orderNo = orderResponse.data.order_no || orderResponse.data.orderNo;
        
        // 显示成功提示
        wx.showModal({
          title: '订单创建成功',
          content: `充值金额：¥${rechargeAmount}\n订单号：${orderNo}\n\n请联系工作人员完成线下付款。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 重置表单并跳转到首页
            this.resetForm();
            navigation.switchTab('/pages/home/home');
          }
        });
      } else {
        throw new Error(orderResponse.message || '创建订单失败');
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('线下支付处理失败:', error);
      message.error('创建订单失败: ' + (error.message || '未知错误'));
    }
  },

  // 关闭二维码弹窗
  closeQrcodeModal() {
    this.setData({
      showQrcodeModal: false,
      qrcodeUrl: '',
      qrcodeOrderNo: '',
      qrcodeLoading: false,
      qrcodeError: ''
    });
  },

  // 复制二维码链接
  copyQrcodeLink() {
    if (!this.data.qrcodeUrl) {
      message.error('暂无链接可复制');
      return;
    }
    
    wx.setClipboardData({
      data: this.data.qrcodeUrl,
      success: () => {
        message.success('链接已复制到剪贴板');
      },
      fail: () => {
        message.error('复制失败，请重试');
      }
    });
  },

  // 重试生成二维码
  async retryGenerateQrcode() {
    if (!this.data.qrcodeUrl) {
      message.error('无法重试，请关闭后重新选择支付方式');
      return;
    }
    
    this.setData({
      qrcodeLoading: true,
      qrcodeError: ''
    });
    
    try {
      await this.generateQRCode(this.data.qrcodeUrl);
      this.setData({ qrcodeLoading: false });
    } catch (error) {
      this.setData({
        qrcodeLoading: false,
        qrcodeError: '重试失败，请复制链接使用'
      });
    }
  },

  // 阻止事件冒泡
  stopQrcodePropagation() {
    // 空函数，仅用于阻止冒泡
  },

  // 支付成功回调
  onPaymentSuccess(orderNo) {
    console.log("支付成功，订单号:", orderNo);
    message.success("充值成功！");
  },

  // 重置表单
  resetForm() {
    this.setData({
      rechargeAmount: "",
      selectedIndex: -1,
      customAmount: "",
      payAmount: "0.00",
      remark: "",
    });
  },
});
