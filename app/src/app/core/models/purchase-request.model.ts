export interface PurchaseRequest {
  ID?: string;
  title: string;
  description?: string;
  totalAmount: number;
  status?: 'New' | 'Pending' | 'Approved' | 'Rejected';
  requester: string;
  createdAt?: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
  statusCriticality?: number;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  ID?: string;
  product_ID: number;
  quantity: number;
  price: number;
  request_ID?: string;
  product?: {
    ID: number;
    name: string;
    price: number;
    category: string;
  };
}

export interface ODataResponse<T> {
  '@odata.context': string;
  value: T[];
  '@odata.count'?: number;
}

export interface ApprovalAction {
  comment?: string;
}
