// pages/service-evaluation/service-evaluation.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    overallRating: 0,
    textEvaluation: '',
    selectedTags: [],
    isAnonymous: false,
    canSubmit: false,
    ratingTexts: [
      '很不满意',
      '不满意', 
      '一般',
      '满意',
      '非常满意'
    ],
    ratingCategories: [
      {
        id: 'service_attitude',
        name: '服务态度',
        rating: 0
      },
      {
        id: 'professional_level',
        name: '专业水平',
        rating: 0
      },
      {
        id: 'response_speed',
        name: '响应速度',
        rating: 0
      },
      {
        id: 'problem_solving',
        name: '问题解决',
        rating: 0
      }
    ],
    serviceTags: [
      '服务热情',
      '专业细致',
      '及时响应',
      '问题解决',
      '态度友好',
      '技术过硬',
      '耐心讲解',
      '准时到达',
      '设备齐全',
      '环境整洁'
    ]
  },

  onLoad() {
    console.log('服务评价页面加载');
  },

  onShow() {
    console.log('服务评价页面显示');
  },

  // 设置整体评分
  setOverallRating(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({
      overallRating: rating
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 设置分类评分
  setCategoryRating(e) {
    const categoryId = e.currentTarget.dataset.category;
    const rating = e.currentTarget.dataset.rating;
    
    const categories = this.data.ratingCategories.map(category => {
      if (category.id === categoryId) {
        return { ...category, rating: rating };
      }
      return category;
    });
    
    this.setData({
      ratingCategories: categories
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 输入文字评价
  onTextEvaluationInput(e) {
    this.setData({
      textEvaluation: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 切换标签选择
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const selectedTags = [...this.data.selectedTags];
    
    const index = selectedTags.indexOf(tag);
    if (index > -1) {
      selectedTags.splice(index, 1);
    } else {
      selectedTags.push(tag);
    }
    
    this.setData({
      selectedTags: selectedTags
    });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 切换匿名选项
  toggleAnonymous(e) {
    this.setData({
      isAnonymous: e.detail.value
    });
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { overallRating, textEvaluation } = this.data;
    
    // 至少需要整体评分
    const canSubmit = overallRating > 0;
    
    this.setData({ canSubmit });
  },

  // 暂时跳过
  skipEvaluation() {
    wx.showModal({
      title: '确认跳过',
      content: '跳过评价后，您将无法再对此服务进行评价。确定要跳过吗？',
      confirmText: '确定跳过',
      cancelText: '继续评价',
      success: (res) => {
        if (res.confirm) {
          message.success('已跳过评价');
          setTimeout(() => {
            navigation.switchTab('/pages/home/home');
          }, 1000);
        }
      }
    });
  },

  // 提交评价
  submitEvaluation() {
    if (!this.data.canSubmit) {
      message.error('请至少给出整体评分');
      return;
    }

    const { overallRating, textEvaluation, selectedTags, isAnonymous } = this.data;
    
    wx.showModal({
      title: '确认提交',
      content: `整体评分：${overallRating}星\n${isAnonymous ? '（匿名评价）' : ''}\n\n确认提交评价？`,
      confirmText: '确认提交',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processEvaluation();
        }
      }
    });
  },

  // 处理评价提交
  processEvaluation() {
    wx.showLoading({
      title: '正在提交...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      message.success('评价提交成功');
      
      setTimeout(() => {
        wx.showModal({
          title: '感谢您的评价',
          content: '您的评价已成功提交！\n\n我们会认真对待您的反馈，持续改进服务质量。\n\n为了感谢您的评价，您将获得50积分奖励。',
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