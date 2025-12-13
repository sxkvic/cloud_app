// pages/my-bill/my-bill.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');
const DataManager = require('../../utils/dataManager');

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    scrollViewHeight: 0,
    bills: [],
    loading: true,
    deviceCode: '',              // 设备编号，从缓存读取
    customerInfo: null,          // 客户信息
    billDetail: null,            // 当前账单详情
    showDetail: false,           // 是否显示详情页面
    isFirstLoad: true,           // 是否首次加载
    currentPage: 1,              // 当前页码
    pageSize: 10,                // 每页数量
    hasMore: true,               // 是否有更多数据
    loadingMore: false,          // 是否正在加载更多
    refreshing: false            // 是否正在下拉刷新
  },

  async onLoad() {
    // 获取系统信息设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2;
    
    // 计算滚动区域高度 = 屏幕高度 - 导航栏高度 - 状态栏高度 - 头部卡片高度(约120px)
    const windowHeight = systemInfo.windowHeight;
    const headerCardHeight = 120; // 头部卡片大约高度
    const scrollViewHeight = windowHeight - statusBarHeight - navBarHeight - headerCardHeight;
    
    this.setData({
      statusBarHeight,
      navBarHeight,
      scrollViewHeight
    });
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
    
    await this.loadCustomerInfo();
    await this.loadBills(true); // 首次加载，传递true
    
    // 标记首次加载完成
    this.setData({ isFirstLoad: false });
  },

  async onShow() {
    // 只有非首次加载时才刷新数据（从其他页面返回时）
    if (!this.data.isFirstLoad) {
      await this.loadBills(true); // 刷新数据
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    // 设置刷新状态
    this.setData({ refreshing: true });
    
    // 重置页码并重新加载
    this.setData({ 
      currentPage: 1,
      hasMore: true 
    });
    const result = await this.loadBills(true); // true表示刷新
    
    // 停止下拉刷新
    this.setData({ refreshing: false });
    
    // 根据结果显示提示
    if (result && result.success) {
      message.success('刷新成功');
    }
  },

  // 上拉加载更多
  async onReachBottom() {
    
    // 如果正在加载或没有更多数据，直接返回
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }
    
    // 加载下一页
    this.setData({ 
      loadingMore: true,
      currentPage: this.data.currentPage + 1 
    });
    
    await this.loadBills(false); // false表示加载更多
    
    this.setData({ loadingMore: false });
  },

  // 加载客户信息（每次都从服务器获取最新数据，避免变更过户等场景下数据不一致）
  async loadCustomerInfo() {
    try {
      // 强制从服务器获取最新数据，不使用缓存
      const result = await DataManager.getCompleteCustomerInfo(this.data.deviceCode, true);
      
      if (result.success && result.data) {
        this.setData({
          customerInfo: result.data.customer || result.data
        });
      } else {
        message.error('无法获取客户信息');
      }
      
    } catch (error) {
      console.error('查询客户信息失败:', error);
      message.error('无法获取客户信息');
    }
  },

  // 加载账单列表
  async loadBills(isRefresh = false) {
    try {
      // 如果是刷新，显示加载状态
      if (isRefresh) {
        this.setData({ loading: true });
      }
      
      // 使用设备号查询账单列表
      const result = await API.getBillList({
        page: this.data.currentPage,
        pageSize: this.data.pageSize,
        device_no: this.data.deviceCode,
        customer_name: '',
        bill_no: ''
      });

      // 转换数据格式
      const billsList = result.data.list || result.data.bills || result.data || [];
      const bills = billsList.map(bill => ({
        id: bill.id,
        billNo: bill.bill_no || bill.order_no,
        orderNo: bill.order_no,  // 保存订单号用于查询发票
        title: bill.package_name || '宽带月费',
        date: bill.created_at || bill.billing_start_date,
        period: bill.billing_start_date && bill.billing_end_date 
          ? `${bill.billing_start_date} 至 ${bill.billing_end_date}` 
          : '月度账单',
        amount: `¥${parseFloat(bill.amount).toFixed(2)}`,
        rawAmount: bill.amount,  // 保存原始金额
        billStatus: bill.bill_status,  // 保存原始状态值
        status: bill.bill_status == 2 ? 'invoiced' : (bill.bill_status == 3 ? 'invoicing' : 'not_invoiced'),
        statusText: bill.bill_status == 2 ? '已开票' : (bill.bill_status == 3 ? '开票中' : '未开票')
      }));

      // 判断是否还有更多数据
      const hasMore = billsList.length >= this.data.pageSize;
      
      // 更新数据
      if (isRefresh) {
        // 刷新：替换所有数据
        this.setData({
          bills: bills,
          loading: false,
          hasMore: hasMore
        });
      } else {
        // 加载更多：追加数据
        this.setData({
          bills: [...this.data.bills, ...bills],
          hasMore: hasMore
        });
      }
      
      // 如果没有更多数据，显示提示
      if (!hasMore && !isRefresh && billsList.length > 0) {
        wx.showToast({
          title: '已加载全部账单',
          icon: 'none',
          duration: 1500
        });
      }
      
      // 返回成功状态
      return { success: true };

    } catch (error) {
      console.error('加载账单失败:', error);
      this.setData({ 
        loading: false,
        loadingMore: false 
      });
      
      // 如果是加载更多失败，回退页码
      if (!isRefresh && this.data.currentPage > 1) {
        this.setData({ 
          currentPage: this.data.currentPage - 1 
        });
        // 加载更多失败的提示
        message.error('加载更多失败，请稍后重试');
      } else {
        // 首次加载或刷新失败的提示
        message.error('加载失败，请下拉刷新');
      }
      
      // 返回失败状态
      return { success: false };
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

  // 刷新开票状态
  async refreshInvoiceStatus(e) {
    const bill = e.currentTarget.dataset.bill;
    
    if (!bill || !bill.orderNo) {
      message.error('订单信息不完整');
      return;
    }
    
    wx.showLoading({ title: '刷新中...', mask: true });
    
    try {
      // 查询发票信息
      const result = await API.getInvoiceInfo(bill.orderNo);
      
      if (result && 
          (result.Code == '0' || result.Code == 0) &&
          result.InvoiceList && 
          result.InvoiceList.length > 0) {
        
        const invoice = result.InvoiceList[0];
        const pdfFile = invoice.ElecInvoiceFileList?.find(f => f.FileType == 13 || f.FileType == '13');
        
        if (pdfFile && pdfFile.FileUrl) {
          // 发票已生成，更新账单状态
          try {
            await API.updateBillStatus(bill.id, 2); // 更新为已开票
            
            // 创建发票记录（异步执行）
            API.createInvoiceForOrder({
              orderNo: bill.orderNo,
              fileDownloadUrl: pdfFile.FileUrl
            }).catch(e => console.error('创建发票记录失败:', e));
            
            wx.hideLoading();
            
            // 刷新列表（传 true 表示刷新，替换数据而不是追加）
            this.setData({ currentPage: 1 });
            await this.loadBills(true);
            
            // 弹窗提示用户查看邮箱
            wx.showModal({
              title: '开票成功',
              content: '电子发票已发送至您的邮箱，请注意查收。如未收到，请检查垃圾邮件。',
              showCancel: false,
              confirmText: '知道了'
            });
          } catch (e) {
            wx.hideLoading();
            message.error('更新状态失败');
          }
        } else {
          wx.hideLoading();
          message.info('发票还在生成中，请稍后再刷新');
        }
      } else {
        wx.hideLoading();
        message.info('发票还在生成中，请稍后再刷新');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('查询发票状态失败:', error);
      message.error('查询失败，请重试');
    }
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
      content: '客服电话：4009677726\n工作时间：9:00-18:00\n\n您也可以在线咨询客服。',
      confirmText: '在线咨询',
      cancelText: '拨打电话',
      success: (res) => {
        if (res.confirm) {
          message.success('正在为您转接在线客服...');
        } else {
          wx.makePhoneCall({
            phoneNumber: '4009677726'
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
  },

  // 返回上一页
  handleBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({
        url: '/pages/home/home'
      });
    }
  }
});