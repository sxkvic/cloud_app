// pages/order-management/order-management.js
const { message, navigation } = require('../../utils/common');
const API = require('../../utils/api');
const QRCode = require('../../utils/qrcode');
const app = getApp();

Page({
  data: {
    activeTab: 'package', // 当前激活的Tab: package-套餐订购, recharge-预充值
    loading: true,
    deviceCode: '',
    
    // 套餐订购订单
    packageOrders: [],
    packagePage: 1,
    packagePageSize: 10,
    packageTotal: 0,
    
    // 预充值订单
    rechargeOrders: [],
    rechargePage: 1,
    rechargePageSize: 10,
    rechargeTotal: 0,
    
    hasMore: true,
    
    // 支付方式选择弹窗
    showPaymentModal: false,
    pendingOrderData: null,
    pendingOrderType: '', // 'package' 或 'recharge'
    
    // 二维码支付弹窗
    showQrcodeModal: false,
    qrcodeUrl: '',
    qrcodeOrderNo: '',
    qrcodeLoading: false,
    qrcodeError: '',
    qrcodeTitle: '',
    qrcodeTips: ''
  },

  async onLoad(options) {
    console.log('订单管理页面加载', options);
    
    // 获取设备码
    const deviceCode = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
    
    if (!deviceCode) {
      message.error('未找到设备信息');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ deviceCode });
    await this.loadOrders();
  },

  // 下拉刷新
  async onPullDownRefresh() {
    console.log('下拉刷新');
    await this.refreshOrders();
    wx.stopPullDownRefresh();
  },

  // 切换Tab
  async switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;

    console.log('切换Tab:', tab);
    this.setData({ 
      activeTab: tab,
      loading: true 
    });

    // 如果当前Tab没有数据，则加载
    if (tab === 'package' && this.data.packageOrders.length === 0) {
      await this.loadPackageOrders();
    } else if (tab === 'recharge' && this.data.rechargeOrders.length === 0) {
      await this.loadRechargeOrders();
    } else {
      this.setData({ loading: false });
    }

    this.updateHasMore();
  },

  // 加载订单（首次加载）
  async loadOrders() {
    try {
      this.setData({ loading: true });
      
      // 默认加载套餐订购订单
      await this.loadPackageOrders();
      
    } catch (error) {
      console.error('加载订单失败:', error);
      message.error('加载订单失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 刷新订单
  async refreshOrders() {
    try {
      if (this.data.activeTab === 'package') {
        this.setData({ packagePage: 1, packageOrders: [] });
        await this.loadPackageOrders();
      } else {
        this.setData({ rechargePage: 1, rechargeOrders: [] });
        await this.loadRechargeOrders();
      }
      message.success('刷新成功');
    } catch (error) {
      console.error('刷新订单失败:', error);
      message.error('刷新失败');
    }
  },

  // 加载套餐订购订单
  async loadPackageOrders() {
    try {
      const { deviceCode, packagePage, packagePageSize } = this.data;
      
      console.log('加载套餐订购订单:', { deviceCode, page: packagePage, pageSize: packagePageSize });
      
      const result = await API.getOrderList({
        page: packagePage,
        pageSize: packagePageSize,
        device_no: deviceCode,
        customer_name: ''
      });

      console.log('套餐订购订单返回:', result);

      if (result.success && result.data) {
        const orders = result.data.orders || [];
        const total = result.data.total || 0;
        
        this.setData({
          packageOrders: packagePage === 1 ? orders : [...this.data.packageOrders, ...orders],
          packageTotal: total,
          loading: false
        });

        this.updateHasMore();
      } else {
        throw new Error(result.message || '获取订单列表失败');
      }
    } catch (error) {
      console.error('加载套餐订购订单失败:', error);
      this.setData({ loading: false });
      throw error;
    }
  },

  // 加载预充值订单
  async loadRechargeOrders() {
    try {
      const { deviceCode, rechargePage, rechargePageSize } = this.data;
      
      console.log('加载预充值订单:', { deviceCode, page: rechargePage, pageSize: rechargePageSize });
      
      const result = await API.getPreRechargeOrderList({
        page: rechargePage,
        pageSize: rechargePageSize,
        device_no: deviceCode,
        customer_name: ''
      });

      console.log('预充值订单返回:', result);

      if (result.success && result.data) {
        const orders = result.data.list || [];
        const total = result.data.total || 0;
        
        this.setData({
          rechargeOrders: rechargePage === 1 ? orders : [...this.data.rechargeOrders, ...orders],
          rechargeTotal: total,
          loading: false
        });

        this.updateHasMore();
      } else {
        throw new Error(result.message || '获取订单列表失败');
      }
    } catch (error) {
      console.error('加载预充值订单失败:', error);
      this.setData({ loading: false });
      throw error;
    }
  },

  // 加载更多
  async loadMore() {
    if (!this.data.hasMore) return;

    try {
      if (this.data.activeTab === 'package') {
        const nextPage = this.data.packagePage + 1;
        this.setData({ packagePage: nextPage });
        await this.loadPackageOrders();
      } else {
        const nextPage = this.data.rechargePage + 1;
        this.setData({ rechargePage: nextPage });
        await this.loadRechargeOrders();
      }
    } catch (error) {
      console.error('加载更多失败:', error);
      message.error('加载更多失败');
    }
  },

  // 更新是否有更多数据
  updateHasMore() {
    const { activeTab, packageOrders, packageTotal, rechargeOrders, rechargeTotal } = this.data;
    
    let hasMore = false;
    if (activeTab === 'package') {
      hasMore = packageOrders.length < packageTotal;
    } else {
      hasMore = rechargeOrders.length < rechargeTotal;
    }
    
    this.setData({ hasMore });
  },

  // ==================== 重新支付功能 ====================

  // 套餐订单重新支付
  handleRepayPackageOrder(e) {
    const order = e.currentTarget.dataset.order;
    console.log('套餐订单重新支付:', order);
    
    if (!order) {
      message.error('订单信息不完整');
      return;
    }

    // 显示支付方式选择弹窗
    this.setData({
      showPaymentModal: true,
      pendingOrderData: order,
      pendingOrderType: 'package'
    });
  },

  // 预充值订单重新支付
  handleRepayRechargeOrder(e) {
    const order = e.currentTarget.dataset.order;
    console.log('预充值订单重新支付:', order);
    
    if (!order) {
      message.error('订单信息不完整');
      return;
    }

    // 显示支付方式选择弹窗
    this.setData({
      showPaymentModal: true,
      pendingOrderData: order,
      pendingOrderType: 'recharge'
    });
  },

  // 关闭支付方式选择弹窗
  closePaymentModal() {
    this.setData({
      showPaymentModal: false,
      pendingOrderData: null,
      pendingOrderType: ''
    });
  },

  // 选择支付方式
  async selectPaymentMethod(e) {
    const method = e.currentTarget.dataset.method;
    console.log('选择支付方式:', method);

    // 关闭支付方式选择弹窗
    this.setData({ showPaymentModal: false });

    const { pendingOrderData, pendingOrderType } = this.data;

    try {
      switch (method) {
        case 'wechat':
          // 微信小程序支付
          await this.handleWechatRepay(pendingOrderData, pendingOrderType);
          break;
        case 'qrcode':
          // 微信二维码支付
          await this.handleQrcodeRepay(pendingOrderData, pendingOrderType);
          break;
        case 'alipay':
          // 支付宝支付
          await this.handleAlipayRepay(pendingOrderData, pendingOrderType);
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
        pendingOrderData: null,
        pendingOrderType: ''
      });
    }
  },

  // 微信小程序支付（重新支付）
  async handleWechatRepay(order, orderType) {
    try {
      console.log('========== 微信小程序重新支付 ==========');
      console.log('订单类型:', orderType);
      console.log('订单数据:', order);
      
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
        message.error('获取微信授权失败，请重试');
        return;
      }

      // 获取用户的openid
      const openid = wx.getStorageSync('openid') || app.globalData.openid;
      console.log('获取openid:', openid);

      if (!openid) {
        wx.hideLoading();
        message.error('未获取到用户信息，请重新登录');
        return;
      }

      // 构建支付参数
      const paymentParams = {
        payment_type: 1, // 微信支付
        order_id: order.id,
        order_no: order.order_no,
        customer_id: order.customer_id,
        device_no: order.device_no,
        orderType: orderType === 'package' ? 1 : 2, // 1=套餐订购, 2=预充值
        openid: openid,
        code: code,
        package_id: order.package_id || ''
      };

      // 预充值订单添加金额
      if (orderType === 'recharge') {
        paymentParams.recharge_amount = order.recharge_amount;
      }

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

            // 支付成功后刷新订单列表
            setTimeout(() => {
              this.refreshOrders();
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

  // 微信二维码支付（重新支付）
  async handleQrcodeRepay(order, orderType) {
    console.log('========== 微信二维码重新支付 ==========');
    console.log('订单类型:', orderType);
    console.log('订单数据:', order);
    
    try {
      // 显示二维码弹窗（加载状态）
      this.setData({
        showQrcodeModal: true,
        qrcodeLoading: true,
        qrcodeError: '',
        qrcodeUrl: '',
        qrcodeOrderNo: ''
      });
      
      // 构建订单参数
      const orderData = {
        orderType: orderType === 'package' ? 1 : 2,
        device_no: order.device_no,
        customer_id: order.customer_id,
        order_id: order.id,
        order_no: order.order_no,
        payment_type: 1, // 微信支付
        package_id: order.package_id || ''
      };

      // 预充值订单添加金额
      if (orderType === 'recharge') {
        orderData.recharge_amount = order.recharge_amount;
      }

      console.log('创建二维码支付参数:', orderData);
      const orderResponse = await API.createPreRechargeOrder(orderData);
      console.log('二维码支付返回:', orderResponse);
      
      if (orderResponse.success && orderResponse.data && orderResponse.data.qr_code_url) {
        const qrCodeUrl = orderResponse.data.qr_code_url;
        const orderNo = orderResponse.data.order_no || order.order_no;
        
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

  // 支付宝支付（重新支付）
  async handleAlipayRepay(order, orderType) {
    console.log('========== 支付宝重新支付 ==========');
    console.log('订单类型:', orderType);
    console.log('订单数据:', order);
    
    try {
      // 显示二维码弹窗（加载状态）
      this.setData({
        showQrcodeModal: true,
        qrcodeLoading: true,
        qrcodeError: '',
        qrcodeUrl: '',
        qrcodeOrderNo: ''
      });
      
      // 构建订单参数
      const orderData = {
        orderType: orderType === 'package' ? 1 : 2,
        device_no: order.device_no,
        customer_id: order.customer_id,
        order_id: order.id,
        order_no: order.order_no,
        payment_type: 2, // 支付宝支付
        package_id: order.package_id || ''
      };

      // 预充值订单添加金额
      if (orderType === 'recharge') {
        orderData.recharge_amount = order.recharge_amount;
      }

      console.log('创建支付宝支付参数:', orderData);
      const orderResponse = await API.createPreRechargeOrder(orderData);
      console.log('支付宝支付返回:', orderResponse);
      
      if (orderResponse.success && orderResponse.data && orderResponse.data.qr_code_url) {
        const qrCodeUrl = orderResponse.data.qr_code_url;
        const orderNo = orderResponse.data.order_no || order.order_no;
        
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

  // 关闭二维码弹窗
  closeQrcodeModal() {
    this.setData({
      showQrcodeModal: false,
      qrcodeUrl: '',
      qrcodeOrderNo: '',
      qrcodeLoading: false,
      qrcodeError: ''
    });
    
    // 关闭后刷新订单列表
    this.refreshOrders();
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
  stopPropagation() {
    // 空函数，仅用于阻止冒泡
  }
});
