using { cuid, managed } from '@sap/cds/common';

namespace sap.btp.purchaseapproval;

/**
 * Purchase Request Entity
 * Represents a purchase request created by an employee
 */
entity PurchaseRequests : cuid, managed {
  title         : String(100)   @mandatory;
  description   : String(500);
  totalAmount   : Decimal(15,2) @mandatory;
  status        : String(20)    @mandatory default 'New';
  requester     : String(100)   @mandatory;
  items         : Composition of many PurchaseItems on items.request = $self;
}

/**
 * Purchase Item Entity
 * Line items for a purchase request
 */
entity PurchaseItems : cuid {
  request       : Association to PurchaseRequests;
  productName   : String(100)   @mandatory;
  quantity      : Integer       @mandatory;
  price         : Decimal(15,2) @mandatory;
}
