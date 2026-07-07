# AGENTS.md - 物资管理系统

## 项目概览
企业IT资产全生命周期管理系统，纯前端实现，使用 localStorage 持久化数据。

## 技术栈
- HTML5 + CSS3 + Vanilla JavaScript (ES6+)
- Tailwind CSS (CDN)
- 数据存储：localStorage
- 构建工具：无（原生静态项目）

## 目录结构
```
├── index.html              # 主页面（含所有模块容器和弹窗）
├── styles/main.css         # 自定义样式（布局、弹窗、响应式）
├── js/
│   ├── data.js             # 数据管理层（localStorage CRUD + Excel数据导入）
│   ├── app.js              # 主应用控制器（路由导航、工具函数）
│   └── modules/
│       ├── ledger.js       # 物资总台账模块
│       ├── records.js      # 签收/归还记录模块
│       ├── location.js     # 部门与位置对照表模块
│       ├── archive.js      # 纸质档案登记模块
│       └── approval.js     # 人事审批导出模块
├── assets/
│   ├── import_data.json    # 从Excel导入的完整数据（首次加载时自动导入）
│   ├── import_data.py      # Excel数据解析脚本
│   └── *.xlsx              # 原始Excel数据文件
├── .coze                   # 项目配置
└── DESIGN.md               # 设计规范
```

## 核心模块
1. **物资总台账** (`LedgerModule`) - 资产CRUD、搜索筛选、排序分页、统计卡片
2. **签收/归还记录** (`RecordsModule`) - Tab切换、表单录入、自动更新资产状态
3. **部门与位置** (`LocationModule`) - 位置映射CRUD
4. **纸质档案** (`ArchiveModule`) - 档案登记CRUD、类型筛选
5. **审批导出** (`ApprovalModule`) - 自动汇总待审批事项、CSV导出

## 数据模型
- `ams_assets` - 物资总表
- `ams_sign_records` - 签收记录
- `ams_return_records` - 归还记录
- `ams_locations` - 位置对照表
- `ams_archives` - 纸质档案
- `ams_counters` - 流水号计数器

## 开发命令
- 预览：`coze dev`（自动热更新）
- 构建：`coze build`
- 启动：`coze start`

## 注意事项
- 所有数据存储在浏览器 localStorage，清除浏览器数据会丢失
- 首次加载自动从 `assets/import_data.json` 导入Excel数据（3837条资产、2269条签收、1266条归还、27个部门、2198条档案）
- 数据导入后标记 `ams_data_imported`，后续加载直接使用localStorage缓存
- 如需重新导入，清除浏览器localStorage后刷新页面
- 签收操作自动将资产状态更新为"在用"
- 归还操作根据设备评估自动更新资产状态
- 档案记录限制导入前500条，避免localStorage超限

## 数据来源
数据整合自5个Excel文件：
1. `Hardware and Software list - For maintenance.xlsx` - 物资总表（Desktop/Notebook/Printer/Monitor/Others/Software/Network device）
2. `Hardware and Software location change list - to DAGRH.xlsx` - 位置变更记录
3. `資產現場登記.xlsx` - 资产现场登记
4. `資訊資產簽收記錄.xlsx` - 签收记录
5. `退回資訊資產.xlsx` - 退回（归还）记录
