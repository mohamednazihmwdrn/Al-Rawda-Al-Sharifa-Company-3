import React from 'react';
import {
  UsersDatabase,
  User,
  Order,
  ReturnOrder,
  MergedInvoice,
  ReceivedInvoice,
  InvoiceView,
} from '../types';
import { getToday } from '../utils';

interface WarehousePanelsProps {
  activeTab: string;
  users: UsersDatabase;
  currentUser: User;
  orders: Order[];
  returnsOrders: ReturnOrder[];
  mergedInvoices: MergedInvoice[];
  receivedInvoices: ReceivedInvoice[];
  closedInvoices: MergedInvoice[];
  onDispatchItem: (orderId: number, warehouseName: string) => void;
  onCloseWarehouseInvoice: (warehouseName: string) => void;
  onReceiveReturnItem: (returnId: number, warehouseName: string) => void;
  onViewInvoice: (
    invoiceCode: string,
    type: 'sent' | 'wh_received' | 'merged' | 'closed' | 'received'
  ) => void;
  onPrintBranchArchive: (key: string, type: 'sent' | 'rec', title: string) => void;
  onPrintCustomHtml: (title: string, subtitle: string, html: string, isPdf?: boolean) => void;
  invoiceView: InvoiceView | null;
  onCloseInvoiceDetails: () => void;
  onPrintInvoiceDetails: (isPdf?: boolean) => void;

  whQtyInputs: Record<string, string>;
  setWhQtyInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  searchWhQueries: Record<string, string>;
  setSearchWhQueries: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  searchArchQueries: Record<string, string>;
  setSearchArchQueries: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  searchMergedQuery: string;
  setSearchMergedQuery: (val: string) => void;
}

