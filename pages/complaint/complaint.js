// pages/complaint/complaint.js
const API = require('../../utils/api');
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    statusBarHeight: 20,
    
    // 投诉类别数据源（恢复原来的10个选项）
    categories: [
      { id: '1', name: '宽带/光纤无法连接' },
      { id: '2', name: '宽带/光纤速率不达标' },
      { id: '3', name: '网络信号覆盖差、影响正常使用' },
      { id: '4', name: 'WiFi信号覆盖差或速率慢' },
      { id: '5', name: '合约期内无法维护或改降套餐' },
      { id: '6', name: '新购运营商套餐不合理' },
      { id: '7', name: '订购/续约承诺未兑现' },
      { id: '8', name: '营业网点服务问题' },
      { id: '9', name: '套餐信息披露不清' },
      { id: '10', name: '其他问题（骚扰电话、恶意营销等）' }
    ],
    index: -1, // -1 表示未选择
    
    // Vant Picker 相关
    showPicker: false,
    pickerColumns: [],
    
    deviceSn: '',
    phone: '',
    content: '',
    contentLength: 0,
    
    canSubmit: false, // 按钮是否激活
    openid: ''
  },

  onLoad(options) {
    console.log('投诉页面加载', options);
    
    // 获取系统信息
    const sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sys.statusBarHeight });
    
    // 初始化 Vant Picker 数据
    const pickerColumns = this.data.categories.map(item => item.name);
    this.setData({ pickerColumns });
    
    // 从页面参数获取设备编号
    if (options.device_number) {
      this.setData({
        deviceSn: options.device_number
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

  // 返回上一页
  handleBack() {
    wx.navigateBack();
  },

  // 显示 Vant Picker
  showVantPicker() {
    this.setData({ showPicker: true });
  },

  // 关闭 Vant Picker
  onPickerClose() {
    this.setData({ showPicker: false });
  },

  // 确认选择
  onPickerConfirm(e) {
    const { value, index } = e.detail;
    console.log('选择了：', value, '索引：', index);
    
    this.setData({
      index: index,
      showPicker: false
    });
    this.checkForm();
    
    // 触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  // 处理下拉框选择（保留作为备用）
  bindPickerChange(e) {
    this.setData({
      index: parseInt(e.detail.value)
    });
    this.checkForm();
    
    // 触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  // 2. 处理设备编号输入
  onDeviceInput(e) {
    this.setData({
      deviceSn: e.detail.value
    });
  },

  // 3. 处理电话输入
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 4. 处理内容输入
  handleInput(e) {
    const val = e.detail.value;
    this.setData({
      content: val,
      contentLength: val.length
    });
    this.checkForm();
  },

  // 5. 表单校验 (控制按钮颜色)
  checkForm() {
    const { index, content } = this.data;
    // 必填项：类别已选 且 内容不为空
    const isValid = (index != -1) && (content.trim().length > 0);
    this.setData({ canSubmit: isValid });
  },

  // 6. 提交
  handleSubmit() {
    const { index, categories, deviceSn, phone, content, openid } = this.data;
    
    if (index == -1) {
      wx.showToast({ title: '请选择投诉类别', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      wx.showToast({ title: '请填写投诉内容', icon: 'none' });
      return;
    }

    // 验证openid
    if (!openid) {
      message.error('用户信息缺失，请重新登录');
      setTimeout(() => {
        navigation.navigateTo('/pages/login/login');
      }, 1500);
      return;
    }

    const payload = {
      category: categories[index].name, // 发给后端的字段：类别名称
      category_id: categories[index].id, // 发给后端的字段：类别ID
      deviceSn: deviceSn,                // 发给后端的字段：设备号
      phone: phone,                      // 发给后端的字段：电话
      content: content,                  // 发给后端的字段：内容
      openid: openid                     // 用户openid
    };

    console.log('提交给后端的数据:', payload);

    wx.showLoading({ title: '提交中...', mask: true });
    
    // 调用API提交投诉
    this.processSubmit(payload);
  },

  // 处理提交
  async processSubmit(payload) {
    try {
      // 构建请求数据
      const complaintData = {
        complaint_category: payload.category_id,
        complaint_content: payload.content.trim(),
        openid: payload.openid
      };

      // 添加可选参数
      if (payload.deviceSn.trim()) {
        complaintData.device_number = payload.deviceSn.trim();
      }
      if (payload.phone.trim()) {
        complaintData.contact_phone = payload.phone.trim();
      }

      console.log('提交投诉数据：', complaintData);

      // 调用API
      const result = await API.createComplaint(complaintData);

      wx.hideLoading();

      if (result.success) {
        wx.showModal({
          title: '提交成功',
          content: '我们会尽快处理您的反馈',
          showCancel: false,
          confirmColor: '#4D6AFF',
          success: () => {
            // 清空表单
            this.setData({
              index: -1,
              deviceSn: '',
              phone: '',
              content: '',
              contentLength: 0,
              canSubmit: false
            });
            
            // 返回上一页或首页
            const pages = getCurrentPages();
            if (pages.length > 1) {
              wx.navigateBack();
            } else {
              navigation.switchTab('/pages/home/home');
            }
          }
        });
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