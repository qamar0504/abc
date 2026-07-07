/**
 * 人事审批导出模块
 */

const ApprovalModule = {
  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const container = document.getElementById('approval-content');
    if (!container) return;

    // 收集需要审批的事项
    const approvalItems = this.getApprovalItems();

    container.innerHTML = `
      <!-- 说明 -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <h3 class="text-sm font-medium text-blue-800 mb-1">审批事项说明</h3>
            <p class="text-xs text-blue-700">以下事项需要人事审批确认，包括：报废资产、高价值设备转移、批量签收等。可勾选需要导出的项目，导出为Excel格式文件。</p>
          </div>
        </div>
      </div>

      <!-- 统计 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="text-xs text-slate-500 mb-1">待审批总数</div>
          <div class="text-2xl font-bold text-slate-800">${approvalItems.length}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="text-xs text-red-500 mb-1">报废审批</div>
          <div class="text-2xl font-bold text-red-600">${approvalItems.filter(i => i.category === '报废').length}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="text-xs text-amber-500 mb-1">转移审批</div>
          <div class="text-2xl font-bold text-amber-600">${approvalItems.filter(i => i.category === '转移').length}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="text-xs text-blue-500 mb-1">维修审批</div>
          <div class="text-2xl font-bold text-blue-600">${approvalItems.filter(i => i.category === '维修').length}</div>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" id="select-all-approval" class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
              全选
            </label>
            <select id="approval-category-filter" class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">全部分类</option>
              <option value="报废">报废</option>
              <option value="转移">转移</option>
              <option value="维修">维修</option>
              <option value="签收">签收</option>
              <option value="归还">归还</option>
            </select>
          </div>
          <button id="btn-export-approval" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            导出选中项
          </button>
          <button id="btn-export-approval-html" class="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5" title="导出HTML报表">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            导出HTML
          </button>
        </div>
      </div>

      <!-- 审批列表 -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-4 py-3 w-10">
                  <input type="checkbox" id="select-all-header" class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                </th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">分类</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">资产编号</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">设备名称</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">相关部门</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">相关人员</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">说明</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">日期</th>
              </tr>
            </thead>
            <tbody>
              ${approvalItems.length === 0 ? `
                <tr><td colspan="8" class="text-center py-12 text-slate-400">暂无待审批事项</td></tr>
              ` : approvalItems.map((item, idx) => `
                <tr class="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                  <td class="px-4 py-3">
                    <input type="checkbox" class="approval-checkbox w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" data-index="${idx}" value="${item.id}">
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${this.getCategoryBadgeClass(item.category)}">${item.category}</span>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-slate-700">${item.assetCode}</td>
                  <td class="px-4 py-3 text-slate-800 font-medium">${item.deviceName}</td>
                  <td class="px-4 py-3 text-slate-600 hidden md:table-cell">${item.department || '-'}</td>
                  <td class="px-4 py-3 text-slate-600 hidden md:table-cell">${item.person || '-'}</td>
                  <td class="px-4 py-3 text-slate-500 hidden lg:table-cell max-w-[200px] truncate">${item.description}</td>
                  <td class="px-4 py-3 text-slate-600">${item.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.bindModuleEvents();
  },

  getApprovalItems() {
    const items = [];

    // 1. 已报废的资产
    const scrappedAssets = DataStore.getAssets().filter(a => a.status === '已报废');
    scrappedAssets.forEach(a => {
      items.push({
        id: `scrap_${a.id}`,
        category: '报废',
        assetCode: a.assetCode,
        deviceName: a.deviceName,
        department: a.department,
        person: a.currentUser || '-',
        description: `资产报废：${a.remark || '无备注'}`,
        date: a.lastUpdated ? a.lastUpdated.substring(0, 10) : '-'
      });
    });

    // 2. 维修中的资产
    const repairAssets = DataStore.getAssets().filter(a => a.status === '维修中');
    repairAssets.forEach(a => {
      items.push({
        id: `repair_${a.id}`,
        category: '维修',
        assetCode: a.assetCode,
        deviceName: a.deviceName,
        department: a.department,
        person: '-',
        description: `设备维修中：${a.remark || '无备注'}`,
        date: a.lastUpdated ? a.lastUpdated.substring(0, 10) : '-'
      });
    });

    // 3. 已转出的资产
    const transferredAssets = DataStore.getAssets().filter(a => a.status === '已转出');
    transferredAssets.forEach(a => {
      items.push({
        id: `transfer_${a.id}`,
        category: '转移',
        assetCode: a.assetCode,
        deviceName: a.deviceName,
        department: a.department,
        person: a.currentUser || '-',
        description: `资产已转出`,
        date: a.lastUpdated ? a.lastUpdated.substring(0, 10) : '-'
      });
    });

    // 4. 最近的签收记录（需确认）
    const signRecords = DataStore.getSignRecords();
    signRecords.forEach(r => {
      items.push({
        id: `sign_${r.id}`,
        category: '签收',
        assetCode: r.assetCode,
        deviceName: r.deviceName,
        department: r.signDept,
        person: r.signPerson,
        description: `签收确认：${r.purpose || '无用途说明'}`,
        date: r.date || '-'
      });
    });

    // 5. 最近的归还记录（需确认设备状态）
    const returnRecords = DataStore.getReturnRecords();
    returnRecords.forEach(r => {
      items.push({
        id: `return_${r.id}`,
        category: '归还',
        assetCode: r.assetCode,
        deviceName: r.deviceName,
        department: r.returnDept,
        person: r.returnPerson,
        description: `归还确认，设备状态：${r.deviceCondition}`,
        date: r.date || '-'
      });
    });

    return items;
  },

  getCategoryBadgeClass(category) {
    const colors = {
      '报废': 'bg-red-100 text-red-700',
      '维修': 'bg-amber-100 text-amber-700',
      '转移': 'bg-purple-100 text-purple-700',
      '签收': 'bg-blue-100 text-blue-700',
      '归还': 'bg-green-100 text-green-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  },

  bindEvents() {},

  bindModuleEvents() {
    // 全选
    const selectAllHeader = document.getElementById('select-all-header');
    const selectAllApproval = document.getElementById('select-all-approval');
    const checkboxes = document.querySelectorAll('.approval-checkbox');

    const toggleAll = (checked) => {
      checkboxes.forEach(cb => cb.checked = checked);
      if (selectAllHeader) selectAllHeader.checked = checked;
      if (selectAllApproval) selectAllApproval.checked = checked;
    };

    if (selectAllHeader) selectAllHeader.addEventListener('change', (e) => toggleAll(e.target.checked));
    if (selectAllApproval) selectAllApproval.addEventListener('change', (e) => toggleAll(e.target.checked));

    // 分类筛选
    const categoryFilter = document.getElementById('approval-category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        const val = categoryFilter.value;
        checkboxes.forEach(cb => {
          const row = cb.closest('tr');
          if (!val) {
            row.style.display = '';
          } else {
            const categoryCell = row.querySelectorAll('td')[1];
            row.style.display = categoryCell.textContent.trim() === val ? '' : 'none';
          }
        });
      });
    }

    // 导出
    const exportBtn = document.getElementById('btn-export-approval');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportSelected());
    }

    // 导出HTML
    const exportHtmlBtn = document.getElementById('btn-export-approval-html');
    if (exportHtmlBtn) {
      exportHtmlBtn.addEventListener('click', () => this.exportHTML());
    }
  },

  exportSelected() {
    const checkedBoxes = document.querySelectorAll('.approval-checkbox:checked');
    if (checkedBoxes.length === 0) {
      Utils.showToast('请先选择要导出的项目', 'warning');
      return;
    }

    const allItems = this.getApprovalItems();
    const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
    const selectedItems = allItems.filter(item => selectedIds.includes(item.id));

    const headers = ['分类', '资产编号', '设备名称', '相关部门', '相关人员', '说明', '日期'];
    const rows = selectedItems.map(item => [
      item.category,
      item.assetCode,
      item.deviceName,
      item.department || '-',
      item.person || '-',
      item.description,
      item.date
    ]);

    const dateStr = new Date().toISOString().substring(0, 10);
    Utils.exportCSV(headers, rows, `审批事项_${dateStr}.csv`);
    Utils.showToast(`已导出 ${selectedItems.length} 条审批记录`);
  },

  exportHTML() {
    const items = this.getFilteredItems();
    const typeColors = { '报废': 'red', '维修': 'amber', '转移': 'purple', '签收': 'blue', '归还': 'green' };
    const headers = ['序号', '类型', '资产编号', '设备名称', '申请人', '部门', '说明', '日期'];
    const rows = items.map((item, i) => [
      i + 1,
      `<span class="badge badge-${typeColors[item.type] || 'gray'}">${item.type}</span>`,
      item.assetCode,
      item.deviceName,
      item.person || '-',
      item.department || '-',
      item.description,
      item.date
    ]);

    const subtitle = this.typeFilter ? `筛选条件：类型=${this.typeFilter}` : '';
    Utils.exportHTML('人事审批事项报表', headers, rows, subtitle);
    Utils.showToast('HTML报表已导出');
  }
};

window.ApprovalModule = ApprovalModule;
