/**
 * 主应用控制器 - 导航路由与页面切换
 */

const App = {
  currentModule: null,

  async init() {
    // 显示加载状态
    this.showLoading(true);

    // 检查是否需要导入Excel数据
    if (!DataStore.isDataImported()) {
      const result = await DataStore.importFromJSON();
      if (result) {
        console.log('Excel数据导入完成:', result);
      } else {
        // 导入失败，使用示例数据
        DataStore.initSampleData();
      }
    }

    this.showLoading(false);
    this.bindNavigation();
    this.bindMobileMenu();
    // 默认加载物资总台账
    this.navigate('ledger');
  },

  showLoading(show) {
    let loading = document.getElementById('global-loading');
    if (show) {
      if (!loading) {
        loading = document.createElement('div');
        loading.id = 'global-loading';
        loading.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.95);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
        loading.innerHTML = `
          <div style="width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
          <div style="font-size:16px;color:#475569;font-weight:500;">正在加载物资数据...</div>
          <div style="font-size:12px;color:#94a3b8;">首次加载需要导入Excel数据，请稍候</div>
        `;
        const style = document.createElement('style');
        style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
        document.head.appendChild(style);
        document.body.appendChild(loading);
      }
    } else {
      if (loading) loading.remove();
    }
  },

  bindNavigation() {
    document.querySelectorAll('[data-nav]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.getAttribute('data-nav');
        this.navigate(target);
      });
    });
  },

  navigate(module) {
    // 更新导航高亮
    document.querySelectorAll('[data-nav]').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-nav') === module);
    });

    // 隐藏所有模块
    document.querySelectorAll('.module-page').forEach(page => {
      page.classList.add('hidden');
    });

    // 显示目标模块
    const targetPage = document.getElementById(`page-${module}`);
    if (targetPage) {
      targetPage.classList.remove('hidden');
    }

    // 关闭移动端菜单
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.classList.remove('active');

    this.currentModule = module;

    // 更新顶部标题
    const titleMap = {
      ledger: '物资总台账',
      records: '签收/归还记录',
      location: '部门与位置对照表',
      archive: '纸质档案登记',
      approval: '审批与导出'
    };
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = titleMap[module] || '';

    // 初始化模块
    switch (module) {
      case 'ledger': LedgerModule.init(); break;
      case 'records': RecordsModule.init(); break;
      case 'location': LocationModule.init(); break;
      case 'archive': ArchiveModule.init(); break;
      case 'approval': ApprovalModule.init(); break;
    }
  },

  bindMobileMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  }
};

