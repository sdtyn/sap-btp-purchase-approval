export interface Product {
  ID?: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock?: number;
  available?: boolean;
  createdAt?: string;
  modifiedAt?: string;
}

export interface ProductSelection {
  product: Product;
  quantity: number;
}

export interface ODataProductResponse {
  '@odata.context': string;
  value: Product[];
  '@odata.count'?: number;
}
