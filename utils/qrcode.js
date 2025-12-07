// utils/qrcode.js
// 二维码生成工具 - 使用专业的 weapp-qrcode 库

const QRCode = require('../libs/weapp-qrcode.js');

/**
 * 生成二维码
 * @param {String} canvasId - Canvas ID
 * @param {String} text - 要生成二维码的文本
 * @param {Object} options - 配置选项
 * @param {Number} options.width - 二维码宽度（默认 200）
 * @param {Number} options.height - 二维码高度（默认 200）
 * @param {String} options.colorDark - 前景色（默认 #000000）
 * @param {String} options.colorLight - 背景色（默认 #FFFFFF）
 * @param {Number} options.typeNumber - 二维码类型（默认 4）
 * @param {Object} context - 页面 this 上下文
 * @returns {Promise}
 */
function generateQRCode(canvasId, text, options = {}, context) {
  return new Promise((resolve, reject) => {
    try {
      // 延迟执行确保 Canvas 已渲染
      setTimeout(() => {
        // 根据内容长度自动选择合适的 typeNumber
        // typeNumber 范围: 1-40，数字越大容量越大
        let typeNumber = options.typeNumber || 10; // 默认使用10，支持更长内容
        
        // 如果内容特别长，使用更大的 typeNumber
        if (text.length > 200) {
          typeNumber = 15;
        }
        if (text.length > 300) {
          typeNumber = 20;
        }
        
        new QRCode({
          canvasId: canvasId,
          text: text,
          width: options.width || 200,
          height: options.height || 200,
          background: options.colorLight || '#FFFFFF',
          foreground: options.colorDark || '#000000',
          typeNumber: typeNumber,
          correctLevel: options.correctLevel || 1, // 改为M级别(1)，H级别(2)容量更小
          usingIn: context
        });
        
        // 延迟一下确保绘制完成
        setTimeout(() => {
          resolve();
        }, 100);
      }, 100);
    } catch (error) {
      console.error('二维码生成失败:', error);
      reject(error);
    }
  });
}

/**
 * 将文本转换为二维码图片
 * @param {String} canvasId - Canvas ID
 * @param {String} text - 要编码的文本
 * @param {Number} size - 二维码尺寸
 * @param {Object} context - 页面上下文
 * @returns {Promise<String>} - 返回图片临时路径
 */
function createQRCodeImage(canvasId, text, size = 200, context) {
  return new Promise(async (resolve, reject) => {
    try {
      // 生成二维码
      await generateQRCode(canvasId, text, { width: size, height: size }, context);

      // 延迟确保绘制完成
      setTimeout(() => {
        // 将 Canvas 转为图片
        const query = wx.createSelectorQuery().in(context);
        query
          .select(`#${canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0]) {
              reject(new Error('Canvas 节点未找到'));
              return;
            }

            const canvas = res[0].node;
            wx.canvasToTempFilePath({
              canvas: canvas,
              success: (res) => {
                resolve(res.tempFilePath);
              },
              fail: reject
            }, context);
          });
      }, 500);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 快速生成二维码（简化调用）
 * @param {Object} params - 参数对象
 * @param {String} params.canvasId - Canvas ID
 * @param {String} params.text - 二维码内容
 * @param {Number} params.size - 尺寸（默认 200）
 * @param {Object} params.context - 页面上下文
 * @returns {Promise}
 */
function drawQRCode(params) {
  const { canvasId, text, size = 200, context } = params;
  return generateQRCode(canvasId, text, { width: size, height: size }, context);
}

module.exports = {
  generateQRCode,
  createQRCodeImage,
  drawQRCode
};
