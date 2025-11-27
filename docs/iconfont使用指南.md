# 阿里巴巴图标库（iconfont）使用指南

## 一、准备工作

### 1. 注册并登录 iconfont
访问：https://www.iconfont.cn/
使用 GitHub 或其他方式登录

### 2. 创建项目
1. 点击右上角"资源管理" → "我的项目"
2. 点击"新建项目"
3. 填写项目名称：`cloud_app_icons`（或其他名称）
4. 选择 FontClass/Symbol 前缀：`icon-`

### 3. 添加图标到项目
1. 在 iconfont 首页搜索需要的图标（如：购物车、账单、客服等）
2. 点击图标上的"购物车"图标，添加到购物车
3. 点击右上角购物车，选择"添加至项目"
4. 选择你创建的项目

### 4. 生成在线链接
1. 进入"我的项目"
2. 点击项目右侧的"Font class"
3. 点击"查看在线链接"
4. 复制生成的 CSS 链接（形如：`//at.alicdn.com/t/c/font_xxx.css`）

## 二、在小程序中使用

### 方法一：使用在线 CDN（推荐）

#### 1. 更新 iconfont.wxss
打开 `styles/iconfont.wxss`，替换 `@font-face` 中的 URL：

```css
@font-face {
  font-family: "iconfont";
  /* 替换为你的项目在线链接 */
  src: url('//at.alicdn.com/t/c/font_YOUR_PROJECT_ID.woff2?t=YOUR_TIMESTAMP') format('woff2'),
       url('//at.alicdn.com/t/c/font_YOUR_PROJECT_ID.woff?t=YOUR_TIMESTAMP') format('woff'),
       url('//at.alicdn.com/t/c/font_YOUR_PROJECT_ID.ttf?t=YOUR_TIMESTAMP') format('truetype');
}
```

**注意**：
- 将 `YOUR_PROJECT_ID` 替换为你的项目 ID
- 将 `YOUR_TIMESTAMP` 替换为时间戳（在线链接中会包含）
- 小程序中使用在线字体需要在 `app.json` 中配置域名白名单

#### 2. 配置域名白名单
在 `app.json` 中添加：

```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于小程序位置接口的效果展示"
    }
  },
  "requiredPrivateInfos": [],
  "networkTimeout": {
    "request": 10000,
    "downloadFile": 10000
  },
  "downloadFile": {
    "maxConcurrent": 10
  }
}
```

并在微信公众平台后台配置服务器域名：
- 登录微信公众平台：https://mp.weixin.qq.com/
- 进入"开发" → "开发管理" → "开发设置"
- 在"服务器域名"中添加：`at.alicdn.com`

#### 3. 更新图标类名
打开 iconfont 项目页面，查看每个图标的 Font class 名称，更新 `styles/iconfont.wxss` 中的类名和 Unicode 编码。

### 方法二：下载到本地（备选）

#### 1. 下载字体文件
1. 在 iconfont 项目页面点击"下载至本地"
2. 解压下载的 zip 文件
3. 将 `iconfont.ttf` 文件复制到 `styles/fonts/` 目录

#### 2. 使用 Base64 编码
由于小程序对本地字体文件支持有限，建议将字体文件转换为 Base64：
1. 使用在线工具将 `iconfont.ttf` 转换为 Base64
2. 在 `iconfont.wxss` 中使用 Base64 编码

```css
@font-face {
  font-family: "iconfont";
  src: url('data:font/truetype;charset=utf-8;base64,YOUR_BASE64_STRING') format('truetype');
}
```

## 三、在页面中使用图标

### 1. 引入样式文件
在页面的 `.wxss` 文件中引入：

```css
@import "../../styles/iconfont.wxss";
```

### 2. 使用图标
在 `.wxml` 中使用：

```xml
<!-- 方式一：使用 text 标签 -->
<text class="iconfont icon-gouwuche"></text>

<!-- 方式二：在 view 中使用 -->
<view class="icon-wrapper">
  <text class="iconfont icon-zhangdan"></text>
</view>

<!-- 方式三：设置颜色和大小 -->
<text class="iconfont icon-kefu" style="color: #409eff; font-size: 40rpx;"></text>
```

### 3. 动态使用图标
在 `.js` 中配置图标类名：

```javascript
data: {
  services: [
    {
      title: '套餐订购',
      iconClass: 'icon-gouwuche',
      color: '#409eff'
    },
    {
      title: '我的账单',
      iconClass: 'icon-zhangdan',
      color: '#52c41a'
    }
  ]
}
```

在 `.wxml` 中使用：

```xml
<view wx:for="{{services}}" wx:key="title">
  <text class="iconfont {{item.iconClass}}" style="color: {{item.color}}"></text>
  <text>{{item.title}}</text>
</view>
```

## 四、常见问题

