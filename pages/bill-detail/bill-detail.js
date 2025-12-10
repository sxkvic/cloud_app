// pages/bill-detail/bill-detail.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');

Page({
  data: {
    billId: '',
    billDetail: null,
    loading: true
  },

  onLoad(options) {
    console.log('账单详情页面加载，参数:', options);
    if (options.id) {
      this.setData({ billId: options.id });
      this.loadBillDetail();
    } else {
      message.error('缺少账单ID');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载账单详情
  async loadBillDetail() {
    try {
      wx.showLoading({ title: '加载中...' });
      console.log('获取账单详情，ID:', this.data.billId);

      const result = await API.getCustomerBillDetail(this.data.billId);
      const billDetail = result.data;

      wx.hideLoading();
      console.log('账单详情:', billDetail);

      this.setData({
        billDetail: billDetail,
        loading: false
      });

    } catch (error) {
      wx.hideLoading();
      console.error('获取账单详情失败:', error);
      message.error('获取账单详情失败');
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 申请开票
  applyInvoice() {
    if (!this.data.billDetail) {
      message.error('账单信息未加载');
      return;
    }

    const billDetail = this.data.billDetail;
    
    // 跳转到开票申请页面，携带账单信息
    navigation.navigateTo(`/pages/invoice/invoice?bill_id=${billDetail.id}&bill_no=${billDetail.bill_no || billDetail.order_no}&amount=${billDetail.amount}`);
  }
});
