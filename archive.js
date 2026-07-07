/**
 * 纸质档案登记模块
 */

const ArchiveModule = {
  currentPage: 1,
  pageSize: 10,
  keyword: '',
  typeFilter: '',
  editingId: null,

  init() {
    this.render();
    this.bindModuleEvents();
  },

  render() {
    const container = document.getElementById('archive-content');
    if (!container) return;

    let archives = DataStore.getArchives();

    // 搜索
    if (this.keyword) {
      const kw = this.keyword.toLowerCase();
      archives = archives.filter(a =>
        (a.archiveNo || '').toLowerCase().includes(kw) ||
        (a.relatedSerialNo || '').toLowerCase().includes(kw) ||
        (a.person || '').toLowerCase().includes(kw) ||
        (a.department || '').toLowerCase().includes(kw) ||
        (a.assetCode || '').toLowerCase().includes(kw) ||
        (a.content || '').toLowerCase().includes(kw)
      );
    }

    // 类型筛选
    if (this.typeFilter) {
      archives = archives.filter(a => a.type === this.typeFilter);
    }

    archives.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const totalPages = Math.ceil(archives.length / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    const pageData = archives.slice(start, start + this.pageSize);

    container.innerHTML = `
      <!-- 工具栏 -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" id="archive-search" placeholder="搜索档案编号、流水号、当事人、资产编号..."
              class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value="${this.keyword}">
          </div>
          <select id="archive-type-filter" class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
            <option value="">全部类型</option>
            <option value="签收单" ${this.typeFilter === '签收单' ? 'selected' : ''}>签收单</option>
            <option value="归还单" ${this.typeFilter === '归还单' ? 'selected' : ''}>归还单</option>
            <option value="位置变更单" ${this.typeFilter === '位置变更单' ? 'selected' : ''}>位置变更单</option>
            <option value="维修单" ${this.typeFilter === '维修单' ? 'selected' : ''}>维修单</option>
            <option value="报废单" ${this.typeFilter === '报废单' ? 'selected' : ''}>报废单</option>
          </select>
          <button id="btn-export-archive" class="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5" title="导出HTML报表">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            导出
          </button>
          <button id="btn-add-archive" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            新增档案
          </button>
        </div>
      </div>

      <!-- 表格 -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-4 py-3 font-medium text-slate-600">档案编号</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">关联流水号</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">类型</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">日期</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">当事人</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">部门</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">资产编号</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600 hidden xl:table-cell">操作内容</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              ${pageData.length === 0 ? `
                <tr><td colspan="9" class="text-center py-12 text-slate-400">暂无档案记录</td></tr>
              ` : pageData.map(a => `
                <tr class="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                  <td class="px-4 py-3 font-mono text-xs text-slate-700">${a.archiveNo}</td>
                  <td class="px-4 py-3 font-mono text-xs text-slate-600 hidden md:table-cell">${a.relatedSerialNo || '-'}</td>
                  <td class="px-4 py-3">${Utils.archiveTypeBadge(a.type)}</td>
                  <td class="px-4 py-3 text-slate-600">${Utils.formatDate(a.date)}</td>
                  <td class="px-4 py-3 text-slate-700 hidden md:table-cell">${a.person || '-'}</td>
                  <td class="px-4 py-3 text-slate-600 hidden lg:table-cell">${a.department || '-'}</td>
                  <td class="px-4 py-3 font-mono text-xs text-slate-600 hidden lg:table-cell">${a.assetCode || '-'}</td>
                  <td class="px-4 py-3 text-slate-500 hidden xl:table-cell max-w-[200px] truncate">${a.content || '-'}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <button class="btn-edit-archive p-1.5 rounded-md hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-colors" data-id="${a.id}" title="编辑">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button class="btn-delete-archive p-1.5 rounded-md hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors" data-id="${a.id}" title="删除">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <div class="text-xs text-slate-500">共 ${archives.length} 条记录，第 ${this.currentPage}/${totalPages} 页</div>
          <div class="flex items-center gap-1">
            <button class="btn-arc-prev px-3 py-1.5 rounded-md text-xs border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed" ${this.currentPage <= 1 ? 'disabled' : ''}>上一页</button>
            <button class="btn-arc-next px-3 py-1.5 rounded-md text-xs border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed" ${this.currentPage >= totalPages ? 'disabled' : ''}>下一页</button>
          </div>
        </div>
      </div>
    `;

    this.bindModuleEvents();
  },

  bindModuleEvents() {
    const searchInput = document.getElementById('archive-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.keyword = e.target.value;
        this.currentPage = 1;
        this.render();
      }, 300));
    }

    const typeFilter = document.getElementById('archive-type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.typeFilter = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }

    const addBtn = document.getElementById('btn-add-archive');
    if (addBtn) addBtn.addEventListener('click', () => this.showForm());

    // 导出HTML
    const exportBtn = document.getElementById('btn-export-archive');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportHTML());

    const prevBtn = document.querySelector('.btn-arc-prev');
    const nextBtn = document.querySelector('.btn-arc-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { this.currentPage--; this.render(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { this.currentPage++; this.render(); });

    document.querySelectorAll('.btn-edit-archive').forEach(btn => {
      btn.addEventListener('click', () => this.showForm(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete-archive').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Utils.confirm('确定删除该档案记录？')) {
          DataStore.deleteArchive(btn.dataset.id);
          Utils.showToast('档案已删除');
          this.render();
        }
      });
    });
  },

  showForm(editId = null) {
    this.editingId = editId;
    const archive = editId ? DataStore.getArchives().find(a => a.id === editId) : {};
    const modal = document.getElementById('archive-modal');
    if (!modal) return;

    modal.querySelector('#archive-form-title').textContent = editId ? '编辑档案' : '新增档案';
    modal.querySelector('#archive-id').value = editId || '';
    modal.querySelector('#archive-related-serial').value = archive.relatedSerialNo || '';
    modal.querySelector('#archive-type').value = archive.type || '签收单';
    modal.querySelector('#archive-date').value = archive.date || new Date().toISOString().substring(0, 10);
    modal.querySelector('#archive-person').value = archive.person || '';
    modal.querySelector('#archive-department').value = archive.department || '';
    modal.querySelector('#archive-asset-code').value = archive.assetCode || '';
    modal.querySelector('#archive-content').value = archive.content || '';
    modal.querySelector('#archive-signature').value = archive.signature || '';
    modal.querySelector('#archive-storage').value = archive.storageLocation || '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  hideForm() {
    const modal = document.getElementById('archive-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    this.editingId = null;
  },

  saveForm() {
    const modal = document.getElementById('archive-modal');
    const data = {
      relatedSerialNo: modal.querySelector('#archive-related-serial').value.trim(),
      type: modal.querySelector('#archive-type').value,
      date: modal.querySelector('#archive-date').value,
      person: modal.querySelector('#archive-person').value.trim(),
      department: modal.querySelector('#archive-department').value.trim(),
      assetCode: modal.querySelector('#archive-asset-code').value.trim(),
      content: modal.querySelector('#archive-content').value.trim(),
      signature: modal.querySelector('#archive-signature').value.trim(),
      storageLocation: modal.querySelector('#archive-storage').value.trim(),
    };

    if (!data.type) { Utils.showToast('请选择档案类型', 'error'); return; }
    if (!data.date) { Utils.showToast('请选择日期', 'error'); return; }
    if (!data.person) { Utils.showToast('请填写当事人', 'error'); return; }

    if (this.editingId) {
      DataStore.updateArchive(this.editingId, data);
      Utils.showToast('档案已更新');
    } else {
      DataStore.addArchive(data);
      Utils.showToast('档案已添加');
    }

    this.hideForm();
    this.render();
  },

  exportHTML() {
    const archives = this.getFilteredArchives();
    const typeColors = { '签收单': 'blue', '归还单': 'green', '位置变更单': 'purple', '维修单': 'amber', '报废单': 'red' };
    const headers = ['档案编号', '关联流水号', '类型', '日期', '当事人', '部门', '资产编号', '操作内容', '签字确认', '存档位置'];
    const rows = archives.map(a => [
      a.archiveCode,
      a.relatedSerialNo || '-',
      `<span class="badge badge-${typeColors[a.type] || 'gray'}">${a.type}</span>`,
      Utils.formatDate(a.date),
      a.person || '-',
      a.department || '-',
      a.assetCode || '-',
      a.content || '-',
      a.signature || '-',
      a.storageLocation || '-'
    ]);

    const subtitle = this.typeFilter ? `筛选条件：类型=${this.typeFilter}` : '';
    Utils.exportHTML('纸质档案登记报表', headers, rows, subtitle);
    Utils.showToast('HTML报表已导出');
  }
};

window.ArchiveModule = ArchiveModule;
