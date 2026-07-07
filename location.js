/**
 * 部门与位置对照表模块
 */

const LocationModule = {
  currentPage: 1,
  pageSize: 10,
  keyword: '',
  editingId: null,

  init() {
    this.render();
    this.bindModuleEvents();
  },

  render() {
    const container = document.getElementById('location-content');
    if (!container) return;

    let locations = DataStore.getLocations();
    if (this.keyword) {
      const kw = this.keyword.toLowerCase();
      locations = locations.filter(l =>
        (l.locationCode || '').toLowerCase().includes(kw) ||
        (l.locationDesc || '').toLowerCase().includes(kw) ||
        (l.deptCode || '').toLowerCase().includes(kw) ||
        (l.deptName || '').toLowerCase().includes(kw) ||
        (l.floor || '').includes(kw)
      );
    }

    const totalPages = Math.ceil(locations.length / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    const pageData = locations.slice(start, start + this.pageSize);

    container.innerHTML = `
      <!-- 工具栏 -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" id="location-search" placeholder="搜索位置编号、描述、部门..."
              class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value="${this.keyword}">
          </div>
          <button id="btn-export-location" class="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5" title="导出HTML报表">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            导出
          </button>
          <button id="btn-add-location" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            新增位置
          </button>
        </div>
      </div>

      <!-- 表格 -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-4 py-3 font-medium text-slate-600">位置/房间编号</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">位置描述</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">部门代码</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">部门全称</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">楼层</th>
                <th class="text-left px-4 py-3 font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              ${pageData.length === 0 ? `
                <tr><td colspan="6" class="text-center py-12 text-slate-400">暂无位置数据</td></tr>
              ` : pageData.map(loc => `
                <tr class="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                  <td class="px-4 py-3 font-mono text-xs font-medium text-slate-800">${loc.locationCode}</td>
                  <td class="px-4 py-3 text-slate-700">${loc.locationDesc}</td>
                  <td class="px-4 py-3 font-mono text-xs text-slate-600">${loc.deptCode}</td>
                  <td class="px-4 py-3 text-slate-700">${loc.deptName}</td>
                  <td class="px-4 py-3 text-slate-600">${loc.floor}F</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <button class="btn-edit-loc p-1.5 rounded-md hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-colors" data-id="${loc.id}" title="编辑">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button class="btn-delete-loc p-1.5 rounded-md hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors" data-id="${loc.id}" title="删除">
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
          <div class="text-xs text-slate-500">共 ${locations.length} 条记录</div>
          <div class="flex items-center gap-1">
            <button class="btn-loc-prev px-3 py-1.5 rounded-md text-xs border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed" ${this.currentPage <= 1 ? 'disabled' : ''}>上一页</button>
            <button class="btn-loc-next px-3 py-1.5 rounded-md text-xs border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed" ${this.currentPage >= totalPages ? 'disabled' : ''}>下一页</button>
          </div>
        </div>
      </div>
    `;

    this.bindModuleEvents();
  },

  bindModuleEvents() {
    const searchInput = document.getElementById('location-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.keyword = e.target.value;
        this.currentPage = 1;
        this.render();
      }, 300));
    }

    const addBtn = document.getElementById('btn-add-location');
    if (addBtn) addBtn.addEventListener('click', () => this.showForm());

    // 导出HTML
    const exportBtn = document.getElementById('btn-export-location');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportHTML());

    const prevBtn = document.querySelector('.btn-loc-prev');
    const nextBtn = document.querySelector('.btn-loc-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { this.currentPage--; this.render(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { this.currentPage++; this.render(); });

    document.querySelectorAll('.btn-edit-loc').forEach(btn => {
      btn.addEventListener('click', () => this.showForm(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete-loc').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Utils.confirm('确定删除该位置记录？')) {
          DataStore.deleteLocation(btn.dataset.id);
          Utils.showToast('位置已删除');
          this.render();
        }
      });
    });
  },

  showForm(editId = null) {
    this.editingId = editId;
    const loc = editId ? DataStore.getLocations().find(l => l.id === editId) : {};
    const modal = document.getElementById('location-modal');
    if (!modal) return;

    modal.querySelector('#location-form-title').textContent = editId ? '编辑位置' : '新增位置';
    modal.querySelector('#loc-id').value = editId || '';
    modal.querySelector('#loc-code').value = loc.locationCode || '';
    modal.querySelector('#loc-desc').value = loc.locationDesc || '';
    modal.querySelector('#loc-dept-code').value = loc.deptCode || '';
    modal.querySelector('#loc-dept-name').value = loc.deptName || '';
    modal.querySelector('#loc-floor').value = loc.floor || '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  hideForm() {
    const modal = document.getElementById('location-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    this.editingId = null;
  },

  saveForm() {
    const modal = document.getElementById('location-modal');
    const data = {
      locationCode: modal.querySelector('#loc-code').value.trim(),
      locationDesc: modal.querySelector('#loc-desc').value.trim(),
      deptCode: modal.querySelector('#loc-dept-code').value.trim(),
      deptName: modal.querySelector('#loc-dept-name').value.trim(),
      floor: modal.querySelector('#loc-floor').value.trim(),
    };

    if (!data.locationCode) { Utils.showToast('请输入位置编号', 'error'); return; }
    if (!data.deptName) { Utils.showToast('请输入部门全称', 'error'); return; }

    if (this.editingId) {
      DataStore.updateLocation(this.editingId, data);
      Utils.showToast('位置已更新');
    } else {
      DataStore.addLocation(data);
      Utils.showToast('位置已添加');
    }

    this.hideForm();
    this.render();
  },

  exportHTML() {
    const locations = DataStore.getLocations();
    const filtered = this.keyword ? locations.filter(l => {
      const kw = this.keyword.toLowerCase();
      return [l.locationCode, l.description, l.deptCode, l.deptName, l.floor]
        .some(v => v && v.toLowerCase().includes(kw));
    }) : locations;

    const headers = ['位置编号', '位置描述', '部门代码', '部门全称', '楼层'];
    const rows = filtered.map(l => [
      l.locationCode, l.description, l.deptCode, l.deptName, l.floor || '-'
    ]);

    Utils.exportHTML('部门与位置对照表', headers, rows);
    Utils.showToast('HTML报表已导出');
  }
};

window.LocationModule = LocationModule;
