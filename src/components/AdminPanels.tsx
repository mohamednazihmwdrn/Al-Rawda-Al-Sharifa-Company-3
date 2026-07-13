import React from 'react';
import { UsersDatabase, Order, MergedInvoice } from '../types';

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
