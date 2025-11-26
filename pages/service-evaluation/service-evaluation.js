// pages/service-evaluation/service-evaluation.js
const API = require('../../utils/api');
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    // 三个评分项
    ratings: {
      response_speed: 0,    // 响应速度
      service_quality: 0,   // 服务质量
      service_attitude: 0   // 服务态度
    },
    canSubmit: false,
    device_no: '',  // 设备编号
    openid: ''      // 用户openid
  },

  onLoad(options) {
    console.log('服务评价页面加载', options);
    
    // 从页面参数获取设备编号
    if (options.device_no) {
      this.setData({
        device_no: options.device_no
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

  // 设置评分
  setRating(e) {
    const { type, rating } = e.currentTarget.dataset;
    const ratings = { ...this.data.ratings };
    ratings[type] = rating;
    
    this.setData({ ratings });
    this.checkCanSubmit();
    
    // 触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  // 获取评分文字描述
  getRatingText(rating) {
    const texts = ['请评分', '很不满意', '不满意', '一般', '满意', '非常满意'];
    return texts[rating] || '请评分';
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { ratings } = this.data;
    // 三个评分都必须大于0才能提交
    const canSubmit = ratings.response_speed > 0 && 
                     ratings.service_quality > 0 && 
                     ratings.service_attitude > 0;
    
    this.setData({ canSubmit });
  },

  // 提交评价
  async submitEvaluation() {
    if (!this.data.canSubmit) {
      message.error('请完成所有评分项');
      return;
    }

    const { ratings, openid, device_no } = this.data;

    // 验证openid
    if (!openid) {
      message.error('用户信息缺失，请重新登录');
      setTimeout(() => {
        navigation.navigateTo('/pages/login/login');
      }, 1500);
      return;
    }

    // 确认提交
    wx.showModal({
      title: '确认提交',
      content: '确认提交服务评价？',
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
    const { ratings, openid, device_no } = this.data;

    wx.showLoading({
      title: '提交中...',
      mask: true
    });

    try {
      // 构建请求数据
      const evaluationData = {
        response_speed: ratings.response_speed,
        service_quality: ratings.service_quality,
        service_attitude: ratings.service_attitude,
        openid: openid
      };

      // 如果有设备编号，添加到请求中
      if (device_no) {
        evaluationData.device_no = device_no;
      }

      console.log('提交评价数据：', evaluationData);

      // 调用API
      const result = await API.createEvaluation(evaluationData);

      wx.hideLoading();

      if (result.success) {
        message.success('评价提交成功');
        
        // 延迟返回上一页或首页
        setTimeout(() => {
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
      console.error('提交评价失败：', error);
      message.error('提交失败，请检查网络后重试');
    }
  }
});