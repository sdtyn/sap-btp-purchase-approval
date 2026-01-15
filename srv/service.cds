using { sap.btp.purchaseapproval as db } from '../db/schema';

/**
 * Purchase Request Service
 * Allows requesters to create and manage purchase requests
 */
@(requires: 'authenticated-user')
service PurchaseRequestService {
  
  @odata.draft.enabled
  entity PurchaseRequests as projection on db.PurchaseRequests actions {
    @(
      Common.SideEffects: {
        TargetProperties: ['status']
      }
    )
    action approve() returns PurchaseRequests;
    
    @(
      Common.SideEffects: {
        TargetProperties: ['status']
      }
    )
    action reject() returns PurchaseRequests;
  };
  
  entity PurchaseItems as projection on db.PurchaseItems;
}

/**
 * Approval Service
 * Allows approvers to review and approve/reject requests
 */
@(requires: 'authenticated-user')
service ApprovalService {
  
  @readonly
  entity PurchaseRequests as projection on db.PurchaseRequests actions {
    action approve() returns PurchaseRequests;
    action reject() returns PurchaseRequests;
  };
  
  @readonly
  entity PurchaseItems as projection on db.PurchaseItems;
}
