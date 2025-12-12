Page({
  data: {
    documentData: {
      orderNumber: "1220250529000220903492",
      acceptDate: "2025年05月29日",
      customerName: "杭州意丰歌服饰有限公司",
      contactPhone: "13915514486",
      certificateType: "统一信用代码",
      certificateNumber: "913************71A",
      certificateAddress: "浙江省杭州市余杭区余杭经济开发区超峰东路2号南楼5楼515室",
      businessOrderNumber: "0620250529106777781",
    },
  },

  onLoad: (options) => {
    // 页面加载时的初始化逻辑
    console.log("业务登记单页面加载")
  },

  onShareAppMessage: () => ({
    title: "江苏电信业务登记单",
    path: "/pages/document/document",
  }),
})
