// pages/self-renewal/self-renewal.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const DataManager = require('../../utils/dataManager');
const QRCode = require('../../utils/qrcode');
const app = getApp();

Page({
  data: {
    loading: true,
    submitLoading: false,
    deviceCode: '',
    packageInfo: null,
    customerInfo: null,
    bindingInfo: null,
    // 支付方式选择
    showPaymentModal: false,
    // 二维码支付相关
    showQrcodeModal: false,
    qrcodeUrl: '',
    qrcodeOrderNo: '',
    qrcodeLoading: false,
    qrcodeError: '',
    qrcodeTitle: '',
    qrcodeTips: '请使用微信扫码支付'
  },

  async onLoad(options) {
    console.log('自助续费页面加载', options);
    
    // 获取设备码（与项目中其他页面保持一致）
    const deviceCode = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
    
    if (!deviceCode) {
      message.error('未找到设备信息，请先绑定设备');
      setTimeout(() => {
        navigation.back();
      }, 1500);
      return;
    }

    this.setData({ deviceCode });
    await this.loadDeviceInfo();
  },

  // 加载设备信息
  async loadDeviceInfo() {
    try {
      this.setData({ loading: true });
      
      // 优先从缓存获取
      let deviceInfo = wx.getStorageSync('complete_customer_info');
      
      if (!deviceInfo) {
        console.log('⚠️ 缓存不存在，重新获取...');
        const result = await DataManager.getCompleteCustomerInfo(this.data.deviceCode, true);
        deviceInfo = result.data;
      } else {
        console.log('✅ 使用缓存的设备信息');
      }
      
      const result = { success: true, data: deviceInfo };
      console.log('设备信息:', result);
      
      if (result.success && result.data && result.data.binding_info) {
        const binding = result.data.binding_info;
        const customer = result.data.customer;
        
        // 保存到缓存
        wx.setStorageSync('customer_info', customer);
        wx.setStorageSync('binding_info', binding);
        
        this.setData({
          packageInfo: {
            package_name: binding.current_package_name || '未知套餐',
            package_id: binding.current_package_id,
            expire_time: binding.expire_time || '未知',
            price: binding.current_package_price || 0
          },
          customerInfo: customer,
          bindingInfo: binding
        });
        
      } else {
        message.error(result.message || '加载套餐信息失败');
        setTimeout(() => {
          navigation.back();
        }, 1500);
      }
    } catch (error) {
      console.error('加载套餐信息失败:', error);
      message.error('加载套餐信息失败');
      setTimeout(() => {
        navigation.back();
      }, 1500);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 提交续费
  submitRenew() {
    if (!this.data.packageInfo || !this.data.customerInfo) {
      message.error('套餐信息不完整');
      return;
    }

    // 直接显示支付方式选择弹窗
    this.setData({
      showPaymentModal: true
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

    const { packageInfo, customerInfo } = this.data;

    try {
      switch (method) {
        case 'wechat':
          // 微信小程序支付
          await this.handleWechatPayment(packageInfo, customerInfo);
          break;
        case 'qrcode':
          // 微信二维码支付
          await this.handleQrcodePayment(packageInfo, customerInfo);
          break;
        case 'alipay':
          // 支付宝支付
          await this.handleAlipayPayment(packageInfo, customerInfo);
          break;
        case 'offline':
          // 线下支付
          await this.handleOfflinePayment(packageInfo, customerInfo);
          break;
        default:
          message.error('未知的支付方式');
      }
    } catch (error) {
      console.error('支付处理失败:', error);
      message.error('支付处理失败，请重试');
    }
  },

  // 微信小程序支付
  async handleWechatPayment(packageInfo, customerInfo) {
    try {
      console.log('========== 开始微信小程序支付（续费） ==========');
      
      this.setData({ submitLoading: true });
      wx.showLoading({ title: '正在调起支付...' });

      // 获取微信 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject });
      });

      const code = loginRes.code;
      if (!code) {
        wx.hideLoading();
        message.error('获取微信授权失败，请重试');
        return;
      }

      // 获取用户的openid
      const openid = wx.getStorageSync('openid') || app.globalData.openid;
      if (!openid) {
        wx.hideLoading();
        message.error('未获取到用户信息，请重新登录');
        return;
      }

      // 调用小程序支付接口
      const paymentParams = {
        payment_type: 1,
        customer_id: customerInfo.customer?.id || customerInfo.id,
        device_no: this.data.deviceCode,
        package_id: packageInfo.package_id,
        orderType: 1, // 套餐订购（续费也是订购类型）
        code: code,
        openid: openid
      };

      const payResult = await API.createMiniprogramPayment(paymentParams);
      wx.hideLoading();

      if (payResult.success && payResult.data) {
        const requiredParams = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign'];
        const missingParams = requiredParams.filter(param => !payResult.data[param]);

        if (missingParams.length > 0) {
          message.error('支付参数不完整');
          return;
        }

        wx.requestPayment({
          timeStamp: payResult.data.timeStamp,
          nonceStr: payResult.data.nonceStr,
          package: payResult.data.package,
          signType: payResult.data.signType,
          paySign: payResult.data.paySign,
          success: (payRes) => {
            console.log('支付成功', payRes);
            wx.showToast({ title: '续费成功', icon: 'success', duration: 2000 });
            
            setTimeout(() => {
              wx.showModal({
                title: '续费完成',
                content: `套餐"${packageInfo.package_name}"续费成功！\n月费：¥${packageInfo.price}\n\n新的到期时间将自动更新。`,
                showCancel: false,
                confirmText: '知道了',
                success: () => {
                  navigation.switchTab('/pages/home/home');
                }
              });
            }, 600);
          },
          fail: (payErr) => {
            console.error('支付失败', payErr);
            if (payErr.errMsg.indexOf('cancel') > -1) {
              message.info('支付已取消');
            } else {
              message.error('支付失败: ' + payErr.errMsg);
            }
          }
        });
      } else {
        message.error('获取支付参数失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('微信支付异常', error);
      message.error('支付失败: ' + (error.message || '未知错误'));
    } finally {
      this.setData({ submitLoading: false });
    }
  },

  // 微信二维码支付
  async handleQrcodePayment(packageInfo, customerInfo) {
    console.log('========== 微信二维码支付（续费） ==========');
    
    try {
      this.setData({
        showQrcodeModal: true,
        qrcodeLoading: true,
        qrcodeError: '',
        qrcodeUrl: '',
        qrcodeOrderNo: ''
      });
      
      const orderData = {
        payment_type: 1,
        customer_id: customerInfo.customer?.id || customerInfo.id,
        device_no: this.data.deviceCode,
        package_id: packageInfo.package_id,
        orderType: 1,
        remark: "小程序续费"
      };
      
      const result = await API.createOrder(orderData);
      
      if (result.success && result.data && result.data.qr_code_url) {
        const qrCodeUrl = result.data.qr_code_url;
        const orderNo = result.data.order_no;
        
        this.setData({
          qrcodeUrl: qrCodeUrl,
          qrcodeOrderNo: orderNo,
          qrcodeLoading: false,
          qrcodeTitle: '微信扫码支付',
          qrcodeTips: '请使用微信扫码支付'
        });
        
        await this.generateQRCode(qrCodeUrl);
      } else {
        throw new Error(result.message || '未获取到支付链接');
      }
    } catch (error) {
      console.error('生成二维码失败:', error);
      this.setData({
        qrcodeLoading: false,
        qrcodeError: error.message || '生成二维码失败，请重试'
      });
      message.error('生成二维码失败');
    }
  },

  // 生成二维码
  async generateQRCode(url) {
    try {
      await QRCode.generateQRCode('qrcode-canvas', url, {
        width: 200,
        height: 200
      }, this);
    } catch (error) {
      console.error('二维码生成失败:', error);
    }
  },

  // 支付宝支付
  async handleAlipayPayment(packageInfo, customerInfo) {
    console.log('========== 支付宝支付（续费） ==========');
    
    try {
      this.setData({
        showQrcodeModal: true,
        qrcodeLoading: true,
        qrcodeError: '',
        qrcodeUrl: '',
        qrcodeOrderNo: ''
      });
      
      const orderData = {
        payment_type: 2, // 支付宝支付
        customer_id: customerInfo.customer?.id || customerInfo.id,
        device_no: this.data.deviceCode,
        package_id: packageInfo.package_id,
        orderType: 1,
        remark: "小程序续费"
      };
      
      const result = await API.createOrder(orderData);
      
      if (result.success && result.data && result.data.qr_code_url) {
        const qrCodeUrl = result.data.qr_code_url;
        const orderNo = result.data.order_no;
        
        this.setData({
          qrcodeUrl: qrCodeUrl,
          qrcodeOrderNo: orderNo,
          qrcodeLoading: false,
          qrcodeTitle: '支付宝扫码支付',
          qrcodeTips: '请使用支付宝扫码支付'
        });
        
        await this.generateQRCode(qrCodeUrl);
      } else {
        throw new Error(result.message || '未获取到支付链接');
      }
    } catch (error) {
      console.error('生成支付宝二维码失败:', error);
      this.setData({
        qrcodeLoading: false,
        qrcodeError: error.message || '生成二维码失败，请重试'
      });
      message.error('生成支付宝二维码失败');
    }
  },

  // 线下支付
  async handleOfflinePayment(packageInfo, customerInfo) {
    console.log('========== 线下支付（续费） ==========');
    
    try {
      wx.showLoading({ title: '创建订单中...' });
      
      const orderData = {
        payment_type: 3,
        customer_id: customerInfo.customer?.id || customerInfo.id,
        device_no: this.data.deviceCode,
        package_id: packageInfo.package_id,
        orderType: 1,
        remark: "小程序续费"
      };
      
      const result = await API.createOfflineOrder(orderData);
      
      wx.hideLoading();
      
      if (result.success && result.data) {
        const orderNo = result.data.order_no || result.data.orderNo || result.data.orderId;
        
        wx.showModal({
          title: '订单创建成功',
          content: `套餐：${packageInfo.package_name}\n月费：¥${packageInfo.price}\n订单号：${orderNo}\n\n请联系工作人员完成线下付款。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            navigation.switchTab('/pages/home/home');
          }
        });
      } else {
        throw new Error(result.message || '创建订单失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('线下支付订单创建失败:', error);
      message.error('创建订单失败');
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

  onShow() {
    console.log('自助续费页面显示');
  }

});