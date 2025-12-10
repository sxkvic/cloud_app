// utils/common.js - 通用工具函数

/**
 * 缓存清理工具 - 统一清理设备相关的缓存数据
 */
const cacheManager = {
  // 清除所有设备相关缓存
  clearDeviceCache() {
    console.log('🗑️ 清除所有设备相关缓存...');
    
    // 清除存储缓存 - 包含所有设备和客户相关的缓存键
    const deviceKeys = [
      // 设备绑定状态
      'deviceBound',
      'device_no', 
      'device_info',
      'deviceCode',  // 旧版本兼容
      'device_name',
      'bindingSkipped',  // 跳过绑定状态
      
      // 客户信息
      'customer_info',
      'customer_name',
      
      // 绑定信息
      'binding_info',
      'recharge_account',
      'current_package',
      
      // 完整信息
      'complete_customer_info',
      
      // 套餐和账户信息
      'package_info',
      'account_info',
      'balance'
    ];
    
    deviceKeys.forEach(key => {
      try {
        wx.removeStorageSync(key);
      } catch (error) {
        console.warn(`清除缓存 ${key} 失败:`, error);
      }
    });
    
    // 清除全局数据
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.deviceBound = false;
      app.globalData.device_no = '';
      app.globalData.device_info = null;
      app.globalData.customer_info = null;
      app.globalData.binding_info = null;
    }
    
    console.log('✅ 设备缓存清理完成');
  },

  // 清除用户相关缓存（但保留设备信息）
  clearUserCache() {
    console.log('🗑️ 清除用户相关缓存...');
    
    const userKeys = [
      'token',
      'openid',
      'userInfo',
      'isLoggedIn'
    ];
    
    userKeys.forEach(key => {
      try {
        wx.removeStorageSync(key);
      } catch (error) {
        console.warn(`清除缓存 ${key} 失败:`, error);
      }
    });
    
    // 清除全局数据
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.token = '';
      app.globalData.openid = '';
      app.globalData.userInfo = null;
      app.globalData.isLoggedIn = false;
    }
    
    console.log('✅ 用户缓存清理完成');
  },

  // 完全清除所有缓存（登出时使用）
  clearAllCache() {
    console.log('🗑️ 清除所有应用缓存...');
    this.clearDeviceCache();
    this.clearUserCache();
    console.log('✅ 所有缓存清理完成');
  }
};

/**
 * 页面跳转工具
 */
const navigation = {
  // 普通跳转
  navigateTo(url) {
    wx.navigateTo({ url });
  },
  
  // 重定向跳转
  redirectTo(url) {
    wx.redirectTo({ url });
  },
  
  // 切换到tabBar页面（已改为redirectTo，因为使用自定义tabbar）
  switchTab(url) {
    wx.redirectTo({ url });
  },
  
  // 返回上一页
  navigateBack(delta = 1) {
    wx.navigateBack({ delta });
  }
};

/**
 * 消息提示工具
 */
const message = {
  // 成功提示
  success(title, duration = 600) {
    wx.showToast({
      title,
      icon: 'success',
      duration
    });
  },
  
  // 错误提示 - 延长默认显示时间到2秒
  error(title, duration = 2000) {
    wx.showToast({
      title,
      icon: 'none',
      duration
    });
  },
  
  /**
   * 带最小显示时长的 Loading 包装器
   * 解决接口太快导致 loading 闪烁的问题
   * @param {Function} asyncFn - 异步函数
   * @param {Object} options - 配置选项
   * @param {number} options.minDuration - 最小显示时长（毫秒），默认 800ms
   * @param {string} options.loadingText - loading 文字
   * @param {string} options.successText - 成功提示文字
   * @param {string} options.errorText - 失败提示文字
   * @returns {Promise} 返回异步函数的结果
   */
  async withMinLoading(asyncFn, options = {}) {
    const {
      minDuration = 800,
      loadingText = '加载中...',
      successText = '',
      errorText = '操作失败'
    } = options;
    
    const startTime = Date.now();
    
    try {
      // 执行异步函数
      const result = await asyncFn();
      
      // 计算已经过去的时间
      const elapsed = Date.now() - startTime;
      const remaining = minDuration - elapsed;
      
      // 如果不足最小时间，等待剩余时间
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
      
      // 显示成功提示
      if (successText) {
        this.success(successText);
      }
      
      return result;
    } catch (error) {
      // 错误时也保持最小时间
      const elapsed = Date.now() - startTime;
      const remaining = minDuration - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
      
      // 显示错误提示
      if (errorText) {
        this.error(errorText);
      }
      
      throw error;
    }
  }
};

module.exports = {
  navigation,
  message,
  cacheManager
};

