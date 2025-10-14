// pages/business-application/business-application.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    selectedType: null,
    canSubmit: false,
    formData: {
      name: '',
      idCard: '',
      phone: '',
      address: '',
      installAddress: '',
      appointmentDate: '',
      timeSlotIndex: null,
      remark: ''
    },
    timeSlots: [
      '上午 9:00-12:00',
      '下午 14:00-17:00',
      '晚上 18:00-20:00'
    ],
    businessTypes: [
      {
        id: 'new_installation',
        name: '新装宽带',
        description: '首次安装宽带服务',
        price: '安装费 ¥200',
        icon: '🔌'
      },
      {
        id: 'upgrade',
        name: '套餐升级',
        description: '升级到更高速率的套餐',
        price: '免费',
        icon: '⬆️'
      },
      {
        id: 'transfer',
        name: '过户申请',
        description: '宽带账户过户给他人',
        price: '手续费 ¥50',
        icon: '👥'
      },
      {
        id: 'relocation',
        name: '移机申请',
        description: '宽带服务地址迁移',
        price: '移机费 ¥100',
        icon: '🚚'
      },
      {
        id: 'suspension',
        name: '暂停服务',
        description: '临时暂停宽带服务',
        price: '免费',
        icon: '⏸️'
      },
      {
        id: 'resume',
        name: '恢复服务',
        description: '恢复暂停的宽带服务',
        price: '免费',
        icon: '▶️'
      }
    ]
  },

  onLoad() {
    console.log('业务申请页面加载');
  },

  onShow() {
    console.log('业务申请页面显示');
  },

  // 选择业务类型
  selectBusinessType(e) {
    const typeId = e.currentTarget.dataset.id;
    this.setData({
      selectedType: typeId
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 输入姓名
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入身份证号
  onIdCardInput(e) {
    this.setData({
      'formData.idCard': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入地址
  onAddressInput(e) {
    this.setData({
      'formData.address': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入安装地址
  onInstallAddressInput(e) {
    this.setData({
      'formData.installAddress': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 选择预约日期
  onDateChange(e) {
    this.setData({
      'formData.appointmentDate': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 选择时间段
  onTimeSlotChange(e) {
    this.setData({
      'formData.timeSlotIndex': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      'formData.remark': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { selectedType, formData } = this.data;
    
    if (!selectedType) {
      this.setData({ canSubmit: false });
      return;
    }

    // 基本必填项检查
    const requiredFields = ['name', 'idCard', 'phone', 'address'];
    const hasRequiredFields = requiredFields.every(field => 
      formData[field] && formData[field].trim().length > 0
    );

    // 特定业务类型的额外检查
    let hasExtraFields = true;
    if (selectedType === 'new_installation' || selectedType === 'upgrade') {
      hasExtraFields = formData.installAddress && formData.installAddress.trim().length > 0 &&
                      formData.appointmentDate && formData.timeSlotIndex !== null;
    }

    // 数据格式验证
    const isValidPhone = this.validatePhone(formData.phone);
    const isValidIdCard = this.validateIdCard(formData.idCard);

    const canSubmit = hasRequiredFields && hasExtraFields && isValidPhone && isValidIdCard;
    
    this.setData({ canSubmit });
  },

  // 验证手机号
  validatePhone(phone) {
    if (!phone) return false;
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // 验证身份证号
  validateIdCard(idCard) {
    if (!idCard) return false;
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return idCardRegex.test(idCard);
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '业务申请遇到问题？请联系客服获取帮助。\n\n客服电话：400-123-4567\n工作时间：9:00-18:00',
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

  // 提交申请
  submitApplication() {
    if (!this.data.canSubmit) {
      message.error('请完善申请信息');
      return;
    }

    const { selectedType, formData } = this.data;
    const businessType = this.data.businessTypes.find(type => type.id === selectedType);
    
    if (!this.validatePhone(formData.phone)) {
      message.error('请输入正确的手机号码');
      return;
    }

    if (!this.validateIdCard(formData.idCard)) {
      message.error('请输入正确的身份证号码');
      return;
    }

    wx.showModal({
      title: '确认申请',
      content: `业务类型：${businessType.name}\n申请人：${formData.name}\n联系电话：${formData.phone}\n\n确认提交申请？`,
      confirmText: '确认提交',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processApplication();
        }
      }
    });
  },

  // 处理申请
  processApplication() {
    wx.showLoading({
      title: '正在提交...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      message.success('申请提交成功');
      
      setTimeout(() => {
        const applicationId = 'BA' + Date.now().toString().slice(-8);
        
        wx.showModal({
          title: '申请已受理',
          content: `您的申请已成功提交！\n\n申请编号：${applicationId}\n业务类型：${this.data.businessTypes.find(t => t.id === this.data.selectedType).name}\n\n我们会在24小时内联系您确认申请详情，请保持电话畅通。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 清空表单数据
            this.setData({
              selectedType: null,
              formData: {
                name: '',
                idCard: '',
                phone: '',
                address: '',
                installAddress: '',
                appointmentDate: '',
                timeSlotIndex: null,
                remark: ''
              },
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