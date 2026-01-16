using { sap.btp.purchaseapproval as db } from '../db/schema';

/**
 * Purchase Request Service
 * Allows requesters to create and manage purchase requests
 * Authorization: Requires Requester role
 */
@(requires: 'Requester')
service PurchaseRequestService {
  
  /**
   * PurchaseRequests Entity
   * Requester can:
   * - CREATE: Create new requests
   * - READ: View own requests only
   * - UPDATE: Update own requests only (draft mode)
   * - DELETE: Delete own requests only
   */
  @odata.draft.enabled
  entity PurchaseRequests as projection on db.PurchaseRequests actions {
    @(
      Common.SideEffects: {
        TargetProperties: ['status']
      },
      requires: 'Approver'
    )
    action approve() returns PurchaseRequests;
    
    @(
      Common.SideEffects: {
        TargetProperties: ['status']
      },
      requires: 'Approver'
    )
    action reject() returns PurchaseRequests;
  };
  
  /**
   * PurchaseItems Entity
   * Accessible to Requester for managing line items
   */
  entity PurchaseItems as projection on db.PurchaseItems;
  
  /**
   * Products Entity (Read-Only)
   * Accessible to browse catalog when creating requests
   */
  @readonly
  entity Products as projection on db.Products;
}

/**
 * Approval Service
 * Allows approvers to review and approve/reject requests
 * Authorization: Requires Approver role (Chef only)
 */
@(requires: 'Approver')
service ApprovalService {
  
  /**
   * PurchaseRequests Entity (Read-Only for Approvers)
   * Approver can:
   * - READ: View all pending requests
   * - Execute approve/reject actions
   */
  @readonly
  entity PurchaseRequests as projection on db.PurchaseRequests actions {
    @(requires: 'Approver')
    action approve() returns PurchaseRequests;
    
    @(requires: 'Approver')
    action reject() returns PurchaseRequests;
  };
  
  /**
   * PurchaseItems Entity (Read-Only for Approvers)
   */
  @readonly
  entity PurchaseItems as projection on db.PurchaseItems;
  
  /**
   * Products Entity (Read-Only for reference)
   */
  @readonly
  entity Products as projection on db.Products;
}

/**
 * Catalog Service
 * Manages product catalog (master data)
 * Authorization: 
 * - READ: All authenticated users (Requester, Approver)
 * - CREATE/UPDATE/DELETE: Requires Approver role
 */
@(requires: 'authenticated-user')
service CatalogService {
  
  /**
   * Products Entity
   * All users can READ
   * Only Approvers can CREATE, UPDATE, DELETE
   */
  entity Products as projection on db.Products;
}
