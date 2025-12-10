// pages/login/login.js
const { navigation, message, cacheManager } = require('../../utils/common');
const API = require('../../utils/api');
const DataManager = require('../../utils/dataManager');
const app = getApp();

Page({
  data: {
    loading: false,
    agreed: false  // 隐私协议同意状态
  },

  onLoad() {
    console.log('登录页加载');
    // 每次进入登录页都要求用户重新登录，不做自动跳转
  },

  onShow() {
    console.log('登录页显示');
  },

  // 隐私协议勾选变化
  onAgreeChange(e) {
    const agreed = e.detail.value.length > 0;
    this.setData({ agreed });
    console.log('隐私协议同意状态:', agreed);
  },

  // 跳转到用户协议
  navigateToUserAgreement(e) {
    console.log('🔗 点击用户协议链接', e);
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    console.log('🚀 准备跳转到用户协议页面');
    wx.navigateTo({
      url: '/pages/user-agreement/user-agreement',
      success: () => {
        console.log('✅ 跳转用户协议成功');
      },
      fail: (err) => {
        console.error('❌ 跳转用户协议失败:', err);
      }
    });
  },

  // 跳转到隐私政策
  navigateToPrivacyPolicy(e) {
    console.log('🔗 点击隐私政策链接', e);
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    console.log('🚀 准备跳转到隐私政策页面');
    wx.navigateTo({
      url: '/pages/privacy-policy/privacy-policy',
      success: () => {
        console.log('✅ 跳转隐私政策成功');
      },
      fail: (err) => {
        console.error('❌ 跳转隐私政策失败:', err);
      }
    });
  },

  // 微信登录
  async onWeChatLogin() {
    // 检查是否同意协议
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意用户协议和隐私政策',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 防止重复调用
    if (this.data.loading) {
      console.log('登录进行中，忽略重复调用');
      return;
    }

    console.log("Starting WeChat Login...");
    this.setData({ loading: true });

    try {
      // 1. 调用微信登录获取code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      if (!loginRes.code) {
        throw new Error('获取微信授权失败');
      }

      const code = loginRes.code;
      console.log('获取到微信code:', code);

      // 2. 通过code获取openid
      const openidResult = await API.getOpenidByCode(code);
      const openid = openidResult.data.openid;
      console.log('获取到openid:', openid);

      // 保存openid
      app.globalData.openid = openid;
      wx.setStorageSync('openid', openid);

      // 3. 尝试生成token（如果用户已存在）
      try {
        const tokenResult = await API.generateTokenByOpenid(openid);
        const token = tokenResult.data.token;
        console.log('用户已存在，获取到token');

        // 保存token
        app.globalData.token = token;
        app.globalData.isLoggedIn = true;
        wx.setStorageSync('token', token);

        // 4. 获取用户信息
        const userInfoResult = await API.getUserInfo();
        app.globalData.userInfo = userInfoResult.data;
        wx.setStorageSync('userInfo', userInfoResult.data);

        // 5. 检查设备绑定状态（老用户也需要检查）
        await this.checkDeviceBindingAndNavigate();

      } catch (tokenError) {
        // 用户不存在，创建新用户
        console.log('用户不存在，创建新用户');

        const createUserResult = await API.createUser({
          openid: openid,
          nickname: '微信用户',
          avatar: ''
        });

        const token = createUserResult.data.token;
        app.globalData.token = token;
        app.globalData.isLoggedIn = true;
        wx.setStorageSync('token', token);

        // 保存用户信息
        if (createUserResult.data.userInfo) {
          app.globalData.userInfo = createUserResult.data.userInfo;
          wx.setStorageSync('userInfo', createUserResult.data.userInfo);
        }

        // 新用户直接跳转到设备绑定页面，不显示中间提示避免闪烁
        this.setData({ loading: false });
        
        setTimeout(() => {
          navigation.navigateTo('/pages/bind-device-code/bind-device-code');
        }, 300);
      }

    } catch (error) {
      console.error('登录失败:', error);
      this.setData({ loading: false });

      // 显示友好的错误提示，延长显示时间到3秒
      const errorMsg = error.message || '登录失败，请重试';
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000  // 错误提示停留3秒
      });
    }
  },

  // 检查设备绑定状态并导航
  async checkDeviceBindingAndNavigate() {
    try {
      console.log('🔍 检查用户设备绑定状态...');
      
      // 调用API获取用户绑定的设备列表
      const devicesResult = await API.getUserDevices();
      const devices = devicesResult.data.devices || [];
      
      console.log('📋 服务器返回的设备列表:', devices);
      console.log('📊 设备数量:', devices.length);
      
      if (devices.length > 0) {
        // 用户已绑定设备
        const firstDevice = devices[0];
        const deviceCode = firstDevice.deviceCode || firstDevice.device_no;
        
        console.log('📦 从 getUserDevices 获取到的设备数据:', firstDevice);
        
        try {
          // 使用 DataManager 获取完整信息（包括新接口数据）
          console.log('🔍 使用 DataManager 获取完整客户信息...');
          const completeInfoResult = await DataManager.getCompleteCustomerInfo(deviceCode, true);
          
          if (completeInfoResult.success && completeInfoResult.data) {
            const completeData = completeInfoResult.data;
            const { customer, binding_info, device_info } = completeData;
            
            // 存储完整的设备信息（包括新接口返回的额外数据）
            wx.setStorageSync('deviceBound', true);
            wx.setStorageSync('device_no', device_info?.device_no || deviceCode);
            wx.setStorageSync('device_info', device_info);
            wx.setStorageSync('customer_info', customer);
            wx.setStorageSync('binding_info', binding_info);
            wx.setStorageSync('complete_customer_info', completeData);
            
            // 同步到全局数据
            app.globalData.deviceBound = true;
            app.globalData.device_no = device_info?.device_no || deviceCode;
            app.globalData.device_info = device_info;
            app.globalData.customer_info = customer;
            app.globalData.binding_info = binding_info;
            app.globalData.complete_customer_info = completeData;
            
            console.log('✅ 完整客户信息已存储（包含新接口数据）:', {
              device_no: device_info?.device_no,
              device_name: device_info?.device_name,
              customer_name: customer?.customer_name,
              customer_id: customer?.id,
              device_id: device_info?.id,
              expire_time: binding_info?.expire_time,
              current_package: binding_info?.current_package_name,
              has_package_info: !!completeData.package_info,
              has_balance_info: !!completeData.balance_info,
              has_usage_info: !!completeData.usage_info
            });
          } else {
            // 如果获取完整信息失败，至少保存基本信息
            console.log('⚠️ 获取完整信息失败，使用 getUserDevices 的数据');
            wx.setStorageSync('deviceBound', true);
            wx.setStorageSync('device_no', firstDevice.device_no || deviceCode);
            
            app.globalData.deviceBound = true;
            app.globalData.device_no = firstDevice.device_no || deviceCode;
          }
        } catch (error) {
          console.error('❌ 查询完整客户信息失败:', error);
          // 即使查询失败，也保存基本信息以便继续登录
          wx.setStorageSync('deviceBound', true);
          wx.setStorageSync('device_no', firstDevice.device_no || deviceCode);
          
          app.globalData.deviceBound = true;
          app.globalData.device_no = firstDevice.device_no || deviceCode;
        }
        
        // 直接跳转，不显示中间提示避免闪烁
        console.log('用户已绑定设备，跳转首页');
        setTimeout(() => {
          this.setData({ loading: false });
          navigation.switchTab('/pages/home/home');
        }, 300);
      } else {
        // 用户未绑定设备
        console.log('⚠️ 用户未绑定设备，清除可能存在的旧缓存');
        
        // 清除所有设备相关缓存（防止使用过期数据）
        cacheManager.clearDeviceCache();
        app.globalData.device_no = null;
        app.globalData.device_info = null;
        app.globalData.customer_info = null;
        app.globalData.binding_info = null;
        
        console.log('✅ 旧缓存已清除，跳转设备绑定页面');
        
        setTimeout(() => {
          this.setData({ loading: false });
          navigation.navigateTo('/pages/bind-device-code/bind-device-code');
        }, 300);
      }
    } catch (error) {
      console.error('检查设备绑定失败:', error);
      // 如果检查失败，也跳转到设备绑定页面
      setTimeout(() => {
        this.setData({ loading: false });
        navigation.navigateTo('/pages/bind-device-code/bind-device-code');
      }, 300);
    }
  },


  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话: 4009677726\n工作时间: 9:00-18:00',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});

