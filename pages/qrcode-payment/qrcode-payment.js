// pages/qrcode-payment/qrcode-payment.js
const { message } = require('../../utils/common');

Page({
    data: {
        qrCodeUrl: '',
        orderNo: '',
        amount: '',
        qrCodeImageData: '',
        isLoading: true
    },

    onLoad(options) {
        console.log('二维码支付页面加载', options);
        
        if (options.qrCodeUrl && options.orderNo && options.amount) {
            this.setData({
                qrCodeUrl: decodeURIComponent(options.qrCodeUrl),
                orderNo: options.orderNo,
                amount: options.amount
            });
            
            // 生成二维码
            this.generateQRCode();
        } else {
            message.error('参数错误');
            wx.navigateBack();
        }
    },

    // 生成二维码
    generateQRCode() {
        wx.showLoading({ title: '生成二维码...' });
        
        try {
            // 使用小程序API生成二维码
            // 这里使用简化的方式，实际项目中可以使用 weapp-qrcode 等库
            const query = wx.createSelectorQuery();
            query.select('#qrcode-canvas')
                .fields({ node: true, size: true })
                .exec((res) => {
                    if (res[0]) {
                        const canvas = res[0].node;
                        const ctx = canvas.getContext('2d');
                        
                        // 设置canvas尺寸
                        const dpr = wx.getSystemInfoSync().pixelRatio;
                        canvas.width = 200 * dpr;
                        canvas.height = 200 * dpr;
                        ctx.scale(dpr, dpr);
                        
                        // 这里应该使用二维码生成库
                        // 暂时显示文本提示
                        ctx.fillStyle = '#f0f0f0';
                        ctx.fillRect(0, 0, 200, 200);
                        
                        ctx.fillStyle = '#333';
                        ctx.font = '12px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('二维码生成中...', 100, 90);
                        ctx.fillText('请扫描下方链接', 100, 110);
                        
                        wx.hideLoading();
                        this.setData({ isLoading: false });
                        
                        // 实际项目中这里应该调用二维码生成库
                        console.log('需要生成二维码的内容:', this.data.qrCodeUrl);
                    } else {
                        wx.hideLoading();
                        this.setData({ isLoading: false });
                        message.error('二维码生成失败');
                    }
                });
        } catch (error) {
            wx.hideLoading();
            this.setData({ isLoading: false });
            console.error('生成二维码失败:', error);
            message.error('二维码生成失败');
        }
    },

    // 复制二维码链接
    copyQRCodeUrl() {
        wx.setClipboardData({
            data: this.data.qrCodeUrl,
            success: () => {
                wx.showToast({
                    title: '链接已复制',
                    icon: 'success'
                });
            },
            fail: () => {
                message.error('复制失败');
            }
        });
    },

    // 已完成支付
    onPaymentCompleted() {
        wx.showModal({
            title: '支付确认',
            content: '请确认您已完成支付',
            confirmText: '已支付',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    // 返回上一页并传递支付完成信息
                    const pages = getCurrentPages();
                    const prevPage = pages[pages.length - 2];
                    if (prevPage && prevPage.startPaymentStatusCheck) {
                        prevPage.startPaymentStatusCheck(this.data.orderNo);
                    }
                    wx.navigateBack();
                }
            }
        });
    },

    // 取消支付
    onPaymentCancel() {
        wx.showModal({
            title: '取消支付',
            content: '确定要取消支付吗？',
            confirmText: '确定',
            cancelText: '继续支付',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateBack();
                }
            }
        });
    }
});
