// pages/complaint/complaint.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    selectedType: null,
    contactPhone: '',
    description: '',
    uploadedImages: [],
    canSubmit: false,
    currentTime: '',
    complaintTypes: [
      {
        id: 'network',
        name: '网络问题',
        description: '网速慢、断网、连接不稳定等',
        icon: '🌐'
      },
      {
        id: 'service',
        name: '服务质量',
        description: '客服态度、上门服务、技术支持等',
        icon: '👥'
      },
      {
        id: 'billing',
        name: '计费问题',
        description: '费用异常、扣费错误、账单问题等',
        icon: '💰'
      },
      {
        id: 'equipment',
        name: '设备问题',
        description: '路由器故障、设备损坏、安装问题等',
        icon: '🔧'
      },
      {
        id: 'other',
        name: '其他问题',
        description: '其他需要反馈的问题',
        icon: '📝'
      }
    ]
  },

  onLoad() {
    console.log('举报投诉页面加载');
    this.setCurrentTime();
  },

  onShow() {
    console.log('举报投诉页面显示');
  },

  // 设置当前时间
  setCurrentTime() {
    const now = new Date();
    const timeString = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0') + ' ' + 
      String(now.getHours()).padStart(2, '0') + ':' + 
      String(now.getMinutes()).padStart(2, '0');
    
    this.setData({
      currentTime: timeString
    });
  },

  // 选择投诉类型
  selectType(e) {
    const typeId = e.currentTarget.dataset.id;
    this.setData({
      selectedType: typeId
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 输入联系电话
  onPhoneInput(e) {
    this.setData({
      contactPhone: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入问题描述
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 上传图片
  uploadImage() {
    if (this.data.uploadedImages.length >= 3) {
      message.error('最多只能上传3张图片');
      return;
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          uploadedImages: [...this.data.uploadedImages, tempFilePath]
        });
        this.checkCanSubmit();
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        message.error('选择图片失败，请重试');
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.uploadedImages;
    images.splice(index, 1);
    this.setData({
      uploadedImages: images
    });
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { selectedType, contactPhone, description } = this.data;
    
    const canSubmit = selectedType && 
                     contactPhone.trim().length > 0 && 
                     description.trim().length > 0 &&
                     this.validatePhone(contactPhone);
    
    this.setData({ canSubmit });
  },

  // 验证手机号
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '紧急问题建议直接联系客服，我们将优先为您处理。\n\n客服电话：400-123-4567\n工作时间：7×24小时',
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

  // 提交投诉
  submitComplaint() {
    if (!this.data.canSubmit) {
      message.error('请完善投诉信息');
      return;
    }

    if (!this.validatePhone(this.data.contactPhone)) {
      message.error('请输入正确的手机号码');
      return;
    }

    const selectedType = this.data.complaintTypes.find(type => type.id === this.data.selectedType);
    
    wx.showModal({
      title: '确认提交',
      content: `投诉类型：${selectedType.name}\n联系电话：${this.data.contactPhone}\n\n确认提交投诉申请？`,
      confirmText: '确认提交',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processComplaint();
        }
      }
    });
  },

  // 处理投诉
  processComplaint() {
    wx.showLoading({
      title: '正在提交...'
    });

    // 模拟提交过程
    setTimeout(() => {
      wx.hideLoading();
      
      message.success('投诉提交成功');
      
      setTimeout(() => {
        wx.showModal({
          title: '投诉已受理',
          content: '您的投诉已成功提交！\n\n投诉编号：CP' + Date.now().toString().slice(-8) + '\n\n我们会在24小时内联系您了解详情，并尽快处理您的问题。\n\n您可以在"我的"页面查看投诉进度。',
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 清空表单数据
            this.setData({
              selectedType: null,
              contactPhone: '',
              description: '',
              uploadedImages: [],
              canSubmit: false
            });
            // 返回首页
            navigation.switchTab('/pages/home/home');
          }
        });
      }, 1000);
    }, 2000);
  }
});