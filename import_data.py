#!/usr/bin/env python3
"""
Excel数据导入脚本 - 将5个Excel文件的数据整合为系统初始数据
"""
import pandas as pd
import json
import re
from datetime import datetime

# ===== 1. 解析物资总表 =====
def parse_asset_list():
    """解析 Hardware and Software list"""
    path = "assets/hardware_software_list.xlsx"
    assets = []
    
    sheet_type_map = {
        'Desktop': '台式机',
        'Notebook': '笔记本',
        'Printer': '打印机',
        'Monitor': '显示器',
        'Others': '其他',
        'Software': '软件',
        'Network device': '网络设备',
    }
    
    for sheet, device_type in sheet_type_map.items():
        try:
            df = pd.read_excel(path, sheet_name=sheet)
            if df.empty:
                continue
            
            for _, row in df.iterrows():
                code = row.get('財產編號')
                name = row.get('設備名稱')
                
                # 跳过空行
                if pd.isna(code) or pd.isna(name):
                    continue
                
                # 处理资产编号
                code_str = str(int(code)) if isinstance(code, float) and code == int(code) else str(code).strip()
                if not code_str or code_str == 'nan':
                    continue
                
                name_str = str(name).strip()
                dept = str(row.get('部門', '')).strip() if pd.notna(row.get('部門')) else ''
                user = str(row.get('使用者', '')).strip() if pd.notna(row.get('使用者')) else ''
                year_val = row.get('取得年份')
                year_str = str(int(year_val)) if pd.notna(year_val) and isinstance(year_val, (int, float)) else str(year_val).strip() if pd.notna(year_val) else ''
                
                # 处理日期
                date_val = row.get('狀況改變日期')
                date_str = ''
                if pd.notna(date_val):
                    if isinstance(date_val, datetime):
                        date_str = date_val.strftime('%Y-%m-%d')
                    else:
                        date_str = str(date_val).strip()
                
                # 检查Unnamed:6列是否有额外状态信息
                extra = ''
                if 'Unnamed: 6' in df.columns:
                    extra_val = row.get('Unnamed: 6')
                    if pd.notna(extra_val):
                        extra = str(extra_val).strip()
                
                # 推断状态
                status = '在用' if user and user not in ['Public', ''] else '闲置'
                if extra and ('非使用中' in extra or '報廢' in extra or 'Scrap' in extra.lower()):
                    status = '已报废'
                elif extra and '維修' in extra:
                    status = '维修中'
                elif not user or user in ['Public', '']:
                    status = '闲置'
                
                # 生成备注
                remark = f"状况变更日期: {date_str}" if date_str else ''
                
                assets.append({
                    'assetCode': code_str,
                    'deviceName': name_str,
                    'deviceType': device_type,
                    'department': dept,
                    'currentUser': user if user not in ['Public', ''] else '',
                    'location': '',
                    'status': status,
                    'acquisitionYear': year_str,
                    'remark': remark,
                })
        except Exception as e:
            print(f"Error parsing sheet {sheet}: {e}")
    
    print(f"物资总表: 共解析 {len(assets)} 条资产")
    return assets

