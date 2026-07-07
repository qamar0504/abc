/**
 * 签收/归还记录模块
 */

const RecordsModule = {
  activeTab: 'sign', // sign | return
  currentPage: 1,
  pageSize: 10,
  keyword: '',

  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const container = document.getElementById('records-content');
    if (!container) return;

    container.innerHTML = `
      <!-- Tab切换 -->
      <div class="flex items-center gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 w-fit">
        <button class="tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.activeTab === 'sign' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}" data-tab="sign">
          签收记录
        </button>
        <button class="tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.activeTab === 'return' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}" data-tab="return">
          归还记录
        </button>
      </div>

      <!-- 工具栏 -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" id="records-search" placeholder="搜索流水号、资产编号、签收/归还人..."
              class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value="${this.keyword}">
          </div>
          <button id="btn-export-records" class="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5" title="导出HTML报表">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            导出
          </button>
          <button id="btn-add-record" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            ${this.activeTab === 'sign' ? '新增签收' : '新增归还'}
          </button>
        </div>
      </div>

      <!-- 表格 -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          ${this.activeTab === 'sign' ? this.renderSignTable() : this.renderReturnTable()}
        </div>
      </div>
    `;

    this.bindModuleEvents();
  },

  renderSignTable() {
    let records = DataStore.getSignRecords();
    if (this.keyword) {
      const kw = this.keyword.toLowerCase();
      records = records.filter(r =>
        (r.serialNo || '').toLowerCase().includes(kw) ||
        (r.assetCode || '').toLowerCase().includes(kw) ||
        (r.signPerson || '').toLowerCase().includes(kw) ||
        (r.signDept || '').toLowerCase().includes(kw) ||
        (r.deviceName || '').toLowerCase().includes(kw)
      );
    }
    records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const totalPages = Math.ceil(records.length / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    const pageData = records.slice(start, start + this.pageSize);

    return `
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="text-left px-4 py-3 font-medium text-slate-600">流水号</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">日期</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">资产编号</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">设备名称</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">签收部门</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">签收人</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">用途说明</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">操作</th>
          </tr>
        </thead>
        <tbody>
          ${pageData.length === 0 ? `
            <tr><td colspan="8" class="text-center py-12 text-slate-400">暂无签收记录</td></tr>
          ` : pageData.map(r => `
            <tr class="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
              <td class="px-4 py-3 font-mono text-xs text-slate-700">${r.serialNo}</td>
              <td class="px-4 py-3 text-slate-600">${Utils.formatDate(r.date)}</td>
              <td class="px-4 py-3 font-mono text-xs text-slate-700">${r.assetCode}</td>
              <td class="px-4 py-3 text-slate-800 font-medium">${r.deviceName}</td>
              <td class="px-4 py-3 text-slate-600 hidden md:table-cell">${r.signDept || '-'}</td>
              <td class="px-4 py-3 text-slate-600 hidden md:table-cell">${r.signPerson || '-'}</td>
              <td class="px-4 py-3 text-slate-500 hidden lg:table-cell max-w-[200px] truncate">${r.purpose || '-'}</td>
              <td class="px-4 py-3">
                <button class="btn-delete-sign p-1.5 rounded-md hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors" data-id="${r.id}" title="删除">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${this.renderPagination(records.length, totalPages)}
    `;
  },

  renderReturnTable() {
    let records = DataStore.getReturnRecords();
    if (this.keyword) {
      const kw = this.keyword.toLowerCase();
      records = records.filter(r =>
        (r.serialNo || '').toLowerCase().includes(kw) ||
        (r.assetCode || '').toLowerCase().includes(kw) ||
        (r.returnPerson || '').toLowerCase().includes(kw) ||
        (r.returnDept || '').toLowerCase().includes(kw) ||
        (r.deviceName || '').toLowerCase().includes(kw)
      );
    }
    records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const totalPages = Math.ceil(records.length / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    const pageData = records.slice(start, start + this.pageSize);

    return `
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="text-left px-4 py-3 font-medium text-slate-600">流水号</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">日期</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">资产编号</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">设备名称</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">归还部门</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">归还人</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">状态评估</th>
            <th class="text-left px-4 py-3 font-medium text-slate-600">操作</th>
          </tr>
        </thead>
        <tbody>
          ${pageData.length === 0 ? `
            <tr><td colspan="8" class="text-center py-12 text-slate-400">暂无归还记录</td></tr>
          ` : pageData.map(r => `
            <tr class="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
              <td class="px-4 py-3 font-mono text-xs text-slate-700">${r.serialNo}</td>
              <td class="px-4 py-3 text-slate-600">${Utils.formatDate(r.date)}</td>
              <td class="px-4 py-3 font-mono text-xs text-slate-700">${r.assetCode}</td>
              <td class="px-4 py-3 text-slate-800 font-medium">${r.deviceName}</td>
              <td class="px-4 py-3 text-slate-600 hidden md:table-cell">${r.returnDept || '-'}</td>
              <td class="px-4 py-3 text-slate-600 hidden md:table-cell">${r.returnPerson || '-'}</td>
              <td class="px-4 py-3">${Utils.conditionBadge(r.deviceCondition)}</td>
              <td class="px-4 py-3">
                <button class="btn-delete-return p-1.5 rounded-md hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors" data-id="${r.id}" title="删除">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${this.renderPagination(records.length, totalPages)}
    `;
  },

  renderPagination(total, totalPages) {
    return `
      <div class="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
        <div class="text-xs text-slate-500">共 ${total} 条记录，第 ${this.currentPage}/${totalPages} 页</div>
        <div class="flex items-center gap-1">
          <button class="btn-rec-prev px-3 py-1.5 rounded-md text-xs border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed" ${this.currentPage <= 1 ? 'disabled' : ''}>上一页</button>
          <button class="btn-rec-next px-3 py-1.5 rounded-md text-xs border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed" ${this.currentPage >= totalPages ? 'disabled' : ''}>下一页</button>
        </div>
      </div>
    `;
  },

  bindEvents() {},

  bindModuleEvents() {
    // Tab切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.currentPage = 1;
        this.keyword = '';
        this.render();
      });
    });

    // 搜索
    const searchInput = document.getElementById('records-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.keyword = e.target.value;
        this.currentPage = 1;
        this.render();
      }, 300));
    }

    // 新增
    const addBtn = document.getElementById('btn-add-record');
    if (addBtn) addBtn.addEventListener('click', () => this.showForm());

    // 导出HTML
    const exportBtn = document.getElementById('btn-export-records');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportHTML());

    // 分页
    const prevBtn = document.querySelector('.btn-rec-prev');
    const nextBtn = document.querySelector('.btn-rec-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { this.currentPage--; this.render(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { this.currentPage++; this.render(); });

    // 删除签收
    document.querySelectorAll('.btn-delete-sign').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Utils.confirm('确定删除该签收记录？')) {
          DataStore.deleteSignRecord(btn.dataset.id);
          Utils.showToast('记录已删除');
          this.render();
        }
      });
    });

    // 删除归还
    document.querySelectorAll('.btn-delete-return').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Utils.confirm('确定删除该归还记录？')) {
          DataStore.deleteReturnRecord(btn.dataset.id);
          Utils.showToast('记录已删除');
          this.render();
        }
      });
    });
  },

  showForm() {
    const modal = document.getElementById('record-modal');
    if (!modal) return;

    const title = modal.querySelector('#record-form-title');
    const assetSelect = modal.querySelector('#record-asset-code');
    const deviceNameInput = modal.querySelector('#record-device-name');
    const deptInput = modal.querySelector('#record-dept');
    const personInput = modal.querySelector('#record-person');
    const dateInput = modal.querySelector('#record-date');
    const purposeGroup = modal.querySelector('#purpose-group');
    const conditionGroup = modal.querySelector('#condition-group');
    const deptLabel = modal.querySelector('#dept-label');
    const personLabel = modal.querySelector('#person-label');

    title.textContent = this.activeTab === 'sign' ? '新增签收记录' : '新增归还记录';
    dateInput.value = new Date().toISOString().substring(0, 10);

    // 填充资产下拉
    const assets = DataStore.getAssets();
    assetSelect.innerHTML = '<option value="">请选择资产</option>' +
      assets.map(a => `<option value="${a.assetCode}" data-name="${a.deviceName}">${a.assetCode} - ${a.deviceName}</option>`).join('');

    // 根据tab显示/隐藏字段
    if (this.activeTab === 'sign') {
      purposeGroup.classList.remove('hidden');
      conditionGroup.classList.add('hidden');
      deptLabel.textContent = '签收部门';
      personLabel.textContent = '签收人';
    } else {
      purposeGroup.classList.add('hidden');
      conditionGroup.classList.remove('hidden');
      deptLabel.textContent = '归还部门';
      personLabel.textContent = '归还人';
    }

    // 清空
    assetSelect.value = '';
    deviceNameInput.value = '';
    deptInput.value = '';
    personInput.value = '';
    modal.querySelector('#record-purpose').value = '';
    modal.querySelector('#record-condition').value = '良好';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  hideForm() {
    const modal = document.getElementById('record-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  saveForm() {
    const modal = document.getElementById('record-modal');
    const assetCode = modal.querySelector('#record-asset-code').value;
    const deviceName = modal.querySelector('#record-device-name').value.trim();
    const dept = modal.querySelector('#record-dept').value.trim();
    const person = modal.querySelector('#record-person').value.trim();
    const date = modal.querySelector('#record-date').value;

    if (!assetCode) { Utils.showToast('请选择资产', 'error'); return; }
    if (!person) { Utils.showToast(`请填写${this.activeTab === 'sign' ? '签收' : '归还'}人`, 'error'); return; }
    if (!date) { Utils.showToast('请选择日期', 'error'); return; }

    if (this.activeTab === 'sign') {
      const purpose = modal.querySelector('#record-purpose').value.trim();
      DataStore.addSignRecord({ date, assetCode, deviceName, signDept: dept, signPerson: person, purpose });
      Utils.showToast('签收记录已添加');
    } else {
      const condition = modal.querySelector('#record-condition').value;
      DataStore.addReturnRecord({ date, assetCode, deviceName, returnDept: dept, returnPerson: person, deviceCondition: condition });
      Utils.showToast('归还记录已添加');
    }

    this.hideForm();
    this.render();
  },

  exportHTML() {
    const records = this.activeTab === 'sign' ? DataStore.getSignRecords() : DataStore.getReturnRecords();
    const filtered = this.keyword ? records.filter(r => {
      const kw = this.keyword.toLowerCase();
      return [r.serialNo, r.assetCode, r.deviceName, r.signDept || r.returnDept, r.signPerson || r.returnPerson]
        .some(v => v && v.toLowerCase().includes(kw));
    }) : records;

    const title = this.activeTab === 'sign' ? '签收记录报表' : '归还记录报表';
    const headers = this.activeTab === 'sign' 
      ? ['流水号', '日期', '资产编号', '设备名称', '签收部门', '签收人', '用途说明']
      : ['流水号', '日期', '资产编号', '设备名称', '归还部门', '归还人', '设备状态评估'];

    const condColors = { '良好': 'green', '需维修': 'amber', '已损坏': 'red' };
    const rows = filtered.map(r => {
      if (this.activeTab === 'sign') {
        return [r.serialNo, Utils.formatDate(r.date), r.assetCode, r.deviceName, r.signDept || '-', r.signPerson || '-', r.purpose || '-'];
      } else {
        return [r.serialNo, Utils.formatDate(r.date), r.assetCode, r.deviceName, r.returnDept || '-', r.returnPerson || '-', 
          r.deviceCondition ? `<span class="badge badge-${condColors[r.deviceCondition] || 'gray'}">${r.deviceCondition}</span>` : '-'];
      }
    });

    Utils.exportHTML(title, headers, rows);
    Utils.showToast('HTML报表已导出');
  }
};

window.RecordsModule = RecordsModule;
