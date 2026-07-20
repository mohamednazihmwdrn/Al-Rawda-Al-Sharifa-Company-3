import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  UsersDatabase,
  User,
  Order,
  DraftOrder,
  ReturnDraft,
  ReturnOrder,
  MergedInvoice,
  ReceivedInvoice,
  InvoiceView,
} from './types';
import { getToday, safeEncodeBase64, safeDecodeBase64 } from './utils';

// Import sub-components
import { Toast } from './components/Toast';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { AdminPanels } from './components/AdminPanels';
import { BranchPanels } from './components/BranchPanels';
import { WarehousePanels } from './components/WarehousePanels';
import { PrintArea } from './components/PrintArea';

export default function App() {
  const isIncomingUpdate = useRef<boolean>(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    resolve: (val: boolean) => void;
  } | null>(null);

  const safeConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        resolve: (val) => {
          setConfirmState(null);
          resolve(val);
        },
      });
    });
  };

  // --- Root States loaded seamlessly from localStorage ---
  const [users, setUsers] = useState<UsersDatabase>(() => {
    const s = localStorage.getItem('usersDatabase_v3');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (parsed.admin) {
          parsed.admin.panel = 'admin-item-track';
        }
        return parsed;
      } catch (e) {}
    }
    return {
      admin: {
        pass: btoa('admin123'),
        role: 'admin',
        panel: 'admin-item-track',
        name: 'المدير العام للمنشأة',
      },
      rawda: {
        pass: btoa('123'),
        role: 'branch',
        panel: 'rawda-branch',
        name: 'معرض الروضة',
        invoiceCounter: 1,
        returnCounter: 1,
      },
      safaa: {
        pass: btoa('123'),
        role: 'branch',
        panel: 'safaa-branch',
        name: 'معرض الصفا',
        invoiceCounter: 1,
        returnCounter: 1,
      },
      nadi: {
        pass: btoa('123'),
        role: 'wh',
        panel: 'nadi-wh',
        name: 'مخزن النادي',
        mergedInvoiceCounter: 1,
      },
      nahas: {
        pass: btoa('123'),
        role: 'wh',
        panel: 'nahas-wh',
        name: 'مخزن النحاس',
        mergedInvoiceCounter: 1,
      },
    };
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const s = localStorage.getItem('ordersData_v3');
    try {
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });

  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>(() => {
    const s = localStorage.getItem('draftOrdersData_v3');
    try {
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });

  const [returnsDraft, setReturnsDraft] = useState<ReturnDraft[]>(() => {
    const s = localStorage.getItem('returnsDraftData_v3');
    try {
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });

  const [returnsOrders, setReturnsOrders] = useState<ReturnOrder[]>(() => {
    const s = localStorage.getItem('returnsOrdersData_v3');
    try {
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });

  const [mergedInvoices, setMergedInvoices] = useState<MergedInvoice[]>(() => {
    const s = localStorage.getItem('mergedInvoices_v3');
    try {
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });

  const [receivedInvoices, setReceivedInvoices] = useState<ReceivedInvoice[]>(() => {
    const s = localStorage.getItem('receivedInvoices_v3');
    try {
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });

  const [closedInvoices, setClosedInvoices] = useState<MergedInvoice[]>(() => {
    const s = localStorage.getItem('closedInvoices_v3');
    try {
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });

  const [orderIdCounter, setOrderIdCounter] = useState<number>(() => {
    const s = localStorage.getItem('orderIdCounter_v3');
    return s ? parseInt(s) : 1;
  });

  const [returnIdCounter, setReturnIdCounter] = useState<number>(() => {
    const s = localStorage.getItem('returnIdCounter_v3');
    return s ? parseInt(s) : 1;
  });

  const [savedItemsCatalog, setSavedItemsCatalog] = useState<string[]>(() => {
    const s = localStorage.getItem('savedItemsCatalog_v3');
    try {
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });

  // --- Session and Layout States ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUserKey = localStorage.getItem('currentUser_key');
    if (savedUserKey) {
      let dbUsers = null;
      const s = localStorage.getItem('usersDatabase_v3');
      if (s) {
        try {
          dbUsers = JSON.parse(s);
        } catch (e) {}
      }
      if (!dbUsers) {
        dbUsers = {
          admin: {
            pass: btoa('admin123'),
            role: 'admin',
            panel: 'admin-item-track',
            name: 'المدير العام للمنشأة',
          },
          rawda: {
            pass: btoa('123'),
            role: 'branch',
            panel: 'rawda-branch',
            name: 'معرض الروضة',
            invoiceCounter: 1,
            returnCounter: 1,
          },
          safaa: {
            pass: btoa('123'),
            role: 'branch',
            panel: 'safaa-branch',
            name: 'معرض الصفا',
            invoiceCounter: 1,
            returnCounter: 1,
          },
          nadi: {
            pass: btoa('123'),
            role: 'wh',
            panel: 'nadi-wh',
            name: 'مخزن النادي',
            mergedInvoiceCounter: 1,
          },
          nahas: {
            pass: btoa('123'),
            role: 'wh',
            panel: 'nahas-wh',
            name: 'مخزن النحاس',
            mergedInvoiceCounter: 1,
          },
        };
      }
      if (dbUsers[savedUserKey]) {
        const userCopy = { ...dbUsers[savedUserKey], key: savedUserKey };
        if (savedUserKey === 'admin') {
          userCopy.panel = 'admin-item-track';
        }
        return userCopy;
      }
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedActiveTab = localStorage.getItem('activeTab_key');
    if (savedActiveTab) {
      return savedActiveTab;
    }
    const savedUserKey = localStorage.getItem('currentUser_key');
    if (savedUserKey === 'admin') return 'admin-item-track';
    if (savedUserKey === 'rawda') return 'rawda-branch';
    if (savedUserKey === 'safaa') return 'safaa-branch';
    if (savedUserKey === 'nadi') return 'nadi-wh';
    if (savedUserKey === 'nahas') return 'nahas-wh';
    return 'admin-item-track';
  });
  const [activeTabBeforeDetails, setActiveTabBeforeDetails] = useState<string>(() => {
    return localStorage.getItem('activeTab_key') || 'admin-item-track';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [invoiceView, setInvoiceView] = useState<InvoiceView | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  // --- Login Form States ---
  const [loginUsername, setLoginUsername] = useState<string>('admin');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // --- Toast notifier state ---
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });

  // --- Print container state ---
  const [printContent, setPrintContent] = useState<{
    title: string;
    subtitle: string;
    html: string;
  } | null>(null);

  // --- Inputs for dynamic branch/warehouse components ---
  const [branchItemInputs, setBranchItemInputs] = useState<Record<string, string>>({});
  const [branchQtyInputs, setBranchQtyInputs] = useState<Record<string, string>>({});
  const [branchReturnItemInputs, setBranchReturnItemInputs] = useState<Record<string, string>>({});
  const [branchReturnQtyInputs, setBranchReturnQtyInputs] = useState<Record<string, string>>({});
  const [whQtyInputs, setWhQtyInputs] = useState<Record<string, string>>({});

  // --- Search inputs ---
  const [adminTrackInput, setAdminTrackInput] = useState<string>('');
  const [adminBackupOutput, setAdminBackupOutput] = useState<string>('');
  const [adminBackupInput, setAdminBackupInput] = useState<string>('');
  const [searchWhQueries, setSearchWhQueries] = useState<Record<string, string>>({});
  const [searchArchQueries, setSearchArchQueries] = useState<Record<string, string>>({});
  const [searchMergedQuery, setSearchMergedQuery] = useState<string>('');

  // --- Real-time Firestore Sync ---
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'sync', 'state'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        isIncomingUpdate.current = true;
        if (data.users) {
          setUsers(data.users);
          const savedUserKey = localStorage.getItem('currentUser_key');
          if (savedUserKey && data.users[savedUserKey]) {
            setCurrentUser((prev) => {
              if (prev) {
                const userCopy = { ...data.users[savedUserKey], key: savedUserKey };
                if (savedUserKey === 'admin') {
                  userCopy.panel = 'admin-item-track';
                }
                return userCopy;
              }
              return prev;
            });
          }
        }
        if (data.orders) setOrders(data.orders);
        if (data.draftOrders) setDraftOrders(data.draftOrders);
        if (data.returnsDraft) setReturnsDraft(data.returnsDraft);
        if (data.returnsOrders) setReturnsOrders(data.returnsOrders);
        if (data.mergedInvoices) setMergedInvoices(data.mergedInvoices);
        if (data.receivedInvoices) setReceivedInvoices(data.receivedInvoices);
        if (data.closedInvoices) setClosedInvoices(data.closedInvoices);
        if (data.orderIdCounter !== undefined) setOrderIdCounter(data.orderIdCounter);
        if (data.returnIdCounter !== undefined) setReturnIdCounter(data.returnIdCounter);
        if (data.savedItemsCatalog) setSavedItemsCatalog(data.savedItemsCatalog);

        setTimeout(() => {
          isIncomingUpdate.current = false;
        }, 150);
      } else {
        // Initialize Firestore with clean empty states if doc doesn't exist
        const defaultUsers = {
          admin: {
            pass: btoa('admin123'),
            role: 'admin',
            panel: 'admin-item-track',
            name: 'المدير العام للمنشأة',
          },
          rawda: {
            pass: btoa('123'),
            role: 'branch',
            panel: 'rawda-branch',
            name: 'معرض الروضة',
            invoiceCounter: 1,
            returnCounter: 1,
          },
          safaa: {
            pass: btoa('123'),
            role: 'branch',
            panel: 'safaa-branch',
            name: 'معرض الصفا',
            invoiceCounter: 1,
            returnCounter: 1,
          },
          nadi: {
            pass: btoa('123'),
            role: 'wh',
            panel: 'nadi-wh',
            name: 'مخزن النادي',
            mergedInvoiceCounter: 1,
          },
          nahas: {
            pass: btoa('123'),
            role: 'wh',
            panel: 'nahas-wh',
            name: 'مخزن النحاس',
            mergedInvoiceCounter: 1,
          },
        };
        setDoc(doc(db, 'sync', 'state'), {
          users: defaultUsers,
          orders: [],
          draftOrders: [],
          returnsDraft: [],
          returnsOrders: [],
          mergedInvoices: [],
          receivedInvoices: [],
          closedInvoices: [],
          orderIdCounter: 1,
          returnIdCounter: 1,
          savedItemsCatalog: [],
        }).catch((err) => console.error('Error initializing state:', err));
      }
    }, (error) => {
      console.error('Firestore subscription error:', error);
    });

    return () => unsubscribe();
  }, []);

  // Keep activeTab synchronized with localStorage
  useEffect(() => {
    if (activeTab && activeTab !== 'invoice-details') {
      localStorage.setItem('activeTab_key', activeTab);
    }
  }, [activeTab]);

  // Auto-Save whenever states change (Local Backup & Firestore live update)
  useEffect(() => {
    localStorage.setItem('usersDatabase_v3', JSON.stringify(users));
    localStorage.setItem('ordersData_v3', JSON.stringify(orders));
    localStorage.setItem('draftOrdersData_v3', JSON.stringify(draftOrders));
    localStorage.setItem('returnsDraftData_v3', JSON.stringify(returnsDraft));
    localStorage.setItem('returnsOrdersData_v3', JSON.stringify(returnsOrders));
    localStorage.setItem('mergedInvoices_v3', JSON.stringify(mergedInvoices));
    localStorage.setItem('receivedInvoices_v3', JSON.stringify(receivedInvoices));
    localStorage.setItem('closedInvoices_v3', JSON.stringify(closedInvoices));
    localStorage.setItem('orderIdCounter_v3', orderIdCounter.toString());
    localStorage.setItem('returnIdCounter_v3', returnIdCounter.toString());
    localStorage.setItem('savedItemsCatalog_v3', JSON.stringify(savedItemsCatalog));

    if (!isIncomingUpdate.current) {
      setDoc(doc(db, 'sync', 'state'), {
        users,
        orders,
        draftOrders,
        returnsDraft,
        returnsOrders,
        mergedInvoices,
        receivedInvoices,
        closedInvoices,
        orderIdCounter,
        returnIdCounter,
        savedItemsCatalog,
      }).catch((err) => {
        console.error('Firestore save error:', err);
      });
    }
  }, [
    users,
    orders,
    draftOrders,
    returnsDraft,
    returnsOrders,
    mergedInvoices,
    receivedInvoices,
    closedInvoices,
    orderIdCounter,
    returnIdCounter,
    savedItemsCatalog,
  ]);

  // Toast auto-clear
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Trigger print and reset print state
  useEffect(() => {
    if (printContent) {
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.warn('Printing is restricted in this environment:', e);
          showToast('⚠️ تم حظر نافذة الطباعة بواسطة المتصفح (بسبب عرض التطبيق داخل إطار iframe). يرجى الضغط على زر فتح في نافذة مستقلة/خارجية للتمكن من الطباعة وحفظ ملفات PDF بشكل كامل.', 'warning');
        }
        setPrintContent(null);
      }, 200);
    }
  }, [printContent]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type, show: true });
  };

  const printHtmlSafe = (title: string, subtitle: string, html: string, isPdf?: boolean) => {
    if (isPdf) {
      showToast(
        "💡 لتصدير الملف كـ PDF، يرجى اختيار 'حفظ بتنسيق PDF' (Save as PDF) كوجهة (Destination) في نافذة الطباعة التي ستظهر الآن.",
        "success"
      );
    }

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="ar" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style id="pageStyle">
              @page {
                size: auto;
                margin: 10mm !important;
              }
            </style>
            <style>
              /* Base styles */
              * {
                -webkit-print-color-adjust: economy !important;
                print-color-adjust: economy !important;
                transform: none !important;
                filter: none !important;
                box-shadow: none !important;
                text-shadow: none !important;
                transition: none !important;
                animation: none !important;
                will-change: auto !important;
              }

              body {
                font-family: Arial, sans-serif;
                direction: rtl;
                padding: 0;
                margin: 0;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }

              .print-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 0px !important;
                box-sizing: border-box !important;
                page-break-inside: auto !important;
                break-inside: auto !important;
              }

              /* Header styling */
              .header {
                text-align: center;
                border-bottom: 2px solid #000000 !important;
                padding-bottom: 4px !important;
                margin-bottom: 8px !important;
              }
              .company-name-main {
                font-size: 14px;
                font-weight: bold;
                color: #000000;
                margin: 0;
              }
              .company-sub {
                display: none !important;
              }
              .header h1 {
                font-size: 13px;
                margin: 2px 0;
                font-weight: bold;
                color: #000000;
              }
              .header h2 {
                font-size: 9px;
                font-weight: normal;
                color: #000000;
                margin: 0;
              }

              /* High-precision crisp table styling */
              table {
                width: 100% !important;
                table-layout: fixed !important;
                border-collapse: collapse !important;
                margin-top: 5px !important;
                direction: rtl;
                border: 0.5px solid #000000 !important;
                background-color: transparent !important;
                background: none !important;
                box-shadow: none !important;
                page-break-inside: auto !important;
                break-inside: auto !important;
              }
              thead {
                display: table-header-group !important;
                background-color: transparent !important;
                background: none !important;
              }
              tr {
                height: 25px !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                background-color: transparent !important;
                background: none !important;
                box-shadow: none !important;
              }
              th, td {
                border: 0.5px solid #000000 !important;
                padding: 6px 8px !important;
                font-family: Arial, Helvetica, sans-serif !important;
                font-size: 11.5px !important;
                line-height: 1.35 !important;
                text-align: center !important;
                vertical-align: middle !important;
                word-wrap: break-word !important;
                white-space: normal !important;
                background-color: transparent !important;
                background: none !important;
                color: #000000 !important;
                box-shadow: none !important;
              }
              th {
                font-size: 12.5px !important;
                font-weight: bold !important;
                background-color: transparent !important;
                background: none !important;
              }
              td strong {
                font-weight: bold !important;
                font-size: 11.5px !important;
                color: #000000 !important;
              }

              /* Compact styling to comfortably fit up to 30 items on A5 and 50 on A4 */
              .compact-table th, 
              .compact-table td {
                padding: 3px 5px !important;
                font-size: 10px !important;
                line-height: 1.15 !important;
                background-color: transparent !important;
                background: none !important;
              }
              .compact-table th {
                font-size: 10.5px !important;
              }
              .compact-table td strong {
                font-size: 10px !important;
              }
              .compact-table .badge {
                padding: 0px 2px !important;
                font-size: 9px !important;
              }
              .compact-table + .summary-box-print {
                margin-top: 6px !important;
                padding: 4px !important;
                gap: 4px !important;
              }
              .compact-table + .summary-box-print div {
                padding: 3px !important;
                font-size: 10px !important;
              }

              /* Specific column settings for main invoice table to prevent squeezing of names */
              #printable-table th:nth-child(1), #printable-table td:nth-child(1) {
                width: 4% !important;
                white-space: nowrap !important;
                text-align: center !important;
              }
              #printable-table th:nth-child(2), #printable-table td:nth-child(2) {
                width: 54% !important; /* increased to give maximum room for item names */
                text-align: right !important;
                white-space: normal !important;
                word-break: break-word !important;
              }
              #printable-table th:nth-child(3), #printable-table td:nth-child(3) {
                width: 8% !important;
                text-align: center !important;
                white-space: normal !important;
              }
              #printable-table th:nth-child(4), #printable-table td:nth-child(4) {
                width: 8% !important;
                text-align: center !important;
                white-space: normal !important;
              }
              #printable-table th:nth-child(5), #printable-table td:nth-child(5) {
                width: 8% !important;
                text-align: center !important;
                white-space: normal !important;
              }
              #printable-table th:nth-child(6), #printable-table td:nth-child(6) {
                width: 8% !important;
                text-align: center !important;
                white-space: normal !important;
              }
              #printable-table th:nth-child(7), #printable-table td:nth-child(7) {
                width: 10% !important;
                text-align: center !important;
                white-space: normal !important;
              }

              /* Badge styling */
              .badge, .badge-success, .badge-pending, .badge-danger {
                display: inline-block !important;
                padding: 1.5px 3px !important;
                border-radius: 1px !important;
                font-size: 8.5pt !important;
                border: none !important;
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #000000 !important;
                white-space: nowrap !important;
              }

              /* Screen only footer style - make it visible on screen too */
              .print-footer {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                border-top: 1.5px solid #000000 !important;
                padding-top: 6px !important;
                margin-top: 25px !important;
                font-size: 9.5pt !important;
                font-weight: bold !important;
                color: #000000 !important;
              }

              /* Print-specific optimizations (Strict Black and White & Ultra Compact 50 Rows Single Page) */
              @media print {
                /* Strip all backgrounds and force clean white with sharp black ink */
                * {
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  color: #000000 !important;
                  box-shadow: none !important;
                  text-shadow: none !important;
                  -webkit-print-color-adjust: economy !important;
                  print-color-adjust: economy !important;
                }

                body {
                  padding: 0 !important;
                  margin: 0 !important;
                  font-size: 7.5pt !important;
                  line-height: 1.05 !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                }

                .print-container {
                  padding: 0 !important;
                  margin: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  page-break-inside: auto !important;
                  break-inside: auto !important;
                }

                .header {
                  padding-bottom: 3px !important;
                  margin-bottom: 6px !important;
                  border-bottom: 1.5px solid #000000 !important;
                }

                .company-name-main {
                  font-size: 13px !important;
                  font-weight: bold !important;
                  margin: 0 !important;
                }

                .company-sub {
                  display: none !important; /* hide non-essential details to gain vertical space */
                }

                .header h1 {
                  font-size: 11px !important;
                  margin: 1px 0 !important;
                  font-weight: bold !important;
                }

                .header h2 {
                  font-size: 8.5px !important;
                  margin: 0 !important;
                }

                /* Fixed table layouts and borders to support 50 rows comfortably on 1 page */
                table {
                  width: 100% !important;
                  table-layout: fixed !important;
                  border-collapse: collapse !important;
                  margin-top: 4px !important;
                  border: 1px solid #000000 !important;
                  background-color: #ffffff !important;
                  page-break-inside: auto !important;
                  break-inside: auto !important;
                         th, td {
                  border: 1px solid #000000 !important;
                  padding: 6px 8px !important; /* comfortable default padding */
                  font-size: 11.5px !important; /* highly legible default font size */
                  line-height: 1.35 !important;
                  text-align: center !important;
                  vertical-align: middle !important;
                  word-wrap: break-word !important;
                  white-space: normal !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  color: #000000 !important;
                }

                th {
                  font-size: 12.5px !important;
                  font-weight: bold !important;
                  white-space: normal !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                }

                td strong {
                  font-weight: bold !important;
                  font-size: 11.5px !important;
                  color: #000000 !important;
                }

                /* Compact table styles specifically when there are many rows */
                .compact-table th,
                .compact-table td {
                  padding: 3px 5px !important;
                  font-size: 10px !important;
                  line-height: 1.15 !important;
                }
                .compact-table th {
                  font-size: 10.5px !important;
                }
                .compact-table td strong {
                  font-size: 10px !important;
                }

                /* Proportional column widths for perfect printing on main invoice table without overlapping */
                #printable-table th:nth-child(1), #printable-table td:nth-child(1) {
                  width: 4% !important;
                  white-space: nowrap !important;
                  text-align: center !important;
                }
                #printable-table th:nth-child(2), #printable-table td:nth-child(2) {
                  width: 54% !important; /* widened to 54% to prevent wrapping of item names */
                  text-align: right !important;
                  white-space: normal !important;
                  word-break: break-word !important;
                }
                #printable-table th:nth-child(3), #printable-table td:nth-child(3) {
                  width: 8% !important;
                  text-align: center !important;
                  white-space: normal !important;
                }
                #printable-table th:nth-child(4), #printable-table td:nth-child(4) {
                  width: 8% !important;
                  text-align: center !important;
                  white-space: normal !important;
                }
                #printable-table th:nth-child(5), #printable-table td:nth-child(5) {
                  width: 8% !important;
                  text-align: center !important;
                  white-space: normal !important;
                }
                #printable-table th:nth-child(6), #printable-table td:nth-child(6) {
                  width: 8% !important;
                  text-align: center !important;
                  white-space: normal !important;
                }
                #printable-table th:nth-child(7), #printable-table td:nth-child(7) {
                  width: 10% !important;
                  text-align: center !important;
                  white-space: normal !important;
                }

                /* Print badges: pure black outlines, no color filling, no shadows */
                .badge, .badge-success, .badge-pending, .badge-danger {
                  display: inline-block !important;
                  padding: 0.5px 2px !important;
                  border-radius: 1px !important;
                  font-size: 6.8pt !important;
                  border: none !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  color: #000000 !important;
                  white-space: nowrap !important;
                }

                .no-print {
                  display: none !important;
                }

                /* Total Summary Boxes: Simple Black & White grid with outlines */
                .summary-box-print {
                  margin-top: 6px !important;
                  padding: 4px !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  border: 1px solid #000000 !important;
                  display: grid !important;
                  grid-template-columns: repeat(4, 1fr) !important;
                  gap: 4px !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }

                .summary-box-print div {
                  padding: 3px !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  border: 1px solid #000000 !important;
                  color: #000000 !important;
                  font-size: 7.8pt !important;
                  text-align: center !important;
                }

                .summary-box-print div span {
                  color: #000000 !important;
                  font-size: 8.5pt !important;
                  font-weight: bold !important;
                }

                .print-footer {
                  display: flex !important;
                  position: fixed !important;
                  bottom: 0px !important;
                  left: 0 !important;
                  right: 0 !important;
                  justify-content: space-between !important;
                  align-items: center !important;
                  border-top: 1px solid #000000 !important;
                  padding-top: 2px !important;
                  font-size: 7.5pt !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                }
              }
            </style>
          </head>
          <body dir="rtl">
            <div class="print-container">
              <div class="header">
                <div class="company-name-main">شركة الروضة الشريفة</div>
                <h1>${title}</h1>
                <h2>${subtitle}</h2>
              </div>
              <div>${html}</div>
            </div>
            <div class="print-footer">
              <div style="font-weight: bold; color: #000000;">🏛️ شركة الروضة الشريفة</div>
              <div style="direction: rtl; font-weight: bold; color: #000000;">حقوق الملكية الفكرية محفوظة لمطور النظام Mohamed Nazih ورقم هاتفي 01029190615 ©</div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                }, 400);
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    } catch (e) {
      console.warn('Popup print blocked, falling back to inline:', e);
    }

    setPrintContent({
      title,
      subtitle,
      html,
    });
  };

  // --- Core Operation Actions ---
  const handleLogin = () => {
    const u = loginUsername;
    const p = loginPassword;
    if (users[u] && atob(users[u].pass) === p) {
      const userCopy = { ...users[u], key: u };
      if (u === 'admin') {
        userCopy.panel = 'admin-item-track';
      }
      setCurrentUser(userCopy);
      localStorage.setItem('currentUser_key', u);
      localStorage.setItem('activeTab_key', userCopy.panel);
      setLoginPassword('');
      showToast(`مرحباً بك في لوحة تحكم ${userCopy.name}`, 'success');
      setActiveTab(userCopy.panel);
    } else {
      showToast('خطأ في كلمة المرور المكتوبة، يرجى إعادة المحاولة!', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setInvoiceView(null);
    localStorage.removeItem('currentUser_key');
    localStorage.removeItem('activeTab_key');
    showToast('تم تسجيل الخروج وتأمين الجلسة', 'warning');
  };

  const handleGoBack = () => {
    if (activeTab === 'invoice-details') {
      setActiveTab(activeTabBeforeDetails);
      setInvoiceView(null);
    } else if (currentUser) {
      if (currentUser.key === 'admin') {
        setActiveTab('admin-item-track');
      } else {
        setActiveTab(currentUser.panel);
      }
    }
  };

  // --- Branch deficit requests operations ---
  const handleAddToDraft = (branchName: string, itemInputKey: string, qtyInputKey: string) => {
    const item = (branchItemInputs[itemInputKey] || '').trim();
    const qty = parseInt(branchQtyInputs[qtyInputKey] || '');

    if (!item) {
      showToast('يرجى كتابة اسم الصنف أولاً', 'error');
      return;
    }
    if (isNaN(qty) || qty < 1) {
      showToast('يرجى تحديد وكتابة كمية الصنف المطلوبة', 'error');
      return;
    }

    if (!savedItemsCatalog.includes(item)) {
      setSavedItemsCatalog((prev) => [...prev, item]);
    }

    const existingIdx = draftOrders.findIndex((d) => d.branch === branchName && d.item === item);
    if (existingIdx !== -1) {
      const updated = [...draftOrders];
      updated[existingIdx].qty += qty;
      setDraftOrders(updated);
      showToast(
        `تم تحديث وزيادة كمية الصنف [ ${item} ] لتصبح ${updated[existingIdx].qty}`,
        'success'
      );
    } else {
      setDraftOrders((prev) => [
        ...prev,
        { draftId: Date.now() + Math.random(), branch: branchName, item, qty },
      ]);
      showToast(`تم تسجيل الصنف بنجاح في الفاتورة الحالية: ${item}`, 'success');
    }

    setBranchItemInputs((prev) => ({ ...prev, [itemInputKey]: '' }));
    setBranchQtyInputs((prev) => ({ ...prev, [qtyInputKey]: '' }));
    setTimeout(() => {
      document.getElementById(itemInputKey)?.focus();
    }, 50);
  };

  const handleRemoveFromDraft = async (draftId: number) => {
    const confirmed = await safeConfirm('هل ترغب في حذف هذا الصنف من المسودة التجهيزية؟');
    if (confirmed) {
      setDraftOrders((prev) => prev.filter((d) => d.draftId !== draftId));
      showToast('تمت الإزالة من القائمة', 'warning');
    }
  };

  const handleSubmitDraft = (branchName: string) => {
    const items = draftOrders.filter((d) => d.branch === branchName);
    if (items.length === 0) {
      showToast('لا توجد أي أصناف مكتوبة بمسودة الطلب حالياً لإرسالها!', 'error');
      return;
    }

    let keyUser = '';
    Object.keys(users).forEach((k) => {
      if (users[k].name === branchName) {
        keyUser = k;
      }
    });
    if (!keyUser) keyUser = 'rawda';

    const userObj = users[keyUser];
    const counter = userObj.invoiceCounter || 1;
    const invoiceCode = `FA-${keyUser.toUpperCase()}-${counter}`;
    const date = getToday();

    const newOrders: Order[] = items.map((d, index) => ({
      id: orderIdCounter + index,
      invoiceCode,
      branch: d.branch,
      item: d.item,
      qty: d.qty,
      dispatchQty: 0,
      remainingQty: d.qty,
      status: 'قيد الانتظار',
      source: '',
      type: 'جاهز للمخزن',
      date,
      isDispatched: false,
      warehouseClosed: false,
      closedBy: '',
    }));

    setOrders((prev) => [...prev, ...newOrders]);
    setOrderIdCounter((prev) => prev + items.length);

    // Increment invoiceCounter
    setUsers((prev) => ({
      ...prev,
      [keyUser]: {
        ...prev[keyUser],
        invoiceCounter: counter + 1,
      },
    }));

    setDraftOrders((prev) => prev.filter((d) => d.branch !== branchName));
    showToast(
      `🚀 تم تصدير المستند الموحد [ ${invoiceCode} ] بنجاح لجميع المخازن`,
      'success'
    );
  };

  // --- Branch returns operations ---
  const handleAddToReturnsDraft = (branchName: string, itemInputKey: string, qtyInputKey: string) => {
    const item = (branchReturnItemInputs[itemInputKey] || '').trim();
    const qty = parseInt(branchReturnQtyInputs[qtyInputKey] || '');

    if (!item) {
      showToast('يرجى كتابة اسم صنف المرتجع أولاً', 'error');
      return;
    }
    if (isNaN(qty) || qty < 1) {
      showToast('يرجى تحديد كمية المرتجع', 'error');
      return;
    }

    if (!savedItemsCatalog.includes(item)) {
      setSavedItemsCatalog((prev) => [...prev, item]);
    }

    const existingIdx = returnsDraft.findIndex((r) => r.branch === branchName && r.item === item);
    if (existingIdx !== -1) {
      const updated = [...returnsDraft];
      updated[existingIdx].qty += qty;
      setReturnsDraft(updated);
      showToast(`تم زيادة كمية مرتجع صنف [ ${item} ] ليكون ${updated[existingIdx].qty}`, 'success');
    } else {
      setReturnsDraft((prev) => [
        ...prev,
        { returnDraftId: Date.now() + Math.random(), branch: branchName, item, qty },
      ]);
      showToast(`تم إضافة صنف المرتجع للمسودة: ${item}`, 'success');
    }

    setBranchReturnItemInputs((prev) => ({ ...prev, [itemInputKey]: '' }));
    setBranchReturnQtyInputs((prev) => ({ ...prev, [qtyInputKey]: '' }));
    setTimeout(() => {
      document.getElementById(itemInputKey)?.focus();
    }, 50);
  };

  const handleRemoveFromReturnsDraft = async (returnDraftId: number) => {
    const confirmed = await safeConfirm('هل ترغب في حذف الصنف من مسودة المرتجعات؟');
    if (confirmed) {
      setReturnsDraft((prev) => prev.filter((r) => r.returnDraftId !== returnDraftId));
      showToast('تم حذف صنف المرتجع من المسودة', 'warning');
    }
  };

  const handleSubmitReturns = (branchName: string) => {
    const items = returnsDraft.filter((r) => r.branch === branchName);
    if (items.length === 0) {
      showToast('لا توجد بنود بمسودة المرتجع لإرسالها!', 'error');
      return;
    }

    let keyUser = '';
    Object.keys(users).forEach((k) => {
      if (users[k].name === branchName) {
        keyUser = k;
      }
    });
    if (!keyUser) keyUser = 'rawda';

    const userObj = users[keyUser];
    const counter = userObj.returnCounter || 1;
    const returnCode = `RET-${keyUser.toUpperCase()}-${counter}`;
    const date = getToday();

    const newReturns: ReturnOrder[] = items.map((r, index) => ({
      id: returnIdCounter + index,
      returnCode,
      branch: r.branch,
      item: r.item,
      qty: r.qty,
      status: 'بانتظار الاستلام بالمخازن',
      receivedBy: '',
      date,
    }));

    setReturnsOrders((prev) => [...prev, ...newReturns]);
    setReturnIdCounter((prev) => prev + items.length);

    // Update returnCounter
    setUsers((prev) => ({
      ...prev,
      [keyUser]: {
        ...prev[keyUser],
        returnCounter: counter + 1,
      },
    }));

    setReturnsDraft((prev) => prev.filter((r) => r.branch !== branchName));
    showToast(`🚀 تم تصدير مستند المرتجع [ ${returnCode} ] إلى المخازن`, 'success');
  };

  // --- Warehouse deficit approvals & closings ---
  const handleDispatchItem = (orderId: number, warehouseName: string, overrideQty?: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const inputVal = whQtyInputs[orderId.toString()];
    const qty = overrideQty !== undefined ? overrideQty : (inputVal !== undefined ? parseInt(inputVal) : order.qty);

    if (isNaN(qty) || qty < 0) {
      showToast('الكمية المسجلة للصرف غير منطقية', 'error');
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'تم الصرف',
              source: warehouseName,
              dispatchQty: qty,
              remainingQty: o.qty - qty,
              isDispatched: true,
              dispatchDate: getToday(),
            }
          : o
      )
    );

    showToast(`تم إقرار صرف عدد ${qty} من الصنف ${order.item}`, 'success');
  };

  const handleReopenDispatchItem = (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'قيد الانتظار',
              source: '',
              dispatchQty: undefined,
              remainingQty: o.qty,
              isDispatched: false,
              dispatchDate: undefined,
            }
          : o
      )
    );
    showToast('🔓 تم إلغاء الصرف وإعادة فتح الصنف للتعديل والمطابقة', 'warning');
  };

  const handleCloseWarehouseInvoice = async (warehouseName: string) => {
    const dispatches = orders.filter(
      (o) =>
        o.type === 'جاهز للمخزن' &&
        o.status === 'تم الصرف' &&
        o.source === warehouseName &&
        !o.warehouseClosed
    );
    if (dispatches.length === 0) {
      showToast(
        `لا توجد فواتير تم صرف أصناف منها حالياً لغلقها في ${warehouseName}`,
        'warning'
      );
      return;
    }
    const confirmed = await safeConfirm(`هل أنت متأكد من ترحيل وإغلاق عمليات الصرف في ${warehouseName}؟`);
    if (!confirmed) return;

    let whKey = '';
    Object.keys(users).forEach((k) => {
      if (users[k].name === warehouseName) {
        whKey = k;
      }
    });
    if (!whKey) whKey = 'nadi';

    const whUser = users[whKey];
    const mergedCounter = whUser.mergedInvoiceCounter || 1;
    const mergedInvoiceTitle = `M-INV-${whKey.toUpperCase()}-${mergedCounter}`;
    const date = getToday();

    const grouped: Record<string, Order[]> = {};
    dispatches.forEach((o) => {
      if (!grouped[o.branch]) grouped[o.branch] = [];
      grouped[o.branch].push(o);
    });

    const newMergedInvoice: MergedInvoice = {
      id: Date.now(),
      invoiceNumber: mergedInvoiceTitle,
      warehouse: warehouseName,
      date,
      branches: grouped,
      items: dispatches.map((o) => ({
        branch: o.branch,
        item: o.item,
        qty: o.qty,
        dispatchQty: o.dispatchQty,
        remainingQty: o.remainingQty,
        orderId: o.id,
        status: o.status,
        source: warehouseName,
      })),
    };

    setMergedInvoices((prev) => [...prev, newMergedInvoice]);
    setClosedInvoices((prev) => [...prev, newMergedInvoice]);

    const remainingOrdersToCreate: Order[] = [];
    dispatches.forEach((d, index) => {
      if (d.remainingQty > 0) {
        remainingOrdersToCreate.push({
          id: Date.now() + index + Math.floor(Math.random() * 10000),
          invoiceCode: d.invoiceCode,
          branch: d.branch,
          item: d.item,
          qty: d.remainingQty,
          dispatchQty: 0,
          remainingQty: d.remainingQty,
          status: 'قيد الانتظار',
          source: '',
          type: 'جاهز للمخزن',
          date: d.date,
          isDispatched: false,
          warehouseClosed: false,
          closedBy: '',
          excludeWarehouse: warehouseName,
        });
      }
    });

    // Close and Archive orders
    setOrders((prev) => {
      const updated = prev.map((o) => {
        const isMatched = dispatches.find((d) => d.id === o.id);
        if (isMatched) {
          return {
            ...o,
            warehouseClosed: true,
            closedBy: warehouseName,
            status: 'تم الأرشفة',
          };
        }
        // Exclude this warehouse from seeing untouched/pending orders of type 'جاهز للمخزن'
        if (o.type === 'جاهز للمخزن' && o.status === 'قيد الانتظار' && !o.warehouseClosed) {
          const exclusions = o.excludeWarehouse ? o.excludeWarehouse.split(',') : [];
          if (!exclusions.includes(warehouseName)) {
            return {
              ...o,
              excludeWarehouse: [...exclusions, warehouseName].join(','),
            };
          }
        }
        return o;
      });
      return [...updated, ...remainingOrdersToCreate];
    });

    // Update receivedInvoices for branches
    let updatedReceived = [...receivedInvoices];
    for (let branch in grouped) {
      const existingIndex = updatedReceived.findIndex((ri) => ri.branch === branch && ri.date === date);
      const itemsToAdd = grouped[branch].map((o) => ({
        item: o.item,
        qty: o.qty,
        dispatchQty: o.dispatchQty,
        remainingQty: o.remainingQty,
        source: warehouseName,
        originalOrderId: o.id,
        status: 'تم الأرشفة',
      }));

      if (existingIndex !== -1) {
        const existingRec = updatedReceived[existingIndex];
        const newSource = existingRec.source.includes(warehouseName)
          ? existingRec.source
          : existingRec.source + ' + ' + warehouseName;
        updatedReceived[existingIndex] = {
          ...existingRec,
          source: newSource,
          items: [...existingRec.items, ...itemsToAdd],
        };
      } else {
        let branchKey = 'RAWDA';
        Object.keys(users).forEach((k) => {
          if (users[k].name === branch) {
            branchKey = k.toUpperCase();
          }
        });
        // Count existing received invoices for this branch to get the next sequential number starting from 1
        const branchRecs = updatedReceived.filter((ri) => ri.branch === branch);
        const nextNum = branchRecs.length + 1;
        const recInvoiceTitle = `REC-${branchKey}-${nextNum}`;
        updatedReceived.push({
          id: Date.now() + Math.random(),
          branch,
          mergedInvoiceNumber: recInvoiceTitle,
          source: warehouseName,
          date,
          items: itemsToAdd,
        });
      }
    }

    setReceivedInvoices(updatedReceived);

    // Update warehouse merged counter
    setUsers((prev) => ({
      ...prev,
      [whKey]: {
        ...prev[whKey],
        mergedInvoiceCounter: mergedCounter + 1,
      },
    }));

    showToast(`🔒 تم ترحيل وتوليد فواتير المستلم المدمجة الكلية للأرشيف بنجاح`, 'success');
  };

  const handleReceiveReturnItem = async (returnId: number, warehouseName: string) => {
    const retItem = returnsOrders.find((r) => r.id === returnId);
    if (!retItem) return;

    const confirmed = await safeConfirm(
      `هل تؤكد استلام الصنف [ ${retItem.item} ] وإضافته في أرشيف استلام مرتجعات ${warehouseName}؟`
    );
    if (confirmed) {
      setReturnsOrders((prev) =>
        prev.map((r) =>
          r.id === returnId
            ? {
                ...r,
                status: 'تم الاستلام بنجاح',
                receivedBy: warehouseName,
                receivedDate: getToday(),
              }
            : r
        )
      );
      showToast(`📥 تم إقرار استلام المرتجع في ${warehouseName}`, 'success');
    }
  };

  // --- Admin panels actions ---
  const handleAddUser = (key: string, name: string, role: 'branch' | 'wh', pass: string) => {
    const cleanKey = key.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPass = pass.trim();

    if (!cleanKey || !cleanName || !cleanPass) {
      showToast('يرجى ملء كافة البيانات المطلوبة لإنشاء الحساب', 'error');
      return;
    }
    if (users[cleanKey]) {
      showToast('كود هذا المستخدم مسجل مسبقاً! يرجى اختيار كود فريد', 'error');
      return;
    }

    let panel = role === 'branch' ? `${cleanKey}-branch` : `${cleanKey}-wh`;

    const newUser: User = {
      pass: btoa(cleanPass),
      role,
      panel,
      name: cleanName,
      ...(role === 'branch'
        ? { invoiceCounter: 1, returnCounter: 1 }
        : { mergedInvoiceCounter: 1 }),
    };

    setUsers((prev) => ({ ...prev, [cleanKey]: newUser }));
    showToast(`تم إضافة الحساب الجديد [ ${cleanName} ] وصلاحياته بنجاح`, 'success');
  };

  const handleUpdateUserPassword = (key: string, newPass: string) => {
    const cleanPass = newPass.trim();
    if (!cleanPass) {
      showToast('لا يمكن حفظ كلمة مرور فارغة!', 'error');
      return;
    }
    if (users[key]) {
      setUsers((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          pass: btoa(cleanPass),
        },
      }));
      showToast(`تم تحديث كلمة المرور لـ [ ${users[key].name} ] بنجاح`, 'success');
    }
  };

  const handleDeleteUser = async (key: string) => {
    if (
      key === 'admin' ||
      key === 'rawda' ||
      key === 'safaa' ||
      key === 'nadi' ||
      key === 'nahas'
    ) {
      showToast('لا يمكن حذف الحسابات الافتراضية والأساسية للنظام المدمج!', 'error');
      return;
    }
    const confirmed = await safeConfirm(`هل أنت متأكد من حذف الحساب [ ${users[key].name} ] تماماً؟`);
    if (confirmed) {
      const updated = { ...users };
      delete updated[key];
      setUsers(updated);
      showToast('تم إقصاء وحذف الحساب من النظام الموحد', 'warning');
    }
  };

  // --- Cryptographic base64 backup actions ---
  const handleGenerateBackup = () => {
    try {
      const backupObj = {
        orders,
        draftOrders,
        returnsDraft,
        returnsOrders,
        mergedInvoices,
        receivedInvoices,
        closedInvoices,
        orderIdCounter,
        returnIdCounter,
        users,
        savedItemsCatalog,
      };
      const str = JSON.stringify(backupObj);
      const encoded = safeEncodeBase64(str);
      setAdminBackupOutput(encoded);
      showToast(
        '🔒 تم توليد كود النسخ الاحتياطي المشفر بنجاح! قم بنسخه وحفظه بأمان.',
        'success'
      );
    } catch (e) {
      showToast('حدث خطأ أثناء تشفير البيانات الكلية للحسابات', 'error');
    }
  };

  const handleRestoreBackup = async () => {
    const code = adminBackupInput.trim();
    if (!code) {
      showToast('يرجى لصق الكود المشفر أولاً لتهيئة عملية الاستعادة', 'error');
      return;
    }
    const confirmed = await safeConfirm(
      '🚨 تنبيه نهائي: هل أنت متأكد من استعادة النسخة؟ سيتم مسح كافة البيانات الحالية وتعويضها ببيانات الكود المشفر بالكامل.'
    );
    if (!confirmed) return;

    try {
      const decodedStr = safeDecodeBase64(code);
      const data = JSON.parse(decodedStr);

      if (data.users) setUsers(data.users);
      if (data.orders) setOrders(data.orders);
      if (data.draftOrders) setDraftOrders(data.draftOrders);
      if (data.returnsDraft) setReturnsDraft(data.returnsDraft);
      if (data.returnsOrders) setReturnsOrders(data.returnsOrders);
      if (data.mergedInvoices) setMergedInvoices(data.mergedInvoices);
      if (data.receivedInvoices) setReceivedInvoices(data.receivedInvoices);
      if (data.closedInvoices) setClosedInvoices(data.closedInvoices);
      if (data.orderIdCounter) setOrderIdCounter(parseInt(data.orderIdCounter));
      if (data.returnIdCounter) setReturnIdCounter(parseInt(data.returnIdCounter));
      if (data.savedItemsCatalog) setSavedItemsCatalog(data.savedItemsCatalog);

      setAdminBackupInput('');
      showToast(
        '🔓 تم فك تشفير البيانات المدمجة بنجاح واستعادة النظام الكلي لوضعه الأصلي الفوري!',
        'success'
      );
    } catch (e) {
      showToast(
        'فشلت عملية الاستعادة! الكود المدخل غير صحيح، مشوه، أو غير متطابق تشفيرياً.',
        'error'
      );
    }
  };

  const handleClearSystemData = async () => {
    const confirmed = await safeConfirm(
      '🚨 تنبيه هام جداً: هل أنت متأكد تماماً من رغبتك في تصفير النظام وتنظيف كافة الطلبيات والفواتير والمرتجعات؟ هذا الإجراء لا يمكن التراجع عنه وسيعيد تهيئة البيانات بشكل كامل وفوري!'
    );
    if (!confirmed) return;

    const defaultUsers = {
      admin: {
        pass: btoa('admin123'),
        role: 'admin',
        panel: 'admin-item-track',
        name: 'المدير العام للمنشأة',
      },
      rawda: {
        pass: btoa('123'),
        role: 'branch',
        panel: 'rawda-branch',
        name: 'معرض الروضة',
        invoiceCounter: 1,
        returnCounter: 1,
      },
      safaa: {
        pass: btoa('123'),
        role: 'branch',
        panel: 'safaa-branch',
        name: 'معرض الصفا',
        invoiceCounter: 1,
        returnCounter: 1,
      },
      nadi: {
        pass: btoa('123'),
        role: 'wh',
        panel: 'nadi-wh',
        name: 'مخزن النادي',
        mergedInvoiceCounter: 1,
      },
      nahas: {
        pass: btoa('123'),
        role: 'wh',
        panel: 'nahas-wh',
        name: 'مخزن النحاس',
        mergedInvoiceCounter: 1,
      },
    };

    isIncomingUpdate.current = false;
    setUsers(defaultUsers);
    setOrders([]);
    setDraftOrders([]);
    setReturnsDraft([]);
    setReturnsOrders([]);
    setMergedInvoices([]);
    setReceivedInvoices([]);
    setClosedInvoices([]);
    setOrderIdCounter(1);
    setReturnIdCounter(1);
    setSavedItemsCatalog([]);

    showToast('🧼 تم تصفير وتنظيف كافة البيانات والعدادات بنجاح كامل وإعادة تهيئة النظام بنجاح!', 'success');
  };

  // --- Document details screen loader ---
  const handleViewInvoice = (
    invoiceCode: string,
    type: 'sent' | 'wh_received' | 'merged' | 'closed' | 'received'
  ) => {
    let title = '';
    let itemsToDisplay: any[] = [];
    let dateStr = '';
    let originWh = '';
    let destinationBranch = '';

    if (type === 'sent' || type === 'wh_received') {
      itemsToDisplay = orders.filter((o) => o.invoiceCode === invoiceCode);
      if (itemsToDisplay.length === 0) {
        showToast('الفاتورة فارغة أو غير متواجدة بالسجلات حالياً', 'error');
        return;
      }
      title = `مستند الفاتورة المرسلة الأصلية رقم: [ ${invoiceCode} ]`;
      dateStr = itemsToDisplay[0].date;
      destinationBranch = itemsToDisplay[0].branch;
      originWh = 'تحت المعالجة (الطلب الأصلي الصادر من المعرض)';
    } else if (type === 'merged' || type === 'closed') {
      let inv = mergedInvoices.find((i) => i.invoiceNumber === invoiceCode);
      if (!inv) {
        showToast('المستند المدمج المطلوب لم يعثر عليه', 'error');
        return;
      }
      itemsToDisplay = inv.items;
      title = `مستند الفاتورة M المدمجة للمنصرف الكلي: [ ${invoiceCode} ]`;
      dateStr = inv.date;
      originWh = inv.warehouse;
      destinationBranch = Object.keys(inv.branches).join(' ، ');
    } else if (type === 'received') {
      let inv = receivedInvoices.find((i) => i.mergedInvoiceNumber === invoiceCode);
      if (!inv) {
        showToast('لا يوجد بيان مستند استلام مطابق', 'error');
        return;
      }
      itemsToDisplay = inv.items;
      title = `بيان نواقص رقم: [ ${invoiceCode} ]`;
      dateStr = inv.date;
      originWh = inv.source;
      destinationBranch = inv.branch;
    }

    setInvoiceView({
      invoiceCode,
      type,
      title,
      dateStr,
      originWh,
      destinationBranch,
      items: itemsToDisplay,
    });
    setActiveTabBeforeDetails(activeTab);
    setActiveTab('invoice-details');
  };

  const handleCloseInvoiceDetails = () => {
    setActiveTab(activeTabBeforeDetails);
    setInvoiceView(null);
  };

  const handlePrintInvoiceDetails = (isPdf?: boolean) => {
    if (!invoiceView) return;
    const view = invoiceView;

    // Group the items exactly like WarehousePanels.tsx does
    const itemGroups: Record<string, {
      item: string;
      requestedQty: number;
      nadiQty: number;
      nahasQty: number;
      deficitQty: number;
      statusText: string;
      badgeClass: string;
    }> = {};

    const invoiceCode = view.invoiceCode || '';
    const matchedOrders = orders.filter(o => o.invoiceCode === invoiceCode);

    if (matchedOrders.length > 0) {
      matchedOrders.forEach(o => {
        const name = o.item;
        if (!itemGroups[name]) {
          itemGroups[name] = {
            item: name,
            requestedQty: 0,
            nadiQty: 0,
            nahasQty: 0,
            deficitQty: 0,
            statusText: 'قيد الانتظار',
            badgeClass: 'badge-pending'
          };
        }
        itemGroups[name].requestedQty += o.qty;
        
        if (o.status === 'تم الصرف' || o.status === 'تم الأرشفة') {
          const dispatched = o.dispatchQty || 0;
          if (o.source === 'مخزن النادي') {
            itemGroups[name].nadiQty += dispatched;
          } else if (o.source === 'مخزن النحاس') {
            itemGroups[name].nahasQty += dispatched;
          } else {
            itemGroups[name].nadiQty += dispatched;
          }
        }
      });
    } else {
      view.items.forEach(it => {
        const name = it.item;
        if (!itemGroups[name]) {
          itemGroups[name] = {
            item: name,
            requestedQty: it.qty || 0,
            nadiQty: 0,
            nahasQty: 0,
            deficitQty: 0,
            statusText: 'قيد الانتظار',
            badgeClass: 'badge-pending'
          };
        }
        const disp = it.dispatchQty || 0;
        const src = it.source || it.warehouse || view.originWh || '';
        if (src.includes('النادي')) {
          itemGroups[name].nadiQty += disp;
        } else if (src.includes('النحاس')) {
          itemGroups[name].nahasQty += disp;
        } else {
          itemGroups[name].nadiQty += disp;
        }
      });
    }

    const groupedItems = Object.values(itemGroups).map(g => {
      const totalDisp = g.nadiQty + g.nahasQty;
      g.deficitQty = Math.max(0, g.requestedQty - totalDisp);
      if (totalDisp >= g.requestedQty) {
        g.statusText = 'واصل كامل';
        g.badgeClass = 'badge-success';
      } else if (totalDisp > 0) {
        g.statusText = 'واصل جزئي';
        g.badgeClass = 'badge-pending';
      } else {
        g.statusText = 'لم يصل / قيد الانتظار';
        g.badgeClass = 'badge-danger';
      }
      return g;
    });

    const totalQty = groupedItems.reduce((sum, item) => sum + item.requestedQty, 0);
    const totalNadi = groupedItems.reduce((sum, item) => sum + item.nadiQty, 0);
    const totalNahas = groupedItems.reduce((sum, item) => sum + item.nahasQty, 0);
    const totalDeficit = groupedItems.reduce((sum, item) => sum + item.deficitQty, 0);

    const isCompact = groupedItems.length > 15;

    let htmlTable = `
      <div style="font-size:12px; margin-bottom:12px; direction:rtl; line-height: 1.5; font-family:'Cairo', 'Inter', sans-serif; display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px;">
          <span>🏢 الجهة الطالبة (المعرض المستلم): <strong style="font-size: 13.5px; color: #1e293b;">${view.destinationBranch}</strong></span>
          <span>📦 حالة التنسيق: <strong style="color: #16a34a;">تغطية مدمجة (النادي + النحاس)</strong></span>
      </div>
      <table id="printable-table" class="${isCompact ? 'compact-table' : ''}" style="width:100%; border-collapse:collapse; margin-top:5px; direction:rtl; font-family:'Cairo', 'Inter', sans-serif;">
          <thead>
              <tr>
                  <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2; width: 40px; text-align: center;">#</th>
                  <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2; text-align:right;">اسم ومواصفات الصنف المعني بالطلب</th>
                  <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2; width: 110px; text-align: center;">الكمية المطلوبة الكلية</th>
                  <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2; width: 110px; text-align: center; color: #4f46e5;">صرف مخزن النادي</th>
                  <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2; width: 110px; text-align: center; color: #0891b2;">صرف مخزن النحاس</th>
                  <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2; width: 110px; text-align: center; color: #dc2626;">العجز / المتبقي الكلي</th>
                  <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2; width: 140px; text-align: center;">حالة التوريد وموقف الصنف</th>
              </tr>
          </thead>
          <tbody>
    `;

    groupedItems.forEach((item, index) => {
      let badgeClass = 'badge-pending';
      if (item.badgeClass === 'badge-success') badgeClass = 'badge-success';
      else if (item.badgeClass === 'badge-danger') badgeClass = 'badge-danger';

      htmlTable += `
          <tr>
              <td style="border:1px solid #000; padding:4px 6px; text-align:center;">${index + 1}</td>
              <td style="border:1px solid #000; padding:4px 6px; text-align:right;"><strong>${item.item}</strong></td>
              <td style="border:1px solid #000; padding:4px 6px; text-align:center; font-weight: bold;">${item.requestedQty}</td>
              <td style="border:1px solid #000; padding:4px 6px; text-align:center; color:#4f46e5; font-weight: bold;">${item.nadiQty}</td>
              <td style="border:1px solid #000; padding:4px 6px; text-align:center; color:#0891b2; font-weight: bold;">${item.nahasQty}</td>
              <td style="border:1px solid #000; padding:4px 6px; text-align:center; color:${item.deficitQty > 0 ? '#dc2626' : '#475569'}; font-weight: bold; background-color:${item.deficitQty > 0 ? '#fef2f2' : 'transparent'};">${item.deficitQty}</td>
              <td style="border:1px solid #000; padding:4px 6px; text-align:center;">
                <span class="badge ${badgeClass}">${item.statusText}</span>
              </td>
          </tr>
      `;
    });

    htmlTable += `
          </tbody>
      </table>

      <div class="summary-box-print" style="margin-top:15px; padding:10px; background:#e2e8f0; border-radius:6px; display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; font-family:'Cairo', sans-serif; font-weight:bold; font-size:11px; color:#1e293b; border:1px solid #cbd5e1; page-break-inside: avoid !important; break-inside: avoid !important;">
        <div style="padding:6px; background:white; border-radius:4px; text-align:center; border:1px solid #cbd5e1;">
          📊 إجمالي المطلوب: <span style="color:#475569; font-size:13px;">${totalQty}</span>
        </div>
        <div style="padding:6px; background:#faf5ff; border-radius:4px; text-align:center; border:1px solid #e9d5ff; color: #4f46e5;">
          💜 إجمالي صرف النادي: <span style="font-size:13px;">${totalNadi}</span>
        </div>
        <div style="padding:6px; background:#ecfeff; border-radius:4px; text-align:center; border:1px solid #c5f2f7; color: #0891b2;">
          🩵 إجمالي صرف النحاس: <span style="font-size:13px;">${totalNahas}</span>
        </div>
        <div style="padding:6px; background:#fef2f2; border-radius:4px; text-align:center; border:1px solid #fecaca; color: #dc2626;">
          ❤️ إجمالي العجز المتبقي: <span style="font-size:13px;">${totalDeficit}</span>
        </div>
      </div>
    `;

    printHtmlSafe(
      `الفاتورة الكلية رقم: [ ${view.invoiceCode} ]`,
      `التاريخ: ${view.dateStr || getToday()}`,
      htmlTable,
      isPdf
    );
  };

  const handlePrintBranchArchive = (key: string, type: 'sent' | 'rec', title: string) => {
    const branchName = key === 'rawda' ? 'معرض الروضة' : users[key]?.name || 'معرض';
    let htmlTable = `<table style="width:100%; border-collapse:collapse; direction:rtl; font-family:'Cairo', 'Inter', sans-serif;"><thead><tr>`;

    if (type === 'sent') {
      htmlTable += `
        <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2;">#</th>
        <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2;">كود الفاتورة الموحدة</th>
        <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2;">تاريخ الإصدار</th>
        <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2;">مجموع البنود</th>
      </tr></thead><tbody>`;
      const branchOrders = orders.filter((o) => o.branch === branchName && o.type === 'جاهز للمخزن');
      const uniqueInvoices = Array.from(new Set(branchOrders.map((o) => o.invoiceCode)));
      uniqueInvoices.forEach((inv, idx) => {
        const matched = branchOrders.filter((o) => o.invoiceCode === inv);
        htmlTable += `
          <tr>
            <td style="border:1px solid #000; padding:5px; text-align:center;">${idx + 1}</td>
            <td style="border:1px solid #000; padding:5px;">${inv}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center;">${matched[0]?.date}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center;">${matched.length} صنف</td>
          </tr>`;
      });
    } else {
      htmlTable += `
        <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2;">#</th>
        <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2;">كود مستند الاستلام</th>
        <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2;">المخازن الموردة للشركة</th>
        <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2;">التاريخ اليومي</th>
        <th style="border:1px solid #000; padding:6px; font-size:12px; background-color:#f2f2f2;">عدد الأصناف</th>
      </tr></thead><tbody>`;
      const items = receivedInvoices.filter((ri) => ri.branch === branchName);
      items.forEach((ri, idx) => {
        htmlTable += `
          <tr>
            <td style="border:1px solid #000; padding:5px; text-align:center;">${idx + 1}</td>
            <td style="border:1px solid #000; padding:5px;"><strong>${ri.mergedInvoiceNumber}</strong></td>
            <td style="border:1px solid #000; padding:5px;">${ri.source}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center;">${ri.date}</td>
            <td style="border:1px solid #000; padding:5px; text-align:center;">${ri.items.length} صنف</td>
          </tr>`;
      });
    }

    htmlTable += `</tbody></table>`;

    printHtmlSafe(
      title,
      `تاريخ البيان الكلي: ${getToday()}`,
      htmlTable
    );
  };

  const handlePrintCustomHtml = (title: string, subtitle: string, html: string, isPdf?: boolean) => {
    if (!title && !subtitle && !html) {
      return;
    }
    printHtmlSafe(title, subtitle, html, isPdf);
  };

  // Render Login screen if not authenticated
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        onLogin={handleLogin}
      />
    );
  }

  // Calculate whether to show contextual Back button
  const showBackButton =
    activeTab === 'invoice-details' ||
    (currentUser.role === 'admin' && activeTab !== currentUser.panel) ||
    (currentUser.role === 'wh' && activeTab !== currentUser.panel && activeTab !== 'merged-returns-wh');

  return (
    <div id="app-screen" className="app-wrapper">
      {/* Autocomplete suggestions datalist */}
      <datalist id="items-autocomplete-list">
        {savedItemsCatalog.map((item, idx) => (
          <option key={idx} value={item} />
        ))}
      </datalist>

      {/* Sidebar navigation */}
      <Sidebar
        users={users}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        onLogout={handleLogout}
        draftOrders={draftOrders}
        returnsDraft={returnsDraft}
        setSidebarCollapsed={setSidebarCollapsed}
        onShowPrivacy={() => setShowPrivacyModal(true)}
      />

      {/* Main dashboard content */}
      <div className={`main-content ${sidebarCollapsed ? 'full-width' : ''}`}>
        {/* Top Header layout */}
        <TopHeader
          currentUser={currentUser}
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onGoBack={handleGoBack}
          onLogout={handleLogout}
          showBackButton={showBackButton}
        />

        {/* Admin control screens */}
        <AdminPanels
          activeTab={activeTab}
          users={users}
          onAddUser={handleAddUser}
          onUpdateUserPassword={handleUpdateUserPassword}
          onDeleteUser={handleDeleteUser}
          orders={orders}
          adminTrackInput={adminTrackInput}
          setAdminTrackInput={setAdminTrackInput}
          adminBackupOutput={adminBackupOutput}
          adminBackupInput={adminBackupInput}
          setAdminBackupInput={setAdminBackupInput}
          onGenerateBackup={handleGenerateBackup}
          onRestoreBackup={handleRestoreBackup}
          onClearSystemData={handleClearSystemData}
          mergedInvoices={mergedInvoices}
          onViewInvoice={handleViewInvoice}
          receivedInvoices={receivedInvoices}
          returnsOrders={returnsOrders}
        />

        {/* Branch requests screens */}
        <BranchPanels
          activeTab={activeTab}
          users={users}
          draftOrders={draftOrders}
          returnsDraft={returnsDraft}
          onAddToDraft={handleAddToDraft}
          onRemoveFromDraft={handleRemoveFromDraft}
          onSubmitDraft={handleSubmitDraft}
          onAddToReturnsDraft={handleAddToReturnsDraft}
          onRemoveFromReturnsDraft={handleRemoveFromReturnsDraft}
          onSubmitReturns={handleSubmitReturns}
          branchItemInputs={branchItemInputs}
          setBranchItemInputs={setBranchItemInputs}
          branchQtyInputs={branchQtyInputs}
          setBranchQtyInputs={setBranchQtyInputs}
          branchReturnItemInputs={branchReturnItemInputs}
          setBranchReturnItemInputs={setBranchReturnItemInputs}
          branchReturnQtyInputs={branchReturnQtyInputs}
          setBranchReturnQtyInputs={setBranchReturnQtyInputs}
          receivedInvoices={receivedInvoices}
          onPrintCustomHtml={handlePrintCustomHtml}
          orders={orders}
          returnsOrders={returnsOrders}
          onViewInvoice={handleViewInvoice}
        />

        {/* Warehouse processing & lists history screens */}
        <WarehousePanels
          activeTab={activeTab}
          users={users}
          currentUser={currentUser}
          orders={orders}
          returnsOrders={returnsOrders}
          mergedInvoices={mergedInvoices}
          receivedInvoices={receivedInvoices}
          closedInvoices={closedInvoices}
          onDispatchItem={handleDispatchItem}
          onReopenDispatchItem={handleReopenDispatchItem}
          onCloseWarehouseInvoice={handleCloseWarehouseInvoice}
          onReceiveReturnItem={handleReceiveReturnItem}
          onViewInvoice={handleViewInvoice}
          onPrintBranchArchive={handlePrintBranchArchive}
          onPrintCustomHtml={handlePrintCustomHtml}
          invoiceView={invoiceView}
          onCloseInvoiceDetails={handleCloseInvoiceDetails}
          onPrintInvoiceDetails={handlePrintInvoiceDetails}
          whQtyInputs={whQtyInputs}
          setWhQtyInputs={setWhQtyInputs}
          searchWhQueries={searchWhQueries}
          setSearchWhQueries={setSearchWhQueries}
          searchArchQueries={searchArchQueries}
          setSearchArchQueries={setSearchArchQueries}
          searchMergedQuery={searchMergedQuery}
          setSearchMergedQuery={setSearchMergedQuery}
        />
      </div>

      {/* Global Toast messaging */}
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      {/* Printing sheet render container */}
      <PrintArea printContent={printContent} />

      {/* Custom Promise-Based Confirmation Modal */}
      {confirmState && (
        <div
          id="custom-confirm-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease-in-out',
          }}
          dir="rtl"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #f3f4f6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706',
                  fontSize: '22px',
                  flexShrink: 0,
                }}
              >
                ⚠️
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                تأكيد الإجراء المطلوب
              </h3>
            </div>
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
              {confirmState.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn"
                style={{
                  backgroundColor: '#94a3b8',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => confirmState.resolve(false)}
              >
                إلغاء
              </button>
              <button
                className="btn"
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => confirmState.resolve(true)}
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy & IP Modal */}
      {showPrivacyModal && (
        <div
          id="privacy-policy-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99998,
            padding: '16px',
            backdropFilter: 'blur(4px)',
          }}
          dir="rtl"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #f1f5f9',
              overflow: 'hidden',
              animation: 'modalFadeIn 0.3s ease-out'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: '850', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛡️ سياسة الخصوصية وحقوق الملكية الفكرية
              </h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '20px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                fontSize: '14px',
                lineHeight: '1.8',
                color: '#334155',
                backgroundColor: '#ffffff',
              }}
            >
              {/* Introduction Welcome Banner */}
              <div style={{
                marginBottom: '24px',
                borderBottom: '2px solid #f1f5f9',
                paddingBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  border: '1px solid #bfdbfe'
                }}>
                  🛡️ وثيقة رسمية معتمدة
                </div>
                <h3 style={{ fontWeight: '850', fontSize: '17px', color: '#0f172a', margin: '0 0 10px 0' }}>
                  نظام إدارة النواقص والمرتجعات الموحد لشركة الروضة الشريفة
                </h3>
                <p style={{ margin: 0, textAlign: 'justify', color: '#475569', fontSize: '13.5px' }}>
                  إن وثيقة سياسة الخصوصية وحقوق الملكية الفكرية هذه تمثل اتفاقية قانونية وتنظيمية شاملة وملزمة لكافة الأطراف والمستخدمين المصرح لهم بالدخول إلى النظام. نؤكد من خلال هذا البيان على التزامنا الكامل بحماية وتأمين سرية البيانات وسجلات المعاملات، مع توضيح كامل ومفصل لجميع الحقوق البرمجية والأدبية والملكية الحصرية لمطور النظام المعتمد.
                </p>
              </div>

              {/* Section 1 */}
              <div style={{ marginBottom: '24px', backgroundColor: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                <h4 style={{ fontWeight: '800', color: '#1e293b', fontSize: '14.5px', margin: '0 0 10px 0', borderRight: '4px solid #3b82f6', paddingRight: '8px' }}>
                  أولاً: أمن وسلامة وسرية البيانات التجارية والعمليات
                </h4>
                <p style={{ margin: 0, textAlign: 'justify', fontSize: '13px', color: '#475569' }}>
                  يهدف هذا النظام إلى تقديم خدمات ذكاء الأعمال المتقدمة لشركة الروضة الشريفة، ويتم حماية كافة البيانات الحساسة وحركات ترحيل البضائع بين الفروع والمخازن (مخزن النادي ومخزن النحاس) بأقصى درجات السرية. يتم تشفير كلمات المرور والبيانات محلياً وسحابياً عبر خدمات الحماية الفائقة لضمان عدم حدوث أي اختراق أو تسريب لأي معاملة تجارية. يلتزم النظام التزاماً كاملاً بعدم مشاركة أي بيانات تشغيلية أو أصناف أو أرصدة تخص شركة الروضة الشريفة مع أي جهة خارجية أو طرف ثالث تحت أي ظرف من الظروف.
                </p>
              </div>

              {/* Section 2 - Highlighted Developer Box */}
              <div style={{
                marginBottom: '24px',
                backgroundColor: '#f0fdf4',
                padding: '20px',
                borderRadius: '14px',
                border: '1px dashed #bbf7d0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
              }}>
                <h4 style={{ fontWeight: '900', color: '#166534', fontSize: '15px', margin: '0 0 12px 0', borderRight: '4px solid #15803d', paddingRight: '8px' }}>
                  ثانياً: بيانات مطور النظام المعتمد وقنوات الدعم الفني
                </h4>
                <p style={{ margin: '0 0 12px 0', textAlign: 'justify', fontSize: '13px', color: '#1e3a1e', fontWeight: '500' }}>
                  إن مطور النظام والمسؤول التقني والبرمجي الأول والوحيد عن تصميم وبناء وهندسة هذا النظام بالكامل هو:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  backgroundColor: '#ffffff',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid #e8f5e9',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '13px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>اسم المطور المعتمد:</span>
                    <strong style={{ color: '#15803d', fontSize: '13.5px' }}>Mohamed Nazih (محمد نزيه)</strong>
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>رقم الهاتف المباشر والواتساب:</span>
                    <strong style={{ color: '#2563eb', fontSize: '13.5px' }}>01029190615</strong>
                  </div>
                </div>
                <p style={{ margin: 0, textAlign: 'justify', fontSize: '12.5px', color: '#14532d', lineHeight: '1.6' }}>
                  يتولى المطور مهام الصيانة المستمرة وتحديث الخوارزميات الرياضية والبرمجية المعقدة المخصصة لترحيل وترصيد ومطابقة البيانات، بالإضافة لتقديم الدعم الفني الكامل والمباشر لتفادي أي عوائق تشغيلية.
                </p>
              </div>

              {/* Section 3 */}
              <div style={{ marginBottom: '24px', backgroundColor: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                <h4 style={{ fontWeight: '800', color: '#1e293b', fontSize: '14.5px', margin: '0 0 10px 0', borderRight: '4px solid #3b82f6', paddingRight: '8px' }}>
                  ثالثاً: حقوق الملكية الفكرية وحفظ الحقوق البرمجية والمصدرية
                </h4>
                <p style={{ margin: 0, textAlign: 'justify', fontSize: '13px', color: '#475569' }}>
                  إن الكود المصدري (Source Code) بالكامل، وقواعد البيانات وهياكلها البرمجية، وتصميمات واجهات المستخدم المبتكرة، والخوارزميات البرمجية المخصصة لحساب ودمج وترحيل ومطابقة الفواتير الكلية وتوزيعها، هي ملكية فكرية مطلقة وحصرية وحق شخصي أصيل لا يمكن التنازل عنه لمطور النظام المعتمد <strong>Mohamed Nazih</strong>. جميع حقوق الملكية الفكرية محفوظة لمطور النظام Mohamed Nazih ورقم هاتف المطور هو 01029190615. يمنع منعاً باتاً وتحت طائلة المسؤولية القانونية والقضائية الكاملة استنساخ الكود المصدري للنظام، أو إعادة توزيعه، أو تعديله، أو نقله، أو بيعه، أو ترخيصه لأي جهة أخرى دون الحصول على تفويض خطي مسبق وموثق رسمياً وموقع شخصياً ومختوم من المطور محمد نزيه.
                </p>
              </div>

              {/* Section 4 */}
              <div style={{ marginBottom: '24px', backgroundColor: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                <h4 style={{ fontWeight: '800', color: '#1e293b', fontSize: '14.5px', margin: '0 0 10px 0', borderRight: '4px solid #3b82f6', paddingRight: '8px' }}>
                  رابعاً: شروط الاستخدام الآمن والنسخ الاحتياطي لقواعد البيانات
                </h4>
                <p style={{ margin: 0, textAlign: 'justify', fontSize: '13px', color: '#475569' }}>
                  يلتزم مستخدمو النظام من موظفي ومسؤولي شركة الروضة الشريفة باتباع إرشادات الاستخدام الصحيحة والآمنة. يتيح النظام خيارات متطورة لتصدير واستعادة النسخ الاحتياطية لقواعد البيانات والأرشيف التجاري بصيغ محمية، وتقع مسؤولية تفعيل وحفظ هذه الملفات والنسخ الدورية على عاتق إدارة الشركة. ولا يتحمل المطور أي مسؤولية عن فقدان البيانات الناتج عن سوء إدارة كلمات المرور أو العبث اليدوي بالخوادم أو الإتلاف العمدي من قبل جهات غير مخولة.
                </p>
              </div>

              {/* Section 5 */}
              <div style={{ marginBottom: '8px', backgroundColor: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                <h4 style={{ fontWeight: '800', color: '#1e293b', fontSize: '14.5px', margin: '0 0 10px 0', borderRight: '4px solid #3b82f6', paddingRight: '8px' }}>
                  خامساً: الامتثال القانوني والتحديثات البرمجية المستمرة
                </h4>
                <p style={{ margin: 0, textAlign: 'justify', fontSize: '13px', color: '#475569' }}>
                  تخضع هذه الاتفاقية وسياسة الخصوصية للتحديث والتحسين الدوري والمستمر من قبل المطور لضمان مواكبة أعلى معايير الجودة التقنية تلبيةً لتوسعات شركة الروضة الشريفة وفروعها. باستخدامكم لهذا النظام وتسجيل الدخول إليه، فإنكم تقرون بشكل صريح بموافقتكم وعلمكم التام وغير القابل للنقض بكافة البنود المذكورة أعلاه، والتزامكم باحترام حقوق الملكية الفكرية للمطور Mohamed Nazih وحمايتها من أي استغلال غير مصرح به.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                © {new Date().getFullYear()} جميع الحقوق محفوظة لـ Mohamed Nazih
              </div>
              <button
                className="btn"
                style={{
                  backgroundColor: 'var(--primary-dark, #1e293b)',
                  color: '#ffffff',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: 'none',
                  fontSize: '13.5px',
                  transition: 'background-color 0.2s',
                }}
                onClick={() => setShowPrivacyModal(false)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0f172a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-dark, #1e293b)')}
              >
                إغلاق وامتثال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
