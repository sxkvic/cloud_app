// utils/share.js
// 全局分享配置工具

const app = getApp();

/**
 * 获取默认分享配置
 * @param {Object} options 自定义配置
 * @param {String} options.title 分享标题
 * @param {String} options.path 分享路径
 * @param {String} options.imageUrl 分享图片URL
 * @returns {Object} 分享配置对象
 */
function getShareConfig(options = {}) {
  const defaultImageUrl = '/images/share.png';
  
  return {
    title: options.title || '云宽带 - 智能网络管理',
    path: options.path || '/pages/splash/splash',
    imageUrl: options.imageUrl || defaultImageUrl
  };
}

/**
 * 获取分享到朋友圈配置
 * @param {Object} options 自定义配置
 * @param {String} options.title 分享标题
 * @param {String} options.query 查询参数
 * @param {String} options.imageUrl 分享图片URL
 * @returns {Object} 分享配置对象
 */
function getTimelineShareConfig(options = {}) {
  const defaultImageUrl = '/images/share.png';
  
  return {
    title: options.title || '云宽带 - 智能网络管理',
    query: options.query || '',
    imageUrl: options.imageUrl || defaultImageUrl
  };
}

/**
 * 启用分享功能（显示分享菜单）
 * 在页面的 onLoad 或 onShow 中调用
 */
function enableShare() {
  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  });
}

/**
 * 为页面添加默认分享功能
 * 在 Page() 配置中使用
 * @param {Object} pageConfig 页面配置对象
 * @returns {Object} 添加了分享功能的页面配置
 */
function withShare(pageConfig) {
  const originalOnLoad = pageConfig.onLoad;
  const originalOnShareAppMessage = pageConfig.onShareAppMessage;
  const originalOnShareTimeline = pageConfig.onShareTimeline;

  // 重写 onLoad，添加分享菜单显示
  pageConfig.onLoad = function(options) {
    // 显示分享菜单
    enableShare();
    
    // 调用原始的 onLoad
    if (originalOnLoad) {
      originalOnLoad.call(this, options);
    }
  };

  // 如果没有定义 onShareAppMessage，添加默认的
  if (!originalOnShareAppMessage) {
    pageConfig.onShareAppMessage = function() {
      return getShareConfig();
    };
  }

  // 如果没有定义 onShareTimeline，添加默认的
  if (!originalOnShareTimeline) {
    pageConfig.onShareTimeline = function() {
      return getTimelineShareConfig();
    };
  }

  return pageConfig;
}

module.exports = {
  getShareConfig,
  getTimelineShareConfig,
  enableShare,
  withShare
};
