// pages/product-query/product-query.js
const { message } = require('../../utils/common');
const API = require('../../utils/api');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: 20,
        deviceNo: '',
        rechargeAccount: '',
        isLoading: false,
        queryResult: null,
        showResult: false,
        historyList: [],
        showHistory: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 适配刘海屏
        const sys = wx.getSystemInfoSync();
        this.setData({ statusBarHeight: sys.statusBarHeight });
        
        // 加载历史记录
        this.loadHistory();
    },

    /**
     * 加载历史查询记录
     */
    loadHistory() {
        try {
            const history = wx.getStorageSync('product_query_history') || [];
            this.setData({ historyList: history });
            
            // 如果有历史记录，自动填充最近一条
            if (history.length > 0) {
                const latest = history[0];
                this.setData({
                    deviceNo: latest.deviceNo || '',
                    rechargeAccount: latest.rechargeAccount || ''
                });
            }
        } catch (e) {
            console.error('加载历史记录失败:', e);
        }
    },

    /**
     * 保存查询记录到历史
     */
    saveToHistory(deviceNo, rechargeAccount, customerName) {
        try {
            let history = wx.getStorageSync('product_query_history') || [];
            
            // 检查是否已存在相同记录
            const existIndex = history.findIndex(item => 
                item.deviceNo === deviceNo && item.rechargeAccount === rechargeAccount
            );
            
            // 如果存在，先移除旧记录
            if (existIndex > -1) {
                history.splice(existIndex, 1);
            }
            
            // 添加新记录到开头
            history.unshift({
                deviceNo,
                rechargeAccount,
                customerName: customerName || '未知客户',
                time: new Date().toLocaleString()
            });
            
            // 最多保留10条记录
            if (history.length > 10) {
                history = history.slice(0, 10);
            }
            
            wx.setStorageSync('product_query_history', history);
            this.setData({ historyList: history });
        } catch (e) {
            console.error('保存历史记录失败:', e);
        }
    },

    /**
     * 选择历史记录并自动查询
     */
    selectHistory(e) {
        const index = e.currentTarget.dataset.index;
        const item = this.data.historyList[index];
        if (!item) return;
        
        this.setData({
            deviceNo: item.deviceNo,
            rechargeAccount: item.rechargeAccount
        }, () => {
            // 自动触发查询
            this.onSubmit();
        });
    },

    /**
     * 清空历史记录
     */
    clearHistory() {
        wx.showModal({
            title: '提示',
            content: '确定要清空所有历史记录吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.removeStorageSync('product_query_history');
                    this.setData({ historyList: [], showHistory: false });
                    message.success('历史记录已清空');
                }
            }
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 设备码输入变化
     */
    onDeviceNoChange(event) {
        this.setData({
            deviceNo: event.detail.value
        });
    },

    /**
     * 缴费账号输入变化
     */
    onRechargeAccountChange(event) {
        this.setData({
            rechargeAccount: event.detail.value
        });
    },

    /**
     * 提交查询表单
     */
    async onSubmit() {
        const deviceNo = this.data.deviceNo.trim();
        const rechargeAccount = this.data.rechargeAccount.trim();
        
        if (!deviceNo) {
            message.error('请输入设备编码');
            return;
        }
        if (!rechargeAccount) {
            message.error('请输入缴费账号');
            return;
        }
        
        this.setData({
            isLoading: true,
            showResult: false
        });

        try {
            console.log('查询客户信息:', { deviceNo, rechargeAccount });
            
            // 调用客户和套餐查询接口
            const response = await API.getCustomerAndPackageByDeviceNo(deviceNo, rechargeAccount);

            console.log('查询结果:', response);

            if (response.success && response.data) {
                const { customer, device, package: pkg, account, binding_info } = response.data;
                
                // 计算总余额
                const balance = parseFloat(account?.balance) || 0;
                const rechargeAmount = parseFloat(account?.recharge_amount) || 0;
                const totalBalance = (balance + rechargeAmount).toFixed(2);
                
                this.setData({
                    queryResult: {
                        customer,
                        device,
                        package: pkg,
                        account,
                        binding_info,
                        totalBalance
                    },
                    showResult: true,
                    isLoading: false
                });
                
                // 保存到历史记录
                this.saveToHistory(deviceNo, rechargeAccount, customer?.customer_name);
                message.success('查询成功');
            } else {
                this.setData({
                    queryResult: null,
                    showResult: false,
                    isLoading: false
                });
                message.info(response.message || '未找到相关信息');
            }
        } catch (error) {
            console.error('查询失败:', error);
            this.setData({
                isLoading: false,
                showResult: false
            });
            message.error('查询失败，请重试');
        }
    },

    /**
     * 重新查询
     */
    resetQuery() {
        this.setData({
            deviceNo: '',
            rechargeAccount: '',
            queryResult: null,
            showResult: false
        });
    },

    /**
     * 返回上一页
     */
    handleBack() {
        const pages = getCurrentPages();
        if (pages.length > 1) {
            // 有上一页，正常返回
            wx.navigateBack();
        } else {
            // 没有上一页，跳转到首页
            wx.switchTab({
                url: '/pages/home/home'
            });
        }
    },

    /**
     * 复制 SN 码
     */
    handleCopy(e) {
        const text = e.currentTarget.dataset.text;
        wx.setClipboardData({
            data: text,
            success: () => {
                wx.showToast({ title: '已复制 SN', icon: 'none' });
            }
        });
    },

    /**
     * 显示帮助信息
     */
    showHelp() {
        wx.showModal({
            title: '如何找到我的设备码？',
            content: '1. 查看无线路由猫设备上的标签\n2. 查看无线路由猫背面的标识\n3. 查看工作人员安装时提供的单据\n4. 联系客服获取设备码',
            showCancel: false,
            confirmText: '知道了'
        });
    }
})