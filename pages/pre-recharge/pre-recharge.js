// pages/pre-recharge/pre-recharge.js
const { navigation, message } = require("../../utils/common");
const API = require("../../utils/api");
const app = getApp();

Page({
  data: {
    deviceCode: "", // 设备编号，从缓存读取
    rechargeAmount: "",
    paymentType: "1", // 支付类型：1-微信支付
    remark: "",
    isLoading: false,
    isLoadingCustomer: false, // 客户信息加载状态
    selectedAmount: null,
    quickAmounts: [50, 100, 150, 200, 300, 500],
    customerInfo: null, // 客户信息
  },

  onLoad() {
    console.log("预充值页面加载");

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
  },

  // 加载客户信息
  async loadCustomerInfo() {
    try {
      this.setData({ isLoadingCustomer: true });
      console.log("查询客户信息，设备码:", this.data.deviceCode);

      if (!this.data.deviceCode) {
        message.error("设备码未设置，请重新登录");
        return;
      }

      const result = await API.getCustomerByDeviceCode(this.data.deviceCode);
      console.log("客户信息查询成功:", result.data);

      // 存储完整的查询结果，包含customer、binding_info、device_info
      this.setData({
        customerInfo: result.data,
        isLoadingCustomer: false,
      });

      // 显示客户基本信息（可选）
      if (result.data && result.data.customer) {
        console.log(
          `客户：${result.data.customer.customer_name}, 设备：${result.data.device_info.device_name}`
        );
      }
    } catch (error) {
      console.error("查询客户信息失败:", error);
      this.setData({ isLoadingCustomer: false });
      message.error("无法获取客户信息，请稍后重试");
    }
  },

  // 选择快捷金额
  selectQuickAmount(e) {
    const amount = e.currentTarget.dataset.amount;
    this.setData({
      selectedAmount: amount,
      rechargeAmount: amount.toString(),
    });
    wx.vibrateShort(); // 触觉反馈
  },

  // 金额输入
  onAmountInput(e) {
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

    this.setData({
      rechargeAmount: value,
      selectedAmount: value ? "custom" : null,
    });
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value,
    });
  },

  // 创建预充值订单
  async createRechargeOrder() {
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

    this.setData({ isLoading: true });

    try {
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

      const orderData = {
        orderType: 2, // 2=预充值
        device_no: this.data.deviceCode,
        package_id: "",
        customer_id: customer.id,
        device_id: deviceInfo.id,
        payment_type: this.data.paymentType, // 始终为1（微信支付）
        recharge_amount: parseFloat(this.data.rechargeAmount),
        remark: this.data.remark,
      };

      console.log("创建预充值订单参数:", orderData);
      console.log(
        "客户信息:",
        customer.customer_name,
        "设备:",
        deviceInfo.device_name
      );

      // 先创建订单
      const orderResponse = await API.createPreRechargeOrder(orderData);
      console.log("订单创建成功:", orderResponse);

      if (orderResponse.data && orderResponse.data.order_no) {
        // 订单创建成功，直接进入支付流程
        console.log("订单创建成功，进入支付流程");
        this.handlePayment(orderResponse.data, customer, deviceInfo);
      } else {
        message.error("订单创建失败，请重试");
      }
    } catch (error) {
      console.error("创建订单失败:", error);
      message.error("创建订单失败，请重试");
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 支付处理函数
  async handlePayment(orderData, customerInfo, deviceInfo) {
    console.log("订单信息:", orderData);
    console.log("客户信息:", customerInfo);
    console.log("设备信息:", deviceInfo);

    try {
      // 直接调用微信支付
      await this.handleDirectPayment(orderData, customerInfo);
    } catch (error) {
      console.error("支付处理失败:", error);
      message.error("支付处理失败，请重试");
    }
  },

  // 微信直接支付
  async handleDirectPayment(orderData, customerInfo) {
    try {
      console.log("========== 开始微信直接支付 ==========");
      console.log("订单数据:", orderData);

      wx.showLoading({ title: "正在调起支付..." });

      // 获取微信 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        });
      });

      const code = loginRes.code;
      console.log("获取微信code:", code);

      if (!code) {
        wx.hideLoading();
        console.error("未获取到微信code");
        message.error("获取微信授权失败，请重试");
        return;
      }

      // 获取用户的openid
      const openid = wx.getStorageSync("openid") || app.globalData.openid;

      console.log("获取openid:", openid);
      console.log("Storage中的openid:", wx.getStorageSync("openid"));
      console.log("globalData中的openid:", app.globalData.openid);

      if (!openid) {
        wx.hideLoading();
        console.error("未获取到openid");
        message.error("未获取到用户信息，请重新登录");
        return;
      }

      // 调用小程序支付接口
      const paymentParams = {
        payment_type: 1, // 微信支付
        order_id: "",
        customer_id: customerInfo.id,
        device_no: this.data.deviceCode,
        orderType: 2, // 预充值
        openid: openid,
        code: code, // 添加微信 code
        recharge_amount: parseFloat(this.data.rechargeAmount),
      };

      console.log("支付参数:", paymentParams);

      const payResult = await API.createMiniprogramPayment(paymentParams);

      wx.hideLoading();

      console.log("========== 支付接口返回 ==========");
      console.log("完整返回数据:", JSON.stringify(payResult, null, 2));
      console.log("success:", payResult.success);
      console.log("data:", payResult.data);
      console.log("message:", payResult.message);

      if (payResult.success && payResult.data) {
        console.log("========== 准备调起微信支付 ==========");
        console.log("支付参数:", JSON.stringify(payResult.data, null, 2));

        // 检查必需的支付参数
        const requiredParams = [
          "timeStamp",
          "nonceStr",
          "package",
          "signType",
          "paySign",
        ];
        const missingParams = requiredParams.filter(
          (param) => !payResult.data[param]
        );

        if (missingParams.length > 0) {
          console.error("缺少必需的支付参数:", missingParams);
          message.error("支付参数不完整: " + missingParams.join(", "));
          return;
        }

        console.log("支付参数验证通过，调起微信支付...");

        wx.requestPayment({
          timeStamp: payResult.data.timeStamp,
          nonceStr: payResult.data.nonceStr,
          package: payResult.data.package,
          signType: payResult.data.signType,
          paySign: payResult.data.paySign,
          success: (payRes) => {
            console.log("========== 支付成功 ==========", payRes);
            wx.showToast({
              title: "支付成功",
              icon: "success",
              duration: 2000,
            });

            // 支付成功回调
            this.onPaymentSuccess(orderData.order_no);
            this.resetForm();
          },
          fail: (payErr) => {
            console.error("========== 支付失败 ==========");
            console.error("错误对象:", payErr);
            console.error("错误信息:", payErr.errMsg);

            if (payErr.errMsg.indexOf("cancel") > -1) {
              message.info("支付已取消");
            } else {
              message.error("支付失败: " + payErr.errMsg);
            }
          },
        });
      } else {
        console.error("========== 支付接口调用失败 ==========");
        console.error("返回数据:", payResult);
        message.error("获取支付参数失败: " + (payResult.message || "未知错误"));
      }
    } catch (error) {
      wx.hideLoading();
      console.error("========== 微信支付异常 ==========", error);
      message.error("支付失败: " + (error.message || "未知错误"));
    }
  },

  // 开始支付状态检查
  startPaymentStatusCheck(orderNo) {
    wx.showLoading({ title: "等待支付结果..." });

    let checkCount = 0;
    const maxChecks = 60; // 最多检查60次，每次3秒，总共180秒

    const checkInterval = setInterval(async () => {
      checkCount++;

      try {
        const result = await this.checkPaymentStatus(orderNo);
        if (
          result &&
          result.success &&
          result.data &&
          result.data.status === "paid"
        ) {
          clearInterval(checkInterval);
          wx.hideLoading();

          wx.showToast({
            title: "支付成功",
            icon: "success",
            duration: 2000,
          });

          this.onPaymentSuccess(orderNo);
          this.resetForm();
        }
      } catch (error) {
        console.error("检查支付状态失败:", error);
      }

      if (checkCount >= maxChecks) {
        clearInterval(checkInterval);
        wx.hideLoading();

        wx.showModal({
          title: "支付状态确认",
          content: "未能自动确认支付状态，请手动确认支付是否成功",
          confirmText: "已支付",
          cancelText: "未支付",
          success: (res) => {
            if (res.confirm) {
              this.onPaymentSuccess(orderNo);
              this.resetForm();
            }
          },
        });
      }
    }, 3000); // 每3秒检查一次
  },

  // 检查支付状态
  async checkPaymentStatus(orderNo) {
    try {
      const result = await API.checkPaymentStatus(orderNo);
      return result;
    } catch (error) {
      console.error("支付状态查询失败:", error);
      throw error;
    }
  },

  // 支付成功回调
  onPaymentSuccess(orderNo) {
    console.log("支付成功，订单号:", orderNo);
    message.success("充值成功！");
    // 可以在这里添加支付成功后的逻辑
    // 比如刷新余额、跳转到成功页面等
  },

  // 重置表单
  resetForm() {
    this.setData({
      rechargeAmount: "",
      selectedAmount: null,
      remark: "",
    });
  },
});
