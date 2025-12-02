// pages/business-cancellation/business-cancellation.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    selectedOption: null,
    selectedReason: null,
    customReason: '',
    canSubmit: false,
    cancellationOptions: [
      {
        id: 'immediate',
        title: '立即退订',
        description: '立即停止服务，按实际使用天数计算退款',
        note: '退款将在3-5个工作日内到账'
      },
      {
        id: 'end_of_month',
        title: '月末退订',
        description: '服务使用到本月底，下月1日开始停止服务',
        note: '无额外费用，正常计费到月底'
      },
      {
        id: 'end_of_cycle',
        title: '周期结束退订',
        description: '服务使用到当前计费周期结束',
        note: '按完整周期计费，无退款'
      }
    ],
    reasons: [
      { id: 'speed', text: '网速不满足需求' },
      { id: 'price', text: '价格过高' },
      { id: 'service', text: '服务质量不满意' },
      { id: 'move', text: '搬家或地址变更' },
      { id: 'alternative', text: '选择了其他运营商' },
      { id: 'temporary', text: '临时不需要网络' },
      { id: 'other', text: '其他原因' }
    ]
  },

  onLoad() {
    console.log('业务退订页面加载');
  },

  onShow() {
    console.log('业务退订页面显示');
  },

  // 选择退订选项
  selectOption(e) {
    const optionId = e.currentTarget.dataset.id;
    this.setData({
      selectedOption: optionId,
      selectedReason: null,
      customReason: ''
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 选择退订原因
  selectReason(e) {
    const reasonId = e.currentTarget.dataset.id;
    this.setData({
      selectedReason: reasonId,
      customReason: reasonId === 'other' ? this.data.customReason : ''
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 输入自定义原因
  onReasonInput(e) {
    this.setData({
      customReason: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { selectedOption, selectedReason, customReason } = this.data;
    
    let canSubmit = false;
    if (selectedOption && selectedReason) {
      if (selectedReason === 'other') {
        canSubmit = customReason.trim().length > 0;
      } else {
        canSubmit = true;
      }
    }
    
    this.setData({ canSubmit });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '退订前建议先联系客服了解相关政策，可能为您提供更好的解决方案。\n\n客服电话：4009677726',
      confirmText: '拨打电话',
      cancelText: '在线咨询',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '4009677726'
          });
        } else {
          message.success('正在为您转接在线客服...');
        }
      }
    });
  },

  // 确认退订
  confirmCancellation() {
    if (!this.data.canSubmit) {
      message.error('请完善退订信息');
      return;
    }

    const selectedOption = this.data.cancellationOptions.find(opt => opt.id === this.data.selectedOption);
    const selectedReason = this.data.reasons.find(reason => reason.id === this.data.selectedReason);
    
    const reasonText = selectedReason.id === 'other' ? this.data.customReason : selectedReason.text;

    wx.showModal({
      title: '确认退订',
      content: `退订类型：${selectedOption.title}\n退订原因：${reasonText}\n\n退订后将立即生效，无法恢复。是否确认退订？`,
      confirmText: '确认退订',
      cancelText: '取消',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          this.processCancellation();
        }
      }
    });
  },

  // 处理退订
  processCancellation() {
    wx.showLoading({
      title: '正在处理退订...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      message.success('退订申请已提交');
      
      setTimeout(() => {
        wx.showModal({
          title: '退订成功',
          content: '您的退订申请已成功提交！\n\n我们将在1-2个工作日内处理您的申请，并按照您选择的退订方式进行退款。\n\n如有疑问，请联系客服。',
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 返回首页
            navigation.switchTab('/pages/home/home');
          }
        });
      }, 1000);
    }, 2000);
  }
});