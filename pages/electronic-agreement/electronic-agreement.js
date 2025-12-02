// pages/electronic-agreement/electronic-agreement.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    selectedType: null,
    currentAgreement: null,
    isAgreed: false,
    canSign: false,
    currentTime: '',
    agreementTypes: [
      {
        id: 'service_agreement',
        name: '宽带服务协议',
        description: '宽带服务使用条款和条件',
        status: 'pending',
        statusText: '待签署',
        icon: '📋'
      },
      {
        id: 'privacy_policy',
        name: '隐私政策',
        description: '个人信息保护和使用政策',
        status: 'signed',
        statusText: '已签署',
        icon: '🔒'
      },
      {
        id: 'user_agreement',
        name: '用户协议',
        description: '用户服务条款和用户行为规范',
        status: 'signed',
        statusText: '已签署',
        icon: '👤'
      },
      {
        id: 'data_protection',
        name: '数据保护协议',
        description: '数据收集、存储和使用政策',
        status: 'expired',
        statusText: '已过期',
        icon: '🛡️'
      }
    ],
    agreements: {
      service_agreement: {
        title: '宽带服务协议',
        version: 'v2.1',
        updateDate: '2024-12-01',
        clauses: [
          {
            title: '第一条 服务内容',
            content: '我们为您提供高速宽带互联网接入服务，包括但不限于上网、数据传输等服务。服务内容以您选择的套餐为准。'
          },
          {
            title: '第二条 服务期限',
            content: '服务期限为一年，自开通之日起计算。到期后可选择续费或终止服务。'
          },
          {
            title: '第三条 费用标准',
            content: '服务费用按照您选择的套餐标准收取，包括月费、安装费等。费用标准如有调整，将提前30天通知。'
          },
          {
            title: '第四条 用户义务',
            content: '用户应当合法使用网络服务，不得从事违法活动。用户有义务保护账户安全，不得将账户转借他人使用。'
          },
          {
            title: '第五条 服务保障',
            content: '我们承诺提供稳定的网络服务，如因我方原因造成服务中断，将按相关规定进行赔偿。'
          }
        ]
      },
      privacy_policy: {
        title: '隐私政策',
        version: 'v1.5',
        updateDate: '2024-11-15',
        clauses: [
          {
            title: '第一条 信息收集',
            content: '我们仅收集为您提供服务所必需的个人信息，包括姓名、身份证号、联系电话、地址等。'
          },
          {
            title: '第二条 信息使用',
            content: '收集的信息仅用于提供服务、客户服务、账单管理等目的，不会用于其他商业用途。'
          },
          {
            title: '第三条 信息保护',
            content: '我们采用先进的技术手段和管理措施保护您的个人信息安全，防止信息泄露、丢失或损坏。'
          }
        ]
      },
      user_agreement: {
        title: '用户协议',
        version: 'v1.3',
        updateDate: '2024-10-20',
        clauses: [
          {
            title: '第一条 账户注册',
            content: '用户应当提供真实、准确、完整的个人信息进行账户注册，并保证信息的及时更新。'
          },
          {
            title: '第二条 使用规范',
            content: '用户应当遵守国家法律法规，不得利用服务从事违法活动，不得干扰他人正常使用网络。'
          },
          {
            title: '第三条 账户安全',
            content: '用户应当妥善保管账户信息，因用户原因导致的账户安全问题，责任由用户自行承担。'
          }
        ]
      },
      data_protection: {
        title: '数据保护协议',
        version: 'v1.0',
        updateDate: '2024-08-10',
        clauses: [
          {
            title: '第一条 数据收集范围',
            content: '我们收集的数据包括个人身份信息、网络使用记录、设备信息等。'
          },
          {
            title: '第二条 数据处理原则',
            content: '数据处理遵循合法、正当、必要的原则，确保数据安全和隐私保护。'
          }
        ]
      }
    },
    signatureHistory: [
      {
        id: '1',
        name: '隐私政策',
        signDate: '2024-11-15 14:30',
        status: 'signed',
        statusText: '已签署'
      },
      {
        id: '2',
        name: '用户协议',
        signDate: '2024-10-20 09:15',
        status: 'signed',
        statusText: '已签署'
      },
      {
        id: '3',
        name: '数据保护协议',
        signDate: '2024-08-10 16:45',
        status: 'expired',
        statusText: '已过期'
      }
    ]
  },

  onLoad() {
    console.log('电子协议页面加载');
    this.setCurrentTime();
  },

  onShow() {
    console.log('电子协议页面显示');
  },

  // 设置当前时间
  setCurrentTime() {
    const now = new Date();
    const timeString = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0') + ' ' + 
      String(now.getHours()).padStart(2, '0') + ':' + 
      String(now.getMinutes()).padStart(2, '0');
    
    this.setData({
      currentTime: timeString
    });
  },

  // 选择协议类型
  selectAgreementType(e) {
    const typeId = e.currentTarget.dataset.id;
    const agreement = this.data.agreements[typeId];
    
    this.setData({
      selectedType: typeId,
      currentAgreement: agreement,
      isAgreed: false
    });
    this.checkCanSign();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 切换同意状态
  toggleAgreement() {
    this.setData({
      isAgreed: !this.data.isAgreed
    });
    this.checkCanSign();
    
    // 触觉反馈
    wx.vibrateShort();
  },

  // 检查是否可以签署
  checkCanSign() {
    const { selectedType, isAgreed } = this.data;
    const agreementType = this.data.agreementTypes.find(type => type.id === selectedType);
    
    const canSign = selectedType && 
                   isAgreed && 
                   agreementType && 
                   agreementType.status === 'pending';
    
    this.setData({ canSign });
  },

  // 下载协议
  downloadAgreement() {
    if (!this.data.selectedType) {
      message.error('请先选择协议');
      return;
    }

    wx.showLoading({
      title: '准备下载...'
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '下载协议',
        content: `${this.data.currentAgreement.title} PDF文件已生成，是否下载到本地？`,
        confirmText: '下载',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            message.success('协议已保存到本地');
          }
        }
      });
    }, 1500);
  },

  // 签署协议
  signAgreement() {
    if (!this.data.canSign) {
      message.error('请先阅读并同意协议条款');
      return;
    }

    const { selectedType, currentAgreement } = this.data;
    
    wx.showModal({
      title: '确认签署',
      content: `您即将签署《${currentAgreement.title}》\n\n签署后将具有法律效力，确认继续吗？`,
      confirmText: '确认签署',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processSignature();
        }
      }
    });
  },

  // 处理签署
  processSignature() {
    wx.showLoading({
      title: '正在签署...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      message.success('协议签署成功');
      
      // 更新协议状态
      const updatedTypes = this.data.agreementTypes.map(type => {
        if (type.id === this.data.selectedType) {
          return { ...type, status: 'signed', statusText: '已签署' };
        }
        return type;
      });

      // 添加到签署历史
      const newHistoryItem = {
        id: Date.now().toString(),
        name: this.data.currentAgreement.title,
        signDate: this.data.currentTime,
        status: 'signed',
        statusText: '已签署'
      };

      this.setData({
        agreementTypes: updatedTypes,
        signatureHistory: [newHistoryItem, ...this.data.signatureHistory],
        isAgreed: false,
        canSign: false
      });

      setTimeout(() => {
        wx.showModal({
          title: '签署完成',
          content: `《${this.data.currentAgreement.title}》签署成功！\n\n签署时间：${this.data.currentTime}\n\n协议已生效，具有法律效力。`,
          showCancel: false,
          confirmText: '知道了'
        });
      }, 1000);
    }, 2000);
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '协议相关问题请联系客服咨询。\n\n客服电话：4009677726\n工作时间：9:00-18:00',
      confirmText: '拨打电话',
      cancelText: '在线咨询',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '4009677726'
          });
        } else {
          message.success('正在为您转接在线客服...');
        }
      }
    });
  },

  // 查看全部协议
  viewAllAgreements() {
    message.success('查看全部协议');
    // 这里可以跳转到完整的协议列表页面
  }
});