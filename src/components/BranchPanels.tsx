import React, { useState } from 'react';
import { UsersDatabase, User, DraftOrder, ReturnDraft, ReceivedInvoice, Order, ReturnOrder } from '../types';

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
  orders?: Order[];
  returnsOrders?: ReturnOrder[];
  onViewInvoice?: (invoiceCode: string, type: 'sent' | 'wh_received' | 'merged' | 'closed' | 'received') => void;
  savedItemsCatalog?: Record<string, string[]>;

  currentUser?: User;
  onDeleteSingleOrder?: (orderId: number) => void;
  onEditSingleOrder?: (orderId: number) => void;
  onDeleteInvoiceByCode?: (invoiceCode: string) => void;
  onDeleteReturnOrder?: (returnCodeOrId: string | number) => void;
  onEditReturnOrder?: (returnId: number) => void;
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
  orders = [],
  returnsOrders = [],
  onViewInvoice,
  savedItemsCatalog = {},

  currentUser,
  onDeleteSingleOrder,
  onEditSingleOrder,
  onDeleteInvoiceByCode,
  onDeleteReturnOrder,
  onEditReturnOrder,
}) => {
  const [expandedReturnCode, setExpandedReturnCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemForInvoiceChoice, setSelectedItemForInvoiceChoice] = useState<any | null>(null);

  React.useEffect(() => {
    setSelectedItemForInvoiceChoice(null);
  }, [activeTab]);

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

    const branchCatalog = (savedItemsCatalog && (savedItemsCatalog[branchName] || savedItemsCatalog[userKey])) || [];

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>📋 إعداد طلبية نواقص - {branchName}</h2>
        <div className="form-row">
          <div className="form-group">
            <label>اكتب اسم الصنف</label>
            <input
              type="text"
              list={`items-autocomplete-list-${userKey}`}
              id={itemInputKey}
              value={itemVal}
              onChange={(e) =>
                setBranchItemInputs((prev) => ({ ...prev, [itemInputKey]: e.target.value }))
              }
              onKeyDown={handleItemKeyDown}
            />
            <datalist id={`items-autocomplete-list-${userKey}`}>
              {branchCatalog.map((item, idx) => (
                <option key={idx} value={item} />
              ))}
            </datalist>
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

    const branchCatalog = (savedItemsCatalog && (savedItemsCatalog[branchName] || savedItemsCatalog[userKey])) || [];

    return (
      <div id={activeTab} className="panel active" dir="rtl">
        <h2>↩️ إعداد فاتورة مرتجعات (الفاتورة المفتوحة حالياً) - {branchName}</h2>
        <p style={{ color: '#4b5563', fontSize: '14.5px', marginBottom: '20px' }}>
          💡 يمكنك كتابة اسم الصنف وتحديد الكمية المرتجعة ثم إضافتهما إلى <strong>الفاتورة المفتوحة</strong>. أضف كافة الأصناف المرتجعة دفعة واحدة، ثم اضغط على زر الإرسال بالأسفل لتصدير الفاتورة بالكامل إلى المخازن.
        </p>

        <div className="form-row" style={{ background: '#fef3c7', padding: '15px', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '25px' }}>
          <div className="form-group" style={{ flex: 2 }}>
            <label style={{ fontWeight: 'bold', color: '#92400e' }}>✍️ اسم صنف المرتجع</label>
            <input
              type="text"
              list={`items-autocomplete-list-${userKey}`}
              id={itemInputKey}
              placeholder="اكتب اسم الصنف أو اختر من القائمة"
              value={itemVal}
              onChange={(e) =>
                setBranchReturnItemInputs((prev) => ({
                  ...prev,
                  [itemInputKey]: e.target.value,
                }))
              }
              onKeyDown={handleItemKeyDown}
              style={{ border: '1px solid #f59e0b', borderRadius: '6px', padding: '10px' }}
            />
            <datalist id={`items-autocomplete-list-${userKey}`}>
              {branchCatalog.map((item, idx) => (
                <option key={idx} value={item} />
              ))}
            </datalist>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold', color: '#92400e' }}>🔢 الكمية المرتجعة</label>
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
              style={{ border: '1px solid #f59e0b', borderRadius: '6px', padding: '10px' }}
            />
          </div>
          <button
            className="btn btn-warning"
            onClick={() => onAddToReturnsDraft(branchName, itemInputKey, qtyInputKey)}
            style={{ alignSelf: 'flex-end', height: '44px', fontWeight: 'bold', padding: '0 25px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ➕ إضافة للفاتورة المفتوحة
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>📝 الفاتورة المفتوحة حالياً (قيد المراجعة والإضافة)</h3>
          <span className="badge badge-warning" style={{ fontSize: '13px', padding: '6px 12px', background: '#f59e0b', color: '#fff' }}>
            {items.length} أصناف مضافة
          </span>
        </div>

        <table id={`table-${userKey}-returns-draft`}>
          <thead>
            <tr>
              <th>الصنف</th>
              <th style={{ textAlign: 'center' }}>الكمية المرتجعة</th>
              <th style={{ textAlign: 'center' }}>الحالة</th>
              <th style={{ textAlign: 'center' }}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: '30px', background: '#f9fafb' }}>
                  ⚠️ الفاتورة المفتوحة فارغة حالياً. يرجى كتابة اسم الصنف والكمية بالأعلى وإضافتهما لتبدأ في إعداد الفاتورة.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.returnDraftId}>
                  <td>
                    <strong>{r.item}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#b45309', background: '#fef3c7', padding: '4px 12px', borderRadius: '4px' }}>
                      {r.qty}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-pending" style={{ background: '#f59e0b', color: '#fff' }}>بانتظار الإرسال النهائي</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onRemoveFromReturnsDraft(r.returnDraftId)}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      🗑 حذف البند
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {items.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              className="btn btn-warning" 
              onClick={() => onSubmitReturns(branchName)}
              style={{ fontWeight: 'bold', fontSize: '15px', padding: '12px 30px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)' }}
            >
              🚀 إرسال الفاتورة المفتوحة بالكامل إلى المخازن
            </button>
          </div>
        )}

        <hr style={{ margin: '35px 0 25px 0', borderColor: '#e2e8f0', borderWidth: '1px', borderStyle: 'solid' }} />

        <div className="section-header" style={{ marginBottom: '15px' }}>
          <h3>⏪ قسم المرتجعات المرسلة (سجل المرتجعات التاريخي)</h3>
          <p style={{ color: '#555', fontSize: '13.5px', marginTop: '4px' }}>
            تُحفظ كافة المرتجعات المرسلة من حسابك هنا وتُحدث حالات استلامها فورياً من قِبل المخازن دون تصفير.
          </p>
        </div>

        <table id={`table-${userKey}-sent-returns`}>
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>#</th>
              <th>كود المرتجع</th>
              <th>تاريخ الإرسال</th>
              <th style={{ textAlign: 'center' }}>عدد الأصناف المرتجعة</th>
              <th style={{ textAlign: 'center' }}>الحالة والجهة المستلمة</th>
              <th style={{ textAlign: 'center' }}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const branchReturns = (returnsOrders || []).filter((r) => r.branch === branchName);
              const uniqueReturnCodes = Array.from(new Set(branchReturns.map((r) => r.returnCode))).reverse(); // Show newest first

              if (uniqueReturnCodes.length === 0) {
                return (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '25px' }}>
                      📭 لم يتم إرسال أي مرتجعات من هذا المعرض بعد.
                    </td>
                  </tr>
                );
              }

              return uniqueReturnCodes.map((retCode, idx) => {
                const returnItems = branchReturns.filter((r) => r.returnCode === retCode);
                const isExpanded = expandedReturnCode === retCode;

                let badgeClass = 'badge-pending';
                let statusText = 'بانتظار الاستلام بالمخازن';
                
                const allReceived = returnItems.every((r) => r.status === 'تم الاستلام بنجاح');
                if (allReceived) {
                  badgeClass = 'badge-success';
                  statusText = `تم الاستلام في: ${returnItems[0]?.receivedBy || 'المخازن'}`;
                }

                return (
                  <React.Fragment key={retCode}>
                    <tr>
                      <td style={{ textAlign: 'center' }}><strong>{idx + 1}</strong></td>
                      <td><strong>{retCode}</strong></td>
                      <td>{returnItems[0]?.date || 'غير محدد'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--warning)', fontSize: '14px' }}>
                          {returnItems.length} صنف
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${badgeClass}`}>{statusText}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn btn-sm btn-view"
                            onClick={() => setExpandedReturnCode(isExpanded ? null : retCode)}
                            style={{ padding: '4px 10px', fontSize: '12px', background: isExpanded ? '#475569' : 'var(--warning)', color: 'white' }}
                          >
                            {isExpanded ? '▲ إغلاق التفاصيل' : '▼ عرض تفاصيل الأصناف'}
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => onDeleteReturnOrder?.(retCode)}
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                            >
                              🗑️ حذف المرتجع
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ background: '#f8fafc', padding: '15px' }}>
                          <div style={{ padding: '5px 15px', borderRight: '3px solid var(--warning)' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>📋 تفاصيل أصناف المرتجع: {retCode}</h4>
                            <table className="table" style={{ margin: 0, width: '100%', background: 'white' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9' }}>
                                  <th>الصنف المرتجع</th>
                                  <th style={{ textAlign: 'center' }}>الكمية المرتجعة</th>
                                  <th style={{ textAlign: 'center' }}>الحالة</th>
                                  <th style={{ textAlign: 'center' }}>تاريخ ترحيل الاستلام</th>
                                </tr>
                              </thead>
                              <tbody>
                                {returnItems.map((item) => (
                                  <tr key={item.id}>
                                    <td><strong>{item.item}</strong></td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className={`badge ${item.status === 'تم الاستلام بنجاح' ? 'badge-success' : 'badge-pending'}`}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                                      {item.receivedDate || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab.endsWith('-detailed-received')) {
    const userKey = activeTab.replace('-detailed-received', '');
    const user = users[userKey];
    if (!user) return null;

    const branchName = user.name;

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
      originalOrderId?: number;
    }

    const flatItems: FlatReceivedItem[] = [];
    branchReceivedInvoices.forEach((ri) => {
      ri.items.forEach((item, itemIdx) => {
        flatItems.push({
          id: `${ri.mergedInvoiceNumber}-${item.item}-${itemIdx}-${ri.date}`,
          date: ri.date,
          item: item.item,
          warehouse: item.source || ri.source || 'غير حدد',
          qty: item.dispatchQty !== undefined ? item.dispatchQty : (item.qty !== undefined ? item.qty : 0),
          invoiceCode: ri.mergedInvoiceNumber,
          originalOrderId: item.originalOrderId,
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

    if (selectedItemForInvoiceChoice) {
      const parseDateToMs = (dateStr: string) => {
        if (!dateStr) return 0;
        const cleaned = dateStr.replace(/\//g, '-');
        const t = new Date(cleaned).getTime();
        return isNaN(t) ? 0 : t;
      };

      const candidateOrders = (orders || []).filter(
        (o) => o.item === selectedItemForInvoiceChoice.item && o.branch === branchName
      );

      let originalOrder = null;
      if (selectedItemForInvoiceChoice.originalOrderId) {
        originalOrder = candidateOrders.find(
          (o) => o.id === selectedItemForInvoiceChoice.originalOrderId
        );
      }
      if (!originalOrder && candidateOrders.length > 0) {
        const targetTime = parseDateToMs(selectedItemForInvoiceChoice.date);
        candidateOrders.sort((a, b) => {
          const distA = Math.abs(parseDateToMs(a.date) - targetTime);
          const distB = Math.abs(parseDateToMs(b.date) - targetTime);
          return distA - distB;
        });
        originalOrder = candidateOrders[0];
      }

      const sentInvoiceCode = originalOrder?.invoiceCode;
      const originalOrderQty = originalOrder?.qty !== undefined ? originalOrder.qty : 'غير متوفر';
      const originalOrderDate = originalOrder?.date || 'غير متوفر';
      const originalOrderStatus = originalOrder?.status || 'لا يوجد';

      return (
        <div id={activeTab} className="panel active" dir="rtl">
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedItemForInvoiceChoice(null)}
            style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#475569', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
          >
            🔙 العودة للكشف التفصيلي بالبنود
          </button>

          <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '8px', borderBottom: '2px solid #cbd5e1', paddingBottom: '12px' }}>
              📂 تفاصيل حركة واستعلام الصنف: <span style={{ color: '#1e40af', fontWeight: 'bold' }}>{selectedItemForInvoiceChoice.item}</span>
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>
              الرجاء اختيار الفاتورة التي ترغب في الدخول إليها واستعراض تفاصيلها الكاملة:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Card 1: Sent Invoice */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '24px' }}>📤</span>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#475569', fontWeight: 'bold' }}>الفاتورة المرسلة (طلب النواقص الكلي)</h4>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', fontSize: '14px', color: '#334155', lineHeight: '2' }}>
                    <li>📄 <strong>رقم كشف الطلب:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{sentInvoiceCode || 'غير متوفر'}</span></li>
                    <li>🔢 <strong>الكمية المطلوبة:</strong> <span style={{ fontWeight: 'bold' }}>{originalOrderQty}</span></li>
                    <li>📅 <strong>تاريخ كشف الطلب:</strong> <span>{originalOrderDate}</span></li>
                    <li>🚦 <strong>حالة الطلب الحالية:</strong> <span className="badge badge-info">{originalOrderStatus}</span></li>
                  </ul>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: sentInvoiceCode ? 'pointer' : 'not-allowed', opacity: sentInvoiceCode ? 1 : 0.6 }}
                  disabled={!sentInvoiceCode}
                  onClick={() => sentInvoiceCode && onViewInvoice?.(sentInvoiceCode, 'sent')}
                >
                  👁️ دخول واستعراض الفاتورة المرسلة
                </button>
              </div>

              {/* Card 2: Received Invoice */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '24px' }}>📥</span>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#475569', fontWeight: 'bold' }}>الفاتورة المستلمة (وارد المخازن الفعلي)</h4>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', fontSize: '14px', color: '#334155', lineHeight: '2' }}>
                    <li>📄 <strong>رقم مستند الاستلام:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedItemForInvoiceChoice.invoiceCode}</span></li>
                    <li>🔢 <strong>الكمية المستلمة فعلياً:</strong> <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{selectedItemForInvoiceChoice.qty}</span></li>
                    <li>📅 <strong>تاريخ استلام الصنف:</strong> <span>{selectedItemForInvoiceChoice.date}</span></li>
                    <li>🏢 <strong>المخزن المورد الرئيسي:</strong> <span className="badge badge-info">{selectedItemForInvoiceChoice.warehouse}</span></li>
                  </ul>
                </div>
                <button
                  className="btn btn-success"
                  style={{ width: '100%', marginTop: 'auto', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  onClick={() => onViewInvoice?.(selectedItemForInvoiceChoice.invoiceCode, 'received')}
                >
                  👁️ دخول واستعراض الفاتورة المستلمة
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

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
                <tr
                  key={fi.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedItemForInvoiceChoice(fi)}
                  title="انقر هنا لعرض الفاتورة المرسلة والمستلمة لهذا الصنف"
                >
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1e40af', textDecoration: 'underline' }}>
                      🔍 <strong>{fi.item}</strong>
                    </span>
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
