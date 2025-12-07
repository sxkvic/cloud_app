/**
 * 数据管理工具
 * 用于管理客户信息、设备信息等数据的缓存和刷新
 */

const API = require('./api.js');

/**
 * 需要清除的缓存键列表
 */
const CACHE_KEYS = [
  'customer_info',
  'binding_info',
  'device_info',
  'complete_customer_info',
  'device_no',
  'device_name',
  'customer_name',
  'recharge_account',
  'current_package',
  'package_info',
  'account_info',
  'balance'
];

/**
 * 清除所有客户相关缓存
 */
function clearCustomerCache() {
  console.log('🗑️ 清除客户相关缓存...');
  CACHE_KEYS.forEach(key => {
    try {
      wx.removeStorageSync(key);
    } catch (error) {
      console.error(`清除缓存失败: ${key}`, error);
    }
  });
  console.log('✅ 缓存已清除');
}

/**
 * 获取完整的客户信息（每次都从服务器获取最新数据）
 * @param {String} deviceCode 设备码
 * @param {Boolean} forceRefresh 是否强制刷新（默认true）
 * @returns {Promise} 完整的客户信息
 */
async function getCompleteCustomerInfo(deviceCode, forceRefresh = true) {
  try {
    console.log('📊 获取完整客户信息...', { deviceCode, forceRefresh });

    // 如果强制刷新，先清除缓存
    if (forceRefresh) {
      clearCustomerCache();
    }

    // 调用 API 获取完整信息
    const result = await API.getCompleteCustomerInfo(deviceCode);

    if (result.success && result.data) {
      // 存储到缓存
      saveCustomerInfoToCache(result.data);
      console.log('✅ 客户信息已更新并缓存');
      return result;
    } else {
      console.error('❌ 获取客户信息失败:', result.message);
      return result;
    }
  } catch (error) {
    console.error('❌ 获取完整客户信息异常:', error);
    throw error;
  }
}

/**
 * 保存客户信息到缓存
 * @param {Object} data 客户信息数据
 */
function saveCustomerInfoToCache(data) {
  try {
    console.log('💾 保存客户信息到缓存...');

    // 保存完整数据
    wx.setStorageSync('complete_customer_info', data);

    // 保存各个字段（兼容旧代码）
    if (data.customer) {
      wx.setStorageSync('customer_info', data.customer);
      wx.setStorageSync('customer_name', data.customer.customer_name || '');
    }

    if (data.binding_info) {
      wx.setStorageSync('binding_info', data.binding_info);
      wx.setStorageSync('recharge_account', data.binding_info.recharge_account || '');
      wx.setStorageSync('current_package', data.binding_info.current_package_name || '');
    }

    // 优先使用 device_info，如果没有则使用 device（新接口字段）
    const deviceData = data.device_info || data.device;
    if (deviceData) {
      wx.setStorageSync('device_info', deviceData);
      wx.setStorageSync('device_no', deviceData.device_no || '');
      wx.setStorageSync('device_name', deviceData.device_name || '');
    }

    // 保存新接口的额外数据
    if (data.package) {
      wx.setStorageSync('package_info', data.package);
    }

    if (data.account) {
      wx.setStorageSync('account_info', data.account);
      wx.setStorageSync('balance', data.account.balance || '0');
    }

    console.log('✅ 客户信息已保存到缓存', {
      has_customer: !!data.customer,
      has_binding: !!data.binding_info,
      has_device: !!(data.device_info || data.device),
      has_package: !!data.package,
      has_account: !!data.account
    });
  } catch (error) {
    console.error('❌ 保存缓存失败:', error);
  }
}

/**
 * 从缓存获取客户信息（不推荐使用，建议每次都获取最新数据）
 * @returns {Object|null} 缓存的客户信息
 */
function getCustomerInfoFromCache() {
  try {
    const completeInfo = wx.getStorageSync('complete_customer_info');
    if (completeInfo) {
      console.log('📦 从缓存获取客户信息');
      return completeInfo;
    }

    // 兼容旧缓存结构
    const customer = wx.getStorageSync('customer_info');
    const binding = wx.getStorageSync('binding_info');
    const device = wx.getStorageSync('device_info');

    if (customer || binding || device) {
      console.log('📦 从旧缓存结构获取客户信息');
      return {
        customer,
        binding_info: binding,
        device_info: device
      };
    }

    return null;
  } catch (error) {
    console.error('❌ 获取缓存失败:', error);
    return null;
  }
}

/**
 * 页面加载时获取最新数据的标准流程
 * @param {Object} page 页面实例
 * @param {String} deviceCode 设备码
 * @param {Function} callback 数据加载完成后的回调
 */
async function loadPageData(page, deviceCode, callback) {
  try {
    console.log('🔄 页面加载数据流程开始...', { deviceCode });

    // 设置加载状态
    if (page.setData) {
      page.setData({ loading: true });
    }

    // 获取最新数据（强制刷新）
    const result = await getCompleteCustomerInfo(deviceCode, true);

    if (result.success && result.data) {
      // 执行回调
      if (typeof callback === 'function') {
        callback(result.data);
      }
      return result.data;
    } else {
      throw new Error(result.message || '获取数据失败');
    }
  } catch (error) {
    console.error('❌ 页面加载数据失败:', error);
    wx.showToast({
      title: '加载失败',
      icon: 'none'
    });
    throw error;
  } finally {
    // 关闭加载状态
    if (page.setData) {
      page.setData({ loading: false });
    }
  }
}

module.exports = {
  clearCustomerCache,
  getCompleteCustomerInfo,
  saveCustomerInfoToCache,
  getCustomerInfoFromCache,
  loadPageData,
  CACHE_KEYS
};
