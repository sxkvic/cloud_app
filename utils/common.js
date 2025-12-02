// utils/common.js - 通用工具函数

/**
 * 缓存清理工具 - 统一清理设备相关的缓存数据
 */
const cacheManager = {
  // 清除所有设备相关缓存
  clearDeviceCache() {
    console.log('🗑️ 清除所有设备相关缓存...');
    
    // 清除存储缓存
    const deviceKeys = [
      'deviceBound',
      'device_no', 
      'device_info',
      'customer_info',
      'binding_info',
      'deviceCode',  // 旧版本兼容
      'bindingSkipped'  // 跳过绑定状态
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
  
  // 智能加载提示 - 只在慢速操作时显示
  smartLoading(title = '加载中...', delay = 500) {
    let timer = null;
    let isShowing = false;
    
    // 延迟显示 loading
    timer = setTimeout(() => {
      wx.showLoading({ title, mask: true });
      isShowing = true;
    }, delay);
    
    // 返回隐藏函数
    return () => {
      if (timer) clearTimeout(timer);
      if (isShowing) wx.hideLoading();
    };
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
  },
  
  // 立即显示加载提示（用于必须显示的场景）
  loading(title = '加载中...') {
    wx.showLoading({ title, mask: true });
  },
  
  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading();
  },
  
  // 确认对话框
  confirm(options) {
    return new Promise((resolve) => {
      wx.showModal({
        title: options.title || '提示',
        content: options.content || '',
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        success: (res) => {
          resolve(res.confirm);
        }
      });
    });
  }
};

/**
 * 存储工具
 */
const storage = {
  // 设置存储
  set(key, value) {
    try {
      wx.setStorageSync(key, value);
    } catch (e) {
      console.error('存储失败:', e);
    }
  },
  
  // 获取存储
  get(key, defaultValue = null) {
    try {
      return wx.getStorageSync(key) || defaultValue;
    } catch (e) {
      console.error('获取存储失败:', e);
      return defaultValue;
    }
  },
  
  // 删除存储
  remove(key) {
    try {
      wx.removeStorageSync(key);
    } catch (e) {
      console.error('删除存储失败:', e);
    }
  }
};

/**
 * 格式化工具
 */
const format = {
  // 格式化金额
  money(amount) {
    return parseFloat(amount).toFixed(2);
  },
  
  // 格式化日期
  date(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },
  
  // 格式化手机号
  phone(phone) {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
};

/**
 * 图标映射 - Font Awesome 到小程序图标
 */
const iconMap = {
  // 基础图标
  'home': 'wap-home',
  'user': 'manager',
  'bell': 'bell',
  'search': 'search',
  'setting': 'setting',
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow',
  'check': 'success',
  'close': 'cross',
  'plus': 'plus',
  'minus': 'minus',
  
  // 功能图标
  'shopping-cart': 'shopping-cart',
  'bill': 'bill',
  'service': 'service',
  'replay': 'replay',
  'gold-coin': 'gold-coin',
  'exchange': 'exchange',
  'calendar': 'calendar',
  'todo-list': 'todo-list',
  'description': 'description',
  'orders': 'orders',
  'warning': 'warning',
  'star': 'star',
  'paid': 'paid',
  
  // 其他图标
  'qrcode': 'scan',
  'camera': 'photo',
  'location': 'location',
  'phone': 'phone',
  'mail': 'mail',
  'clock': 'clock',
  'map-marker': 'location',
  'wallet': 'gold-coin',
  'box-open': 'shop',
  'receipt': 'bill',
  'list-alt': 'todo-list',
  'id-card': 'contact',
  'cog': 'setting'
};

/**
 * 获取图标名称
 */
function getIconName(faIcon) {
  // 移除 fa- 前缀
  const cleanIcon = faIcon.replace(/^fa-/, '');
  return iconMap[cleanIcon] || 'question';
}

module.exports = {
  navigation,
  message,
  storage,
  format,
  getIconName,
  cacheManager
};