# ===== 2. 解析签收记录 =====
def parse_sign_records():
    """解析 資訊資產簽收記錄"""
    path = "assets/sign_records.xlsx"
    records = []
    
    type_map = {
        'pc': '台式机', 'desktop': '台式机', 'notebook': '笔记本', 'laptop': '笔记本',
        'monitor': '显示器', 'printer': '打印机', 'others': '其他',
        'mouse': '其他', 'keyboard': '其他', 'ssd': '其他', 'hdd': '其他',
        'scanner': '其他', 'projector': '其他', 'network': '网络设备',
        'tablet': '笔记本', 'ipad': '笔记本', 'dock': '其他',
        'adapter': '其他', 'cable': '其他', 'memory': '其他',
    }
    
    xls = pd.ExcelFile(path)
    for sheet in xls.sheet_names:
        try:
            df = pd.read_excel(path, sheet_name=sheet)
            if df.empty:
                continue
            
            for _, row in df.iterrows():
                code = row.get('資產編號')
                name = row.get('資產名稱')
                
                if pd.isna(code) or pd.isna(name):
                    continue
                
                code_str = str(int(code)) if isinstance(code, float) and not pd.isna(code) and code == int(code) else str(code).strip()
                if not code_str or code_str == 'nan':
                    continue
                
                name_str = str(name).strip()
                dept = str(row.get('部門', '')).strip() if pd.notna(row.get('部門')) else ''
                user = str(row.get('使用者', '')).strip() if pd.notna(row.get('使用者')) else ''
                
                date_val = row.get('交收日期')
                date_str = ''
                if pd.notna(date_val):
                    if isinstance(date_val, datetime):
                        date_str = date_val.strftime('%Y-%m-%d')
                    else:
                        date_str = str(date_val).strip()[:10]
                
                raw_type = str(row.get('類型', '')).strip().lower() if pd.notna(row.get('類型')) else ''
                device_type = type_map.get(raw_type, '其他')
                
                records.append({
                    'date': date_str,
                    'assetCode': code_str,
                    'deviceName': name_str,
                    'signDept': dept,
                    'signPerson': user,
                    'purpose': f'类型: {raw_type}' if raw_type else '',
                })
        except Exception as e:
            print(f"Error parsing sign sheet {sheet}: {e}")
    
    print(f"签收记录: 共解析 {len(records)} 条")
    return records

# ===== 3. 解析归还记录 =====
def parse_return_records():
    """解析 退回資訊資產"""
    path = "assets/return_records.xlsx"
    records = []
    
    xls = pd.ExcelFile(path)
    for sheet in xls.sheet_names:
        try:
            df = pd.read_excel(path, sheet_name=sheet)
            if df.empty:
                continue
            
            for _, row in df.iterrows():
                code = row.get('資產編號')
                name = row.get('資產名稱')
                
                if pd.isna(code) or pd.isna(name):
                    continue
                
                code_str = str(int(code)) if isinstance(code, float) and not pd.isna(code) and code == int(code) else str(code).strip()
                if not code_str or code_str == 'nan':
                    continue
                
                name_str = str(name).strip()
                dept = str(row.get('部門', '')).strip() if pd.notna(row.get('部門')) else ''
                user = str(row.get('使用者', '')).strip() if pd.notna(row.get('使用者')) else ''
                
                date_val = row.get('交收日期')
                date_str = ''
                if pd.notna(date_val):
                    if isinstance(date_val, datetime):
                        date_str = date_val.strftime('%Y-%m-%d')
                    else:
                        date_str = str(date_val).strip()[:10]
                
                records.append({
                    'date': date_str,
                    'assetCode': code_str,
                    'deviceName': name_str,
                    'returnDept': dept,
                    'returnPerson': user,
                    'deviceCondition': '良好',  # 默认良好
                })
        except Exception as e:
            print(f"Error parsing return sheet {sheet}: {e}")
    
    print(f"归还记录: 共解析 {len(records)} 条")
    return records

