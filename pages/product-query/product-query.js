// pages/product-query/product-query.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        queryInput: '',
        isLoading: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

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
     * 用户点击右上角分享
     */
    onShareAppMessage() {

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
    onSubmit() {
        if (!this.data.queryInput.trim()) {
            wx.showToast({
                title: '请输入设备码或宽带账号',
                icon: 'none'
            });
            return;
        }
        
        this.setData({
            isLoading: true
        });

        console.log('Querying for:', this.data.queryInput);

        // 模拟查询请求
        setTimeout(() => {
            this.setData({
                isLoading: false
            });
            
            wx.showToast({
                title: '查询成功！',
                icon: 'success'
            });
        }, 1500);
    },

    /**
     * 显示帮助信息
     */
    showHelp() {
        wx.showModal({
            title: '如何找到我的设备码？',
            content: '1. 查看光猫设备上的标签\n2. 查看路由器背面的标识\n3. 查看宽带安装时提供的单据\n4. 联系客服获取设备码',
            showCancel: false,
            confirmText: '知道了'
        });
    }
})