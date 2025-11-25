// pages/pre-recharge/pre-recharge.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const app = getApp();

Page({
    data: {
        deviceCode: 'DEV00845211', // 使用固定设备码
        rechargeAmount: '',
        paymentType: '1', // 支付类型：1-微信支付
        paymentMethod: '1', // 支付方式：1-直接支付, 2-二维码支付
        remark: '',
        isLoading: false,
        isLoadingCustomer: false, // 客户信息加载状态
        selectedAmount: null,
        quickAmounts: [50, 100, 150, 200, 300, 500],
        customerInfo: null, // 客户信息
        paymentMethods: [
            { value: '1', label: '微信直接支付', desc: '在小程序内直接支付' },
            { value: '2', label: '二维码支付', desc: '生成二维码扫码支付' }
        ]
    },

    onLoad() {
        console.log('预充值页面加载');
        // 获取全局设备码
        if (app.globalData.deviceCode) {
            this.setData({
                deviceCode: app.globalData.deviceCode
            });
        }
        // 加载客户信息
        this.loadCustomerInfo();
    },

    onShow() {
        console.log('预充值页面显示');
    },

    // 加载客户信息
    async loadCustomerInfo() {
        try {
            this.setData({ isLoadingCustomer: true });
            console.log('查询客户信息，设备码:', this.data.deviceCode);
            
            if (!this.data.deviceCode) {
                message.error('设备码未设置，请重新登录');
                return;
            }
            
            const result = await API.getCustomerByDeviceCode(this.data.deviceCode);
            console.log('客户信息查询成功:', result.data);
            
            // 存储完整的查询结果，包含customer、binding_info、device_info
            this.setData({
                customerInfo: result.data,
                isLoadingCustomer: false
            });
            
            // 显示客户基本信息（可选）
            if (result.data && result.data.customer) {
                console.log(`客户：${result.data.customer.customer_name}, 设备：${result.data.device_info.device_name}`);
            }
            
        } catch (error) {
            console.error('查询客户信息失败:', error);
            this.setData({ isLoadingCustomer: false });
            message.error('无法获取客户信息，请稍后重试');
        }
    },

    // 选择快捷金额
    selectQuickAmount(e) {
        const amount = e.currentTarget.dataset.amount;
        this.setData({
            selectedAmount: amount,
            rechargeAmount: amount.toString()
        });
        wx.vibrateShort(); // 触觉反馈
    },

    // 金额输入
    onAmountInput(e) {
        let value = e.detail.value;
        // 只允许数字和小数点
        value = value.replace(/[^\d.]/g, '');
        // 确保只有一个小数点
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        // 限制小数点后最多两位
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }

        this.setData({
            rechargeAmount: value,
            selectedAmount: value ? 'custom' : null
        });
    },

    // 备注输入
    onRemarkInput(e) {
        this.setData({
            remark: e.detail.value
        });
    },

    // 选择支付方式
    selectPaymentMethod(e) {
        const paymentMethod = e.currentTarget.dataset.type;
        this.setData({
            paymentMethod: paymentMethod
        });
        wx.vibrateShort(); // 触觉反馈
    },

    // 创建预充值订单
    async createRechargeOrder() {
        if (!this.data.rechargeAmount || parseFloat(this.data.rechargeAmount) <= 0) {
            message.error('请选择或输入充值金额');
            return;
        }

        if (!this.data.customerInfo) {
            message.error('客户信息未加载，请稍后重试');
            return;
        }

        this.setData({ isLoading: true });

        try {
            const customerData = this.data.customerInfo;
            const customer = customerData.customer;
            const deviceInfo = customerData.device_info;
            
            // 验证必要的数据
            if (!customer || !customer.id) {
                message.error('客户信息不完整，请重新加载');
                return;
            }
            
            if (!deviceInfo || !deviceInfo.id) {
                message.error('设备信息不完整，请重新加载');
                return;
            }
            
            const orderData = {
                orderType: 2, // 2=预充值
                device_no: this.data.deviceCode,
                package_id: '',
                customer_id: customer.id,
                device_id: deviceInfo.id,
                payment_type: this.data.paymentType, // 始终为1（微信支付）
                recharge_amount: parseFloat(this.data.rechargeAmount),
                remark: this.data.remark,
            };

            console.log('创建预充值订单参数:', orderData);
            console.log('客户信息:', customer.customer_name, '设备:', deviceInfo.device_name);

            // 先创建订单
            const orderResponse = await API.createPreRechargeOrder(orderData);
            console.log('订单创建成功:', orderResponse);

            if (orderResponse.data && orderResponse.data.order_no) {
                // 订单创建成功，直接进入支付流程
                console.log('订单创建成功，进入支付流程');
                this.handlePayment(orderResponse.data, customer, deviceInfo);
            } else {
                message.error('订单创建失败，请重试');
            }

        } catch (error) {
            console.error('创建订单失败:', error);
            message.error('创建订单失败，请重试');
        } finally {
            this.setData({ isLoading: false });
        }
    },

    // 支付处理函数
    async handlePayment(orderData, customerInfo, deviceInfo) {
        console.log('订单信息:', orderData);
        console.log('客户信息:', customerInfo);
        console.log('设备信息:', deviceInfo);
        console.log('支付方式:', this.data.paymentMethod);
        
        try {
            if (this.data.paymentMethod === '1') {
                // 微信直接支付（后续实现）
                await this.handleDirectPayment(orderData, customerInfo);
            } else if (this.data.paymentMethod === '2') {
                // 二维码支付
                await this.handleQRCodePayment(orderData, customerInfo);
            } else {
                message.error('请选择支付方式');
            }
        } catch (error) {
            console.error('支付处理失败:', error);
            message.error('支付处理失败，请重试');
        }
    },

    // 微信直接支付（预留）
    async handleDirectPayment(orderData, customerInfo) {
        // TODO: 后续实现微信直接支付
        message.info('微信直接支付功能将在后续版本中实现');
        this.resetForm();
    },

    // 二维码支付
    async handleQRCodePayment(orderData, customerInfo) {
        try {
            console.log('二维码支付数据:', orderData);
            
            if (orderData && orderData.qr_code_url) {
                // 直接使用订单返回的二维码链接
                const paymentInfo = {
                    qr_code_url: orderData.qr_code_url,
                    order_no: orderData.order_no,
                    amount: this.data.rechargeAmount,
                    subject: `预充值 - ${customerInfo.customer_name}`
                };
                
                this.showQRCodePayment(paymentInfo);
            } else {
                message.error('未获取到支付二维码，请重试');
            }
        } catch (error) {
            console.error('二维码支付失败:', error);
            message.error('二维码支付失败，请重试');
        }
    },

    // 显示二维码支付界面
    showQRCodePayment(paymentData) {
        const { qr_code_url, order_no, amount, subject } = paymentData;
        
        // 生成二维码
        wx.showModal({
            title: '微信扫码支付',
            content: `订单号：${order_no}\n支付金额：¥${amount}\n支付说明：${subject}\n\n请使用微信扫一扫下方二维码完成支付`,
            confirmText: '查看二维码',
            cancelText: '取消支付',
            success: (res) => {
                if (res.confirm) {
                    this.displayQRCode(qr_code_url, order_no);
                } else {
                    message.info('支付已取消');
                }
            }
        });
    },

    // 显示二维码
    displayQRCode(qrCodeUrl, orderNo) {
        wx.showLoading({ title: '生成二维码...' });
        
        // 跳转到二维码显示页面
        wx.navigateTo({
            url: `/pages/qrcode-payment/qrcode-payment?qrCodeUrl=${encodeURIComponent(qrCodeUrl)}&orderNo=${orderNo}&amount=${this.data.rechargeAmount}`,
            success: () => {
                wx.hideLoading();
                console.log('跳转到二维码支付页面成功');
            },
            fail: (error) => {
                wx.hideLoading();
                console.error('跳转失败:', error);
                // 降级到弹窗显示
                this.showQRCodeModal(qrCodeUrl, orderNo);
            }
        });
    },

    // 弹窗显示二维码（降级方案）
    showQRCodeModal(qrCodeUrl, orderNo) {
        wx.showModal({
            title: '微信扫码支付',
            content: `订单号：${orderNo}\n支付金额：¥${this.data.rechargeAmount}\n\n请使用微信扫一扫功能扫描二维码完成支付\n\n二维码内容：${qrCodeUrl}`,
            confirmText: '已扫码支付',
            cancelText: '取消支付',
            success: (res) => {
                if (res.confirm) {
                    this.startPaymentStatusCheck(orderNo);
                } else {
                    message.info('支付已取消');
                }
            }
        });
    },

    // 开始支付状态检查
    startPaymentStatusCheck(orderNo) {
        wx.showLoading({ title: '等待支付结果...' });
        
        let checkCount = 0;
        const maxChecks = 60; // 最多检查60次，每次3秒，总共180秒
        
        const checkInterval = setInterval(async () => {
            checkCount++;
            
            try {
                const result = await this.checkPaymentStatus(orderNo);
                if (result && result.success && result.data && result.data.status === 'paid') {
                    clearInterval(checkInterval);
                    wx.hideLoading();
                    
                    wx.showToast({
                        title: '支付成功',
                        icon: 'success',
                        duration: 2000
                    });
                    
                    this.onPaymentSuccess(orderNo);
                    this.resetForm();
                }
            } catch (error) {
                console.error('检查支付状态失败:', error);
            }
            
            if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
                wx.hideLoading();
                
                wx.showModal({
                    title: '支付状态确认',
                    content: '未能自动确认支付状态，请手动确认支付是否成功',
                    confirmText: '已支付',
                    cancelText: '未支付',
                    success: (res) => {
                        if (res.confirm) {
                            this.onPaymentSuccess(orderNo);
                            this.resetForm();
                        }
                    }
                });
            }
        }, 3000); // 每3秒检查一次
    },

    // 检查支付状态
    async checkPaymentStatus(orderNo) {
        try {
            const result = await API.checkPaymentStatus(orderNo);
            return result;
        } catch (error) {
            console.error('支付状态查询失败:', error);
            throw error;
        }
    },

    // 支付成功回调
    onPaymentSuccess(orderNo) {
        console.log('支付成功，订单号:', orderNo);
        message.success('充值成功！');
        // 可以在这里添加支付成功后的逻辑
        // 比如刷新余额、跳转到成功页面等
    },

    // 重置表单
    resetForm() {
        this.setData({
            rechargeAmount: '',
            selectedAmount: null,
            remark: ''
        });
    }

});