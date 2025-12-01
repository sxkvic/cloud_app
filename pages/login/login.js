// pages/login/login.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const app = getApp();

Page({
  data: {
    loading: false
  },

  onLoad() {
    console.log('登录页加载');
    // 每次进入登录页都要求用户重新登录，不做自动跳转
  },

  onShow() {
    console.log('登录页显示');
  },

  // 微信登录
  async onWeChatLogin() {
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
          // 调用 getCustomerByDeviceCode 获取完整的设备、客户和绑定信息
          console.log('🔍 调用 getCustomerByDeviceCode 获取完整信息...');
          const deviceInfoResult = await API.getCustomerByDeviceCode(deviceCode);
          
          if (deviceInfoResult.success && deviceInfoResult.data) {
            const { customer, binding_info, device_info } = deviceInfoResult.data;
            
            // 存储完整的设备信息
            wx.setStorageSync('deviceBound', true);
            wx.setStorageSync('device_no', device_info?.device_no || deviceCode);
            wx.setStorageSync('device_info', device_info);
            wx.setStorageSync('customer_info', customer);
            wx.setStorageSync('binding_info', binding_info);
            
            // 同步到全局数据
            app.globalData.deviceBound = true;
            app.globalData.device_no = device_info?.device_no || deviceCode;
            app.globalData.device_info = device_info;
            app.globalData.customer_info = customer;
            app.globalData.binding_info = binding_info;
            
            console.log('✅ 完整设备信息已存储:', {
              device_no: device_info?.device_no,
              device_name: device_info?.device_name,
              customer_name: customer?.customer_name,
              customer_id: customer?.id,
              device_id: device_info?.id,
              expire_time: binding_info?.expire_time,
              current_package: binding_info?.current_package_name
            });
          } else {
            // 如果 getCustomerByDeviceCode 失败，至少保存基本信息
            console.log('⚠️ getCustomerByDeviceCode 返回数据不完整，使用 getUserDevices 的数据');
            wx.setStorageSync('deviceBound', true);
            wx.setStorageSync('device_no', firstDevice.device_no || deviceCode);
            
            app.globalData.deviceBound = true;
            app.globalData.device_no = firstDevice.device_no || deviceCode;
          }
        } catch (error) {
          console.error('❌ 查询完整设备信息失败:', error);
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
        wx.removeStorageSync('deviceBound');
        wx.removeStorageSync('device_no');
        wx.removeStorageSync('device_info');
        wx.removeStorageSync('customer_info');
        wx.removeStorageSync('binding_info');
        
        // 清除全局数据
        app.globalData.deviceBound = false;
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


  // 显示协议
  showAgreement(e) {
    e.stopPropagation();
    wx.showModal({
      title: '用户服务协议',
      content: '这里是用户服务协议的内容...\n\n1. 服务条款\n2. 隐私政策\n3. 免责声明',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话: 400-123-4567\n工作时间: 9:00-18:00',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});

