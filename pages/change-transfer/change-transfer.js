// pages/change-transfer/change-transfer.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const app = getApp();

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    deviceCode: '',
    loading: true,
    submitLoading: false,
    customerInfo: null,
    formData: {
      customerName: '',
      idNumber: ''
    },
    canSubmit: false
  },

  async onLoad() {
    console.log('变更过户页面加载');
    
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
    const device_no = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
    
    if (!device_no) {
      message.error('未找到设备信息，请先绑定设备');
      setTimeout(() => {
        navigation.navigateTo('/pages/bind-device-code/bind-device-code');
      }, 1500);
      return;
    }
    
    this.setData({ deviceCode: device_no });
    console.log('读取到设备编号:', device_no);
    
    await this.loadCustomerInfo();
  },

  onShow() {
    console.log('变更过户页面显示');
  },

  // 加载客户信息
  async loadCustomerInfo() {
    try {
      console.log('查询客户信息，设备码:', this.data.deviceCode);
      
      await message.withMinLoading(
        async () => {
          const result = await API.getCustomerByDeviceCode(this.data.deviceCode);
          console.log('客户信息查询成功:', result.data);
          
          this.setData({
            customerInfo: result.data
          });
        },
        {
          minDuration: 600,
          errorText: '加载客户信息失败，请稍后重试'
        }
      );
      
      this.setData({ loading: false });
      
    } catch (error) {
      console.error('查询客户信息失败:', error);
      this.setData({ loading: false });
    }
  },

  // 返回上一页
  handleBack() {
    wx.navigateBack();
  },

  // 输入客户名称
  onCustomerNameInput(e) {
    this.setData({
      'formData.customerName': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入身份证号
  onIdNumberInput(e) {
    this.setData({
      'formData.idNumber': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { formData } = this.data;
    
    // 测试阶段：只检查是否填写，不验证格式
    const canSubmit = formData.customerName.trim() && 
                     formData.idNumber.trim();
    
    this.setData({ canSubmit });
  },

  // 验证身份证号
  validateIdCard(idCard) {
    if (!idCard) return false;
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return idCardRegex.test(idCard);
  },

  // 提交过户申请
  submitTransfer() {
    if (!this.data.canSubmit) {
      message.error('请完善申请信息');
      return;
    }

    const { formData } = this.data;
    
    // 测试阶段：跳过身份证格式验证
    // if (!this.validateIdCard(formData.idNumber)) {
    //   message.error('请输入正确的身份证号码');
    //   return;
    // }

    const content = `新户主：${formData.customerName}\n身份证号：${formData.idNumber}\n\n确认提交过户申请？`;

    wx.showModal({
      title: '确认过户',
      content: content,
      confirmText: '确认提交',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processTransfer();
        }
      }
    });
  },

  // 处理过户申请
  async processTransfer() {
    const { formData, deviceCode, customerInfo } = this.data;
    
    if (!customerInfo) {
      message.error('客户信息不完整');
      return;
    }

    this.setData({ submitLoading: true });

    try {
      console.log('创建过户申请');

      // 获取用户的openid
      const openid = wx.getStorageSync('openid') || app.globalData.openid;
      
      if (!openid) {
        message.error('未获取到用户信息，请重新登录');
        this.setData({ submitLoading: false });
        return;
      }

      const result = await message.withMinLoading(
        async () => {
          return await API.createTransferApplication({
            user_type: 1,
            customer_name: formData.customerName,
            id_number: formData.idNumber,
            device_no: deviceCode,
            openid: openid
          });
        },
        {
          minDuration: 800,
          successText: '',
          errorText: '提交失败，请重试'
        }
      );

      this.setData({ submitLoading: false });
      console.log('过户申请创建成功:', result.data);

      message.success('申请提交成功');
      
      setTimeout(() => {
        wx.showModal({
          title: '申请已受理',
          content: `您的过户申请已成功提交！\n\n新户主：${formData.customerName}\n设备号：${deviceCode}\n处理时间：3-5个工作日\n\n我们会在24小时内联系您确认申请详情，请保持电话畅通。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 清空表单数据
            this.setData({
              formData: {
                customerName: '',
                idNumber: ''
              },
              canSubmit: false
            });
            // 返回首页
            navigation.switchTab('/pages/home/home');
          }
        });
      }, 600);

    } catch (error) {
      this.setData({ submitLoading: false });
      console.error('提交过户申请失败:', error);
    }
  }
});