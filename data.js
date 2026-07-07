/**
 * 数据管理层 - localStorage CRUD 操作
 */

const DataStore = {
  // 存储键名
  KEYS: {
    ASSETS: 'ams_assets',
    SIGN_RECORDS: 'ams_sign_records',
    RETURN_RECORDS: 'ams_return_records',
    LOCATIONS: 'ams_locations',
    ARCHIVES: 'ams_archives',
    COUNTERS: 'ams_counters'
  },

  // 获取数据
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('DataStore.get error:', e);
      return [];
    }
  },

  // 设置数据
  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('DataStore.set error:', e);
      return false;
    }
  },

  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // 生成流水号
  generateSerialNo(prefix) {
    const counters = this.get(this.KEYS.COUNTERS) || {};
    const year = new Date().getFullYear();
    const key = `${prefix}_${year}`;
    counters[key] = (counters[key] || 0) + 1;
    this.set(this.KEYS.COUNTERS, counters);
    return `${prefix}-${year}-${String(counters[key]).padStart(4, '0')}`;
  },

  // 获取当前时间字符串
  now() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  },

  // ===== 物资总台账 =====
  getAssets() {
    return this.get(this.KEYS.ASSETS);
  },

  addAsset(asset) {
    const assets = this.getAssets();
    asset.id = this.generateId();
    asset.lastUpdated = this.now();
    assets.push(asset);
    this.set(this.KEYS.ASSETS, assets);
    return asset;
  },

  updateAsset(id, updates) {
    const assets = this.getAssets();
    const index = assets.findIndex(a => a.id === id);
    if (index === -1) return null;
    assets[index] = { ...assets[index], ...updates, lastUpdated: this.now() };
    this.set(this.KEYS.ASSETS, assets);
    return assets[index];
  },

  deleteAsset(id) {
    const assets = this.getAssets().filter(a => a.id !== id);
    this.set(this.KEYS.ASSETS, assets);
  },

  getAssetByCode(assetCode) {
    return this.getAssets().find(a => a.assetCode === assetCode) || null;
  },

  // ===== 签收记录 =====
  getSignRecords() {
    return this.get(this.KEYS.SIGN_RECORDS);
  },

  addSignRecord(record) {
    const records = this.getSignRecords();
    record.id = this.generateId();
    record.serialNo = this.generateSerialNo('QS');
    record.createdAt = this.now();
    records.push(record);
    this.set(this.KEYS.SIGN_RECORDS, records);
    // 更新物资状态
    this.updateAssetByCode(record.assetCode, { status: '在用', currentUser: record.signPerson, department: record.signDept });
    return record;
  },

  deleteSignRecord(id) {
    const records = this.getSignRecords().filter(r => r.id !== id);
    this.set(this.KEYS.SIGN_RECORDS, records);
  },

  // ===== 归还记录 =====
  getReturnRecords() {
    return this.get(this.KEYS.RETURN_RECORDS);
  },

  addReturnRecord(record) {
    const records = this.getReturnRecords();
    record.id = this.generateId();
    record.serialNo = this.generateSerialNo('GH');
    record.createdAt = this.now();
    records.push(record);
    this.set(this.KEYS.RETURN_RECORDS, records);
    // 更新物资状态
    const statusMap = { '良好': '闲置', '需维修': '维修中', '已损坏': '已报废' };
    this.updateAssetByCode(record.assetCode, { status: statusMap[record.deviceCondition] || '闲置', currentUser: '', department: '' });
    return record;
  },

  deleteReturnRecord(id) {
    const records = this.getReturnRecords().filter(r => r.id !== id);
    this.set(this.KEYS.RETURN_RECORDS, records);
  },

  // 根据资产编号更新物资
  updateAssetByCode(assetCode, updates) {
    const assets = this.getAssets();
    const index = assets.findIndex(a => a.assetCode === assetCode);
    if (index === -1) return;
    assets[index] = { ...assets[index], ...updates, lastUpdated: this.now() };
    this.set(this.KEYS.ASSETS, assets);
  },

  // ===== 部门与位置对照表 =====
  getLocations() {
    return this.get(this.KEYS.LOCATIONS);
  },

  addLocation(loc) {
    const locations = this.getLocations();
    loc.id = this.generateId();
    locations.push(loc);
    this.set(this.KEYS.LOCATIONS, locations);
    return loc;
  },

  updateLocation(id, updates) {
    const locations = this.getLocations();
    const index = locations.findIndex(l => l.id === id);
    if (index === -1) return null;
    locations[index] = { ...locations[index], ...updates };
    this.set(this.KEYS.LOCATIONS, locations);
    return locations[index];
  },

  deleteLocation(id) {
    const locations = this.getLocations().filter(l => l.id !== id);
    this.set(this.KEYS.LOCATIONS, locations);
  },

  // ===== 纸质档案登记 =====
  getArchives() {
    return this.get(this.KEYS.ARCHIVES);
  },

  addArchive(archive) {
    const archives = this.getArchives();
    archive.id = this.generateId();
    archive.archiveNo = this.generateSerialNo('DA');
    archive.createdAt = this.now();
    archives.push(archive);
    this.set(this.KEYS.ARCHIVES, archives);
    return archive;
  },

  updateArchive(id, updates) {
    const archives = this.getArchives();
    const index = archives.findIndex(a => a.id === id);
    if (index === -1) return null;
    archives[index] = { ...archives[index], ...updates };
    this.set(this.KEYS.ARCHIVES, archives);
    return archives[index];
  },

  deleteArchive(id) {
    const archives = this.getArchives().filter(a => a.id !== id);
    this.set(this.KEYS.ARCHIVES, archives);
  },

  // ===== 从Excel导入数据 =====
  async importFromJSON() {
    try {
      const response = await fetch('/assets/import_data.json');
      if (!response.ok) throw new Error('Failed to load data');
      const data = await response.json();

      // 导入资产
      if (data.assets && data.assets.length > 0) {
        const assetsWithId = data.assets.map(a => ({
          ...a,
          id: this.generateId(),
          lastUpdated: this.now()
        }));
        this.set(this.KEYS.ASSETS, assetsWithId);
      }

      // 导入签收记录
      if (data.signRecords && data.signRecords.length > 0) {
        const signWithId = data.signRecords.map((r, i) => ({
          ...r,
          id: this.generateId(),
          serialNo: `QS-IMP-${String(i + 1).padStart(4, '0')}`,
          createdAt: this.now()
        }));
        this.set(this.KEYS.SIGN_RECORDS, signWithId);
      }

      // 导入归还记录
      if (data.returnRecords && data.returnRecords.length > 0) {
        const returnWithId = data.returnRecords.map((r, i) => ({
          ...r,
          id: this.generateId(),
          serialNo: `GH-IMP-${String(i + 1).padStart(4, '0')}`,
          createdAt: this.now()
        }));
        this.set(this.KEYS.RETURN_RECORDS, returnWithId);
      }

      // 导入位置
      if (data.locations && data.locations.length > 0) {
        const locsWithId = data.locations.map(l => ({
          ...l,
          id: this.generateId()
        }));
        this.set(this.KEYS.LOCATIONS, locsWithId);
      }

      // 导入档案（限制前500条，避免localStorage超限）
      if (data.archives && data.archives.length > 0) {
        const limitedArchives = data.archives.slice(0, 500);
        const archWithId = limitedArchives.map((a, i) => ({
          ...a,
          id: this.generateId(),
          archiveNo: `DA-IMP-${String(i + 1).padStart(4, '0')}`,
          createdAt: this.now()
        }));
        this.set(this.KEYS.ARCHIVES, archWithId);
      }

      // 标记已导入
      localStorage.setItem('ams_data_imported', 'true');

      return {
        assets: data.assets ? data.assets.length : 0,
        signRecords: data.signRecords ? data.signRecords.length : 0,
        returnRecords: data.returnRecords ? data.returnRecords.length : 0,
        locations: data.locations ? data.locations.length : 0,
        archives: data.archives ? Math.min(data.archives.length, 500) : 0,
      };
    } catch (e) {
      console.error('Import error:', e);
      return null;
    }
  },

  // 检查是否已导入Excel数据
  isDataImported() {
    return localStorage.getItem('ams_data_imported') === 'true';
  },

  // ===== 初始化示例数据 =====
  initSampleData() {
    if (this.getAssets().length > 0) return; // 已有数据则不初始化

    const sampleAssets = [
      { assetCode: 'ZC-2024-001', deviceName: 'ThinkPad T14s', deviceType: '笔记本', department: '技术部', currentUser: '张三', location: 'A栋3楼301', status: '在用', acquisitionYear: '2024', remark: 'i7/16G/512G' },
      { assetCode: 'ZC-2024-002', deviceName: 'Dell OptiPlex 7090', deviceType: '台式机', department: '财务部', currentUser: '李四', location: 'B栋2楼205', status: '在用', acquisitionYear: '2024', remark: 'i5/16G/256G SSD' },
      { assetCode: 'ZC-2024-003', deviceName: 'Dell U2723QE', deviceType: '显示器', department: '设计部', currentUser: '', location: 'C栋1楼仓库', status: '闲置', acquisitionYear: '2024', remark: '27寸4K' },
      { assetCode: 'ZC-2023-004', deviceName: 'HP LaserJet Pro M404', deviceType: '打印机', department: '行政部', currentUser: '', location: 'A栋3楼公共区', status: '维修中', acquisitionYear: '2023', remark: '黑白激光' },
      { assetCode: 'ZC-2023-005', deviceName: 'Cisco Catalyst 2960', deviceType: '网络设备', department: '技术部', currentUser: '', location: 'A栋机房', status: '在用', acquisitionYear: '2023', remark: '48口千兆交换机' },
      { assetCode: 'ZC-2022-006', deviceName: 'MacBook Pro 14', deviceType: '笔记本', department: '设计部', currentUser: '王五', location: 'C栋2楼201', status: '在用', acquisitionYear: '2022', remark: 'M1 Pro/16G/512G' },
      { assetCode: 'ZC-2022-007', deviceName: 'Lenovo ThinkCentre M920', deviceType: '台式机', department: '', currentUser: '', location: 'B栋2楼仓库', status: '已报废', acquisitionYear: '2022', remark: '主板损坏，无维修价值' },
      { assetCode: 'ZC-2024-008', deviceName: 'Adobe Creative Cloud', deviceType: '软件', department: '设计部', currentUser: '王五', location: '-', status: '在用', acquisitionYear: '2024', remark: '年度订阅' },
    ];

    sampleAssets.forEach(a => this.addAsset(a));

    const sampleLocations = [
      { locationCode: 'A-301', locationDesc: '技术部办公区', deptCode: 'TECH', deptName: '技术部', floor: '3' },
      { locationCode: 'A-302', locationDesc: '技术部会议室', deptCode: 'TECH', deptName: '技术部', floor: '3' },
      { locationCode: 'B-205', locationDesc: '财务部办公区', deptCode: 'FIN', deptName: '财务部', floor: '2' },
      { locationCode: 'C-201', locationDesc: '设计部办公区', deptCode: 'DES', deptName: '设计部', floor: '2' },
      { locationCode: 'A-JF', locationDesc: 'A栋机房', deptCode: 'TECH', deptName: '技术部', floor: '1' },
    ];

    sampleLocations.forEach(l => this.addLocation(l));
  }
};

// 导出到全局
window.DataStore = DataStore;
