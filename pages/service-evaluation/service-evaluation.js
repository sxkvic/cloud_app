// pages/service-evaluation/service-evaluation.js
const API = require('../../utils/api');
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    statusBarHeight: 20,
    
    // 星星图标 (使用base64 SVG)
    starFilled: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBmaWxsPSIjRkZCODAwIiBkPSJNMjQgMzZsLTEyIDcgMy0xNC0xMS05IDEzLTEgNi0xMyA2IDEzIDEzIDEtMTEgOSAzIDE0eiIvPjwvc3ZnPg==',
    starEmpty: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBmaWxsPSIjRTBFMEUwIiBkPSJNMjQgMzZsLTEyIDcgMy0xNC0xMS05IDEzLTEgNi0xMyA2IDEzIDEzIDEtMTEgOSAzIDE0eiIvPjwvc3ZnPg==',
    
    // 评分数据
    scores: {
      response_speed: 5,
      service_quality: 5,
      service_attitude: 5
    },

    // 标签数据
    tags: [
      { name: '响应迅速', selected: false },
      { name: '技术专业', selected: false },
      { name: '准时到达', selected: false },
      { name: '收费透明', selected: false },
      { name: '态度很好', selected: false },
      { name: '安装美观', selected: false }
    ],
    
    comment: '',
    commentLength: 0,
    canSubmit: true,
    
    // 工单信息
    orderInfo: {
      serviceType: '宽带安装服务',
      orderNo: '',
      completeTime: ''
    },
    currentTime: '',
    
    device_no: '',  // 设备编号
    openid: ''      // 用户openid
  },

  onLoad(options) {
    console.log('服务评价页面加载', options);
    
    // 获取系统信息
    const sys = wx.getSystemInfoSync();
    this.setData({ 
      statusBarHeight: sys.statusBarHeight,
      currentTime: this.formatDateTime(new Date())
    });
    
    // 从页面参数或本地缓存获取设备编号
    let device_no = options.device_no;
    
    if (!device_no) {
      // 如果页面参数没有，尝试从本地缓存读取
      device_no = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
      console.log('从本地缓存读取设备编号:', device_no);
    }
    
    if (device_no) {
      this.setData({
        device_no: device_no,
        'orderInfo.orderNo': device_no
      });
      
      // 尝试加载设备信息用于显示
      const device_info = wx.getStorageSync('device_info');
      if (device_info && device_info.device_name) {
        this.setData({
          'orderInfo.serviceType': device_info.device_name + '服务'
        });
      }
    } else {
      console.warn('未找到设备编号，请先绑定设备');
    }
    
    // 从本地存储获取openid
    const openid = wx.getStorageSync('openid');
    if (openid) {
      this.setData({ openid });
    } else {
      console.warn('未找到用户openid');
    }
  },

  // 格式化日期时间
  formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 返回上一页
  handleBack() {
    wx.navigateBack();
  },

  // 处理评分点击
  handleRate(e) {
    const { type, score } = e.currentTarget.dataset;
    this.setData({
      [`scores.${type}`]: score
    });
    
    // 触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
    
    this.checkCanSubmit();
  },

  // 处理标签选择
  toggleTag(e) {
    const index = e.currentTarget.dataset.index;
    const key = `tags[${index}].selected`;
    this.setData({
      [key]: !this.data.tags[index].selected
    });
  },

  // 处理评论输入
  handleCommentInput(e) {
    const comment = e.detail.value;
    this.setData({
      comment: comment,
      commentLength: comment.length
    });
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { scores } = this.data;
    // 三个评分都必须大于0才能提交
    const canSubmit = scores.response_speed > 0 && 
                     scores.service_quality > 0 && 
                     scores.service_attitude > 0;
    
    this.setData({ canSubmit });
  },

  // 提交评价
  handleSubmit() {
    if (!this.data.canSubmit) {
      message.error('请完成所有评分项');
      return;
    }

    const { scores, tags, comment, openid, device_no } = this.data;

    // 验证openid
    if (!openid) {
      message.error('用户信息缺失，请重新登录');
      setTimeout(() => {
        navigation.navigateTo('/pages/login/login');
      }, 1500);
      return;
    }

    const selectedTags = tags.filter(t => t.selected).map(t => t.name);
    
    console.log('提交数据:', {
      scores,
      tags: selectedTags,
      comment: comment
    });

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
    const { scores, tags, comment, openid, device_no } = this.data;
    const selectedTags = tags.filter(t => t.selected).map(t => t.name);

    wx.showLoading({
      title: '提交中...',
      mask: true
    });

    try {
      // 构建请求数据
      const evaluationData = {
        response_speed: scores.response_speed,
        service_quality: scores.service_quality,
        service_attitude: scores.service_attitude,
        tags: selectedTags.join(','),
        comment: comment,
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