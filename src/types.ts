/**
 * Types representing the data models in Al-Rawda Al-Sharifa Deficits and Returns Management System.
 */

export interface User {
  pass: string; // Base64 encodedpassword
  role: 'admin' | 'branch' | 'wh';
  panel: string;
  name: string;
  invoiceCounter?: number;
  returnCounter?: number;
  mergedInvoiceCounter?: number;
  key?: string;
}

export type UsersDatabase = Record<string, User>;

export interface Order {
  id: number;
  invoiceCode: string;
  branch: string;
  item: string;
  qty: number;
  dispatchQty: number;
  remainingQty: number;
  status: string; // 'قيد الانتظار', 'تم الصرف', 'تم الأرشفة'
  source: string; // Warehouse name
  type: string; // 'جاهز للمخزن'
  date: string;
  isDispatched: boolean;
  warehouseClosed: boolean;
  closedBy: string;
  dispatchDate?: string;
  excludeWarehouse?: string;
}

export interface DraftOrder {
  draftId: number;
  branch: string;
  item: string;
  qty: number;
}

export interface ReturnDraft {
  returnDraftId: number;
  branch: string;
  item: string;
  qty: number;
}

export interface ReturnOrder {
  id: number;
  returnCode: string;
  branch: string;
  item: string;
  qty: number;
  status: string; // 'بانتظار الاستلام بالمخازن', 'تم الاستلام بنجاح'
  receivedBy: string;
  date: string;
  receivedDate?: string;
}

export interface MergedInvoiceItem {
  branch: string;
  item: string;
  qty: number;
  dispatchQty: number;
  remainingQty: number;
  orderId: number;
  status: string;
  source: string;
}

export interface MergedInvoice {
  id: number;
  invoiceNumber: string;
  warehouse: string;
  date: string;
  branches: Record<string, Order[]>;
  items: MergedInvoiceItem[];
}

export interface ReceivedInvoiceItem {
  item: string;
  qty: number;
  dispatchQty: number;
  remainingQty: number;
  source: string;
  originalOrderId: number;
  status: string;
}

export interface ReceivedInvoice {
  id: number;
  branch: string;
  mergedInvoiceNumber: string;
  source: string;
  date: string;
  items: ReceivedInvoiceItem[];
}

export interface InvoiceView {
  invoiceCode: string;
  type: 'sent' | 'wh_received' | 'merged' | 'closed' | 'received';
  title: string;
  dateStr: string;
  originWh: string;
  destinationBranch: string;
  items: any[];
}