export const WarehousePanels: React.FC<WarehousePanelsProps> = ({
  activeTab,
  users,
  currentUser,
  orders,
  returnsOrders,
  mergedInvoices,
  receivedInvoices,
  closedInvoices,
  onDispatchItem,
  onCloseWarehouseInvoice,
  onReceiveReturnItem,
  onViewInvoice,
  onPrintBranchArchive,
  onPrintCustomHtml,
  invoiceView,
  onCloseInvoiceDetails,
  onPrintInvoiceDetails,

  whQtyInputs,
  setWhQtyInputs,
  searchWhQueries,
  setSearchWhQueries,
  searchArchQueries,
  setSearchArchQueries,
  searchMergedQuery,
  setSearchMergedQuery,
}) => {
  // 1. Warehouse LIVE panels (*-wh)
  if (activeTab.endsWith('-wh') && activeTab !== 'merged-returns-wh') {
    const userKey = activeTab.replace('-wh', '');
    const user = users[userKey];
    if (!user) return null;

    const warehouseName = user.name;
    const searchQuery = searchWhQueries[userKey] || '';

    // Active orders in warehouse (not closed, either pending or dispatched by this warehouse)
    const activeOrders = orders.filter(
      (o) =>
        o.type === 'جاهز للمخزن' &&
        !o.warehouseClosed &&
        !(o.excludeWarehouse && o.excludeWarehouse.split(',').includes(warehouseName)) &&
        (o.status === 'قيد الانتظار' || (o.status === 'تم الصرف' && o.source === warehouseName))
    );

    const filteredOrders = activeOrders.filter(
      (o) =>
        o.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.invoiceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.item.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePrintLive = (isPdf = false) => {
      let htmlTable = `
        <table style="width:100%; border-collapse:collapse; direction:rtl; margin-top:10px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">#</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:right;">المعرض الطالب</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">رقم الفاتورة الأصلية</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:right;">اسم الصنف ومواصفاته</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">الكمية المطلوبة</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">الصرف الفعلي</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">الحالة والموقف</th>
            </tr>
          </thead>
          <tbody>
      `;

      filteredOrders.forEach((o, index) => {
        const actualDisp = o.status === 'تم الصرف' ? `${o.dispatchQty} وحدات` : 'بانتظار الصرف يدوياً';
        const itemStatus = o.status === 'تم الصرف' ? 'جاهز للغلق والأرشفة' : 'قيد الانتظار بالمستودع';
        htmlTable += `
          <tr>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${index + 1}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right; font-size:11px;"><strong>${o.branch}</strong></td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-family:monospace;">${o.invoiceCode}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right; font-size:11px;"><strong>${o.item}</strong></td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-weight:bold;">${o.qty}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-weight:bold; color:green;">${actualDisp}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${itemStatus}</td>
          </tr>
        `;
      });

      if (filteredOrders.length === 0) {
        htmlTable += `
          <tr>
            <td colspan="7" style="border:1px solid #000; padding:15px; text-align:center; color:#999; font-size:11px;">لا توجد نواقص نشطة حالياً في المستودع اليوم</td>
          </tr>
        `;
      }

      const totalRequired = filteredOrders.reduce((sum, o) => sum + o.qty, 0);
      const totalDispatched = filteredOrders.reduce((sum, o) => sum + (o.status === 'تم الصرف' ? (o.dispatchQty || 0) : 0), 0);

      htmlTable += `
          </tbody>
        </table>
        <div style="margin-top:15px; padding:10px; border:1px solid #000; direction:rtl; font-size:11px; line-height:1.5;">
          <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <div>📦 إجمالي البنود المدرجة: <strong>${filteredOrders.length} أصناف</strong></div>
            <div>📊 إجمالي الكميات المطلوبة: <strong>${totalRequired} وحدات</strong></div>
            <div>✅ إجمالي الكميات المصروفة: <strong>${totalDispatched} وحدات</strong></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:20px; border-top:1px dashed #000; padding-top:10px;">
            <div>توقيع أمين مستودع ${warehouseName}: ....................................</div>
            <div>اعتماد إدارة الحركة والتشغيل: ....................................</div>
          </div>
        </div>
      `;

      onPrintCustomHtml(
        `مسودة بيان التحضير اليومي - ${warehouseName}`,
        `تاريخ وتوقيت كشف الصرف: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}`,
        htmlTable,
        isPdf
      );
    };

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>📦 لوحة التحكم بالنواقص - {warehouseName}</h2>
        <div className="search-filter-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '250px', marginBottom: 0 }}>
            <input
              type="text"
              placeholder="🔍 بحث باسم المعرض، رقم الفاتورة، أو الصنف..."
              value={searchQuery}
              onChange={(e) =>
                setSearchWhQueries((prev) => ({ ...prev, [userKey]: e.target.value }))
              }
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-close-invoice"
              onClick={() => onCloseWarehouseInvoice(warehouseName)}
            >
              🔒 ترحيل وإغلاق يومية {warehouseName}
            </button>
            <button
              className="btn"
              style={{ background: 'var(--success)', color: 'white' }}
              onClick={() => handlePrintLive(false)}
            >
              🖨️ طباعة كشف التحضير
            </button>
            <button
              className="btn"
              style={{ background: 'var(--primary-blue)', color: 'white' }}
              onClick={() => handlePrintLive(true)}
            >
              📄 تصدير الكشف PDF
            </button>
          </div>
        </div>
        <table id={`table-${activeTab}`}>
          <thead>
            <tr>
              <th>المعرض</th>
              <th>الفاتورة</th>
              <th>الصنف</th>
              <th>الكمية المطلوبة</th>
              <th>الصرف الفعلي</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  لا توجد نواقص بالانتظار أو مطابقة للبحث حالياً في المستودع
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const inputId = o.id.toString();
                const currentQtyVal = whQtyInputs[inputId] !== undefined ? whQtyInputs[inputId] : o.qty.toString();

                return (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.branch}</strong>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {o.invoiceCode}
                      </span>
                    </td>
                    <td>{o.item}</td>
                    <td>
                      <strong>{o.qty}</strong>
                    </td>
                    <td>
                      {o.status === 'قيد الانتظار' ? (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <input
                            type="number"
                            className="wh-qty-input"
                            min="0"
                            max={o.qty}
                            value={currentQtyVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWhQtyInputs((prev) => ({ ...prev, [inputId]: val }));
                            }}
                          />
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => onDispatchItem(o.id, warehouseName)}
                          >
                            ✅ إقرار توريد
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                          تم صرف: {o.dispatchQty} وحدات
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          o.status === 'قيد الانتظار' ? 'badge-pending' : 'badge-success'
                        }`}
                      >
                        {o.status === 'قيد الانتظار' ? 'بانتظار الصرف' : 'جاهزة للغلوق'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // 2. Merged Returns Wh Panel
  if (activeTab === 'merged-returns-wh') {
    const openReturns = returnsOrders.filter((r) => r.status === 'بانتظار الاستلام بالمخازن');
    const warehouseName = currentUser.role === 'wh' ? currentUser.name : 'مخزن النادي';

    const handlePrintReturns = (isPdf = false) => {
      let htmlTable = `
        <table style="width:100%; border-collapse:collapse; direction:rtl; margin-top:10px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">#</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:right;">المعرض الصادر منه</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">كود مستند المرتجع</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:right;">اسم ومواصفات صنف المرتجع</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">الكمية المرتجعة</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">تاريخ الإرسال</th>
            </tr>
          </thead>
          <tbody>
      `;

      openReturns.forEach((r, index) => {
        htmlTable += `
          <tr>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${index + 1}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right; font-size:11px;"><strong>${r.branch}</strong></td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-family:monospace; color:blue;">${r.returnCode}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right; font-size:11px;"><strong>${r.item}</strong></td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-weight:bold; color:red;">${r.qty}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${r.date}</td>
          </tr>
        `;
      });

      if (openReturns.length === 0) {
        htmlTable += `
          <tr>
            <td colspan="6" style="border:1px solid #000; padding:15px; text-align:center; color:#999; font-size:11px;">لا توجد فواتير مرتجعات واصلة بانتظار الاستلام حالياً</td>
          </tr>
        `;
      }

      const totalQty = openReturns.reduce((sum, r) => sum + r.qty, 0);

      htmlTable += `
          </tbody>
        </table>
        <div style="margin-top:15px; padding:10px; border:1px solid #000; direction:rtl; font-size:11px; line-height:1.5;">
          <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <div>📦 إجمالي بنود المرتجعات المفتوحة: <strong>${openReturns.length} أصناف</strong></div>
            <div>📊 إجمالي الكميات المرتجعة: <strong>${totalQty} وحدات</strong></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:20px; border-top:1px dashed #000; padding-top:10px;">
            <div>اسم وتوقيع المستلم الفعلي: ....................................</div>
            <div>اعتماد إدارة العهد والمخازن: ....................................</div>
          </div>
        </div>
      `;

      onPrintCustomHtml(
        `بيان المرتجعات المفتوحة الواردة من المعارض`,
        `تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}`,
        htmlTable,
        isPdf
      );
    };

    return (
      <div id="merged-returns-wh" className="panel active" dir="rtl">
        <h2>📋 قائمة المرتجعات المدمجة الواردة من المعارض</h2>
        <p style={{ marginBottom: '15px', color: 'var(--text-light)', fontSize: '13px' }}>
          فاتورة ربط مدمجة وموحدة للمرتجعات المفتوحة - يحق لأي مخزن تأكيد استلام البند فور وصوله إليه يدوياً.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            className="btn"
            style={{ background: 'var(--success)', color: 'white' }}
            onClick={() => handlePrintReturns(false)}
          >
            🖨️ طباعة كشف المرتجعات المفتوحة
          </button>
          <button
            className="btn"
            style={{ background: 'var(--primary-blue)', color: 'white' }}
            onClick={() => handlePrintReturns(true)}
          >
            📄 تصدير كشف المرتجعات PDF
          </button>
        </div>
        <table id="table-merged-returns-wh">
          <thead>
            <tr>
              <th>المعرض الصادر منه</th>
              <th>كود مستند المرتجع</th>
              <th>اسم ومواصفات صنف المرتجع</th>
              <th>الكمية المرتجعة</th>
              <th>تاريخ الإرسال</th>
              <th>إجراء وقسم استلام المرتجع المختص</th>
            </tr>
          </thead>
          <tbody>
            {openReturns.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '25px' }}>
                  🎉 لا توجد فواتير مرتجعات واصلة بانتظار الاستلام حالياً
                </td>
              </tr>
            ) : (
              openReturns.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.branch}</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        color: 'var(--primary-blue)',
                      }}
                    >
                      {r.returnCode}
                    </span>
                  </td>
                  <td>
                    <strong>{r.item}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--danger)' }}>
                      {r.qty}
                    </span>
                  </td>
                  <td>{r.date}</td>
                  <td>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => onReceiveReturnItem(r.id, warehouseName)}
                    >
                      📥 استلام وتأكيد بالعهدة
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // 3. Branch Archive Sent
  if (activeTab.endsWith('-archive-sent')) {
    const userKey = activeTab.replace('-archive-sent', '');
    const user = users[userKey];
    if (!user) return null;

    const branchName = user.name;
    const searchQuery = searchArchQueries[`${userKey}_sent`] || '';

    const branchOrders = orders.filter((o) => o.branch === branchName && o.type === 'جاهز للمخزن');
    const uniqueInvoices = Array.from(new Set(branchOrders.map((o) => o.invoiceCode)));

    const filteredInvoices = uniqueInvoices.filter((invCode) => {
      const group = branchOrders.filter((o) => o.invoiceCode === invCode);
      const textBlock = `${invCode} ${group[0]?.date || ''} ${group.length} أصناف`.toLowerCase();
      return textBlock.includes(searchQuery.toLowerCase());
    });

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>📤 أرشيف المرسل الأصلي - {branchName}</h2>
        <div className="search-filter-row">
          <div className="form-group">
            <input
              type="text"
              placeholder="🔍 بحث برقم الفاتورة أو التاريخ..."
              value={searchQuery}
              onChange={(e) =>
                setSearchArchQueries((prev) => ({ ...prev, [`${userKey}_sent`]: e.target.value }))
              }
            />
          </div>
        </div>
        <table id={`table-${userKey}-sent-archive`}>
          <thead>
            <tr>
              <th>الرقم التسلسلي</th>
              <th>كود الفاتورة</th>
              <th>التاريخ</th>
              <th>عدد الأصناف المطلوبة</th>
              <th>عرض طلبية المرسل</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  لا توجد فواتير مرسلة مسجلة حالياً
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invCode, idx) => {
                const group = branchOrders.filter((o) => o.invoiceCode === invCode);
                return (
                  <tr key={invCode}>
                    <td>
                      <strong>{idx + 1}</strong>
                    </td>
                    <td>
                      <strong>{invCode}</strong>
                    </td>
                    <td>{group[0]?.date}</td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                        {group.length} من الأصناف
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-view"
                        onClick={() => onViewInvoice(invCode, 'sent')}
                      >
                        👁️ عرض طلبية المرسل
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
          <button
            className="btn"
            style={{ background: 'var(--success)', color: 'white' }}
            onClick={() => onPrintBranchArchive(userKey, 'sent', `أرشيف مرسل ${branchName}`)}
          >
            🖨️ طباعة السجل الرسمي
          </button>
          <button
            className="btn"
            style={{ background: 'var(--primary-blue)', color: 'white' }}
            onClick={() => {
              onPrintBranchArchive(userKey, 'sent', `أرشيف مرسل ${branchName}`);
              onPrintCustomHtml('', '', '', true);
            }}
          >
            📄 تصدير السجل PDF
          </button>
        </div>
      </div>
    );
  }

  // 4. Branch Archive Received (M-Invoices)
  if (activeTab.endsWith('-archive-rec') && users[activeTab.replace('-archive-rec', '')]?.role === 'branch') {
    const userKey = activeTab.replace('-archive-rec', '');
    const user = users[userKey];
    if (!user) return null;

    const branchName = user.name;
    const searchQuery = searchArchQueries[`${userKey}_rec`] || '';

    const items = receivedInvoices.filter((ri) => ri.branch === branchName);
    const filteredItems = items.filter(
      (ri) =>
        ri.mergedInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ri.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ri.date.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>📥 أرشيف المستلم الفعلي المجمع - {branchName}</h2>
        <div className="search-filter-row">
          <div className="form-group">
            <input
              type="text"
              placeholder="🔍 بحث برقم مستند الاستلام، اسم الصنف، أو المخزن المورد..."
              value={searchQuery}
              onChange={(e) =>
                setSearchArchQueries((prev) => ({ ...prev, [`${userKey}_rec`]: e.target.value }))
              }
            />
          </div>
        </div>
        <table id={`table-${userKey}-received-archive`}>
          <thead>
            <tr>
              <th>الرقم التسلسلي</th>
              <th>كود مستند الاستلام</th>
              <th>المخازن الموردة</th>
              <th>عدد الأصناف المستلمة</th>
              <th>التاريخ</th>
              <th>تفقد ومطابقة النواقص العجز</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  لا توجد فواتير مستلمة مجمعة واصلة حالياً
                </td>
              </tr>
            ) : (
              filteredItems.map((ri, idx) => (
                <tr key={ri.id}>
                  <td>
                     <strong>{idx + 1}</strong>
                  </td>
                  <td>
                    <strong>{ri.mergedInvoiceNumber}</strong>
                  </td>
                  <td>
                    <span className="badge badge-closed">{ri.source}</span>
                  </td>
                  <td>
                    <strong>{ri.items.length} أصناف مدمجة</strong>
                  </td>
                  <td>{ri.date}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-view"
                      onClick={() => onViewInvoice(ri.mergedInvoiceNumber, 'received')}
                    >
                      👁️ تدقيق ومطابقة العجز
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
          <button
            className="btn"
            style={{ background: 'var(--success)', color: 'white' }}
            onClick={() => onPrintBranchArchive(userKey, 'rec', `أرشيف مستلم ${branchName}`)}
          >
            🖨️ طباعة سجل الفواتير المستلمة
          </button>
          <button
            className="btn"
            style={{ background: 'var(--primary-blue)', color: 'white' }}
            onClick={() => {
              onPrintBranchArchive(userKey, 'rec', `أرشيف مستلم ${branchName}`);
              onPrintCustomHtml('', '', '', true);
            }}
          >
            📄 تصدير سجل الفواتير PDF
          </button>
        </div>
      </div>
    );
  }

  // 5. Branch Archive Returns
  if (activeTab.endsWith('-archive-returns') && users[activeTab.replace('-archive-returns', '')]?.role === 'branch') {
    const userKey = activeTab.replace('-archive-returns', '');
    const user = users[userKey];
    if (!user) return null;

    const branchName = user.name;
    const items = returnsOrders.filter((r) => r.branch === branchName && r.status === 'تم الاستلام بنجاح');

    const handlePrintBranchReturns = (isPdf = false) => {
      let htmlTable = `
        <table style="width:100%; border-collapse:collapse; direction:rtl; margin-top:10px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">#</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">كود مستند المرتجع</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:right;">اسم الصنف المرتجع</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">الكمية</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">المخزن المستلم الفعلي</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">تاريخ الاستلام والتقييد</th>
            </tr>
          </thead>
          <tbody>
      `;

      items.forEach((r, idx) => {
        htmlTable += `
          <tr>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${idx + 1}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-family:monospace;">${r.returnCode}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right; font-size:11px;"><strong>${r.item}</strong></td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-weight:bold;">${r.qty}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-weight:bold;">${r.receivedBy}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${r.receivedDate}</td>
          </tr>
        `;
      });

      if (items.length === 0) {
        htmlTable += `
          <tr>
            <td colspan="6" style="border:1px solid #000; padding:15px; text-align:center; color:#999; font-size:11px;">لا توجد مرتجعات مستلمة ومؤرشفة حالياً</td>
          </tr>
        `;
      }

      htmlTable += `
          </tbody>
        </table>
      `;

      onPrintCustomHtml(
        `أرشيف المرتجعات المستلمة في المخازن - ${branchName}`,
        `تاريخ الاستخراج الكلي: ${getToday()}`,
        htmlTable,
        isPdf
      );
    };

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>📥 أرشيف المرتجعات المستلمة في المخازن - {branchName}</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            className="btn"
            style={{ background: 'var(--success)', color: 'white' }}
            onClick={() => handlePrintBranchReturns(false)}
          >
            🖨️ طباعة أرشيف المرتجعات المعتمدة
          </button>
          <button
            className="btn"
            style={{ background: 'var(--primary-blue)', color: 'white' }}
            onClick={() => handlePrintBranchReturns(true)}
          >
            📄 تصدير أرشيف المرتجعات PDF
          </button>
        </div>
        <table id={`table-${userKey}-returns-archive`}>
          <thead>
            <tr>
              <th>كود الفاتورة</th>
              <th>اسم الصنف المرتجع</th>
              <th>الكمية</th>
              <th>المخزن المستلم الفعلي</th>
              <th>التاريخ</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '15px' }}>
                  لا توجد مرتجعات مستلمة ومؤرشفة حالياً
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.returnCode}</strong>
                  </td>
                  <td>{r.item}</td>
                  <td>
                    <span style={{ fontWeight: 'bold' }}>{r.qty}</span>
                  </td>
                  <td>
                    <span className="badge badge-closed">{r.receivedBy}</span>
                  </td>
                  <td>{r.receivedDate}</td>
                  <td>
                    <span className="badge badge-success">تم الاستلام والأرشفة</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // 6. Warehouse Archive Received Requests (📋 طلبات مخزن)
  if (activeTab.endsWith('-archive-rec') && users[activeTab.replace('-archive-rec', '')]?.role === 'wh') {
    const userKey = activeTab.replace('-archive-rec', '');
    const user = users[userKey];
    if (!user) return null;

    const warehouseName = user.name;
    const branchOrders = orders.filter((o) => o.type === 'جاهز للمخزن');
    const uniqueInvoices = Array.from(new Set(branchOrders.map((o) => o.invoiceCode)));

    const handlePrintWhRecRequests = (isPdf = false) => {
      let htmlTable = `
        <table style="width:100%; border-collapse:collapse; direction:rtl; margin-top:10px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">#</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:right;">المعرض الطالب</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">رقم الفاتورة الأصلية</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">عدد الأصناف والمواد</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">التاريخ</th>
            </tr>
          </thead>
          <tbody>
      `;

      uniqueInvoices.forEach((invCode, idx) => {
        const group = branchOrders.filter((o) => o.invoiceCode === invCode);
        htmlTable += `
          <tr>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${idx + 1}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right; font-size:11px;"><strong>${group[0]?.branch}</strong></td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-family:monospace;">${invCode}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-weight:bold;">${group.length} أصناف</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${group[0]?.date}</td>
          </tr>
        `;
      });

      if (uniqueInvoices.length === 0) {
        htmlTable += `
          <tr>
            <td colspan="5" style="border:1px solid #000; padding:15px; text-align:center; color:#999; font-size:11px;">سجل الطلبات فارغ حالياً</td>
          </tr>
        `;
      }

      htmlTable += `
          </tbody>
        </table>
      `;

      onPrintCustomHtml(
        `أرشيف الطلبات الواردة المتراكمة - ${warehouseName}`,
        `تاريخ طباعة السجل الكلي: ${getToday()}`,
        htmlTable,
        isPdf
      );
    };

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>📋 أرشيف الطلبات الواردة المتراكمة - {warehouseName}</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            className="btn"
            style={{ background: 'var(--success)', color: 'white' }}
            onClick={() => handlePrintWhRecRequests(false)}
          >
            🖨️ طباعة سجل الطلبات الواردة
          </button>
          <button
            className="btn"
            style={{ background: 'var(--primary-blue)', color: 'white' }}
            onClick={() => handlePrintWhRecRequests(true)}
          >
            📄 تصدير سجل الطلبات PDF
          </button>
        </div>
        <table id={`table-${userKey}-received-orders`}>
          <thead>
            <tr>
              <th>الرقم التسلسلي</th>
              <th>المعرض الطالب</th>
              <th>رقم الفاتورة الأصلية</th>
              <th>عدد المواد</th>
              <th>التاريخ</th>
              <th>تفاصيل الفاتورة</th>
            </tr>
          </thead>
          <tbody>
            {uniqueInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  السجل فارغ حالياً
                </td>
              </tr>
            ) : (
              uniqueInvoices.map((invCode, idx) => {
                const group = branchOrders.filter((o) => o.invoiceCode === invCode);
                return (
                  <tr key={invCode}>
                    <td>
                      <strong>{idx + 1}</strong>
                    </td>
                    <td>
                      <strong>{group[0]?.branch}</strong>
                    </td>
                    <td>{invCode}</td>
                    <td>
                      <strong>{group.length} أصناف</strong>
                    </td>
                    <td>{group[0]?.date}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-view"
                        onClick={() => onViewInvoice(invCode, 'wh_received')}
                      >
                        👁️ تفاصيل الفاتورة الكلية
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // 7. Warehouse Archive Dispatch M-Invoices (📦 منصرف مخزن)
  if (activeTab.endsWith('-archive-disp')) {
    const userKey = activeTab.replace('-archive-disp', '');
    const user = users[userKey];
    if (!user) return null;

    const warehouseName = user.name;
    const closed = closedInvoices.filter((inv) => inv.warehouse === warehouseName);

    const handlePrintWhDispArchive = (isPdf = false) => {
      let htmlTable = `
        <table style="width:100%; border-collapse:collapse; direction:rtl; margin-top:10px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">#</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">رقم الفاتورة المدمجة</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:right;">المعارض المستلمة</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">عدد الأصناف والمواد</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">التاريخ واليومية</th>
            </tr>
          </thead>
          <tbody>
      `;

      closed.forEach((inv, idx) => {
        const branchList = Object.keys(inv.branches).join(' ، ');
        htmlTable += `
          <tr>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${idx + 1}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-family:monospace; font-weight:bold;">${inv.invoiceNumber}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right; font-size:11px;">${branchList}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-weight:bold;">${inv.items.length} أصناف مدمجة</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${inv.date}</td>
          </tr>
        `;
      });

      if (closed.length === 0) {
        htmlTable += `
          <tr>
            <td colspan="5" style="border:1px solid #000; padding:15px; text-align:center; color:#999; font-size:11px;">لا توجد فواتير مرحلة ومقيدة مسبقاً في المستودع</td>
          </tr>
        `;
      }

      htmlTable += `
          </tbody>
        </table>
      `;

      onPrintCustomHtml(
        `سجل المنصرف المرحل والمغلق لليوميات - ${warehouseName}`,
        `تاريخ الاستخراج: ${getToday()}`,
        htmlTable,
        isPdf
      );
    };

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>📦 أرشيف المنصرف المدمج - {warehouseName}</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            className="btn"
            style={{ background: 'var(--success)', color: 'white' }}
            onClick={() => handlePrintWhDispArchive(false)}
          >
            🖨️ طباعة سجل المنصرف الكلي
          </button>
          <button
            className="btn"
            style={{ background: 'var(--primary-blue)', color: 'white' }}
            onClick={() => handlePrintWhDispArchive(true)}
          >
            📄 تصدير سجل المنصرف PDF
          </button>
        </div>
        <table id={`table-${userKey}-dispatched-archive`}>
          <thead>
            <tr>
              <th>الرقم التسلسلي</th>
              <th>الفاتورة المدمجة</th>
              <th>المعارض المستلمة</th>
              <th>عدد الأصناف</th>
              <th>التاريخ</th>
              <th>عرض للتفتيش المالي</th>
            </tr>
          </thead>
          <tbody>
            {closed.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  لا توجد فواتير مرحلة ومقيدة مسبقاً في المستودع
                </td>
              </tr>
            ) : (
              closed.map((inv, idx) => {
                const branchList = Object.keys(inv.branches).join(' ، ');
                return (
                  <tr key={inv.id}>
                    <td>
                      <strong>{idx + 1}</strong>
                    </td>
                    <td>
                      <strong>{inv.invoiceNumber}</strong>
                    </td>
                    <td>{branchList}</td>
                    <td>{inv.items.length} مادة مستلمة</td>
                    <td>{inv.date}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-view"
                        onClick={() => onViewInvoice(inv.invoiceNumber, 'closed')}
                      >
                        👁️ مستند الفاتورة
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // 8. Warehouse Archive Returns History (📥 استلام مرتجع مخزن)
  if (activeTab.endsWith('-archive-returns') && users[activeTab.replace('-archive-returns', '')]?.role === 'wh') {
    const userKey = activeTab.replace('-archive-returns', '');
    const user = users[userKey];
    if (!user) return null;

    const warehouseName = user.name;
    const items = returnsOrders.filter(
      (r) => r.status === 'تم الاستلام بنجاح' && r.receivedBy === warehouseName
    );

    const handlePrintWhReturnsHistory = (isPdf = false) => {
      let htmlTable = `
        <table style="width:100%; border-collapse:collapse; direction:rtl; margin-top:10px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">#</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:right;">المعرض الصادر منه</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">كود المستند الأصلي</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:right;">اسم الصنف المرتجع</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">الكمية المستلمة فعلياً</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">تاريخ الاستلام والأرشفة</th>
            </tr>
          </thead>
          <tbody>
      `;

      items.forEach((r, idx) => {
        htmlTable += `
          <tr>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${idx + 1}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right; font-size:11px;"><strong>${r.branch}</strong></td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-family:monospace;">${r.returnCode}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right; font-size:11px;"><strong>${r.item}</strong></td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-weight:bold; color:green;">${r.qty}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${r.receivedDate}</td>
          </tr>
        `;
      });

      if (items.length === 0) {
        htmlTable += `
          <tr>
            <td colspan="6" style="border:1px solid #000; padding:15px; text-align:center; color:#999; font-size:11px;">لم تقم باستلام أي مرتجعات لتقييدها تاريخياً حتى الآن</td>
          </tr>
        `;
      }

      const totalQty = items.reduce((sum, r) => sum + r.qty, 0);

      htmlTable += `
          </tbody>
        </table>
        <div style="margin-top:15px; padding:10px; border:1px solid #000; direction:rtl; font-size:11px; line-height:1.5;">
          <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <div>📦 إجمالي بنود المرتجعات المستلمة: <strong>${items.length} أصناف</strong></div>
            <div>📊 إجمالي الوحدات المستلمة: <strong>${totalQty} وحدات</strong></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:20px; border-top:1px dashed #000; padding-top:10px;">
            <div>توقيع مستلم العهدة بمستودع ${warehouseName}: ....................................</div>
            <div>اعتماد إدارة العهد الكلية: ....................................</div>
          </div>
        </div>
      `;

      onPrintCustomHtml(
        `سجل استلام مرتجعات المعارض بمخزن - ${warehouseName}`,
        `تاريخ سحب التقرير: ${getToday()}`,
        htmlTable,
        isPdf
      );
    };

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>📥 أرشيف قسم استلام مرتجع - {warehouseName}</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            className="btn"
            style={{ background: 'var(--success)', color: 'white' }}
            onClick={() => handlePrintWhReturnsHistory(false)}
          >
            🖨️ طباعة سجل المرتجعات المستلمة
          </button>
          <button
            className="btn"
            style={{ background: 'var(--primary-blue)', color: 'white' }}
            onClick={() => handlePrintWhReturnsHistory(true)}
          >
            📄 تصدير سجل المرتجعات PDF
          </button>
        </div>
        <table id={`table-${userKey}-returns-archive`}>
          <thead>
            <tr>
              <th>المعرض الصادر منه</th>
              <th>كود المستند</th>
              <th>اسم الصنف</th>
              <th>الكمية المستلمة</th>
              <th>تاريخ الاستلام الفعلي</th>
              <th>الحالة المعملية</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '15px' }}>
                  لم تقم باستلام أي مرتجعات لتقييدها تاريخياً حتى الآن
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.branch}</strong>
                  </td>
                  <td>
                    <strong>{r.returnCode}</strong>
                  </td>
                  <td>{r.item}</td>
                  <td>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--success)' }}>
                      {r.qty}
                    </span>
                  </td>
                  <td>{r.receivedDate}</td>
                  <td>
                    <span className="badge badge-success">مؤرشف بالعهدة</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // 9. Merged Archive Today (📊 مرسلة مدمجة اليوم)
  if (activeTab === 'merged-archive') {
    let displayedInvoices = mergedInvoices;
    if (currentUser.role === 'wh') {
      displayedInvoices = mergedInvoices.filter((inv) => inv.warehouse === currentUser.name);
    }

    const filteredInvoices = displayedInvoices.filter((inv) => {
      const branchesList = Object.keys(inv.branches).join(' ');
      const textBlock = `${inv.invoiceNumber} ${inv.warehouse} ${branchesList} ${inv.date}`.toLowerCase();
      return textBlock.includes(searchMergedQuery.toLowerCase());
    });

    const handlePrintMergedArchive = (isPdf = false) => {
      let htmlTable = `
        <table style="width:100%; border-collapse:collapse; direction:rtl; margin-top:10px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">#</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">رقم الفاتورة المدمجة</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">المخزن الصادر</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:right;">المعارض المشتركة في الربط</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">عدد الأصناف والمواد</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">إجمالي المنصرف والوارد</th>
              <th style="border:1px solid #000; padding:6px; font-size:11px; text-align:center;">التاريخ</th>
            </tr>
          </thead>
          <tbody>
      `;

      filteredInvoices.forEach((inv, idx) => {
        const totalQty = inv.items.reduce((sum, item) => sum + (item.dispatchQty || 0), 0);
        const branchList = Object.keys(inv.branches).join(' ، ');
        htmlTable += `
          <tr>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${idx + 1}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-family:monospace; font-weight:bold;">${inv.invoiceNumber}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${inv.warehouse}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right; font-size:11px;">${branchList}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${inv.items.length} صنف</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px; font-weight:bold;">${totalQty} وحدة</td>
            <td style="border:1px solid #000; padding:5px; text-align:center; font-size:11px;">${inv.date}</td>
          </tr>
        `;
      });

      if (filteredInvoices.length === 0) {
        htmlTable += `
          <tr>
            <td colspan="7" style="border:1px solid #000; padding:15px; text-align:center; color:#999; font-size:11px;">لا توجد فواتير مدمجة مطابقة للبحث اليوم</td>
          </tr>
        `;
      }

      htmlTable += `
          </tbody>
        </table>
      `;

      onPrintCustomHtml(
        `بيان الربط العام اليومي الموحد للفواتير الصادرة من المستودعات`,
        `تاريخ البيان: ${getToday()}`,
        htmlTable,
        isPdf
      );
    };

    return (
      <div id="merged-archive" className="panel active" dir="rtl">
        <h2>📊 أرشيف الفواتير المرسلة المدمجة الموحدة (الربط العام اليومي)</h2>
        <div className="search-filter-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '250px', marginBottom: 0 }}>
            <input
              type="text"
              placeholder="🔍 بحث برقم الفاتورة، المخزن، أو المعارض..."
              value={searchMergedQuery}
              onChange={(e) => setSearchMergedQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn"
              style={{ background: 'var(--success)', color: 'white' }}
              onClick={() => handlePrintMergedArchive(false)}
            >
              🖨️ طباعة كشف الربط العام
            </button>
            <button
              className="btn"
              style={{ background: 'var(--primary-blue)', color: 'white' }}
              onClick={() => handlePrintMergedArchive(true)}
            >
              📄 تصدير كشف الربط PDF
            </button>
          </div>
        </div>
        <table id="table-merged-archive">
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
    );
  }

  // 10. Invoice Details Screen (invoice-details)
  if (activeTab === 'invoice-details' && invoiceView) {
    const view = invoiceView;
    const totalQty = view.items.reduce((sum, item) => sum + (item.qty || 0), 0);

    return (
      <div id="invoice-details" className="panel active" dir="rtl">
        <h2>📄 تفاصيل الفاتورة ومطابقة البيانات المدمجة</h2>
        <div className="invoice-details">
          <div className="invoice-header">
            <div>
              <strong>{view.title}</strong>
            </div>
            <div>📅 تاريخ المعاملة: {view.dateStr}</div>
          </div>
          <div
            style={{
              marginBottom: '15px',
              padding: '10px',
              background: '#eef2f7',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            <span style={{ marginLeft: '20px' }}>
              🏢 الجهة الطالبة/المستلمة: <strong>{view.destinationBranch}</strong>
            </span>
            <span>
              📦 مصدر التوريد الصادر:{' '}
              <strong style={{ color: 'var(--primary-blue)' }}>{view.originWh}</strong>
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>اسم ومواصفات الصنف</th>
                {view.type === 'wh_received' ? (
                  <>
                    <th>المعرض الطالب</th>
                    <th>المستودع المورد</th>
                  </>
                ) : (
                  view.type !== 'sent' && (
                    <th>
                      {view.type === 'received' ? 'المخزن المورد' : 'المعرض المخرج له'}
                    </th>
                  )
                )}
                <th>الكمية المطلوبة (المرسلة)</th>
                {view.type !== 'sent' && <th>المنصرف فعلياً (المستلم)</th>}
                {view.type !== 'sent' && <th>العجز / النواقص الكلية</th>}
                <th>حالة التوريد وموقف الصنف</th>
              </tr>
            </thead>
            <tbody>
              {view.items.map((item, index) => {
                const req = item.qty || 0;
                const disp = item.dispatchQty !== undefined ? item.dispatchQty : 0;
                const remaining = req - disp;
                const itemWh = item.source || item.warehouse || 'قيد الانتظار بالمخزن';

                let statusBadge = 'badge-pending';
                let statusText = 'واصل جزئي';

                if (view.type === 'sent') {
                  statusBadge = 'badge-info';
                  statusText =
                    item.status === 'تم الأرشفة' || item.status === 'تم الصرف'
                      ? 'مرسل بالكامل'
                      : 'مرسل';
                } else {
                  if (disp >= req) {
                    statusBadge = 'badge-success';
                    statusText = 'واصل كامل';
                  } else {
                    statusBadge = 'badge-danger';
                    statusText = 'واصل جزئي';
                  }
                }

                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{item.item}</strong>
                    </td>
                    {view.type === 'wh_received' ? (
                      <>
                        <td>
                          <span className="badge badge-info">
                            {item.branch || view.destinationBranch}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-closed">
                            {itemWh}
                          </span>
                        </td>
                      </>
                    ) : (
                      view.type !== 'sent' && (
                        <td>
                          <span className="badge badge-info">
                            {view.type === 'received' ? itemWh : (item.branch || view.destinationBranch)}
                          </span>
                        </td>
                      )
                    )}
                    <td>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 'bold',
                          color: 'var(--primary-dark)',
                        }}
                      >
                        {req}
                      </span>
                    </td>
                    {view.type !== 'sent' && (
                      <td>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--success)' }}>
                          {disp}
                        </span>
                      </td>
                    )}
                    {view.type !== 'sent' && (
                      <td>
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 'bold',
                            color: remaining > 0 ? 'var(--danger)' : 'var(--text-light)',
                          }}
                        >
                          {remaining}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className={`badge ${statusBadge}`}>{statusText}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div
            style={{
              marginTop: '15px',
              padding: '12px',
              background: 'var(--bg-gray)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 600,
            }}
          >
            <div>إجمالي عدد الأصناف المدرجة: {view.items.length}</div>
            <div>مجموع وحدات الطلب الكلية: {totalQty}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" style={{ marginTop: '15px' }} onClick={onCloseInvoiceDetails}>
            ↩ رجوع للأرشيف
          </button>
          <button className="btn btn-success" style={{ marginTop: '15px' }} onClick={() => onPrintInvoiceDetails(false)}>
            🖨️ طباعة الفاتورة الفورية
          </button>
          <button
            className="btn"
            style={{ background: 'var(--primary-blue)', color: 'white', marginTop: '15px' }}
            onClick={() => onPrintInvoiceDetails(true)}
          >
            📄 تصدير الفاتورة PDF
          </button>
        </div>
      </div>
    );
  }

  return null;
};
