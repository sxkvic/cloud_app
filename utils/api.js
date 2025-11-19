// utils/api.js
// API接口定义

const { request } = require('./request');

/**
 * API接口定义
 * 包含小程序需要的所有32个接口
 */
const API = {

  // ==================== 用户认证模块 ====================

  /**
   * 通过微信code获取openid
   * @param {String} code 微信登录code
   * @returns {Promise} { success, data: { openid }, message }
   */
  getOpenidByCode(code) {
    return request({
      url: '/api/v1/wx/getOpenidByCode',
      method: 'POST',
      data: { code },
      needAuth: false
    });
  },

  /**
   * 通过openid生成token
   * @param {String} openid 用户openid
   * @returns {Promise} { success, data: { token }, message }
   */
  generateTokenByOpenid(openid) {
    return request({
      url: '/api/v1/wx/generateTokenByOpenid',
      method: 'POST',
      data: { openid },
      needAuth: false
    });
  },

  /**
   * 创建用户并生成token
   * @param {Object} userData 用户数据
   * @param {String} userData.openid 用户openid
   * @param {String} userData.nickname 用户昵称
   * @param {String} userData.avatar 用户头像
   * @returns {Promise} { success, data: { token, userInfo }, message }
   */
  createUser(userData) {
    return request({
      url: '/api/v1/wx/createUser',
      method: 'POST',
      data: userData,
      needAuth: false
    });
  },

  /**
   * 获取用户信息
   * @returns {Promise} { success, data: { userInfo }, message }
   */
  getUserInfo() {
    return request({
      url: '/api/v1/wx/getUserInfo',
      method: 'GET',
      needAuth: true
    });
  },

  // ==================== 设备绑定模块 ====================

  /**
   * 绑定设备
   * @param {String} deviceCode 设备码（16位）
   * @returns {Promise} { success, data, message }
   */
  bindDevice(deviceCode) {
    return request({
      url: '/api/v1/wx/bindDevice',
      method: 'POST',
      data: { deviceCode },
      needAuth: true
    });
  },

  /**
   * 获取用户绑定的设备列表
   * @returns {Promise} { success, data: { devices }, message }
   */
  getUserDevices() {
    return request({
      url: '/api/v1/wx/getUserDevices',
      method: 'GET',
      needAuth: true
    });
  },

  /**
   * 解绑设备
   * @param {String} deviceCode 设备码
   * @returns {Promise} { success, data, message }
   */
  unbindDevice(deviceCode) {
    return request({
      url: '/api/v1/wx/unbindDevice',
      method: 'POST',
      data: { deviceCode },
      needAuth: true
    });
  },

  /**
   * 根据设备码查询客户信息
   * @param {String} deviceCode 设备码
   * @returns {Promise} { success, data: { customer }, message }
   */
  getCustomerByDeviceCode(deviceCode) {
    return request({
      url: `/api/v1/wx/getCustomerByDeviceCode/${deviceCode}`,
      method: 'GET',
      needAuth: true
    });
  },

  // ==================== 套餐管理模块 ====================

  /**
   * 获取套餐列表
   * @param {Object} params 查询参数
   * @param {String} params.status 套餐状态（可选）
   * @param {Number} params.page 页码（可选）
   * @param {Number} params.pageSize 每页数量（可选）
   * @returns {Promise} { success, data: { packages, total }, message }
   */
  getPackagesList(params = {}) {
    return request({
      url: '/api/v1/wx/packages/getPackagesList',
      method: 'GET',
      data: params,
      needAuth: false
    });
  },

  /**
   * 获取套餐详情
   * @param {String} id 套餐ID
   * @returns {Promise} { success, data: { package }, message }
   */
  getPackageDetail(id) {
    return request({
      url: `/api/v1/wx/packages/getPackageDetail/${id}`,
      method: 'GET',
      needAuth: false
    });
  },

  /**
   * 创建订单
   * @param {Object} orderData 订单数据
   * @param {String} orderData.packageId 套餐ID
   * @param {String} orderData.packageName 套餐名称
   * @param {Number} orderData.amount 订单金额
   * @param {String} orderData.remark 备注（可选）
   * @returns {Promise} { success, data: { orderId, orderNo }, message }
   */
  createOrder(orderData) {
    return request({
      url: '/api/v1/wx/orders',
      method: 'POST',
      data: orderData,
      needAuth: true
    });
  },

  // ==================== 账单管理模块 ====================

  /**
   * 获取账单列表
   * @param {Object} params 查询参数
   * @param {Number} params.page 页码（可选）
   * @param {Number} params.pageSize 每页数量（可选）
   * @param {String} params.status 账单状态（可选）
   * @returns {Promise} { success, data: { bills, total }, message }
   */
  getCustomerBillList(params = {}) {
    return request({
      url: '/api/v1/wx/customerBill/getCustomerBillList',
      method: 'GET',
      data: params,
      needAuth: true
    });
  },

  /**
   * 获取账单详情
   * @param {String} id 账单ID
   * @returns {Promise} { success, data: { bill }, message }
   */
  getCustomerBillDetail(id) {
    return request({
      url: `/api/v1/wx/customerBill/getCustomerBillDetail/${id}`,
      method: 'GET',
      needAuth: true
    });
  },

  // ==================== 支付功能模块 ====================

  /**
   * 创建小程序支付订单
   * @param {Object} paymentData 支付数据
   * @param {Number} paymentData.amount 支付金额（单位：元）
   * @param {String} paymentData.description 支付描述
   * @param {String} paymentData.openid 用户openid
   * @param {String} paymentData.order_id 关联订单ID（可选）
   * @returns {Promise} { success, data: { order_no, jsapi_params }, message }
   */
  createMiniprogramPayment(paymentData) {
    return request({
      url: '/api/v1/wx/miniprogram/pay',
      method: 'POST',
      data: paymentData,
      needAuth: true
    });
  },

  /**
   * 查询支付状态（增强版）
   * @param {Object} params 查询参数
   * @param {String} params.order_no 支付订单号
   * @returns {Promise} { success, data: { status, transaction_id, ... }, message }
   */
  getPaymentStatus(params) {
    return request({
      url: '/api/v1/wx/payments/status/enhanced',
      method: 'GET',
      data: params,
      needAuth: true
    });
  },

  /**
   * 取消支付
   * @param {Object} data 取消数据
   * @param {String} data.order_no 支付订单号
   * @param {String} data.reason 取消原因（可选）
   * @returns {Promise} { success, data, message }
   */
  cancelPayment(data) {
    return request({
      url: '/api/v1/wx/payments/cancel',
      method: 'POST',
      data: data,
      needAuth: true
    });
  },

  // ==================== 开票管理模块 ====================

  /**
   * 获取可开票订单列表
   * @param {Object} params 查询参数
   * @param {Number} params.page 页码（可选）
   * @param {Number} params.limit 每页数量（可选）
   * @param {Number} params.invoice_status 开票状态（1:未开票, 2:已开票）
   * @returns {Promise} { success, data: { invoices, total }, message }
   */
  getInvoiceList(params = {}) {
    return request({
      url: '/api/v1/invoices/getInvoiceList',
      method: 'GET',
      data: params,
      needAuth: true
    });
  },

  /**
   * 创建或更新开票信息
   * @param {Object} invoiceInfo 开票信息
   * @param {String} invoiceInfo.customer_name 客户名称
   * @param {String} invoiceInfo.invoice_title 发票抬头
   * @param {String} invoiceInfo.invoice_type 发票类型（个人/企业）
   * @param {String} invoiceInfo.taxpayer_id 纳税人识别号
   * @param {String} invoiceInfo.address 地址
   * @param {String} invoiceInfo.phone 电话
   * @param {String} invoiceInfo.bank_name 开户银行（可选）
   * @param {String} invoiceInfo.bank_account 银行账号（可选）
   * @returns {Promise} { success, data: { id }, message }
   */
  createOrUpdateInvoiceInfo(invoiceInfo) {
    return request({
      url: '/api/v1/invoices/invoice-info/createOrUpdateInvoiceInfo',
      method: 'POST',
      data: invoiceInfo,
      needAuth: true
    });
  },

  /**
   * 为订单创建发票
   * @param {String} orderId 订单ID
   * @param {Object} invoiceData 发票数据
   * @param {String} invoiceData.invoice_title 发票抬头
   * @param {String} invoiceData.taxpayer_id 纳税人识别号
   * @param {String} invoiceData.invoice_type 发票类型
   * @param {String} invoiceData.address 地址（可选）
   * @param {String} invoiceData.phone 电话（可选）
   * @param {String} invoiceData.bank_name 开户银行（可选）
   * @param {String} invoiceData.bank_account 银行账号（可选）
   * @returns {Promise} { success, data: { invoiceId }, message }
   */
  createInvoiceForOrder(orderId, invoiceData) {
    return request({
      url: `/api/v1/invoices/create/${orderId}`,
      method: 'POST',
      data: invoiceData,
      needAuth: true
    });
  },

  /**
   * 根据设备号获取开票信息
   * @param {String} deviceNo 设备号
   * @returns {Promise} { success, data: { invoiceInfo }, message }
   */
  getInvoiceInfoByDevice(deviceNo) {
    return request({
      url: `/api/v1/invoices/invoice-info/device/${deviceNo}`,
      method: 'GET',
      needAuth: true
    });
  },

  // ==================== 订单管理模块 ====================

  /**
   * 查询订单列表
   * @param {Object} params 查询参数
   * @param {Number} params.page 页码（可选）
   * @param {Number} params.pageSize 每页数量（可选）
   * @param {String} params.status 订单状态（可选）
   * @returns {Promise} { success, data: { orders, total }, message }
   */
  getOrdersList(params = {}) {
    return request({
      url: '/api/v1/wx/orders',
      method: 'GET',
      data: params,
      needAuth: true
    });
  },

  /**
   * 获取订单详情
   * @param {String} id 订单ID
   * @returns {Promise} { success, data: { order }, message }
   */
  getOrderDetail(id) {
    return request({
      url: `/api/v1/wx/orders/${id}`,
      method: 'GET',
      needAuth: true
    });
  },

  // ==================== 工具类接口模块 ====================

  /**
   * 获取省份列表
   * @returns {Promise} { success, data: { provinces }, message }
   */
  getProvinces() {
    return request({
      url: '/api/v1/tools/provinces',
      method: 'GET',
      needAuth: false
    });
  },

  /**
   * 获取城市列表
   * @param {String} provinceId 省份ID
   * @returns {Promise} { success, data: { cities }, message }
   */
  getCities(provinceId) {
    return request({
      url: `/api/v1/tools/provinces/${provinceId}/cities`,
      method: 'GET',
      needAuth: false
    });
  },

  /**
   * 获取区县列表
   * @param {String} cityId 城市ID
   * @returns {Promise} { success, data: { districts }, message }
   */
  getDistricts(cityId) {
    return request({
      url: `/api/v1/tools/cities/${cityId}/districts`,
      method: 'GET',
      needAuth: false
    });
  },

  /**
   * 获取街道列表
   * @param {String} districtId 区县ID
   * @returns {Promise} { success, data: { streets }, message }
   */
  getStreets(districtId) {
    return request({
      url: `/api/v1/tools/districts/${districtId}/streets`,
      method: 'GET',
      needAuth: false
    });
  },

  /**
   * 获取社区列表
   * @param {String} streetId 街道ID
   * @returns {Promise} { success, data: { communities }, message }
   */
  getCommunities(streetId) {
    return request({
      url: `/api/v1/tools/streets/${streetId}/communities`,
      method: 'GET',
      needAuth: false
    });
  },

  /**
   * 获取Banner列表
   * @param {Number} position 位置参数（1=首页）
   * @returns {Promise} { success, data: { banners }, message }
   */
  getBannersList(position = 1) {
    return request({
      url: '/api/v1/tools/getBannersList',
      method: 'GET',
      data: { position },
      needAuth: true  // API要求管理员权限，但小程序会发送用户token尝试
    });
  },

  /**
   * 获取推文列表
   * @param {Object} params 查询参数（可选）
   * @returns {Promise} { success, data: { articles }, message }
   */
  getArticlesList(params = {}) {
    return request({
      url: '/api/v1/tools/getArticlesList',
      method: 'GET',
      data: params,
      needAuth: false  // 不需要认证（公开接口）
    });
  },

  /**
   * 获取推文详情
   * @param {String} id 推文ID
   * @returns {Promise} { success, data: { article }, message }
   */
  getArticleDetail(id) {
    return request({
      url: `/api/v1/tools/getArticleDetail/${id}`,
      method: 'GET',
      needAuth: false  // 不需要认证（公开接口）
    });
  },

  /**
   * 下载文件
   * @param {String} fileId 文件ID
   * @returns {Promise} { success, data: { fileUrl }, message }
   */
  downloadFile(fileId) {
    return request({
      url: `/api/v1/tools/files/download/${fileId}`,
      method: 'GET',
      needAuth: false
    });
  },

  /**
   * 获取运营商列表
   * @returns {Promise} { success, data: { operators }, message }
   */
  getOperatorsList() {
    return request({
      url: '/api/v1/tools/getOperatorsList',
      method: 'GET',
      needAuth: false
    });
  }
};

module.exports = API;

