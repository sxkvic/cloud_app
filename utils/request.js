// utils/request.js
// 统一网络请求封装

const app = getApp();

/**
 * 统一网络请求封装
 * @param {Object} options 请求配置
 * @param {String} options.url 请求路径（相对路径，如 '/api/login'）
 * @param {String} options.method 请求方法（GET/POST/PUT/DELETE）
 * @param {Object} options.data 请求参数
 * @param {Boolean} options.needAuth 是否需要认证（默认true）
 * @param {Boolean} options.showLoading 是否显示加载提示（默认true）
 * @param {String} options.loadingText 加载提示文字（默认"加载中..."）
 * @returns {Promise}
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data = {},
      needAuth = true,
      showLoading = true,
      loadingText = '加载中...'
    } = options;

    // 构建完整URL
    const apiBaseUrl = app.globalData.apiBaseUrl || 'https://your-api-domain.com';
    const fullUrl = `${apiBaseUrl}${url}`;

    // 构建请求头
    const header = {
      'Content-Type': 'application/json'
    };

    // 如果需要认证，添加token
    if (needAuth && app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`;
    }

    // 显示加载提示
    if (showLoading) {
      wx.showLoading({
        title: loadingText,
        mask: true
      });
    }

    // 发起请求
    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: header,
      success: (res) => {
        if (showLoading) {
          wx.hideLoading();
        }

        // 统一处理响应
        if (res.statusCode === 200) {
          if (res.data.success) {
            // 业务成功
            resolve(res.data);
          } else {
            // 业务错误
            wx.showToast({
              title: res.data.message || '操作失败',
              icon: 'none',
              duration: 2000
            });
            reject(res.data);
          }
        } else if (res.statusCode === 401) {
          // token过期或未登录
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          });

          // 清除token和用户信息
          app.globalData.token = null;
          app.globalData.userInfo = null;
          app.globalData.isLoggedIn = false;
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');

          // 跳转到登录页
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/login'
            });
          }, 2000);

          reject({ message: '登录已过期' });
        } else if (res.statusCode === 403) {
          // 权限不足
          wx.showToast({
            title: '权限不足',
            icon: 'none',
            duration: 2000
          });
          reject({ message: '权限不足' });
        } else if (res.statusCode === 404) {
          // 资源不存在
          wx.showToast({
            title: '请求的资源不存在',
            icon: 'none',
            duration: 2000
          });
          reject({ message: '资源不存在' });
        } else if (res.statusCode >= 500) {
          // 服务器错误
          wx.showToast({
            title: '服务器错误，请稍后重试',
            icon: 'none',
            duration: 2000
          });
          reject({ message: '服务器错误' });
        } else {
          // 其他HTTP错误
          wx.showToast({
            title: `请求失败 (${res.statusCode})`,
            icon: 'none',
            duration: 2000
          });
          reject(res);
        }
      },
      fail: (err) => {
        if (showLoading) {
          wx.hideLoading();
        }

        // 网络错误
        wx.showToast({
          title: '网络连接失败，请检查网络',
          icon: 'none',
          duration: 2000
        });

        console.error('网络请求失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * GET请求快捷方法
 */
function get(url, data = {}, options = {}) {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  });
}

/**
 * POST请求快捷方法
 */
function post(url, data = {}, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  });
}

/**
 * PUT请求快捷方法
 */
function put(url, data = {}, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  });
}

/**
 * DELETE请求快捷方法
 */
function del(url, data = {}, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  del
};

