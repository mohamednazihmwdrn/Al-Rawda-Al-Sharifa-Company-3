import React, { useState } from 'react';
import { UsersDatabase, DraftOrder, ReturnDraft, ReceivedInvoice } from '../types';

interface BranchPanelsProps {
  activeTab: string;
  users: UsersDatabase;
  draftOrders: DraftOrder[];
  returnsDraft: ReturnDraft[];
  onAddToDraft: (branch: string, itemInputKey: string, qtyInputKey: string) => void;
  onRemoveFromDraft: (draftId: number) => void;
  onSubmitDraft: (branch: string) => void;
  onAddToReturnsDraft: (branch: string, itemInputKey: string, qtyInputKey: string) => void;
  onRemoveFromReturnsDraft: (draftId: number) => void;
  onSubmitReturns: (branch: string) => void;
  branchItemInputs: Record<string, string>;
  setBranchItemInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  branchQtyInputs: Record<string, string>;
  setBranchQtyInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  branchReturnItemInputs: Record<string, string>;
  setBranchReturnItemInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  branchReturnQtyInputs: Record<string, string>;
  setBranchReturnQtyInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  receivedInvoices?: ReceivedInvoice[];
  onPrintCustomHtml?: (title: string, subtitle: string, html: string, isPdf?: boolean) => void;
}

