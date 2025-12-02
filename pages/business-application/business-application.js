// pages/business-application/business-application.js
const { navigation, message } = require('../../utils/common');
const request = require('../../utils/request');
const API = require('../../utils/api');

Page({
  data: {
    canSubmit: false,
    submitLoading: false,
    // 省市选择器状态
    showProvincePicker: false,
    showCityPicker: false,
    // 选中的省份和城市
    selectedProvince: null,
    selectedCity: null,
    // Picker的列数据
    provinceColumns: [],
    cityColumns: [],
    formData: {
      customer_name: '',
      user_type: 1,  // 1=个人, 2=企业
      id_number: '',
      contact_person: '',
      contact_phone: '',
      city: '',
      install_address: '',
      install_requirement: '',
      status: 1  // 默认启用
    }
  },

  async onLoad() {
    console.log('业务申请页面加载');
    // 页面加载时只加载省份数据
    await this.loadProvinces();
  },

  onShow() {
    console.log('业务申请页面显示');
  },

  // 切换客户类型
  switchUserType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    this.setData({
      'formData.user_type': type,
      'formData.id_number': ''  // 切换类型时清空证件号
    });
    wx.vibrateShort();
    this.checkCanSubmit();
  },

  // 输入客户名称
  onCustomerNameInput(e) {
    this.setData({
      'formData.customer_name': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入证件号
  onIdNumberInput(e) {
    this.setData({
      'formData.id_number': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入联系人姓名
  onContactPersonInput(e) {
    this.setData({
      'formData.contact_person': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入联系电话
  onContactPhoneInput(e) {
    this.setData({
      'formData.contact_phone': e.detail.value
    });
    this.checkCanSubmit();
  },

  // ========== 省市选择器逻辑 ==========
  
  // 加载省份列表（页面加载时调用）
  async loadProvinces() {
    try {
      const result = await API.getProvinces();
      if (result.success && Array.isArray(result.data)) {
        const columns = result.data.map(item => ({
          text: item.name,
          value: item.id
        }));
        this.setData({ provinceColumns: columns });
        console.log('省份数据加载完成:', columns.length);
      }
    } catch (error) {
      console.error('加载省份数据失败:', error);
      message.error('加载省份数据失败');
    }
  },

  // 加载城市列表（选择省份后调用）
  async loadCities(provinceId, provinceName) {
    try {
      wx.showLoading({ title: '加载城市...' });
      const result = await API.getCities(provinceId);
      wx.hideLoading();
      
      if (result.success && Array.isArray(result.data)) {
        const columns = result.data.map(item => ({
          text: item.name,
          value: item.id
        }));
        this.setData({ cityColumns: columns });
        console.log(`${provinceName}的城市加载完成:`, columns.length);
        return true;
      }
      return false;
    } catch (error) {
      wx.hideLoading();
      console.error('加载城市数据失败:', error);
      message.error('加载城市数据失败');
      return false;
    }
  },

  // 显示省份选择器
  showAreaPicker() {
    this.setData({ showProvincePicker: true });
  },

  // 关闭省份选择器
  onProvincePickerClose() {
    this.setData({ showProvincePicker: false });
  },

  // 省份选择确认
  async onProvinceConfirm(e) {
    const { value, index } = e.detail;
    const province = this.data.provinceColumns[index];
    
    this.setData({ 
      selectedProvince: province,
      showProvincePicker: false
    });
    
    // 加载该省份的城市
    const success = await this.loadCities(province.value, province.text);
    if (success) {
      // 自动打开城市选择器
      this.setData({ showCityPicker: true });
    }
  },

  // 关闭城市选择器
  onCityPickerClose() {
    this.setData({ showCityPicker: false });
  },

  // 城市选择确认
  onCityConfirm(e) {
    const { value, index } = e.detail;
    const city = this.data.cityColumns[index];
    
    this.setData({ 
      selectedCity: city,
      showCityPicker: false
    });
    
    // 拼接完整地址
    const cityStr = `${this.data.selectedProvince.text}/${city.text}`;
    this.setData({
      'formData.city': cityStr
    });
    this.checkCanSubmit();
  },

  // 输入安装地址
  onInstallAddressInput(e) {
    this.setData({
      'formData.install_address': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 输入安装要求
  onInstallRequirementInput(e) {
    this.setData({
      'formData.install_requirement': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { formData } = this.data;
    
    // 必填项：客户名称
    if (!formData.customer_name || formData.customer_name.trim().length === 0) {
      this.setData({ canSubmit: false });
      return;
    }

    // 客户名称长度验证（1-100字符）
    if (formData.customer_name.trim().length > 100) {
      this.setData({ canSubmit: false });
      return;
    }

    // 如果填写了联系电话，验证格式
    if (formData.contact_phone && !this.validatePhone(formData.contact_phone)) {
      this.setData({ canSubmit: false });
      return;
    }

    // 如果填写了证件号，验证格式
    if (formData.id_number) {
      if (formData.user_type === 1) {
        // 个人：验证身份证号
        if (!this.validateIdCard(formData.id_number)) {
          this.setData({ canSubmit: false });
          return;
        }
      } else {
        // 企业：验证营业执照号（统一社会信用代码18位）
        if (!this.validateBusinessLicense(formData.id_number)) {
          this.setData({ canSubmit: false });
          return;
        }
      }
    }

    this.setData({ canSubmit: true });
  },

  // 验证手机号
  validatePhone(phone) {
    if (!phone) return true;  // 可选字段，为空时返回true
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // 验证身份证号
  validateIdCard(idCard) {
    if (!idCard) return true;  // 可选字段，为空时返回true
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return idCardRegex.test(idCard);
  },

  // 验证营业执照号（统一社会信用代码）
  validateBusinessLicense(license) {
    if (!license) return true;  // 可选字段，为空时返回true
    // 统一社会信用代码：18位，由数字和大写字母组成
    const licenseRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
    return licenseRegex.test(license);
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

    const { formData } = this.data;
    
    // 最终验证
    if (formData.contact_phone && !this.validatePhone(formData.contact_phone)) {
      message.error('请输入正确的手机号码');
      return;
    }

    if (formData.id_number) {
      if (formData.user_type === 1 && !this.validateIdCard(formData.id_number)) {
        message.error('请输入正确的身份证号码');
        return;
      }
      if (formData.user_type === 2 && !this.validateBusinessLicense(formData.id_number)) {
        message.error('请输入正确的统一社会信用代码');
        return;
      }
    }

    const customerType = formData.user_type === 1 ? '个人客户' : '企业客户';
    wx.showModal({
      title: '确认提交',
      content: `客户类型：${customerType}\n客户名称：${formData.customer_name}\n联系电话：${formData.contact_phone || '未填写'}\n\n确认提交申请？`,
      confirmText: '确认提交',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processApplication();
        }
      }
    });
  },

  // 处理申请 - 调用真实API
  async processApplication() {
    this.setData({ submitLoading: true });

    try {
      // 调用创建客户API
      const result = await request.post('/api/v1/customers/createCustomer', this.data.formData, {
        loadingText: '正在提交申请...',
        showLoading: true
      });
      
      this.setData({ submitLoading: false });
      
      // 提交成功
      const customer = result.data.customer;
      message.success('申请提交成功');
      
      // 延迟显示详情弹窗
      setTimeout(() => {
        wx.showModal({
          title: '申请已受理',
          content: `您的申请已成功提交！\n\n客户ID：${customer.id}\n客户名称：${customer.customer_name}\n创建时间：${customer.created_at}\n\n我们会在24小时内联系您确认申请详情，请保持电话畅通。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 清空表单数据
            this.setData({
              formData: {
                customer_name: '',
                user_type: 1,
                id_number: '',
                contact_person: '',
                contact_phone: '',
                city: '',
                install_address: '',
                install_requirement: '',
                status: 1
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
      // 错误提示已在 request 中处理
      console.error('创建客户失败:', error);
    }
  }
});