# ===== 4. 解析位置变更记录 =====
def parse_location_changes():
    """解析 Location change list - 提取部门信息"""
    path = "assets/location_change_list.xlsx"
    departments = set()
    
    # 从物资总表中提取部门
    asset_path = "assets/hardware_software_list.xlsx"
    for sheet in ['Desktop', 'Notebook', 'Printer', 'Monitor', 'Others', 'Software', 'Network device']:
        try:
            df = pd.read_excel(asset_path, sheet_name=sheet)
            for _, row in df.iterrows():
                dept = row.get('部門')
                if pd.notna(dept):
                    dept_str = str(dept).strip()
                    if dept_str and dept_str != 'nan':
                        departments.add(dept_str)
        except:
            pass
    
    # 生成位置对照表
    locations = []
    dept_list = sorted(departments)
    
    # 部门代码映射
    dept_names = {
        'DAF': '财务及行政部', 'DAGRH': '人力资源及总务部', 'DCRE': '企业传讯部',
        'DFCQ': '基金管理及筹款部', 'DGI': '资讯科技部', 'DIn': '内部部门',
        'DM': '市场部', 'DPDO': '项目发展部', 'DPP': '公共关系部',
        'DPTE': '项目培训部', 'DTNE': '培训及教育部', 'GAD': '总行政部门',
        'DPPR': '公共事务部',
    }
    
    for dept_code in dept_list:
        dept_name = dept_names.get(dept_code, dept_code)
        locations.append({
            'locationCode': dept_code,
            'locationDesc': f'{dept_name}办公区',
            'deptCode': dept_code,
            'deptName': dept_name,
            'floor': '',
        })
    
    print(f"部门位置: 共解析 {len(locations)} 个部门")
    return locations

# ===== 5. 解析现场登记 =====
def parse_onsite_register():
    """解析 資產現場登記 - 作为档案记录"""
    path = "assets/onsite_register.xlsx"
    archives = []
    
    xls = pd.ExcelFile(path)
    for sheet in xls.sheet_names:
        try:
            df = pd.read_excel(path, sheet_name=sheet)
            if df.empty:
                continue
            
            for _, row in df.iterrows():
                code = row.get('資產編號')
                name = row.get('資產名稱')
                
                if pd.isna(code) or pd.isna(name):
                    continue
                
                code_str = str(int(code)) if isinstance(code, float) and not pd.isna(code) and code == int(code) else str(code).strip()
                if not code_str or code_str == 'nan':
                    continue
                
                name_str = str(name).strip()
                dept = str(row.get('部門', '')).strip() if pd.notna(row.get('部門')) else ''
                user = str(row.get('使用者', '')).strip() if pd.notna(row.get('使用者')) else ''
                
                date_val = row.get('交收日期')
                date_str = ''
                if pd.notna(date_val):
                    if isinstance(date_val, datetime):
                        date_str = date_val.strftime('%Y-%m-%d')
                    else:
                        date_str = str(date_val).strip()[:10]
                
                raw_type = str(row.get('類型', '')).strip() if pd.notna(row.get('類型')) else ''
                
                archives.append({
                    'relatedSerialNo': '',
                    'type': '签收单',
                    'date': date_str,
                    'person': user,
                    'department': dept,
                    'assetCode': code_str,
                    'content': f'现场登记: {name_str}, 类型: {raw_type}',
                    'signature': user,
                    'storageLocation': f'{sheet}年档案',
                })
        except Exception as e:
            print(f"Error parsing onsite sheet {sheet}: {e}")
    
    print(f"现场登记档案: 共解析 {len(archives)} 条")
    return archives

# ===== 主流程 =====
if __name__ == '__main__':
    print("开始解析Excel文件...")
    
    assets = parse_asset_list()
    sign_records = parse_sign_records()
    return_records = parse_return_records()
    locations = parse_location_changes()
    archives = parse_onsite_register()
    
    # 去重资产（按资产编号）
    seen_codes = set()
    unique_assets = []
    for a in assets:
        if a['assetCode'] not in seen_codes:
            seen_codes.add(a['assetCode'])
            unique_assets.append(a)
    
    print(f"\n去重后资产数: {len(unique_assets)} (原: {len(assets)})")
    
    # 输出为JSON
    data = {
        'assets': unique_assets,
        'signRecords': sign_records,
        'returnRecords': return_records,
        'locations': locations,
        'archives': archives,
    }
    
    with open('assets/import_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n数据已保存到 assets/import_data.json")
    print(f"资产: {len(unique_assets)} 条")
    print(f"签收记录: {len(sign_records)} 条")
    print(f"归还记录: {len(return_records)} 条")
    print(f"部门位置: {len(locations)} 个")
    print(f"档案记录: {len(archives)} 条")