export const BranchPanels: React.FC<BranchPanelsProps> = ({
  activeTab,
  users,
  draftOrders,
  returnsDraft,
  onAddToDraft,
  onRemoveFromDraft,
  onSubmitDraft,
  onAddToReturnsDraft,
  onRemoveFromReturnsDraft,
  onSubmitReturns,
  branchItemInputs,
  setBranchItemInputs,
  branchQtyInputs,
  setBranchQtyInputs,
  branchReturnItemInputs,
  setBranchReturnItemInputs,
  branchReturnQtyInputs,
  setBranchReturnQtyInputs,
  receivedInvoices = [],
  onPrintCustomHtml,
}) => {
  // Find which user/branch is related to the activeTab
  const isBranchTab = activeTab.endsWith('-branch');
  const isReturnsTab = activeTab.endsWith('-returns');

  if (isBranchTab) {
    const userKey = activeTab.replace('-branch', '');
    const user = users[userKey];
    if (!user) return null;

    const branchName = user.name;
    const items = draftOrders.filter((d) => d.branch === branchName);

    const itemInputKey = `${userKey}_item`;
    const qtyInputKey = `${userKey}_qty`;

    const itemVal = branchItemInputs[itemInputKey] || '';
    const qtyVal = branchQtyInputs[qtyInputKey] || '';

    const handleItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const qtyInputEl = document.getElementById(qtyInputKey);
        qtyInputEl?.focus();
      }
    };

    const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onAddToDraft(branchName, itemInputKey, qtyInputKey);
      }
    };

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>📋 إعداد طلبية نواقص - {branchName}</h2>
        <div className="form-row">
          <div className="form-group">
            <label>اكتب اسم الصنف</label>
            <input
              type="text"
              list="items-autocomplete-list"
              id={itemInputKey}
              value={itemVal}
              onChange={(e) =>
                setBranchItemInputs((prev) => ({ ...prev, [itemInputKey]: e.target.value }))
              }
              onKeyDown={handleItemKeyDown}
            />
          </div>
          <div className="form-group">
            <label>الكمية</label>
            <input
              type="number"
              min="1"
              id={qtyInputKey}
              placeholder="اكتب العدد هنا"
              value={qtyVal}
              onChange={(e) =>
                setBranchQtyInputs((prev) => ({ ...prev, [qtyInputKey]: e.target.value }))
              }
              onKeyDown={handleQtyKeyDown}
            />
          </div>
          <button
            className="btn btn-success"
            onClick={() => onAddToDraft(branchName, itemInputKey, qtyInputKey)}
          >
            ➕ إضافة
          </button>
        </div>

        <h3>📝 المسودة الحالية</h3>
        <table id={`table-${userKey}-draft`}>
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>الحالة</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  المسودة فارغة. اكتب الصنف والكمية بالأعلى وقم بإضافتهما
                </td>
              </tr>
            ) : (
              items.map((d) => (
                <tr key={d.draftId}>
                  <td>
                    <strong>{d.item}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{d.qty}</span>
                  </td>
                  <td>
                    <span className="badge badge-draft">في مرحلة التجهيز الكلي</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onRemoveFromDraft(d.draftId)}
                    >
                      🗑 حذف البند
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <button className="btn btn-primary" onClick={() => onSubmitDraft(branchName)}>
          🚀 إرسال الفاتورة للمخازن
        </button>
      </div>
    );
  }

  if (isReturnsTab) {
    const userKey = activeTab.replace('-returns', '');
    const user = users[userKey];
    if (!user) return null;

    const branchName = user.name;
    const items = returnsDraft.filter((r) => r.branch === branchName);

    const itemInputKey = `${userKey}_return_item`;
    const qtyInputKey = `${userKey}_return_qty`;

    const itemVal = branchReturnItemInputs[itemInputKey] || '';
    const qtyVal = branchReturnQtyInputs[qtyInputKey] || '';

    const handleItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const qtyInputEl = document.getElementById(qtyInputKey);
        qtyInputEl?.focus();
      }
    };

    const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onAddToReturnsDraft(branchName, itemInputKey, qtyInputKey);
      }
    };

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>↩️ إعداد فاتورة مرتجعات - {branchName}</h2>
        <div className="form-row">
          <div className="form-group">
            <label>اسم صنف المرتجع</label>
            <input
              type="text"
              list="items-autocomplete-list"
              id={itemInputKey}
              value={itemVal}
              onChange={(e) =>
                setBranchReturnItemInputs((prev) => ({
                  ...prev,
                  [itemInputKey]: e.target.value,
                }))
              }
              onKeyDown={handleItemKeyDown}
            />
          </div>
          <div className="form-group">
            <label>الكمية المرتجعة</label>
            <input
              type="number"
              min="1"
              id={qtyInputKey}
              placeholder="اكتب العدد هنا"
              value={qtyVal}
              onChange={(e) =>
                setBranchReturnQtyInputs((prev) => ({
                  ...prev,
                  [qtyInputKey]: e.target.value,
                }))
              }
              onKeyDown={handleQtyKeyDown}
            />
          </div>
          <button
            className="btn btn-warning"
            onClick={() => onAddToReturnsDraft(branchName, itemInputKey, qtyInputKey)}
          >
            ➕ إضافة للمسودة
          </button>
        </div>
        <h3>📝 مسودة المرتجعات الحالية</h3>
        <table id={`table-${userKey}-returns-draft`}>
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الكمية المرتجعة</th>
              <th>الحالة</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  مسودة المرتجعات فارغة حالياً.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.returnDraftId}>
                  <td>
                    <strong>{r.item}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--warning)' }}>
                      {r.qty}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-pending">بانتظار الإرسال</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onRemoveFromReturnsDraft(r.returnDraftId)}
                    >
                      🗑 حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <button className="btn btn-warning" onClick={() => onSubmitReturns(branchName)}>
          🚀 إرسال المرتجعات لجميع المخازن
        </button>
      </div>
    );
  }

  if (activeTab.endsWith('-detailed-received')) {
    const userKey = activeTab.replace('-detailed-received', '');
    const user = users[userKey];
    if (!user) return null;

    const branchName = user.name;
    const [searchTerm, setSearchTerm] = useState('');

    // Filter incoming invoices for this specific branch
    const branchReceivedInvoices = (receivedInvoices || []).filter(
      (ri) => ri.branch === branchName
    );

    // Flatten to item-level records
    interface FlatReceivedItem {
      id: string;
      date: string;
      item: string;
      warehouse: string;
      qty: number;
      invoiceCode: string;
    }

    const flatItems: FlatReceivedItem[] = [];
    branchReceivedInvoices.forEach((ri) => {
      ri.items.forEach((item, itemIdx) => {
        flatItems.push({
          id: `${ri.mergedInvoiceNumber}-${item.item}-${itemIdx}-${ri.date}`,
          date: ri.date,
          item: item.item,
          warehouse: item.source || ri.source || 'غير حدد',
          qty: item.dispatchQty !== undefined ? item.dispatchQty : 0,
          invoiceCode: ri.mergedInvoiceNumber,
        });
      });
    });

    // Filter by user search term (case-insensitive)
    const filteredItems = flatItems.filter((fi) =>
      fi.item.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate sum of quantities
    const totalQty = filteredItems.reduce((acc, curr) => acc + curr.qty, 0);

    const handlePrintReport = (isPdf: boolean = false) => {
      let htmlTable = `
        <table style="width:100%; border-collapse:collapse; direction:rtl; font-family:'Inter', sans-serif; text-align:right;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #000; padding:8px; font-size:12px; text-align:center;">#</th>
              <th style="border:1px solid #000; padding:8px; font-size:12px; text-align:right;">اسم الصنف المستلم</th>
              <th style="border:1px solid #000; padding:8px; font-size:12px; text-align:center;">تاريخ الاستلام والصرف</th>
              <th style="border:1px solid #000; padding:8px; font-size:12px; text-align:center;">المخزن المورد</th>
              <th style="border:1px solid #000; padding:8px; font-size:12px; text-align:center;">الكمية المستلمة فعلياً</th>
              <th style="border:1px solid #000; padding:8px; font-size:12px; text-align:center;">رقم المستند المدمج</th>
            </tr>
          </thead>
          <tbody>
      `;

      if (filteredItems.length === 0) {
        htmlTable += `
          <tr>
            <td colspan="6" style="border:1px solid #000; padding:15px; text-align:center; color:#888;">
              لا توجد أي أصناف مطابقة للبحث أو مستلمة حالياً.
            </td>
          </tr>
        `;
      } else {
        filteredItems.forEach((fi, idx) => {
          htmlTable += `
            <tr>
              <td style="border:1px solid #000; padding:6px; text-align:center; font-size:11px;">${idx + 1}</td>
              <td style="border:1px solid #000; padding:6px; text-align:right; font-size:11px;"><strong>${fi.item}</strong></td>
              <td style="border:1px solid #000; padding:6px; text-align:center; font-size:11px;">${fi.date}</td>
              <td style="border:1px solid #000; padding:6px; text-align:center; font-size:11px;">${fi.warehouse}</td>
              <td style="border:1px solid #000; padding:6px; text-align:center; font-size:11px; font-weight:bold;">${fi.qty}</td>
              <td style="border:1px solid #000; padding:6px; text-align:center; font-size:11px;">${fi.invoiceCode}</td>
            </tr>
          `;
        });
      }

      htmlTable += `
          <tr style="background-color:#f9f9f9; font-weight:bold;">
            <td colspan="4" style="border:1px solid #000; padding:8px; text-align:left; font-size:12px;">المجموع الإجمالي للكميات المستلمة:</td>
            <td style="border:1px solid #000; padding:8px; text-align:center; font-size:12px; color:#1e40af; font-weight:bold;">${totalQty}</td>
            <td style="border:1px solid #000; padding:8px; text-align:center; font-size:12px;">-</td>
          </tr>
        </tbody>
      </table>
      `;

      const reportSubtitle = searchTerm
        ? `تصفية لاسم الصنف: "${searchTerm}" | التاريخ اليومي للطباعة: ${new Date().toLocaleDateString('ar-EG')}`
        : `تقرير حركة الوارد الشامل | التاريخ اليومي للطباعة: ${new Date().toLocaleDateString('ar-EG')}`;

      onPrintCustomHtml?.(
        `📋 كشف تفصيلي بالبنود والأصناف المستلمة (وارد المخازن) - ${branchName}`,
        reportSubtitle,
        htmlTable,
        isPdf
      );
    };

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>📋 كشف تفصيلي بالبنود والأصناف المستلمة (وارد المخازن)</h2>
        <p style={{ color: '#555', marginBottom: '15px' }}>
          هذا التقرير يعرض سجل جميع السلع والأصناف التي تم صرفها من المخازن واستلامها في <strong>{branchName}</strong> لكل يوم بالتفصيل.
        </p>

        <div className="search-filter-row" style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>🔍 ابحث باسم الصنف للفلترة الفورية:</label>
            <input
              type="text"
              placeholder="✏️ اكتب هنا اسم الصنف المطلوب للبحث عنه..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>
          <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={() => handlePrintReport(false)}
              disabled={filteredItems.length === 0}
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🖨️ طباعة التقرير الفوري
            </button>
            <button
              className="btn btn-success"
              onClick={() => handlePrintReport(true)}
              disabled={filteredItems.length === 0}
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📄 تصدير كـ PDF
            </button>
          </div>
        </div>

        <table id={`table-${userKey}-detailed-received`}>
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>#</th>
              <th>اسم الصنف المستلم</th>
              <th style={{ textAlign: 'center' }}>تاريخ الاستلام والصرف</th>
              <th style={{ textAlign: 'center' }}>المخزن المورد</th>
              <th style={{ textAlign: 'center' }}>الكمية المستلمة فعلياً</th>
              <th style={{ textAlign: 'center' }}>رقم مستند الاستلام المدمج</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '30px' }}>
                  {searchTerm ? '❌ لا توجد أصناف مطابقة لكلمة البحث المكتوبة.' : '📭 لم يتم استلام أي فواتير أو أصناف في المعرض بعد.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((fi, idx) => (
                <tr key={fi.id}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <strong>{fi.item}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>{fi.date}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-info">{fi.warehouse}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e40af' }}>{fi.qty}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>{fi.invoiceCode}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredItems.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                <td colSpan={4} style={{ textAlign: 'left', padding: '12px' }}>المجموع الإجمالي للكميات المستلمة:</td>
                <td style={{ textAlign: 'center', fontSize: '16px', color: '#1e40af' }}>{totalQty}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  }

  return null;
};
