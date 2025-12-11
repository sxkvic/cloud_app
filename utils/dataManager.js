/**
 * 数据管理工具 - 无缓存版本
 * 只存储设备码，所有数据实时从服务器获取
 * 避免因缓存导致的数据污染问题（如变更过户场景）
 */

const API = require('./api.js');

/**
 * 获取当前绑定的设备码
 * @returns {String|null} 设备码
 */
function getDeviceCode() {
  return wx.getStorageSync('device_no') || null;
}

/**
 * 保存设备码（绑定设备时调用）
 * @param {String} deviceCode 设备码
 */
function saveDeviceCode(deviceCode) {
  wx.setStorageSync('device_no', deviceCode);
  wx.setStorageSync('deviceBound', true);
  console.log('✅ 设备码已保存:', deviceCode);
}

/**
 * 清除设备绑定（解绑时调用）
 */
function clearDeviceBinding() {
  wx.removeStorageSync('device_no');
  wx.removeStorageSync('deviceBound');
  console.log('✅ 设备绑定已清除');
}

/**
 * 检查是否已绑定设备
 * @returns {Boolean}
 */
function isDeviceBound() {
  return !!getDeviceCode();
}

/**
 * 获取完整的客户信息（实时从服务器获取）
 * 调用两个接口获取完整数据：
 * 1. getCustomerByDeviceCode - 获取基本信息和 recharge_account
 * 2. getCustomerAndPackageByDeviceNo - 获取完整信息（包含套餐和账户）
 * 
 * @param {String} deviceCode 设备码（可选，不传则从本地获取）
 * @returns {Promise<{success: Boolean, data: Object, message: String}>}
 */
async function getCompleteCustomerInfo(deviceCode) {
  try {
    // 如果没传设备码，从本地获取
    const device_no = deviceCode || getDeviceCode();
    
    if (!device_no) {
      return { success: false, message: '未绑定设备', data: null };
    }

    console.log('📊 获取客户信息...', { device_no });

    // 1. 先调用基本接口获取 recharge_account
    const basicResult = await API.getCustomerByDeviceCode(device_no);
    
    if (!basicResult.success || !basicResult.data) {
      console.error('❌ 获取基本信息失败:', basicResult.message);
      return basicResult;
    }

    const rechargeAccount = basicResult.data.binding_info?.recharge_account;
    
    if (!rechargeAccount) {
      // 没有 recharge_account，直接返回基本信息
      console.log('⚠️ 未找到 recharge_account，返回基本信息');
      return {
        success: true,
        message: '获取成功',
        data: {
          customer: basicResult.data.customer,
          binding_info: basicResult.data.binding_info,
          device_info: basicResult.data.device_info,
          device: basicResult.data.device_info,
          package: null,
          account: null
        }
      };
    }

    // 2. 调用完整接口获取套餐和账户信息
    console.log('📞 获取完整信息...', { device_no, rechargeAccount });
    const completeResult = await API.getCustomerAndPackageByDeviceNo(device_no, rechargeAccount);
    
    if (completeResult.success && completeResult.data) {
      // 合并数据，确保字段完整
      const mergedData = {
        customer: completeResult.data.customer || basicResult.data.customer,
        binding_info: completeResult.data.binding_info || basicResult.data.binding_info,
        device_info: basicResult.data.device_info,
        device: completeResult.data.device,
        package: completeResult.data.package,
        account: completeResult.data.account
      };
      
      console.log('✅ 完整客户信息获取成功', {
        customer_name: mergedData.customer?.customer_name,
        device_no: mergedData.device_info?.device_no || mergedData.device?.device_no,
        has_package: !!mergedData.package,
        balance: mergedData.account?.balance
      });
      
      return { success: true, message: '获取成功', data: mergedData };
    }

    // 完整接口失败，返回基本信息
    console.warn('⚠️ 完整接口调用失败，返回基本信息');
    return {
      success: true,
      message: '获取成功（部分）',
      data: {
        customer: basicResult.data.customer,
        binding_info: basicResult.data.binding_info,
        device_info: basicResult.data.device_info,
        device: basicResult.data.device_info,
        package: null,
        account: null
      }
    };

  } catch (error) {
    console.error('❌ 获取客户信息异常:', error);
    return { success: false, message: error.message || '获取失败', data: null };
  }
}

/**
 * 快速获取基本客户信息（只调用一个接口，速度更快）
 * 适用于只需要客户名称、设备信息等基本数据的场景
 * 
 * @param {String} deviceCode 设备码（可选）
 * @returns {Promise<{success: Boolean, data: Object, message: String}>}
 */
async function getBasicCustomerInfo(deviceCode) {
  try {
    const device_no = deviceCode || getDeviceCode();
    
    if (!device_no) {
      return { success: false, message: '未绑定设备', data: null };
    }

    console.log('📊 获取基本客户信息...', { device_no });
    return await API.getCustomerByDeviceCode(device_no);

  } catch (error) {
    console.error('❌ 获取基本信息异常:', error);
    return { success: false, message: error.message || '获取失败', data: null };
  }
}

module.exports = {
  getDeviceCode,
  saveDeviceCode,
  clearDeviceBinding,
  isDeviceBound,
  getCompleteCustomerInfo,
  getBasicCustomerInfo
};
