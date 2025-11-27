// pages/my-bill/my-bill.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');

Page({
  data: {
    bills: [],
    loading: true,
    deviceCode: '',              // 设备编号，从缓存读取
    customerInfo: null,          // 客户信息
    billDetail: null,            // 当前账单详情
    showDetail: false            // 是否显示详情页面
  },

  async onLoad() {
    console.log('我的账单页面加载');
    
    // 从本地缓存读取设备编号
    const device_no = wx.getStorageSync('device_no') || wx.getStorageSync('deviceCode');
    
    if (!device_no) {
      message.error('未找到设备信息，请先绑定设备');
      setTimeout(() => {
        navigation.navigateTo('/pages/bind-device-code/bind-device-code');
      }, 1500);
      return;
    }
    
    this.setData({ deviceCode: device_no });
    console.log('读取到设备编号:', device_no);
    
    await this.loadCustomerInfo();
    await this.loadBills();
  },

  async onShow() {
    console.log('我的账单页面显示');
    await this.loadBills();
  },

  // 加载客户信息
  async loadCustomerInfo() {
    try {
      console.log('查询客户信息，设备码:', this.data.deviceCode);
      
      const result = await API.getCustomerByDeviceCode(this.data.deviceCode);
      console.log('客户信息查询成功:', result.data);
      
      this.setData({
        customerInfo: result.data.customer || result.data
      });
      
    } catch (error) {
      console.error('查询客户信息失败:', error);
      message.error('无法获取客户信息');
    }
  },

  // 加载账单列表
  async loadBills() {
    try {
      this.setData({ loading: true });
      console.log('开始加载账单列表，设备号:', this.data.deviceCode);

      // 使用设备号查询账单列表
      const result = await API.getBillList({
        page: 1,
        pageSize: 20,
        device_no: this.data.deviceCode,
        customer_name: '',
        bill_no: ''
      });
      
      console.log('账单列表加载成功:', result.data);

      // 转换数据格式
      const billsList = result.data.list || result.data.bills || result.data || [];
      const bills = billsList.map(bill => ({
        id: bill.id,
        billNo: bill.bill_no || bill.order_no,
        title: bill.package_name || '宽带月费',
        date: bill.created_at || bill.billing_start_date,
        period: bill.billing_start_date && bill.billing_end_date 
          ? `${bill.billing_start_date} 至 ${bill.billing_end_date}` 
          : '月度账单',
        amount: `¥${parseFloat(bill.amount).toFixed(2)}`,
        status: bill.bill_status == 1 ? 'paid' : 'pending',
        statusText: bill.bill_status == 1 ? '已缴费' : '待缴费'
      }));

      this.setData({
        bills: bills,
        loading: false
      });

    } catch (error) {
      console.error('加载账单失败:', error);
      this.setData({ loading: false });

      // 如果加载失败，使用默认账单数据
      message.error('加载账单失败，显示默认数据');
      this.setData({
        bills: [
          {
            id: '60',
            billNo: 'ZD202511214029561',
            title: '测试包年卡998',
            date: '2025-11-21',
            period: '2025-11-21 至 2026-11-21',
            amount: '¥998.00',
            status: 'pending',
            statusText: '待缴费'
          }
        ]
      });
    }
  },

  // 充值缴费
  recharge() {
    message.success('跳转到充值页面');
    navigation.navigateTo('/pages/pre-recharge/pre-recharge');
  },

  // 查看历史账单
  viewHistory() {
    message.success('查看历史账单');
    // 这里可以跳转到详细的历史账单页面
    wx.showModal({
      title: '历史账单',
      content: '您想查看哪个时间段的历史账单？',
      confirmText: '近6个月',
      cancelText: '近1年',
      success: (res) => {
        if (res.confirm) {
          this.loadHistoryBills('6months');
        } else {
          this.loadHistoryBills('1year');
        }
      }
    });
  },

  // 下载账单
  downloadBill() {
    wx.showLoading({
      title: '准备下载...'
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '下载账单',
        content: '账单PDF文件已生成，是否下载到本地？',
        confirmText: '下载',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            message.success('账单已保存到本地');
          }
        }
      });
    }, 1500);
  },

  // 查看账单详情
  viewBillDetail(e) {
    const billId = e.currentTarget.dataset.id;

    if (!billId) {
      message.error('账单ID无效');
      return;
    }

    console.log('跳转到账单详情页，ID:', billId);
    
    // 跳转到详情页面
    navigation.navigateTo(`/pages/bill-detail/bill-detail?id=${billId}`);
  },

  // 查看全部账单
  viewAllBills() {
    message.success('查看全部账单');
    // 这里可以跳转到完整的账单列表页面
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00\n\n您也可以在线咨询客服。',
      confirmText: '在线咨询',
      cancelText: '拨打电话',
      success: (res) => {
        if (res.confirm) {
          message.success('正在为您转接在线客服...');
        } else {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567'
          });
        }
      }
    });
  },

  // 立即缴费
  payNow() {
    const pendingBills = this.data.bills.filter(bill => bill.status === 'pending');
    
    if (pendingBills.length === 0) {
      message.success('您当前没有待缴费账单');
      return;
    }

    const totalAmount = pendingBills.reduce((sum, bill) => {
      return sum + parseFloat(bill.amount.replace('¥', ''));
    }, 0);

    wx.showModal({
      title: '确认缴费',
      content: `您有 ${pendingBills.length} 笔待缴费账单，总计金额：¥${totalAmount.toFixed(2)}\n\n是否立即缴费？`,
      confirmText: '立即缴费',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processPayment(totalAmount);
        }
      }
    });
  },

  // 处理缴费
  processPayment(amount) {
    wx.showLoading({
      title: '正在缴费...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      message.success('缴费成功！');
      
      // 更新账单状态
      const updatedBills = this.data.bills.map(bill => {
        if (bill.status === 'pending') {
          return { ...bill, status: 'paid', statusText: '已缴费' };
        }
        return bill;
      });

      this.setData({
        bills: updatedBills
      });

      setTimeout(() => {
        wx.showModal({
          title: '缴费完成',
          content: `缴费成功！\n缴费金额：¥${amount.toFixed(2)}\n缴费时间：${new Date().toLocaleString()}`,
          showCancel: false,
          confirmText: '知道了'
        });
      }, 1000);
    }, 2000);
  },

  // 加载历史账单
  loadHistoryBills(period) {
    wx.showLoading({
      title: '加载中...'
    });

    setTimeout(() => {
      wx.hideLoading();
      message.success(`已加载${period === '6months' ? '近6个月' : '近1年'}的历史账单`);
    }, 1000);
  },
  
  // 计算计费天数
  calculateDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
});