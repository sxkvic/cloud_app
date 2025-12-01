// pages/customer-service/customer-service.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: 0,
        faqList: [
            { id: 1, title: '宽带无法上网怎么办？' },
            { id: 2, title: '如何修改我的WiFi密码？' },
            { id: 3, title: '如何申请电子发票？' },
            { id: 4, title: '光猫指示灯亮红灯什么意思？' }
        ]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 获取系统信息，设置状态栏高度
        const systemInfo = wx.getSystemInfoSync();
        this.setData({
            statusBarHeight: systemInfo.statusBarHeight
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
     * 返回按钮
     */
    handleBack() {
        const pages = getCurrentPages();
        if (pages.length > 1) {
            wx.navigateBack();
        } else {
            wx.switchTab({
                url: '/pages/home/home'
            });
        }
    },

    /**
     * 拨打热线电话
     */
    handleCall() {
        wx.makePhoneCall({
            phoneNumber: '4009677726',
            success: function() {
                console.log("拨打成功");
            },
            fail: function() {
                console.log("拨打取消或失败");
            }
        });
    },

    /**
     * 点击常见问题
     */
    onFaqTap(e) {
        const index = e.currentTarget.dataset.index;
        const item = this.data.faqList[index];
        
        // 实际场景：跳转到具体的文章页面
        wx.showModal({
            title: '问题详情',
            content: `您点击了：${item.title}\n此处应跳转至具体解决方案页面。`,
            showCancel: false,
            confirmText: '知道了',
            confirmColor: '#2979ff'
        });
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        const app = getApp();
        const shareImageUrl = `${app.globalData.apiBaseUrl}/api/v1/files/download/93`;
        
        return {
            title: '客户服务中心 - 云宽带',
            path: '/pages/customer-service/customer-service',
            imageUrl: shareImageUrl
        };
    }
})