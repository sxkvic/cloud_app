// pages/complaint/complaint.js
const API = require('../../utils/api');
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    // 投诉分类（1-10）
    complaintCategories: [
      { id: '1', name: '宽带/光纤无法连接' },
      { id: '2', name: '宽带/光纤速率不达标' },
      { id: '3', name: '网络信号覆盖差、去哪儿都、影响正常使用' },
      { id: '4', name: 'WiFi信号覆盖差或速率慢效果不佳' },
      { id: '5', name: '合约期内无法律维或改或降套餐' },
      { id: '6', name: '进新购的运营商套餐+套餐合理' },
      { id: '7', name: '进订/续约承诺是否兑现、按实际运营或设备赠送' },
      { id: '8', name: '营业网点正反、问题无人处理' },
      { id: '9', name: '套餐信息披露、问题无法处理' },
      { id: '10', name: '其他问题（如骚扰电话、恶意营销等）' }
    ],
    categoryIndex: -1,
    deviceNumber: '',
    contactPhone: '',
    complaintContent: '',
    canSubmit: false,
    openid: ''
  },

  onLoad(options) {
    console.log('投诉页面加载', options);
    
    // 从页面参数获取设备编号
    if (options.device_number) {
      this.setData({
        deviceNumber: options.device_number
      });
    }
    
    // 从本地存储获取openid
    const openid = wx.getStorageSync('openid');
    if (openid) {
      this.setData({ openid });
    } else {
      console.warn('未找到用户openid');
    }
  },

  // 选择投诉类别
  onCategoryChange(e) {
    this.setData({
      categoryIndex: parseInt(e.detail.value)
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  // 输入设备编号
  onDeviceNumberInput(e) {
    this.setData({
      deviceNumber: e.detail.value
    });
  },

  // 输入联系电话
  onPhoneInput(e) {
    this.setData({
      contactPhone: e.detail.value
    });
  },

  // 输入投诉内容
  onContentInput(e) {
    this.setData({
      complaintContent: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { categoryIndex, complaintContent } = this.data;
    
    // 必填项：投诉类别和投诉内容
    const canSubmit = categoryIndex >= 0 && complaintContent.trim().length > 0;
    
    this.setData({ canSubmit });
  },

  // 提交投诉
  async submitComplaint() {
    if (!this.data.canSubmit) {
      message.error('请完善必填信息');
      return;
    }

    const { categoryIndex, complaintCategories, complaintContent, openid, deviceNumber, contactPhone } = this.data;

    // 验证openid
    if (!openid) {
      message.error('用户信息缺失，请重新登录');
      setTimeout(() => {
        navigation.navigateTo('/pages/login/login');
      }, 1500);
      return;
    }

    // 确认提交
    const selectedCategory = complaintCategories[categoryIndex];
    wx.showModal({
      title: '确认提交',
      content: `投诉类别：${selectedCategory.name}\n\n确认提交投诉？`,
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processSubmit();
        }
      }
    });
  },

  // 处理提交
  async processSubmit() {
    const { categoryIndex, complaintCategories, complaintContent, openid, deviceNumber, contactPhone } = this.data;

    wx.showLoading({
      title: '提交中...',
      mask: true
    });

    try {
      // 构建请求数据
      const complaintData = {
        complaint_category: complaintCategories[categoryIndex].id,
        complaint_content: complaintContent.trim(),
        openid: openid
      };

      // 添加可选参数
      if (deviceNumber.trim()) {
        complaintData.device_number = deviceNumber.trim();
      }
      if (contactPhone.trim()) {
        complaintData.contact_phone = contactPhone.trim();
      }

      console.log('提交投诉数据：', complaintData);

      // 调用API
      const result = await API.createComplaint(complaintData);

      wx.hideLoading();

      if (result.success) {
        message.success('投诉提交成功');
        
        // 延迟返回
        setTimeout(() => {
          // 清空表单
          this.setData({
            categoryIndex: -1,
            deviceNumber: '',
            contactPhone: '',
            complaintContent: '',
            canSubmit: false
          });
          
          // 返回上一页或首页
          const pages = getCurrentPages();
          if (pages.length > 1) {
            navigation.navigateBack();
          } else {
            navigation.switchTab('/pages/home/home');
          }
        }, 1500);
      } else {
        message.error(result.message || '提交失败，请重试');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('提交投诉失败：', error);
      message.error('提交失败，请检查网络后重试');
    }
  }
});