// pages/customer-service/customer-service.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        activeFaq: [],
        faqList: [
            {
                title: '宽带无法上网怎么办？',
                content: '1. 请检查您的光猫（Modem）和路由器电源是否接通，指示灯是否正常。\n2. 尝试重启光猫和路由器（断电30秒后重新通电）。\n3. 检查网线是否松动或损坏。\n4. 如以上操作无效，请联系在线客服进行线路检测。'
            },
            {
                title: '如何修改我的WiFi密码？',
                content: '您可以通过本小程序内的"智能家居"或"路由器管理"功能进行修改。如果您的设备不支持此功能，请在电脑或手机浏览器地址栏输入路由器的管理地址（通常为192.168.1.1或192.168.0.1），登录后进入无线设置进行修改。'
            },
            {
                title: '如何申请电子发票？',
                content: '请返回首页，点击"开票"功能，选择您需要开具发票的账单，填写抬头信息后即可申请。电子发票将发送到您预留的电子邮箱。'
            }
        ]
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
     * 开始在线客服对话
     */
    startChat() {
        wx.showToast({
            title: '正在连接在线客服...',
            icon: 'loading',
            duration: 2000
        });
        
        // 这里可以添加跳转到聊天页面的逻辑
        // wx.navigateTo({
        //     url: '/pages/chat/chat'
        // });
    },

    /**
     * 拨打电话
     */
    makeCall() {
        wx.makePhoneCall({
            phoneNumber: '10086-8-1',
            fail: function() {
                wx.showToast({
                    title: '拨打电话失败',
                    icon: 'error'
                });
            }
        });
    },

    /**
     * 常见问题折叠面板变化
     */
    onFaqChange(event) {
        this.setData({
            activeFaq: event.detail
        });
    }
})