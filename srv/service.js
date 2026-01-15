const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  const { PurchaseRequests } = this.entities;

  /**
   * Custom Action: Approve Purchase Request
   * Sets status to "Approved"
   */
  this.on('approve', 'PurchaseRequests', async (req) => {
    const { ID } = req.params[0];
    
    // Get current user
    const user = req.user.id;
    
    // Update status to Approved
    await UPDATE(PurchaseRequests)
      .set({ status: 'Approved', modifiedBy: user })
      .where({ ID });
    
    // Return updated entity
    return SELECT.one.from(PurchaseRequests).where({ ID });
  });

  /**
   * Custom Action: Reject Purchase Request
   * Sets status to "Rejected"
   */
  this.on('reject', 'PurchaseRequests', async (req) => {
    const { ID } = req.params[0];
    
    // Get current user
    const user = req.user.id;
    
    // Update status to Rejected
    await UPDATE(PurchaseRequests)
      .set({ status: 'Rejected', modifiedBy: user })
      .where({ ID });
    
    // Return updated entity
    return SELECT.one.from(PurchaseRequests).where({ ID });
  });

  /**
   * Before CREATE: Set default values
   */
  this.before('CREATE', 'PurchaseRequests', async (req) => {
    const { status, requester } = req.data;
    
    // Set default status if not provided
    if (!status) {
      req.data.status = 'New';
    }
    
    // Set requester to current user if not provided
    if (!requester) {
      req.data.requester = req.user.id || 'anonymous';
    }
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

  /**
   * Validation: Prevent approval/rejection of non-pending requests
   */
  this.before(['approve', 'reject'], 'PurchaseRequests', async (req) => {
    const { ID } = req.params[0];
    const request = await SELECT.one.from(PurchaseRequests).where({ ID });
    
    if (!request) {
      req.error(404, `Purchase request ${ID} not found`);
    }
    
    if (request.status !== 'New' && request.status !== 'Pending') {
      req.error(400, `Cannot process request with status: ${request.status}`);
    }
  });

});