// 通用工具函数
const Utils = {
  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '-';
    return dateStr.substring(0, 10);
  },

  // 状态标签HTML
  statusBadge(status) {
    const colors = {
      '在用': 'bg-blue-100 text-blue-700',
      '闲置': 'bg-gray-100 text-gray-600',
      '维修中': 'bg-amber-100 text-amber-700',
      '已报废': 'bg-red-100 text-red-700',
      '已转出': 'bg-purple-100 text-purple-700',
    };
    const cls = colors[status] || 'bg-gray-100 text-gray-600';
    return `<span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}">${status}</span>`;
  },

  // 设备类型标签
  typeBadge(type) {
    const colors = {
      '台式机': 'bg-sky-50 text-sky-700',
      '笔记本': 'bg-indigo-50 text-indigo-700',
      '显示器': 'bg-teal-50 text-teal-700',
      '打印机': 'bg-orange-50 text-orange-700',
      '网络设备': 'bg-cyan-50 text-cyan-700',
      '软件': 'bg-violet-50 text-violet-700',
      '其他': 'bg-gray-50 text-gray-600',
    };
    const cls = colors[type] || 'bg-gray-50 text-gray-600';
    return `<span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}">${type}</span>`;
  },

  // 设备状态评估标签
  conditionBadge(condition) {
    const colors = {
      '良好': 'bg-emerald-100 text-emerald-700',
      '需维修': 'bg-amber-100 text-amber-700',
      '已损坏': 'bg-red-100 text-red-700',
    };
    const cls = colors[condition] || 'bg-gray-100 text-gray-600';
    return `<span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}">${condition}</span>`;
  },

  // 档案类型标签
  archiveTypeBadge(type) {
    const colors = {
      '签收单': 'bg-blue-100 text-blue-700',
      '归还单': 'bg-green-100 text-green-700',
      '位置变更单': 'bg-purple-100 text-purple-700',
      '维修单': 'bg-amber-100 text-amber-700',
      '报废单': 'bg-red-100 text-red-700',
    };
    const cls = colors[type] || 'bg-gray-100 text-gray-600';
    return `<span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}">${type}</span>`;
  },

  // 防抖
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // 导出CSV
  exportCSV(headers, rows, filename) {
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },

  // 导出HTML报表
  exportHTML(title, headers, rows, subtitle) {
    const dateStr = new Date().toLocaleString('zh-CN');
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: #f8fafc; color: #1e293b; padding: 24px; font-size: 13px; }
  .report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #2563eb; }
  .report-header h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
  .report-header .subtitle { font-size: 13px; color: #64748b; }
  .report-header .meta { font-size: 12px; color: #94a3b8; margin-top: 8px; }
  .stats { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .stat-item { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; min-width: 120px; }
  .stat-item .label { font-size: 11px; color: #64748b; margin-bottom: 2px; }
  .stat-item .value { font-size: 20px; font-weight: 700; color: #2563eb; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  thead th { background: #f1f5f9; color: #475569; font-weight: 600; font-size: 12px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
  tbody td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  tbody tr:hover { background: #f8fafc; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-green { background: #d1fae5; color: #047857; }
  .badge-gray { background: #f1f5f9; color: #475569; }
  .badge-amber { background: #fef3c7; color: #b45309; }
  .badge-red { background: #fee2e2; color: #b91c1c; }
  .badge-purple { background: #ede9fe; color: #6d28d9; }
  .badge-sky { background: #e0f2fe; color: #0369a1; }
  .badge-indigo { background: #e0e7ff; color: #4338ca; }
  .badge-teal { background: #ccfbf1; color: #0f766e; }
  .badge-orange { background: #ffedd5; color: #c2410c; }
  .badge-cyan { background: #cffafe; color: #0e7490; }
  .badge-violet { background: #f5f3ff; color: #6d28d9; }
  .badge-emerald { background: #d1fae5; color: #047857; }
  .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
  .toolbar { text-align: right; margin-bottom: 16px; }
  .toolbar button { padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
  .toolbar button:hover { background: #1d4ed8; }
  @media print {
    body { padding: 0; background: white; }
    .toolbar { display: none; }
    .report-header { border-bottom-color: #000; }
    table { box-shadow: none; }
    thead th { background: #eee; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">打印 / 保存为PDF</button>
  </div>
  <div class="report-header">
    <h1>${title}</h1>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    <div class="meta">生成时间：${dateStr} | 共 ${rows.length} 条记录</div>
  </div>
  <table>
    <thead>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">
    物资管理系统 - 报表导出
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}_${new Date().toISOString().substring(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  },

  // 显示Toast消息
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
      success: 'bg-emerald-500',
      error: 'bg-red-500',
      warning: 'bg-amber-500',
      info: 'bg-blue-500'
    };

    const toast = document.createElement('div');
    toast.className = `toast-item ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2`;
    toast.innerHTML = `
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${type === 'success' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>' :
          type === 'error' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>' :
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  // 确认对话框
  confirm(message) {
    return window.confirm(message);
  }
};

window.App = App;
window.Utils = Utils;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init().catch(err => {
    console.error('App init error:', err);
    App.showLoading(false);
    DataStore.initSampleData();
    App.bindNavigation();
    App.bindMobileMenu();
    App.navigate('ledger');
  });
});
