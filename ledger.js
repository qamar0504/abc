/**
 * 物资总台账模块
 */

const LedgerModule = {
  currentPage: 1,
  pageSize: 10,
  sortField: 'lastUpdated',
  sortOrder: 'desc',
  filters: { keyword: '', deviceType: '', status: '', department: '' },
  editingId: null,

  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const container = document.getElementById('ledger-content');
    if (!container) return;

    const assets = this.getFilteredAssets();
    const totalPages = Math.ceil(assets.length / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const start = (this.currentPage - 1) * this.pageSize;
    const pageData = assets.slice(start, start + this.pageSize);

    // 统计卡片
    const allAssets = DataStore.getAssets();
    const stats = {
      total: allAssets.length,
      inUse: allAssets.filter(a => a.status === '在用').length,
      idle: allAssets.filter(a => a.status === '闲置').length,
      repair: allAssets.filter(a => a.status === '维修中').length,
      scrapped: allAssets.filter(a => a.status === '已报废').length,
    };

    container.innerHTML = `
      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="text-xs text-slate-500 mb-1">资产总数</div>
          <div class="text-2xl font-bold text-slate-800">${stats.total}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="text-xs text-blue-500 mb-1">在用</div>
          <div class="text-2xl font-bold text-blue-600">${stats.inUse}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="text-xs text-gray-500 mb-1">闲置</div>
          <div class="text-2xl font-bold text-gray-600">${stats.idle}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="text-xs text-amber-500 mb-1">维修中</div>
          <div class="text-2xl font-bold text-amber-600">${stats.repair}</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200 col-span-2 md:col-span-1">
          <div class="text-xs text-red-500 mb-1">已报废</div>
          <div class="text-2xl font-bold text-red-600">${stats.scrapped}</div>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" id="ledger-search" placeholder="搜索资产编号、设备名称、使用者..." 
              class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value="${this.filters.keyword}">
          </div>
          <select id="filter-type" class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
            <option value="">全部类型</option>
            <option value="台式机" ${this.filters.deviceType === '台式机' ? 'selected' : ''}>台式机</option>
            <option value="笔记本" ${this.filters.deviceType === '笔记本' ? 'selected' : ''}>笔记本</option>
            <option value="显示器" ${this.filters.deviceType === '显示器' ? 'selected' : ''}>显示器</option>
            <option value="打印机" ${this.filters.deviceType === '打印机' ? 'selected' : ''}>打印机</option>
            <option value="网络设备" ${this.filters.deviceType === '网络设备' ? 'selected' : ''}>网络设备</option>
            <option value="软件" ${this.filters.deviceType === '软件' ? 'selected' : ''}>软件</option>
            <option value="其他" ${this.filters.deviceType === '其他' ? 'selected' : ''}>其他</option>
          </select>
          <select id="filter-status" class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
            <option value="">全部状态</option>
            <option value="在用" ${this.filters.status === '在用' ? 'selected' : ''}>在用</option>
            <option value="闲置" ${this.filters.status === '闲置' ? 'selected' : ''}>闲置</option>
            <option value="维修中" ${this.filters.status === '维修中' ? 'selected' : ''}>维修中</option>
            <option value="已报废" ${this.filters.status === '已报废' ? 'selected' : ''}>已报废</option>
            <option value="已转出" ${this.filters.status === '已转出' ? 'selected' : ''}>已转出</option>
          </select>
          <button id="btn-export-ledger" class="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5" title="导出HTML报表">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            导出
          </button>
          <button id="btn-add-asset" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            新增资产
          </button>
        </div>
      </div>

      <!-- 表格 -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer hover:text-blue-600 select-none" data-sort="assetCode">
                  资产编号 ${this.getSortIcon('assetCode')}
                </th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">设备名称</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer hover:text-blue-600 select-none" data-sort="deviceType">
                  类型 ${this.getSortIcon('deviceType')}
                </th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">部门</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">使用者</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">位置</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer hover:text-blue-600 select-none" data-sort="status">
                  状态 ${this.getSortIcon('status')}
                </th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden xl:table-cell cursor-pointer hover:text-blue-600 select-none" data-sort="acquisitionYear">
                  年份 ${this.getSortIcon('acquisitionYear')}
                </th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              ${pageData.length === 0 ? `
                <tr><td colspan="9" class="text-center py-12 text-slate-400">
                  <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                  暂无数据
                </td></tr>
              ` : pageData.map(asset => `
                <tr class="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                  <td class="px-4 py-3 font-mono text-xs text-slate-700">${asset.assetCode}</td>
                  <td class="px-4 py-3 text-slate-800 font-medium">${asset.deviceName}</td>
                  <td class="px-4 py-3">${Utils.typeBadge(asset.deviceType)}</td>
                  <td class="px-4 py-3 text-slate-600 hidden md:table-cell">${asset.department || '-'}</td>
                  <td class="px-4 py-3 text-slate-600 hidden lg:table-cell">${asset.currentUser || '-'}</td>
                  <td class="px-4 py-3 text-slate-600 hidden lg:table-cell">${asset.location || '-'}</td>
                  <td class="px-4 py-3">${Utils.statusBadge(asset.status)}</td>
                  <td class="px-4 py-3 text-slate-600 hidden xl:table-cell">${asset.acquisitionYear || '-'}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <button class="btn-edit-asset p-1.5 rounded-md hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-colors" data-id="${asset.id}" title="编辑">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button class="btn-delete-asset p-1.5 rounded-md hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors" data-id="${asset.id}" title="删除">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <!-- 分页 -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <div class="text-xs text-slate-500">共 ${assets.length} 条记录，第 ${this.currentPage}/${totalPages} 页</div>
          <div class="flex items-center gap-1">
            <button class="btn-page-prev px-3 py-1.5 rounded-md text-xs border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed" ${this.currentPage <= 1 ? 'disabled' : ''}>上一页</button>
            ${this.generatePageButtons(totalPages)}
            <button class="btn-page-next px-3 py-1.5 rounded-md text-xs border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed" ${this.currentPage >= totalPages ? 'disabled' : ''}>下一页</button>
          </div>
        </div>
      </div>
    `;

    this.bindModuleEvents();
  },

  getSortIcon(field) {
    if (this.sortField !== field) return '<span class="text-slate-300 ml-0.5">&#8597;</span>';
    return this.sortOrder === 'asc'
      ? '<span class="text-blue-600 ml-0.5">&#8593;</span>'
      : '<span class="text-blue-600 ml-0.5">&#8595;</span>';
  },

  generatePageButtons(totalPages) {
    let buttons = '';
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      const active = i === this.currentPage;
      buttons += `<button class="btn-page-num px-3 py-1.5 rounded-md text-xs border ${active ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-white'}" data-page="${i}">${i}</button>`;
    }
    return buttons;
  },

  getFilteredAssets() {
    let assets = DataStore.getAssets();

    // 关键词搜索
    if (this.filters.keyword) {
      const kw = this.filters.keyword.toLowerCase();
      assets = assets.filter(a =>
        (a.assetCode || '').toLowerCase().includes(kw) ||
        (a.deviceName || '').toLowerCase().includes(kw) ||
        (a.currentUser || '').toLowerCase().includes(kw) ||
        (a.department || '').toLowerCase().includes(kw) ||
        (a.location || '').toLowerCase().includes(kw) ||
        (a.remark || '').toLowerCase().includes(kw)
      );
    }

    // 类型筛选
    if (this.filters.deviceType) {
      assets = assets.filter(a => a.deviceType === this.filters.deviceType);
    }

    // 状态筛选
    if (this.filters.status) {
      assets = assets.filter(a => a.status === this.filters.status);
    }

    // 排序
    assets.sort((a, b) => {
      const va = a[this.sortField] || '';
      const vb = b[this.sortField] || '';
      const cmp = va.localeCompare(vb, 'zh-CN');
      return this.sortOrder === 'asc' ? cmp : -cmp;
    });

    return assets;
  },

  bindEvents() {
    // 事件在 render 中绑定
  },

  bindModuleEvents() {
    // 搜索
    const searchInput = document.getElementById('ledger-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.filters.keyword = e.target.value;
        this.currentPage = 1;
        this.render();
      }, 300));
    }

    // 类型筛选
    const typeSelect = document.getElementById('filter-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.filters.deviceType = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }

    // 状态筛选
    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }

    // 排序
    document.querySelectorAll('[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        if (this.sortField === field) {
          this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortField = field;
          this.sortOrder = 'asc';
        }
        this.render();
      });
    });

    // 分页
    const prevBtn = document.querySelector('.btn-page-prev');
    const nextBtn = document.querySelector('.btn-page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { this.currentPage--; this.render(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { this.currentPage++; this.render(); });
    document.querySelectorAll('.btn-page-num').forEach(btn => {
      btn.addEventListener('click', () => { this.currentPage = parseInt(btn.dataset.page); this.render(); });
    });

    // 新增
    const addBtn = document.getElementById('btn-add-asset');
    if (addBtn) addBtn.addEventListener('click', () => this.showForm());

    // 导出HTML
    const exportBtn = document.getElementById('btn-export-ledger');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportHTML());

    // 编辑
    document.querySelectorAll('.btn-edit-asset').forEach(btn => {
      btn.addEventListener('click', () => this.showForm(btn.dataset.id));
    });

    // 删除
    document.querySelectorAll('.btn-delete-asset').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Utils.confirm('确定要删除该资产吗？此操作不可撤销。')) {
          DataStore.deleteAsset(btn.dataset.id);
          Utils.showToast('资产已删除');
          this.render();
        }
      });
    });
  },

  showForm(editId = null) {
    this.editingId = editId;
    const asset = editId ? DataStore.getAssets().find(a => a.id === editId) : {};
    const modal = document.getElementById('asset-modal');
    if (!modal) return;

    modal.querySelector('#asset-form-title').textContent = editId ? '编辑资产' : '新增资产';
    modal.querySelector('#asset-id').value = editId || '';
    modal.querySelector('#asset-code').value = asset.assetCode || '';
    modal.querySelector('#asset-device-name').value = asset.deviceName || '';
    modal.querySelector('#asset-device-type').value = asset.deviceType || '台式机';
    modal.querySelector('#asset-department').value = asset.department || '';
    modal.querySelector('#asset-user').value = asset.currentUser || '';
    modal.querySelector('#asset-location').value = asset.location || '';
    modal.querySelector('#asset-status').value = asset.status || '闲置';
    modal.querySelector('#asset-year').value = asset.acquisitionYear || new Date().getFullYear().toString();
    modal.querySelector('#asset-remark').value = asset.remark || '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  hideForm() {
    const modal = document.getElementById('asset-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    this.editingId = null;
  },

  saveForm() {
    const form = document.getElementById('asset-form');
    if (!form) return;

    const data = {
      assetCode: form.querySelector('#asset-code').value.trim(),
      deviceName: form.querySelector('#asset-device-name').value.trim(),
      deviceType: form.querySelector('#asset-device-type').value,
      department: form.querySelector('#asset-department').value.trim(),
      currentUser: form.querySelector('#asset-user').value.trim(),
      location: form.querySelector('#asset-location').value.trim(),
      status: form.querySelector('#asset-status').value,
      acquisitionYear: form.querySelector('#asset-year').value.trim(),
      remark: form.querySelector('#asset-remark').value.trim(),
    };

    // 验证
    if (!data.assetCode) { Utils.showToast('请输入资产编号', 'error'); return; }
    if (!data.deviceName) { Utils.showToast('请输入设备名称', 'error'); return; }

    // 检查编号唯一性
    if (!this.editingId) {
      const existing = DataStore.getAssetByCode(data.assetCode);
      if (existing) { Utils.showToast('资产编号已存在', 'error'); return; }
    }

    if (this.editingId) {
      DataStore.updateAsset(this.editingId, data);
      Utils.showToast('资产已更新');
    } else {
      DataStore.addAsset(data);
      Utils.showToast('资产已添加');
    }

    this.hideForm();
    this.render();
  },

  exportHTML() {
    const assets = this.getFilteredAssets();
    const headers = ['资产编号', '设备名称', '设备类型', '部门', '当前使用者', '位置', '状态', '取得年份', '备注'];
    const statusColors = { '在用': 'blue', '闲置': 'gray', '维修中': 'amber', '已报废': 'red', '已转出': 'purple' };
    const typeColors = { '台式机': 'sky', '笔记本': 'indigo', '显示器': 'teal', '打印机': 'orange', '网络设备': 'cyan', '软件': 'violet', '其他': 'gray' };
    const rows = assets.map(a => [
      a.assetCode,
      a.deviceName,
      `<span class="badge badge-${typeColors[a.deviceType] || 'gray'}">${a.deviceType}</span>`,
      a.department || '-',
      a.currentUser || '-',
      a.location || '-',
      `<span class="badge badge-${statusColors[a.status] || 'gray'}">${a.status}</span>`,
      a.acquisitionYear || '-',
      a.remark || '-'
    ]);

    const subtitle = this.filters.deviceType || this.filters.status ? 
      `筛选条件：${this.filters.deviceType ? '类型=' + this.filters.deviceType : ''}${this.filters.status ? ' 状态=' + this.filters.status : ''}` : '';

    Utils.exportHTML('物资总台账报表', headers, rows, subtitle);
    Utils.showToast('HTML报表已导出');
  }
};

window.LedgerModule = LedgerModule;
