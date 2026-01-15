const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  const { PurchaseRequests } = this.entities;

  /**
   * Helper: Check if user has Approver role
   */
  const isApprover = (user) => {
    return user.is('Approver') || user.is('Admin');
  };

  /**
   * Helper: Log events
   */
  const logEvent = (event, requestId, user, details = {}) => {
    console.log(`[${new Date().toISOString()}] ${event} - Request: ${requestId}, User: ${user}`, details);
  };

  /**
   * Custom Action: Approve Purchase Request
   * Business Rule: Only Approver role can approve
   * Business Rule: Requester cannot approve their own request
   * Status Transition: NEW/PENDING → APPROVED
   */
  this.on('approve', 'PurchaseRequests', async (req) => {
    const { ID } = req.params[0];
    const user = req.user.id;

    // Authorization: Check if user has Approver role
    if (!isApprover(req.user)) {
      req.error(403, 'Only users with Approver role can approve requests');
    }

    // Get the request
    const request = await SELECT.one.from(PurchaseRequests).where({ ID });
    
    if (!request) {
      req.error(404, `Purchase request ${ID} not found`);
    }

    // Business Rule: Requester cannot approve their own request
    if (request.requester === user) {
      req.error(403, 'You cannot approve your own purchase request');
    }

    // Status Transition: Only NEW or PENDING can be approved
    if (request.status !== 'New' && request.status !== 'Pending') {
      req.error(400, `Cannot approve request with status: ${request.status}`);
    }
    
    // Update status to Approved
    await UPDATE(PurchaseRequests)
      .set({ status: 'Approved', modifiedBy: user })
      .where({ ID });
    
    // Log approval event
    logEvent('APPROVAL', ID, user, { 
      previousStatus: request.status,
      newStatus: 'Approved',
      requester: request.requester
    });
    
    // Return updated entity
    return SELECT.one.from(PurchaseRequests).where({ ID });
  });

  /**
   * Custom Action: Reject Purchase Request
   * Business Rule: Only Approver role can reject
   * Business Rule: Requester cannot reject their own request
   * Status Transition: NEW/PENDING → REJECTED
   */
  this.on('reject', 'PurchaseRequests', async (req) => {
    const { ID } = req.params[0];
    const user = req.user.id;

    // Authorization: Check if user has Approver role
    if (!isApprover(req.user)) {
      req.error(403, 'Only users with Approver role can reject requests');
    }

    // Get the request
    const request = await SELECT.one.from(PurchaseRequests).where({ ID });
    
    if (!request) {
      req.error(404, `Purchase request ${ID} not found`);
    }

    // Business Rule: Requester cannot reject their own request
    if (request.requester === user) {
      req.error(403, 'You cannot reject your own purchase request');
    }

    // Status Transition: Only NEW or PENDING can be rejected
    if (request.status !== 'New' && request.status !== 'Pending') {
      req.error(400, `Cannot reject request with status: ${request.status}`);
    }
    
    // Update status to Rejected
    await UPDATE(PurchaseRequests)
      .set({ status: 'Rejected', modifiedBy: user })
      .where({ ID });
    
    // Log rejection event
    logEvent('REJECTION', ID, user, { 
      previousStatus: request.status,
      newStatus: 'Rejected',
      requester: request.requester
    });
    
    // Return updated entity
    return SELECT.one.from(PurchaseRequests).where({ ID });
  });

  /**
   * Before CREATE: Set default values and transition to PENDING if amount threshold is met
   */
  this.before('CREATE', 'PurchaseRequests', async (req) => {
    const { status, requester, totalAmount } = req.data;
    
    // Set default status to New
    if (!status) {
      req.data.status = 'New';
    }
    
    // Set requester to current user if not provided
    if (!requester) {
      req.data.requester = req.user.id || 'anonymous';
    }

    // Auto-transition to PENDING if amount > 1000 (configurable threshold)
    const APPROVAL_THRESHOLD = 1000;
    if (totalAmount && totalAmount > APPROVAL_THRESHOLD) {
      req.data.status = 'Pending';
    }
  });

  /**
   * After CREATE: Log creation event
   */
  this.after('CREATE', 'PurchaseRequests', async (data, req) => {
    logEvent('CREATION', data.ID, req.user.id, {
      status: data.status,
      totalAmount: data.totalAmount,
      requester: data.requester
    });
  });

  /**
   * After READ: Calculate total amount from items
   */
  this.after('READ', 'PurchaseRequests', async (data) => {
    const requests = Array.isArray(data) ? data : [data];
    
    for (let request of requests) {
      if (request.ID) {
        // Calculate total from items
        const items = await SELECT.from('sap.btp.purchaseapproval.PurchaseItems')
          .where({ request_ID: request.ID });
        
        if (items && items.length > 0) {
          const total = items.reduce((sum, item) => {
            return sum + (item.quantity * item.price);
          }, 0);
          request.totalAmount = total;
        }
      }
    }
  });

});
