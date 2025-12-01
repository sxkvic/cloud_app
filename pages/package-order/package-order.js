// pages/package-order/package-order.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const app = getApp();

Page({
  data: {
    selectedPackage: null,
    selectedPackageName: '暂无',
    selectedPackagePrice: '0',
    packages: [],
    loading: true,               // 骨架屏显示状态
    submitLoading: false,        // 提交订单 loading 状态（按钮用）
    // 客户信息相关
    deviceCode: '',              // 设备编号，从缓存读取
    customerInfo: null           // 客户信息
  },

  async onLoad() {
    console.log('套餐订购页面加载');
    
    // 从本地缓存读取设备编号（允许为空，可以浏览套餐）
    const device_no = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
    
    if (device_no) {
      this.setData({ deviceCode: device_no });
      console.log('读取到设备编号:', device_no);
      // 有设备号时加载客户信息
      await this.loadCustomerInfo();
    } else {
      console.log('⚠️ 未绑定设备，仅允许浏览套餐');
    }
    
    // 无论是否绑定设备，都加载套餐列表供浏览
    await this.loadPackages();
  },

  async onShow() {
    console.log('套餐订购页面显示');
  },

  // 加载套餐列表
  async loadPackages() {
    try {
      this.setData({ loading: true });
      console.log('开始加载套餐列表...');

      // 使用 withMinLoading 确保骨架屏至少显示 600ms
      await message.withMinLoading(
        async () => {
          const result = await API.getPackagesList({
            page: 1,
            pageSize: 20
          });

          console.log('套餐列表加载成功:', result.data);

          // 过滤出有效套餐(status === 1)、排序并转换数据格式
          const packages = result.data.list
            .filter(pkg => pkg.status === 1)  // 只保留status为1的有效套餐
            .sort((a, b) => (a.sort || 0) - (b.sort || 0))  // 根据sort字段从小到大排序
            .map((pkg, index) => {
              // 处理流量字段,提取数字和单位(如 "1000M" -> speed: "1000", unit: "M")
              let speed = '100';
              let speedUnit = 'M';
              if (pkg.flow) {
                const match = pkg.flow.match(/(\d+)([A-Za-z]*)/);
                if (match) {
                  speed = match[1];
                  speedUnit = match[2] || 'M';  // 如果没有单位，默认M
                }
              }

              // 构建特性列表
              const features = [];
              if (pkg.flow) {
                features.push(`流量: ${pkg.flow}`);
              }
              if (pkg.remark) {
                features.push(pkg.remark);
              }
              if (pkg.package_type === '0') {
                features.push('包月套餐');
              }

              // 构建特性标签(用于显示在卡片上)
              const featureTags = [];
              if (pkg.package_type === '0') {
                featureTags.push('包月套餐');
              }
              if (pkg.package_type === '3') {
                featureTags.push('热销TOP1');
              }
              featureTags.push('不限速');
              if (speed >= 1000) {
                featureTags.push('千兆光纤');
              }

              return {
                id: pkg.id,
                name: pkg.package_name || '未命名套餐',
                speed: speed,
                speedUnit: speedUnit,  // 动态单位
                price: pkg.price || '0',
                isPopular: pkg.package_type === '3',  // package_type为3的标记为热门
                features: features,
                featureTags: featureTags,
                colorTheme: index % 4  // 颜色主题循环: 0-绿色, 1-蓝色, 2-橙红色, 3-紫色
              };
            });

          console.log('有效套餐数量:', packages.length);

          // 更新数据
          this.setData({
            packages: packages
          });
        },
        {
          minDuration: 600,  // 骨架屏最小显示 600ms
          errorText: '加载套餐失败，请稍后重试'
        }
      );

      // 加载完成，隐藏骨架屏
      this.setData({ loading: false });

    } catch (error) {
      console.error('加载套餐失败:', error);
      this.setData({ loading: false });
    }
  },

  // 加载客户信息
  async loadCustomerInfo() {
    try {
      console.log('查询客户信息，设备码:', this.data.deviceCode);
      
      const result = await API.getCustomerByDeviceCode(this.data.deviceCode);
      console.log('客户信息查询成功:', result.data);
      
      this.setData({
        customerInfo: result.data.customer || result.data
      });
      
    } catch (error) {
      console.error('查询客户信息失败:', error);
      message.error('无法获取客户信息，请稍后重试');
    }
  },

  // 选择套餐
  selectPackage(e) {
    const packageId = e.currentTarget.dataset.id;
    const selectedPackage = this.data.packages.find(pkg => pkg.id === packageId);
    
    this.setData({
      selectedPackage: packageId,
      selectedPackageName: selectedPackage.name,
      selectedPackagePrice: selectedPackage.price
    });
  },

  // 确认订购
  confirmOrder() {
    if (!this.data.selectedPackage) {
      message.error('请先选择套餐');
      return;
    }
    
    // 检查是否已绑定设备
    if (!this.data.deviceCode) {
      wx.showModal({
        title: '需要绑定设备',
        content: '订购套餐前需要先绑定设备，是否前往绑定？',
        confirmText: '去绑定',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            navigation.navigateTo('/pages/bind-device-code/bind-device-code');
          }
        }
      });
      return;
    }
    
    if (!this.data.customerInfo) {
      message.error('客户信息加载中，请稍候');
      return;
    }

    const selectedPackage = this.data.packages.find(pkg => pkg.id === this.data.selectedPackage);
    const customer = this.data.customerInfo;
    
    wx.showModal({
      title: '确认订购',
      content: `客户：${customer.customer_name || customer.name || '未知'}\n套餐：${selectedPackage.name}\n月费：¥${selectedPackage.price}\n\n确认为该客户订购此套餐？`,
      confirmText: '确认订购',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          this.processOrder();
        }
      }
    });
  },

  // 处理订购
  async processOrder() {
    const selectedPackage = this.data.packages.find(pkg => pkg.id === this.data.selectedPackage);
    const customer = this.data.customerInfo;

    if (!selectedPackage) {
      message.error('请选择套餐');
      return;
    }
    
    if (!customer) {
      message.error('客户信息不完整');
      return;
    }

    // 使用按钮 loading 状态
    this.setData({ submitLoading: true });

    try {
      console.log('创建订单，套餐:', selectedPackage, '客户:', customer);

      // 使用 withMinLoading 确保 loading 至少显示 800ms
      const result = await message.withMinLoading(
        async () => {
          // 创建订单 - 使用新接口参数格式
          return await API.createOrder({
            customer_id: customer.id || customer.customer_id,
            device_no: this.data.deviceCode,
            package_id: selectedPackage.id,
            orderType: 1,  // 1=新装
            payment_type: '1',  // 1=微信支付
            remark: '小程序订购'
          });
        },
        {
          minDuration: 800,  // 最小显示 800ms，避免闪烁
          successText: '',
          errorText: '订购失败，请重试'
        }
      );

      this.setData({ submitLoading: false });
      console.log('订单创建成功:', result.data);

      // 订单创建成功后，进入支付流程
      const orderData = result.data;
      if (orderData && (orderData.order_no || orderData.orderNo || orderData.orderId)) {
        console.log('订单创建成功，进入支付流程');
        await this.handlePayment(orderData, selectedPackage, customer);
      } else {
        message.error('订单创建失败，请重试');
      }

    } catch (error) {
      this.setData({ submitLoading: false });
      console.error('订购失败:', error);
      // 错误提示已在 withMinLoading 中处理
    }
  },

  // 支付处理函数
  async handlePayment(orderData, packageInfo, customerInfo) {
    console.log('订单信息:', orderData);
    console.log('套餐信息:', packageInfo);
    console.log('客户信息:', customerInfo);
    
    try {
      // 调用微信支付
      await this.handleWechatPayment(orderData, packageInfo, customerInfo);
    } catch (error) {
      console.error('支付处理失败:', error);
      message.error('支付处理失败，请重试');
      this.setData({ submitLoading: false });
    }
  },

  // 微信支付
  async handleWechatPayment(orderData, packageInfo, customerInfo) {
    try {
      console.log('========== 开始微信支付 ==========');
      console.log('订单数据:', orderData);
      
      wx.showLoading({ title: '正在调起支付...' });
      
      // 获取微信 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });
      
      const code = loginRes.code;
      console.log('获取微信code:', code);
      
      if (!code) {
        wx.hideLoading();
        console.error('未获取到微信code');
        message.error('获取微信授权失败，请重试');
        this.setData({ submitLoading: false });
        return;
      }
      
      // 获取用户的openid
      const openid = wx.getStorageSync('openid') || app.globalData.openid;
      
      console.log('获取openid:', openid);
      console.log('Storage中的openid:', wx.getStorageSync('openid'));
      console.log('globalData中的openid:', app.globalData.openid);
      
      if (!openid) {
        wx.hideLoading();
        console.error('未获取到openid');
        message.error('未获取到用户信息，请重新登录');
        this.setData({ submitLoading: false });
        return;
      }
      
      // 调用小程序支付接口
      const paymentParams = {
        payment_type: 1, // 微信支付
        order_id: '',
        customer_id: customerInfo.id || customerInfo.customer_id,
        device_no: this.data.deviceCode,
        package_id: packageInfo.id,
        orderType: 1, // 套餐订购
        code: code, // 微信 code
        openid: openid
      };
      
      console.log('支付参数:', paymentParams);
      
      const payResult = await API.createMiniprogramPayment(paymentParams);
      
      wx.hideLoading();
      
      console.log('========== 支付接口返回 ==========');
      console.log('完整返回数据:', JSON.stringify(payResult, null, 2));
      console.log('success:', payResult.success);
      console.log('data:', payResult.data);
      console.log('message:', payResult.message);
      
      if (payResult.success && payResult.data) {
        console.log('========== 准备调起微信支付 ==========');
        console.log('支付参数:', JSON.stringify(payResult.data, null, 2));
        
        // 检查必需的支付参数
        const requiredParams = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign'];
        const missingParams = requiredParams.filter(param => !payResult.data[param]);
        
        if (missingParams.length > 0) {
          console.error('缺少必需的支付参数:', missingParams);
          message.error('支付参数不完整: ' + missingParams.join(', '));
          this.setData({ submitLoading: false });
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
            this.setData({ submitLoading: false });
            
            wx.showToast({
              title: '支付成功',
              icon: 'success',
              duration: 2000
            });
            
            // 支付成功后显示订购完成提示
            setTimeout(() => {
              wx.showModal({
                title: '订购完成',
                content: `${packageInfo.name} 订购成功！\n客户：${customerInfo.customer_name || customerInfo.name}\n订单号：${paymentParams.order_id}\n月费：¥${packageInfo.price}\n我们将尽快为您安排服务。`,
                showCancel: false,
                confirmText: '知道了',
                success: () => {
                  // 返回首页
                  navigation.switchTab('/pages/home/home');
                }
              });
            }, 600);
          },
          fail: (payErr) => {
            console.error('========== 支付失败 ==========');
            console.error('错误对象:', payErr);
            console.error('错误信息:', payErr.errMsg);
            this.setData({ submitLoading: false });
            
            if (payErr.errMsg.indexOf('cancel') > -1) {
              message.info('支付已取消');
            } else {
              message.error('支付失败: ' + payErr.errMsg);
            }
          }
        });
      } else {
        console.error('========== 支付接口调用失败 ==========');
        console.error('返回数据:', payResult);
        message.error('获取支付参数失败: ' + (payResult.message || '未知错误'));
        this.setData({ submitLoading: false });
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('========== 微信支付异常 ==========', error);
      message.error('支付失败: ' + (error.message || '未知错误'));
      this.setData({ submitLoading: false });
    }
  }
});