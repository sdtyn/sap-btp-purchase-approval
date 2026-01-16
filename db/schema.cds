using { cuid, managed } from '@sap/cds/common';

namespace sap.btp.purchaseapproval;

/**
 * Product Catalog Entity
 * Master data for available products
 */
entity Products : managed {
  key ID        : Integer;
  name          : String(100)   @mandatory;
  description   : String(500);
  price         : Decimal(15,2) @mandatory;
  category      : String(50)    @mandatory;
  imageUrl      : String(500);
  stock         : Integer       default 0;
  available     : Boolean       default true;
}

/**
 * Purchase Request Entity
 * Represents a purchase request created by an employee
 */
entity PurchaseRequests : cuid, managed {
  title         : String(100)   @mandatory;
  description   : String(500);
  totalAmount   : Decimal(15,2) @mandatory;
  status        : String(20)    @mandatory default 'Pending';
  requester     : String(100)   @mandatory;
  items         : Composition of many PurchaseItems on items.request = $self;
  
  // Virtual field for status criticality (UI color coding)
  virtual statusCriticality : Integer;
}

/**
 * Purchase Item Entity
 * Line items for a purchase request
 */
entity PurchaseItems : cuid {
  request       : Association to PurchaseRequests;
  product       : Association to Products { ID } @mandatory;
  quantity      : Integer       @mandatory;
  price         : Decimal(15,2) @mandatory;  // Price at time of order (historical)
}


