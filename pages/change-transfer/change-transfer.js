// pages/change-transfer/change-transfer.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    selectedOperation: null,
    canSubmit: false,
    formData: {
      newName: '',
      newIdCard: '',
      newPhone: '',
      receiverName: '',
      receiverIdCard: '',
      receiverPhone: '',
      receiverAddress: '',
      newAddress: '',
      reasonIndex: null,
      remark: ''
    },
    changeReasons: [
      '搬家迁移',
      '工作调动',
      '房屋买卖',
      '租赁变更',
      '其他原因'
    ],
    operationTypes: [
      {
        id: 'change_info',
        name: '信息变更',
        description: '变更个人基本信息（姓名、身份证、电话）',
        fee: '免费',
        icon: '✏️'
      },
      {
        id: 'transfer',
        name: '账户过户',
        description: '将宽带账户过户给他人',
        fee: '¥50',
        icon: '👥'
      },
      {
        id: 'change_address',
        name: '地址变更',
        description: '变更宽带服务地址',
        fee: '¥100',
        icon: '🏠'
      }
    ]
  },

  onLoad() {
    console.log('变更过户页面加载');
  },

  onShow() {
    console.log('变更过户页面显示');
  },

  // 选择操作类型
  selectOperation(e) {
    const operationId = e.currentTarget.dataset.id;
    this.setData({
      selectedOperation: operationId
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 输入新姓名
  onNewNameInput(e) {
    this.setData({
      'formData.newName': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入新身份证号
  onNewIdCardInput(e) {
    this.setData({
      'formData.newIdCard': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入新电话
  onNewPhoneInput(e) {
    this.setData({
      'formData.newPhone': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入接收方姓名
  onReceiverNameInput(e) {
    this.setData({
      'formData.receiverName': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入接收方身份证号
  onReceiverIdCardInput(e) {
    this.setData({
      'formData.receiverIdCard': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入接收方电话
  onReceiverPhoneInput(e) {
    this.setData({
      'formData.receiverPhone': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入接收方地址
  onReceiverAddressInput(e) {
    this.setData({
      'formData.receiverAddress': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入新地址
  onNewAddressInput(e) {
    this.setData({
      'formData.newAddress': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 选择变更原因
  onReasonChange(e) {
    this.setData({
      'formData.reasonIndex': e.detail.value
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
    const { selectedOperation, formData } = this.data;
    
    if (!selectedOperation) {
      this.setData({ canSubmit: false });
      return;
    }

    let canSubmit = false;

    switch (selectedOperation) {
      case 'change_info':
        canSubmit = formData.newName.trim() && 
                   formData.newIdCard.trim() && 
                   formData.newPhone.trim() &&
                   this.validatePhone(formData.newPhone) &&
                   this.validateIdCard(formData.newIdCard);
        break;
      case 'transfer':
        canSubmit = formData.receiverName.trim() && 
                   formData.receiverIdCard.trim() && 
                   formData.receiverPhone.trim() &&
                   formData.receiverAddress.trim() &&
                   this.validatePhone(formData.receiverPhone) &&
                   this.validateIdCard(formData.receiverIdCard);
        break;
      case 'change_address':
        canSubmit = formData.newAddress.trim() && 
                   formData.reasonIndex !== null;
        break;
    }
    
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
      content: '变更过户遇到问题？请联系客服获取帮助。\n\n客服电话：400-123-4567\n工作时间：9:00-18:00',
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

  // 提交变更申请
  submitChange() {
    if (!this.data.canSubmit) {
      message.error('请完善申请信息');
      return;
    }

    const { selectedOperation, formData } = this.data;
    const operationType = this.data.operationTypes.find(type => type.id === selectedOperation);
    
    // 验证格式
    if (selectedOperation === 'change_info') {
      if (!this.validatePhone(formData.newPhone)) {
        message.error('请输入正确的新手机号码');
        return;
      }
      if (!this.validateIdCard(formData.newIdCard)) {
        message.error('请输入正确的新身份证号码');
        return;
      }
    }

    if (selectedOperation === 'transfer') {
      if (!this.validatePhone(formData.receiverPhone)) {
        message.error('请输入正确的接收方手机号码');
        return;
      }
      if (!this.validateIdCard(formData.receiverIdCard)) {
        message.error('请输入正确的接收方身份证号码');
        return;
      }
    }

    let content = `操作类型：${operationType.name}\n`;
    if (selectedOperation === 'change_info') {
      content += `新姓名：${formData.newName}\n新电话：${formData.newPhone}`;
    } else if (selectedOperation === 'transfer') {
      content += `接收方：${formData.receiverName}\n接收方电话：${formData.receiverPhone}`;
    } else if (selectedOperation === 'change_address') {
      content += `新地址：${formData.newAddress}`;
    }

    wx.showModal({
      title: '确认申请',
      content: content + '\n\n确认提交申请？',
      confirmText: '确认提交',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processChange();
        }
      }
    });
  },

  // 处理变更申请
  processChange() {
    wx.showLoading({
      title: '正在提交...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      message.success('申请提交成功');
      
      setTimeout(() => {
        const changeId = 'CT' + Date.now().toString().slice(-8);
        const operationType = this.data.operationTypes.find(type => type.id === this.data.selectedOperation);
        
        wx.showModal({
          title: '申请已受理',
          content: `您的${operationType.name}申请已成功提交！\n\n申请编号：${changeId}\n处理时间：3-5个工作日\n费用：${operationType.fee}\n\n我们会在24小时内联系您确认申请详情，请保持电话畅通。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 清空表单数据
            this.setData({
              selectedOperation: null,
              formData: {
                newName: '',
                newIdCard: '',
                newPhone: '',
                receiverName: '',
                receiverIdCard: '',
                receiverPhone: '',
                receiverAddress: '',
                newAddress: '',
                reasonIndex: null,
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