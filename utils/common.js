// utils/common.js - 通用工具函数

/**
 * 缓存清理工具 - 简化版（只管理设备绑定状态）
 * 不再缓存客户信息等数据，所有数据实时从服务器获取
 */
const cacheManager = {
  // 清除设备绑定（解绑设备时调用）
  clearDeviceCache() {
    console.log('🗑️ 清除设备绑定...');
    
    // 只清除设备绑定相关的键
    const deviceKeys = [
      'deviceBound',
      'device_no',
      'deviceCode',  // 旧版本兼容
      'bindingSkipped'
    ];
    
    deviceKeys.forEach(key => {
      try {
        wx.removeStorageSync(key);
      } catch (error) {
        console.warn(`清除 ${key} 失败:`, error);
      }
    });
    
    // 清除全局数据
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.deviceBound = false;
      app.globalData.device_no = '';
    }
    
    console.log('✅ 设备绑定已清除');
  },

  // 清除用户登录状态
  clearUserCache() {
    console.log('🗑️ 清除用户登录状态...');
    
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
        console.warn(`清除 ${key} 失败:`, error);
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
    
    console.log('✅ 用户登录状态已清除');
  },

  // 完全清除所有缓存（登出时使用）
  clearAllCache() {
    console.log('🗑️ 清除所有缓存...');
    this.clearDeviceCache();
    this.clearUserCache();
    console.log('✅ 所有缓存已清除');
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

