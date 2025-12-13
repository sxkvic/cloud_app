// pages/product-query/product-query.js
const { message } = require('../../utils/common');
const API = require('../../utils/api');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: 20,
        queryInput: '',
        isLoading: false,
        queryResult: null,
        showResult: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 适配刘海屏
        const sys = wx.getSystemInfoSync();
        this.setData({ statusBarHeight: sys.statusBarHeight });
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
     * 输入框内容变化
     */
    onInputChange(event) {
        this.setData({
            queryInput: event.detail.value
        });
    },

    /**
     * 提交查询表单
     */
    async onSubmit() {
        if (!this.data.queryInput.trim()) {
            message.error('请输入设备码或宽带账号');
            return;
        }
        
        this.setData({
            isLoading: true,
            showResult: false
        });

        try {
            console.log('查询设备信息:', this.data.queryInput);
            
            // 调用设备查询接口
            const response = await API.getDevicesList({
                page: 1,
                pageSize: 10,
                deviceNo: this.data.queryInput.trim()
            });

            console.log('查询结果:', response);

            if (response.data && response.data.list && response.data.list.length > 0) {
                this.setData({
                    queryResult: {
                        data: response.data.list,
                        total: response.data.total || response.data.list.length,
                        page: response.data.page || 1,
                        pageSize: response.data.pageSize || 10
                    },
                    showResult: true,
                    isLoading: false
                });
                message.success(`查询成功！找到 ${response.data.list.length} 条设备信息`);
            } else {
                this.setData({
                    queryResult: null,
                    showResult: false,
                    isLoading: false
                });
                message.info('未找到相关设备信息');
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
            queryInput: '',
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