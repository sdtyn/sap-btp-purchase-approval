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
  @(restrict: [
    { grant: ['READ', 'CREATE'], to: 'Requester', where: 'requester = $user' },
    { grant: ['UPDATE', 'DELETE'], to: 'Requester', where: 'requester = $user' },
    { grant: '*', to: 'Approver' }
  ])
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
  @(restrict: [
    { grant: '*', to: 'Requester' },
    { grant: 'READ', to: 'Approver' }
  ])
  entity PurchaseItems as projection on db.PurchaseItems;
}

/**
 * Approval Service
 * Allows approvers to review and approve/reject requests
 * Authorization: Requires Approver role
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
  @(restrict: [
    { grant: 'READ', to: 'Approver' }
  ])
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
  @(restrict: [
    { grant: 'READ', to: 'Approver' }
  ])
  entity PurchaseItems as projection on db.PurchaseItems;
}
