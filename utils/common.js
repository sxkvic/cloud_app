// utils/common.js - 通用工具函数

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
  success(title, duration = 1500) {
    wx.showToast({
      title,
      icon: 'success',
      duration
    });
  },
  
  // 错误提示
  error(title, duration = 2000) {
    wx.showToast({
      title,
      icon: 'none',
      duration
    });
  },
  
  // 加载提示
  loading(title = '加载中...') {
    wx.showLoading({ title });
  },
  
  // 隐藏加载
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
  getIconName
};

