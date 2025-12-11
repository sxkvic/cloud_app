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
      loadingText = '加载中...',
      minDuration = 600  // 全局 Loading 最小显示时长（0.6秒）
    } = options;

    // 构建完整URL
    // 对于以 /out 开头的URL（如开票服务），不添加 /node 前缀
    let fullUrl;
    if (url.startsWith('/out/')) {
      const baseUrl = 'https://www.chmura.cn';
      fullUrl = `${baseUrl}${url}`;
    } else {
      const apiBaseUrl = app.globalData.apiBaseUrl || 'https://your-api-domain.com';
      fullUrl = `${apiBaseUrl}${url}`;
    }

    // 构建请求头
    const header = {
      'Content-Type': 'application/json'
    };

    // 如果需要认证，添加token
    if (needAuth && app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`;
    }

    // 记录开始时间
    const startTime = Date.now();

    // 显示加载提示
    if (showLoading) {
      wx.showLoading({
        title: loadingText,
        mask: true
      });
    }

    // 隐藏 Loading 的辅助函数（确保最小显示时长）
    const hideLoadingWithMinDuration = async () => {
      if (showLoading) {
        const elapsed = Date.now() - startTime;
        const remaining = minDuration - elapsed;
        
        if (remaining > 0) {
          // 等待剩余时间
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
        
        wx.hideLoading();
      }
    };

    // 发起请求
    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: header,
      success: async (res) => {
        await hideLoadingWithMinDuration();

        // 统一处理响应
        if (res.statusCode === 200) {
          // 特殊处理开票服务接口（使用Code字段）
          if (url.includes('/invoice-service/')) {
            // 开票服务接口直接返回数据，由业务层判断成功失败
            resolve(res.data);
          } else if (res.data.success) {
            // 普通接口 - 业务成功
            resolve(res.data);
          } else {
            // 业务错误 - 提取错误信息（支持多种字段）
            const errorMsg = res.data.error || res.data.message || res.data.details || '操作失败';
            wx.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            });
            // 传递完整的错误对象，方便业务层提取信息
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
      fail: async (err) => {
        await hideLoadingWithMinDuration();

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

