import React from 'react';
import { UsersDatabase, Order, MergedInvoice, ReceivedInvoice, ReturnOrder } from '../types';

interface AdminPanelsProps {
  activeTab: string;
  users: UsersDatabase;
  onAddUser: (key: string, name: string, role: 'branch' | 'wh', pass: string) => void;
  onUpdateUserPassword: (key: string, pass: string) => void;
  onDeleteUser: (key: string) => void;
  orders: Order[];
  adminTrackInput: string;
  setAdminTrackInput: (val: string) => void;
  adminBackupOutput: string;
  adminBackupInput: string;
  setAdminBackupInput: (val: string) => void;
  onGenerateBackup: () => void;
  onRestoreBackup: () => void;
  onClearSystemData: () => void;
  mergedInvoices: MergedInvoice[];
  onViewInvoice: (invoiceCode: string, type: 'sent' | 'wh_received' | 'merged' | 'closed' | 'received') => void;
  receivedInvoices?: ReceivedInvoice[];
  returnsOrders?: ReturnOrder[];
}

export const AdminPanels: React.FC<AdminPanelsProps> = ({
  activeTab,
  users,
  onAddUser,
  onUpdateUserPassword,
  onDeleteUser,
  orders,
  adminTrackInput,
  setAdminTrackInput,
  adminBackupOutput,
  adminBackupInput,
  setAdminBackupInput,
  onGenerateBackup,
  onRestoreBackup,
  onClearSystemData,
  mergedInvoices,
  onViewInvoice,
  receivedInvoices = [],
  returnsOrders = [],
}) => {
  // Add User Form States
  const [key, setKey] = React.useState('');
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState<'branch' | 'wh'>('branch');
  const [pass, setPass] = React.useState('');

  // Merged Invoices Local Search
  const [localSearchMerged, setLocalSearchMerged] = React.useState('');

  // Password Input Record per User
  const [updates, setUpdates] = React.useState<Record<string, string>>({});

  // Monitor States
  const branchKeys = React.useMemo(() => Object.keys(users).filter((k) => users[k].role === 'branch'), [users]);
  const whKeys = React.useMemo(() => Object.keys(users).filter((k) => users[k].role === 'wh'), [users]);

  const [selectedBranchKey, setSelectedBranchKey] = React.useState(branchKeys[0] || '');
  const [selectedWhKey, setSelectedWhKey] = React.useState(whKeys[0] || '');

  const [branchDate, setBranchDate] = React.useState('');
  const [branchMonth, setBranchMonth] = React.useState('');

  const [whDate, setWhDate] = React.useState('');
  const [whMonth, setWhMonth] = React.useState('');

  React.useEffect(() => {
    if (branchKeys.length > 0 && !selectedBranchKey) {
      setSelectedBranchKey(branchKeys[0]);
    }
  }, [branchKeys, selectedBranchKey]);

  React.useEffect(() => {
    if (whKeys.length > 0 && !selectedWhKey) {
      setSelectedWhKey(whKeys[0]);
    }
  }, [whKeys, selectedWhKey]);

  React.useEffect(() => {
    const defaultUpdates: Record<string, string> = {};
    Object.keys(users).forEach((k) => {
      try {
        defaultUpdates[k] = atob(users[k].pass);
      } catch (e) {
        defaultUpdates[k] = '';
      }
    });
    setUpdates(defaultUpdates);
  }, [users]);

  if (activeTab === 'admin-users') {
    return (
      <div id="admin-users" className="panel active" dir="rtl">
        <h2>👥 لوحة التحكم بالحسابات والصلاحيات</h2>
        <div className="form-row">
          <div className="form-group">
            <label>كود المستخدم (اسم الحساب للانترنت)</label>
            <input
              type="text"
              placeholder="مثال: rabea"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>الاسم الكامل للمستخدم</label>
            <input
              type="text"
              placeholder="مثال: معرض ربيعة"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>نوع الصلاحية الكلية</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'branch' | 'wh')}
            >
              <option value="branch">معرض / فرع (طلب وإرسال نواقص ومرتجع)</option>
              <option value="wh">مخزن / مستودع (صرف واستلام وتأكيد)</option>
            </select>
          </div>
          <div className="form-group">
            <label>كلمة المرور الجديدة</label>
            <input
              type="text"
              placeholder="اكتب كلمة السر"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>
          <button
            className="btn btn-success"
            onClick={() => {
              onAddUser(key, name, role, pass);
              setKey('');
              setName('');
              setPass('');
            }}
          >
            ➕ حفظ الحساب
          </button>
        </div>

        <h3>📋 قائمة الحسابات النشطة بالنظام الحالية</h3>
        <table id="table-admin-users-list">
          <thead>
            <tr>
              <th>كود الحساب</th>
              <th>الاسم الكامل للجهة</th>
              <th>نوع الصلاحية</th>
              <th>تعديل كلمة المرور</th>
              <th>إجراءات الإدارة</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(users).map((uKey) => {
              const u = users[uKey];
              const roleText =
                u.role === 'admin'
                  ? 'مدير عام مطلق'
                  : u.role === 'branch'
                  ? 'معرض / فرع طالب'
                  : 'مخزن صرف وتوريد';
              return (
                <tr key={uKey}>
                  <td>
                    <strong>{uKey}</strong>
                  </td>
                  <td>{u.name}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-closed' : 'badge-info'}`}>
                      {roleText}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="adm-pass-input"
                        value={updates[uKey] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUpdates((prev) => ({ ...prev, [uKey]: val }));
                        }}
                      />
                      <button
                        className="btn btn-warning btn-sm"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={() => onUpdateUserPassword(uKey, updates[uKey] || '')}
                      >
                        💾 حفظ
                      </button>
                    </div>
                  </td>
                  <td>
                    {uKey !== 'admin' ? (
                      <button className="btn btn-danger btn-sm" onClick={() => onDeleteUser(uKey)}>
                        🗑️ حذف الحساب
                      </button>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>غير قابل للتعديل</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'admin-item-track') {
    const filteredOrders = orders.filter((o) =>
      o.item.toLowerCase().includes(adminTrackInput.toLowerCase())
    );

    const filteredInvoices = mergedInvoices.filter((inv) => {
      const branchesList = Object.keys(inv.branches).join(' ');
      const textBlock = `${inv.invoiceNumber} ${inv.warehouse} ${branchesList} ${inv.date}`.toLowerCase();
      return textBlock.includes(localSearchMerged.toLowerCase());
    });

    return (
      <div id="admin-item-track" className="panel active" dir="rtl">
        <h2>🔍 كشف حساب تفصيلي كلي لحركة صنف</h2>
        <div className="search-filter-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ marginBottom: '8px', display: 'block' }}>
              اكتب اسم الصنف بالكامل أو جزء منه لمراقبته فوراً:
            </label>
            <input
              type="text"
              placeholder="✏️ اكتب هنا اسم الصنف للبحث المتكامل عبر جميع الفروع والمستودعات..."
              value={adminTrackInput}
              onChange={(e) => setAdminTrackInput(e.target.value)}
            />
          </div>
        </div>
        <table id="table-admin-item-track">
          <thead>
            <tr>
              <th>تاريخ الحركة</th>
              <th>المعرض الطالب</th>
              <th>رقم مستند الفاتورة</th>
              <th>المخزن المورد</th>
              <th>الكمية المطلوبة</th>
              <th>المنصرف فعلياً</th>
              <th>العجز المتبقي</th>
              <th>حالة الحركة الكلية</th>
            </tr>
          </thead>
          <tbody>
            {!adminTrackInput ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  يرجى كتابة اسم الصنف بالأعلى لتوليد كشف الحساب والتقارير التفصيلية المباشرة له.
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--danger)', padding: '20px' }}>
                  ❌ لم يتم العثور على أي تحركات أو فواتير مسجلة لهذا الصنف في أي معرض أو مخزن.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const req = o.qty || 0;
                const disp = o.dispatchQty || 0;
                const rem = req - disp;
                return (
                  <tr key={o.id}>
                    <td>{o.date}</td>
                    <td>
                      <strong>{o.branch}</strong>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace' }}>{o.invoiceCode}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{o.source || 'في انتظار الصرف'}</span>
                    </td>
                    <td>
                      <strong>{req}</strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{disp}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          color: rem > 0 ? 'var(--danger)' : 'var(--text-light)',
                          fontWeight: 'bold',
                        }}
                      >
                        {rem}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${disp >= req ? 'badge-success' : 'badge-pending'}`}>
                        {disp >= req ? 'واصل كامل' : 'واصل جزئي / قيد التوريد'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Section divider */}
        <hr style={{ margin: '40px 0', borderColor: 'var(--border-color)', borderWidth: '2px' }} />

        {/* Permanently displayed Today's Merged Invoices Section */}
        <div id="admin-merged-archive-section">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 قسم مرسلة مدمجة اليوم (الربط العام الموحد)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '15px' }}>
            مستندات الربط والتوريد اليومية الصادرة من المخازن والمدمجة لجميع الفروع والمعارض الحالية.
          </p>
          <div className="search-filter-row">
            <div className="form-group" style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="🔍 بحث برقم الفاتورة المدمجة، المخزن، أو المعارض المشتركة..."
                value={localSearchMerged}
                onChange={(e) => setLocalSearchMerged(e.target.value)}
              />
            </div>
          </div>
          <table id="table-admin-merged-archive">
            <thead>
              <tr>
                <th>الرقم التسلسلي</th>
                <th>رقم الفاتورة المدمجة</th>
                <th>المخزن الصادر</th>
                <th>المعارض المشتركة</th>
                <th>عدد الأصناف</th>
                <th>إجمالي المنصرف</th>
                <th>التاريخ</th>
                <th>التحكم والتأكيد</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    لا توجد فواتير مدمجة مطابقة للبحث اليوم
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const totalQty = inv.items.reduce((sum, item) => sum + (item.dispatchQty || 0), 0);
                  const branchList = Object.keys(inv.branches).join(' ، ');
                  return (
                    <tr key={inv.id}>
                      <td>
                        <strong>{idx + 1}</strong>
                      </td>
                      <td>
                        <strong>{inv.invoiceNumber}</strong>
                      </td>
                      <td>
                        <span className="badge badge-info">{inv.warehouse}</span>
                      </td>
                      <td>{branchList}</td>
                      <td>{inv.items.length} صنف</td>
                      <td>
                        <strong>{totalQty} وحدة</strong>
                      </td>
                      <td>{inv.date}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-view"
                          onClick={() => onViewInvoice(inv.invoiceNumber, 'merged')}
                        >
                          👁️ تفقد شامل وعرض
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'admin-monitor') {
    const selectedBranchName = users[selectedBranchKey]?.name || '';
    const selectedWhName = users[selectedWhKey]?.name || '';

    // --- Branch filtering and calculation ---
    let branchSentOrders = orders.filter((o) => o.branch === selectedBranchName && o.type === 'جاهز للمخزن');
    if (branchDate) {
      branchSentOrders = branchSentOrders.filter((o) => o.date === branchDate);
    }
    if (branchMonth) {
      branchSentOrders = branchSentOrders.filter((o) => o.date.startsWith(branchMonth));
    }

    const branchSentInvoices: Record<string, Order[]> = {};
    branchSentOrders.forEach((o) => {
      if (!branchSentInvoices[o.invoiceCode]) {
        branchSentInvoices[o.invoiceCode] = [];
      }
      branchSentInvoices[o.invoiceCode].push(o);
    });

    let branchRecInvoices = receivedInvoices.filter((ri) => ri.branch === selectedBranchName);
    if (branchDate) {
      branchRecInvoices = branchRecInvoices.filter((ri) => ri.date === branchDate);
    }
    if (branchMonth) {
      branchRecInvoices = branchRecInvoices.filter((ri) => ri.date.startsWith(branchMonth));
    }

    // --- Warehouse filtering and calculation ---
    let whRecReturns = returnsOrders.filter((r) => r.receivedBy === selectedWhName && r.status === 'تم الاستلام بنجاح');
    if (whDate) {
      whRecReturns = whRecReturns.filter((r) => (r.receivedDate || r.date) === whDate);
    }
    if (whMonth) {
      whRecReturns = whRecReturns.filter((r) => (r.receivedDate || r.date).startsWith(whMonth));
    }

    const whReturnInvoices: Record<string, ReturnOrder[]> = {};
    whRecReturns.forEach((r) => {
      if (!whReturnInvoices[r.returnCode]) {
        whReturnInvoices[r.returnCode] = [];
      }
      whReturnInvoices[r.returnCode].push(r);
    });

    let whDispatchedOrders = orders.filter((o) => o.source === selectedWhName && (o.status === 'تم الصرف' || o.status === 'تم الأرشفة' || o.isDispatched));
    if (whDate) {
      whDispatchedOrders = whDispatchedOrders.filter((o) => (o.dispatchDate || o.date) === whDate);
    }
    if (whMonth) {
      whDispatchedOrders = whDispatchedOrders.filter((o) => (o.dispatchDate || o.date).startsWith(whMonth));
    }

    const whDispatchedInvoices: Record<string, Order[]> = {};
    whDispatchedOrders.forEach((o) => {
      const groupKey = `${o.invoiceCode}-${o.branch}`;
      if (!whDispatchedInvoices[groupKey]) {
        whDispatchedInvoices[groupKey] = [];
      }
      whDispatchedInvoices[groupKey].push(o);
    });

    return (
      <div id="admin-monitor" className="panel active" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* 1. SECTION FOR SHOWROOMS / BRANCHES */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #cbd5e1', paddingBottom: '15px' }}>
            <div>
              <h2 style={{ fontSize: '20px', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏢 رقابة ومطابقة حركة المعارض (كل معرض على حدة)
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                متابعة دقيقة لكل ما طلبه المعرض بقسم المرسلات وما وصله فعلياً مع تحديد المخزن المورد بقسم المستلم.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>اختر المعرض:</label>
                <select 
                  value={selectedBranchKey} 
                  onChange={(e) => setSelectedBranchKey(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                >
                  {branchKeys.map(k => (
                    <option key={k} value={k}>{users[k].name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>فلترة باليوم (الأرشيف اليومي):</label>
                <input 
                  type="date" 
                  value={branchDate} 
                  onChange={(e) => {
                    setBranchDate(e.target.value);
                    if (e.target.value) setBranchMonth(''); // Clear month if date chosen
                  }}
                  style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>فلترة بالشهر (الأرشيف الشهري):</label>
                <input 
                  type="month" 
                  value={branchMonth} 
                  onChange={(e) => {
                    setBranchMonth(e.target.value);
                    if (e.target.value) setBranchDate(''); // Clear date if month chosen
                  }}
                  style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {(branchDate || branchMonth) && (
                <button 
                  className="btn btn-sm" 
                  onClick={() => { setBranchDate(''); setBranchMonth(''); }}
                  style={{ marginTop: '20px', background: '#94a3b8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  🧹 إعادة تعيين الفلترة
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }} className="grid md:grid-cols-2 gap-6">
            
            {/* 1-A. قسم مرسل */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📤 قسم المرسلات (الطلبيات والنواقص المرسلة من المعرض)
                </h3>
                <span className="badge badge-info" style={{ fontSize: '12px', padding: '4px 10px' }}>
                  {Object.keys(branchSentInvoices).length} فواتير مطلوبة
                </span>
              </div>

              {Object.keys(branchSentInvoices).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  📭 لا توجد فواتير أو طلبيات مرسلة مسجلة لهذا المعرض للفترة المحددة.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '550px', overflowY: 'auto', paddingLeft: '4px' }}>
                  {Object.keys(branchSentInvoices).reverse().map((invCode) => {
                    const items = branchSentInvoices[invCode];
                    const firstItem = items[0];
                    const allArchived = items.every((i) => i.status === 'تم الأرشفة' || i.warehouseClosed);
                    const allPending = items.every((i) => i.status === 'قيد الانتظار');
                    
                    let badgeColor = 'badge-pending';
                    let statusLabel = 'قيد الانتظار بالمخازن';
                    if (allArchived) {
                      badgeColor = 'badge-closed';
                      statusLabel = 'تم الاستلام والإغلاق';
                    } else if (allPending) {
                      badgeColor = 'badge-pending';
                      statusLabel = 'بانتظار الصرف';
                    } else if (items.some((i) => i.status === 'تم الصرف')) {
                      badgeColor = 'badge-success';
                      statusLabel = 'جاهز للاستلام / منصرف';
                    }

                    return (
                      <div key={invCode} style={{ border: '1px solid #f1f5f9', borderRadius: '8px', padding: '12px', background: '#fafafb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '5px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#334155' }}>
                            📄 كود الفاتورة: <strong style={{ color: 'var(--primary-blue)', fontFamily: 'monospace' }}>{invCode}</strong>
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>📅 تاريخ الطلب: {firstItem?.date}</span>
                          <span className={`badge ${badgeColor}`} style={{ fontSize: '11px' }}>{statusLabel}</span>
                        </div>

                        <table className="table-mini" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginTop: '5px' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '6px', textAlign: 'right' }}>اسم الصنف</th>
                              <th style={{ padding: '6px', textAlign: 'center' }}>الكمية المطلوبة</th>
                              <th style={{ padding: '6px', textAlign: 'center' }}>المنصرف فعلياً</th>
                              <th style={{ padding: '6px', textAlign: 'center' }}>العجز المتبقي</th>
                              <th style={{ padding: '6px', textAlign: 'center' }}>المخزن المورد</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it) => {
                              const deficit = it.qty - it.dispatchQty;
                              return (
                                <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px', fontWeight: '500' }}>{it.item}</td>
                                  <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{it.qty}</td>
                                  <td style={{ padding: '6px', textAlign: 'center', color: 'var(--success)', fontWeight: 'bold' }}>{it.dispatchQty || 0}</td>
                                  <td style={{ padding: '6px', textAlign: 'center', color: deficit > 0 ? 'var(--danger)' : '#64748b', fontWeight: 'bold' }}>
                                    {deficit}
                                  </td>
                                  <td style={{ padding: '6px', textAlign: 'center' }}>
                                    {it.source ? (
                                      <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 6px' }}>{it.source}</span>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 1-B. قسم مستلم */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📥 قسم المستلمات (المطابقة والوارد الفعلي الواصل للمعرض)
                </h3>
                <span className="badge badge-success" style={{ fontSize: '12px', padding: '4px 10px', background: '#10b981' }}>
                  {branchRecInvoices.length} مستندات مستلمة
                </span>
              </div>

              {branchRecInvoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  📭 لا توجد فواتير أو شحنات مستلمة مسجلة في هذا المعرض للفترة المحددة.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '550px', overflowY: 'auto', paddingLeft: '4px' }}>
                  {branchRecInvoices.slice().reverse().map((rec) => {
                    return (
                      <div key={rec.id} style={{ border: '1px solid #f1f5f9', borderRadius: '8px', padding: '12px', background: '#fafafb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '5px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#334155' }}>
                            📋 فاتورة مدمجة: <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{rec.mergedInvoiceNumber}</strong>
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>📅 تاريخ الاستلام: {rec.date}</span>
                          <span className="badge badge-closed" style={{ fontSize: '11px', background: '#1e293b' }}>
                            🚚 من: {rec.source}
                          </span>
                        </div>

                        <table className="table-mini" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginTop: '5px' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '6px', textAlign: 'right' }}>اسم الصنف</th>
                              <th style={{ padding: '6px', textAlign: 'center' }}>الكمية المطلوبة أصلاً</th>
                              <th style={{ padding: '6px', textAlign: 'center' }}>الكمية المستلمة فعلياً</th>
                              <th style={{ padding: '6px', textAlign: 'center' }}>عجز الفاتورة الكلية</th>
                              <th style={{ padding: '6px', textAlign: 'center' }}>الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rec.items.map((it, idx) => {
                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px', fontWeight: '500' }}>{it.item}</td>
                                  <td style={{ padding: '6px', textAlign: 'center' }}>{it.qty}</td>
                                  <td style={{ padding: '6px', textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>{it.dispatchQty}</td>
                                  <td style={{ padding: '6px', textAlign: 'center', color: it.remainingQty > 0 ? 'var(--danger)' : '#64748b', fontWeight: 'bold' }}>
                                    {it.remainingQty}
                                  </td>
                                  <td style={{ padding: '6px', textAlign: 'center' }}>
                                    <span className={`badge ${it.remainingQty === 0 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                      {it.remainingQty === 0 ? 'كامل ومطابق' : 'عجز ترحيل متبقي'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 2. SECTION FOR WAREHOUSES */}
        <div style={{ background: '#faf5ff', padding: '20px', borderRadius: '12px', border: '1px solid #f3e8ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #e9d5ff', paddingBottom: '15px' }}>
            <div>
              <h2 style={{ fontSize: '20px', color: '#581c87', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                📦 رقابة ومطابقة حركة المخازن والمستودعات (كل مخزن على حدة)
              </h2>
              <p style={{ fontSize: '13px', color: '#701a75', margin: '4px 0 0 0' }}>
                متابعة دقيقة لكل ما استلمه المخزن من مرتجعات بقسم مستلم، وكافة الشحنات التي تم صرفها لأي معرض بقسم منصرف.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b21a8', display: 'block', marginBottom: '4px' }}>اختر المخزن:</label>
                <select 
                  value={selectedWhKey} 
                  onChange={(e) => setSelectedWhKey(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                >
                  {whKeys.map(k => (
                    <option key={k} value={k}>{users[k].name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b21a8', display: 'block', marginBottom: '4px' }}>فلترة باليوم (الأرشيف اليومي):</label>
                <input 
                  type="date" 
                  value={whDate} 
                  onChange={(e) => {
                    setWhDate(e.target.value);
                    if (e.target.value) setWhMonth(''); // Clear month if date chosen
                  }}
                  style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b21a8', display: 'block', marginBottom: '4px' }}>فلترة بالشهر (الأرشيف الشهري):</label>
                <input 
                  type="month" 
                  value={whMonth} 
                  onChange={(e) => {
                    setWhMonth(e.target.value);
                    if (e.target.value) setWhDate(''); // Clear date if month chosen
                  }}
                  style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {(whDate || whMonth) && (
                <button 
                  className="btn btn-sm" 
                  onClick={() => { setWhDate(''); setWhMonth(''); }}
                  style={{ marginTop: '20px', background: '#c084fc', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  🧹 إعادة تعيين الفلترة
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }} className="grid md:grid-cols-2 gap-6">
            
            {/* 2-A. قسم مستلم (المرتجع الوارد للمستودع) */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '10px', border: '1px solid #f3e8ff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f3e8ff', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', color: '#581c87', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📥 قسم مستلم (المرتجع الفعلي المعتمد في المخزن)
                </h3>
                <span className="badge badge-success" style={{ fontSize: '12px', padding: '4px 10px', background: '#a855f7' }}>
                  {Object.keys(whReturnInvoices).length} مستندات مرتجعة
                </span>
              </div>

              {Object.keys(whReturnInvoices).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#c084fc' }}>
                  📭 لا توجد مرتجعات مستلمة ومؤرشفة في هذا المخزن للفترة المحددة.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '550px', overflowY: 'auto', paddingLeft: '4px' }}>
                  {Object.keys(whReturnInvoices).reverse().map((retCode) => {
                    const items = whReturnInvoices[retCode];
                    const firstItem = items[0];
                    return (
                      <div key={retCode} style={{ border: '1px solid #f3e8ff', borderRadius: '8px', padding: '12px', background: '#faf5ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '5px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#581c87' }}>
                            🔙 مستند مرتجع: <strong style={{ color: '#a855f7', fontFamily: 'monospace' }}>{retCode}</strong>
                          </span>
                          <span style={{ fontSize: '11px', color: '#6b21a8' }}>📅 تاريخ الاستلام: {firstItem?.receivedDate || firstItem?.date}</span>
                          <span className="badge badge-closed" style={{ fontSize: '11px', background: '#581c87', color: '#fff' }}>
                            🏢 من: {firstItem?.branch}
                          </span>
                        </div>

                        <table className="table-mini" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginTop: '5px' }}>
                          <thead>
                            <tr style={{ background: '#f3e8ff', borderBottom: '1px solid #e9d5ff' }}>
                              <th style={{ padding: '6px', textAlign: 'right', color: '#581c87' }}>اسم الصنف المرتجع</th>
                              <th style={{ padding: '6px', textAlign: 'center', color: '#581c87' }}>الكمية المستلمة</th>
                              <th style={{ padding: '6px', textAlign: 'center', color: '#581c87' }}>حالة الاستلام</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it) => {
                              return (
                                <tr key={it.id} style={{ borderBottom: '1px solid #f3e8ff' }}>
                                  <td style={{ padding: '6px', fontWeight: '500' }}>{it.item}</td>
                                  <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold', color: '#a855f7' }}>{it.qty}</td>
                                  <td style={{ padding: '6px', textAlign: 'center' }}>
                                    <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px', background: '#10b981' }}>
                                      تم الاستلام والتدقيق
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2-B. قسم منصرف (الشحنات الصادرة من المستودع) */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '10px', border: '1px solid #f3e8ff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f3e8ff', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', color: '#581c87', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📤 قسم منصرف (شحنات الصرف الصادرة ومطابقتها الفروع)
                </h3>
                <span className="badge badge-info" style={{ fontSize: '12px', padding: '4px 10px', background: '#3b82f6' }}>
                  {Object.keys(whDispatchedInvoices).length} شحنات منصرفة
                </span>
              </div>

              {Object.keys(whDispatchedInvoices).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#c084fc' }}>
                  📭 لا توجد شحنات منصرفة مسجلة لهذا المخزن للفترة المحددة.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '550px', overflowY: 'auto', paddingLeft: '4px' }}>
                  {Object.keys(whDispatchedInvoices).reverse().map((groupKey) => {
                    const items = whDispatchedInvoices[groupKey];
                    const firstItem = items[0];
                    return (
                      <div key={groupKey} style={{ border: '1px solid #f3e8ff', borderRadius: '8px', padding: '12px', background: '#faf5ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '5px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#581c87' }}>
                            📦 كود الشحنة: <strong style={{ color: '#3b82f6', fontFamily: 'monospace' }}>{firstItem?.invoiceCode}</strong>
                          </span>
                          <span style={{ fontSize: '11px', color: '#6b21a8' }}>📅 تاريخ الصرف: {firstItem?.dispatchDate || firstItem?.date}</span>
                          <span className="badge badge-closed" style={{ fontSize: '11px', background: '#10b981', color: '#fff' }}>
                            🏢 إلى: {firstItem?.branch}
                          </span>
                        </div>

                        <table className="table-mini" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginTop: '5px' }}>
                          <thead>
                            <tr style={{ background: '#f3e8ff', borderBottom: '1px solid #e9d5ff' }}>
                              <th style={{ padding: '6px', textAlign: 'right', color: '#581c87' }}>اسم الصنف</th>
                              <th style={{ padding: '6px', textAlign: 'center', color: '#581c87' }}>الكمية المطلوبة</th>
                              <th style={{ padding: '6px', textAlign: 'center', color: '#581c87' }}>المنصرف فعلياً</th>
                              <th style={{ padding: '6px', textAlign: 'center', color: '#581c87' }}>العجز المتبقي</th>
                              <th style={{ padding: '6px', textAlign: 'center', color: '#581c87' }}>الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it) => {
                              const deficit = it.qty - it.dispatchQty;
                              return (
                                <tr key={it.id} style={{ borderBottom: '1px solid #f3e8ff' }}>
                                  <td style={{ padding: '6px', fontWeight: '500' }}>{it.item}</td>
                                  <td style={{ padding: '6px', textAlign: 'center' }}>{it.qty}</td>
                                  <td style={{ padding: '6px', textAlign: 'center', color: 'var(--success)', fontWeight: 'bold' }}>{it.dispatchQty}</td>
                                  <td style={{ padding: '6px', textAlign: 'center', color: deficit > 0 ? 'var(--danger)' : '#64748b', fontWeight: 'bold' }}>
                                    {deficit}
                                  </td>
                                  <td style={{ padding: '6px', textAlign: 'center' }}>
                                    <span className={`badge ${deficit === 0 ? 'badge-success' : 'badge-pending'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                      {deficit === 0 ? 'تم الصرف بالكامل' : 'عجز جزئي متبقي'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    );
  }

  if (activeTab === 'admin-backup') {
    return (
      <div id="admin-backup" className="panel active" dir="rtl">
        <h2>💾 إدارة نظام الأرشفة والنسخ الاحتياطي المشفر يدوياً</h2>
        <div
          style={{
            background: '#eef2f7',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            marginBottom: '25px',
          }}
        >
          <h3>📤 توليد نسخة احتياطية مشفرة جديدة</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '12px' }}>
            عند الضغط على الزر، سيقوم النظام بجمع كافة الفواتير، الإعدادات، الحسابات، والمرتجعات،
            وتشفيرها في كود نصي موحد يمكنك حفظه في ملف خارجي.
          </p>
          <button className="btn btn-primary" onClick={onGenerateBackup}>
            🔒 توليد الكود المشفر وتصديره
          </button>
          <textarea
            style={{
              marginTop: '12px',
              height: '100px',
              fontFamily: 'monospace',
              fontSize: '12px',
              resize: 'vertical',
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
            }}
            placeholder="سيظهر الكود المشفر هنا..."
            value={adminBackupOutput}
            readOnly
          />
        </div>

        <div
          style={{
            background: '#fff3cd',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #ffeeba',
          }}
        >
          <h3>📥 استعادة نسخة احتياطية سابقة يدوياً</h3>
          <p style={{ fontSize: '13px', color: '#856404', marginBottom: '12px' }}>
            ⚠️ تحذير: استعادة النسخة الاحتياطية ستقوم باستبدال كافة البيانات الحالية بالبيانات
            الموجودة داخل الكود المشفر تماماً.
          </p>
          <textarea
            style={{
              height: '100px',
              fontFamily: 'monospace',
              fontSize: '12px',
              resize: 'vertical',
              background: '#fff',
              width: '100%',
              padding: '10px',
              border: '1px solid #ffeeba',
              borderRadius: '8px',
            }}
            placeholder="قم بلصق الكود المشفر هنا لاستعادة البيانات الحسابية الأصلية..."
            value={adminBackupInput}
            onChange={(e) => setAdminBackupInput(e.target.value)}
          />
          <button
            className="btn btn-danger"
            style={{ marginTop: '12px' }}
            onClick={onRestoreBackup}
          >
            🔓 فك التشفير واستعادة النظام بالكامل
          </button>
        </div>

        <div
          style={{
            background: '#f8d7da',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #f5c6cb',
            marginTop: '25px',
          }}
        >
          <h3 style={{ color: '#721c24' }}>🧼 تصفير وتنظيف النظام بالكامل</h3>
          <p style={{ fontSize: '13px', color: '#721c24', marginBottom: '12px' }}>
            🚨 تنبيه هام جداً: هذا الإجراء سيقوم بحذف وإلغاء كافة الفواتير، الطلبيات، المسودات، المرتجعات، وتصفير جميع العدادات التسلسلية لتبدأ من رقم 1 من جديد مع الحفاظ على الحسابات الأساسية والسرية.
          </p>
          <button
            className="btn btn-danger"
            style={{ background: '#dc3545', borderColor: '#dc3545' }}
            onClick={onClearSystemData}
          >
            🧼 مسح كافة البيانات وتصفير النظام
          </button>
        </div>
      </div>
    );
  }

  return null;
};
