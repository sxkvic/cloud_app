// pages/customer-service/customer-service.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: 0,
        faqList: [
            { id: 1, title: '宽带无法上网怎么办？', answer: '重启无线路由电源或拨打客服热线4009677726联系售后人员上门。', expanded: false },
            { id: 2, title: '如何修改我的WiFi密码？', answer: '不同的无线路由登录IP地址不一样，详情咨询客服。', expanded: false },
            { id: 3, title: '如何申请电子发票？', answer: '首页我的账单里面。', expanded: false },
            { id: 4, title: '无线路由猫指示灯亮红灯什么意思？', answer: '无信号或设备故障。', expanded: false }
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
        const faqList = this.data.faqList;
        
        // 切换当前项的展开状态
        faqList[index].expanded = !faqList[index].expanded;
        
        this.setData({ faqList });
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