### 1. 图标不显示
- 检查是否正确引入了 `iconfont.wxss`
- 检查类名是否正确（区分大小写）
- 检查字体文件 URL 是否可访问
- 检查是否配置了域名白名单

### 2. 图标显示为方块
- 字体文件加载失败
- Unicode 编码不正确
- 字体文件格式不支持

### 3. 更新图标
1. 在 iconfont 项目中添加/删除图标
2. 点击"更新代码"
3. 重新复制在线链接
4. 更新 `iconfont.wxss` 中的 URL 和类名

## 五、推荐图标

根据你的首页功能，推荐搜索以下关键词：

- **套餐订购**：购物车、订购、套餐
- **我的账单**：账单、订单、清单
- **在线客服**：客服、咨询、对话
- **业务退订**：退订、取消、返回
- **产品查询**：搜索、查询、放大镜
- **预充值**：充值、钱包、金币
- **变更过户**：转移、交换、过户
- **自助续费**：续费、循环、刷新
- **业务申请**：申请、表单、编辑
- **电子协议**：协议、文档、合同
- **开票**：发票、票据、收据
- **投诉举报**：警告、举报、感叹号
- **服务评价**：星星、评分、点赞
- **代缴代扣**：银行卡、支付、扣款

## 六、项目示例配置

### 推荐的图标配置（供参考）

```javascript
// 常用服务图标
commonServices: [
  {
    title: '套餐订购',
    subtitle: '升级您的网络',
    iconClass: 'icon-gouwuche',
    bgColor: '#f0f6ff',
    iconBgColor: '#409eff',
    route: '/pages/package-order/package-order'
  },
  {
    title: '我的账单',
    subtitle: '查看消费明细',
    iconClass: 'icon-zhangdan',
    bgColor: '#f0f9f3',
    iconBgColor: '#52c41a',
    route: '/pages/my-bill/my-bill'
  },
  {
    title: '在线客服',
    subtitle: '7x24小时支持',
    iconClass: 'icon-kefu',
    bgColor: '#f6f2ff',
    iconBgColor: '#722ed1',
    route: '/pages/customer-service/customer-service'
  },
  {
    title: '业务退订',
    subtitle: '退订业务',
    iconClass: 'icon-tuiding',
    bgColor: '#fffbe6',
    iconBgColor: '#faad14',
    route: '/pages/business-cancellation/business-cancellation'
  }
]

// 全部功能图标
allFeatures: [
  { iconClass: 'icon-chaxun', text: '产品查询', color: '#409eff', route: '/pages/product-query/product-query' },
  { iconClass: 'icon-chongzhi', text: '预充值', color: '#52c41a', route: '/pages/pre-recharge/pre-recharge' },
  { iconClass: 'icon-guohu', text: '变更过户', color: '#722ed1', route: '/pages/change-transfer/change-transfer' },
  { iconClass: 'icon-xufei', text: '自助续费', color: '#f5222d', route: '/pages/self-renewal/self-renewal' },
  { iconClass: 'icon-shenqing', text: '业务申请', color: '#3071a9', route: '/pages/business-application/business-application' },
  { iconClass: 'icon-xieyi', text: '电子协议', color: '#13c2c2', route: '/pages/electronic-agreement/electronic-agreement' },
  { iconClass: 'icon-kaipiao', text: '开票', color: '#fa8c16', route: '/pages/invoice/invoice' },
  { iconClass: 'icon-tousu', text: '举报投诉', color: '#8c8c8c', route: '/pages/complaint/complaint' },
  { iconClass: 'icon-pingjia', text: '服务评价', color: '#faad14', route: '/pages/service-evaluation/service-evaluation' },
  { iconClass: 'icon-daikou', text: '代缴代扣', color: '#eb2f96', route: '/pages/payment-collection/payment-collection' }
]
```

## 七、注意事项

1. **性能优化**：只添加需要使用的图标，避免字体文件过大
2. **版本管理**：每次更新图标后记录版本号和更新日期
3. **备份**：保存一份字体文件的本地备份
4. **兼容性**：测试在不同设备和微信版本上的显示效果
5. **颜色控制**：使用 CSS 的 `color` 属性控制图标颜色
6. **大小控制**：使用 `font-size` 控制图标大小

## 八、快速开始步骤

1. ✅ 创建 iconfont 项目并添加图标
2. ✅ 获取在线链接
3. ✅ 更新 `styles/iconfont.wxss` 中的字体 URL
4. ✅ 在微信公众平台配置域名白名单
5. ✅ 在页面 wxss 中引入 iconfont.wxss
6. ✅ 更新页面 js 中的图标配置
7. ✅ 更新页面 wxml 使用新的图标类名
8. ✅ 编译并测试

完成以上步骤后，你的小程序就可以使用阿里巴巴图标库的图标了！
