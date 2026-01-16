const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  const { PurchaseRequests, Products } = this.entities;

  // ApprovalService: Enforce Approver role on ALL operations
  if (this.name === 'ApprovalService') {
    this.before('*', '*', (req) => {
      if (!req.user.is('Approver')) {
        req.reject(403, `Access denied. User '${req.user.id}' requires Approver role for ApprovalService.`);
      }
    });
    
    // Row-Level Security: Approvers see only PENDING requests from OTHER users
    this.before('READ', 'PurchaseRequests', (req) => {
      const currentUser = req.user.id;
      const existingWhere = req.query.SELECT.where;
      
      const filters = [
        { ref: ['requester'] }, '!=', { val: currentUser },
        'and',
        { ref: ['status'] }, '=', { val: 'Pending' }
      ];
      
      if (existingWhere) {
        req.query.SELECT.where = [...existingWhere, 'and', ...filters];
      } else {
        req.query.SELECT.where = filters;
      }
    });
  }

  // PurchaseRequestService: Enforce Requester role on ALL operations
  if (this.name === 'PurchaseRequestService') {
    this.before('*', '*', (req) => {
      // Allow approve/reject actions for Approvers (they have special permission)
      if (req.event === 'approve' || req.event === 'reject') {
        if (!req.user.is('Approver')) {
          req.reject(403, `Access denied. Only Approvers can ${req.event} requests.`);
        }
        return; // Allow Approvers to execute these actions
      }
      
      // For all other operations, require Requester role
      if (!req.user.is('Requester')) {
        req.reject(403, `Access denied. User '${req.user.id}' requires Requester role for PurchaseRequestService.`);
      }
    });
    
    // Row-Level Security: Users can only see their own purchase requests
    this.before('READ', 'PurchaseRequests', (req) => {
      const currentUser = req.user.id;
      const existingWhere = req.query.SELECT.where;
      
      const filter = [{ ref: ['requester'] }, '=', { val: currentUser }];
      
      if (existingWhere) {
        req.query.SELECT.where = [...existingWhere, 'and', ...filter];
      } else {
        req.query.SELECT.where = filter;
      }
    });
  }

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
   * Helper: Calculate status criticality for UI
   * 1 = Positive (green) - Approved
   * 2 = Critical (red) - Rejected
   * 3 = Warning (yellow) - Pending
   * 0 = Neutral (grey) - New
   */
  const getStatusCriticality = (status) => {
    const criticalityMap = {
      'New': 0,
      'Pending': 3,
      'Approved': 1,
      'Rejected': 2
    };
    return criticalityMap[status] || 0;
  };

  /**
   * Add statusCriticality to all read operations
   */
  this.after('READ', 'PurchaseRequests', (data) => {
    if (Array.isArray(data)) {
      data.forEach(item => {
        item.statusCriticality = getStatusCriticality(item.status);
      });
    } else if (data) {
      data.statusCriticality = getStatusCriticality(data.status);
    }
    return data;
  });

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
    
    // Get all items for this purchase request
    const items = await SELECT.from('sap.btp.purchaseapproval.PurchaseItems')
      .where({ request_ID: ID });
    
    // Reduce stock for each product
    for (const item of items) {
      // Get product by ID from association
      const product = await SELECT.one.from(Products)
        .where({ ID: item.product_ID });
      
      if (!product) {
        req.error(404, `Product with ID '${item.product_ID}' not found`);
      }
      
      const newStock = product.stock - item.quantity;
      
      // Check if sufficient stock
      if (newStock < 0) {
        req.error(400, `Insufficient stock for product '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
      
      // Update stock
      await UPDATE(Products)
        .set({ stock: newStock })
        .where({ ID: product.ID });
      
      logEvent('STOCK_REDUCED', product.ID, user, {
        productName: product.name,
        previousStock: product.stock,
        reducedBy: item.quantity,
        newStock: newStock
      });
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
   * Before CREATE: Set default values and transition to PENDING
   * All purchase requests require approval
   */
  this.before('CREATE', 'PurchaseRequests', async (req) => {
    const { status, requester } = req.data;
    
    // Set default status to Pending (all requests need approval)
    if (!status) {
      req.data.status = 'Pending';
    }
    
    // Set requester to current user if not provided
    if (!requester) {
      req.data.requester = req.user.id || 'anonymous';
    }
  });

  /**
   * Before draftActivate: Ensure status is set to Pending if not already set
   * This handles the case when draft is activated without explicit status
   */
  this.before('draftActivate', 'PurchaseRequests', async (req) => {
    const { ID } = req.params[0];
    
    // Get the draft
    const draft = await SELECT.one.from(PurchaseRequests.drafts).where({ ID });
    
    if (draft && (!draft.status || draft.status === 'New')) {
      // Update draft status to Pending before activation
      await UPDATE(PurchaseRequests.drafts).set({ status: 'Pending' }).where({ ID });
    }
  });

  /**
   * Before CREATE PurchaseItems: Auto-populate price from Product and validate stock
   */
  this.before('CREATE', 'PurchaseItems', async (req) => {
    const { product_ID, quantity } = req.data;
    
    if (!product_ID) {
      req.error(400, 'Product is required');
    }
    
    if (!quantity || quantity <= 0) {
      req.error(400, 'Quantity must be greater than 0');
    }
    
    // Get product details
    const product = await SELECT.one.from(Products).where({ ID: product_ID });
    
    if (!product) {
      req.error(404, `Product with ID '${product_ID}' not found`);
    }
    
    if (!product.available) {
      req.error(400, `Product '${product.name}' is not available`);
    }
    
    // Check if sufficient stock available (only for new requests, not during draft)
    if (quantity > product.stock) {
      req.error(400, `Insufficient stock for '${product.name}'. Available: ${product.stock}, Requested: ${quantity}`);
    }
    
    // Auto-populate price from product (current price at time of order)
    if (!req.data.price) {
      req.data.price = product.price;
    }
    
    logEvent('PURCHASE_ITEM_CREATED', product.ID, req.user.id, {
      productName: product.name,
      quantity: quantity,
      price: req.data.price
    });
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

  // ==================== CATALOG SERVICE ====================
  
  /**
   * CatalogService: Authorization for CUD operations
   * READ: All authenticated users
   * CREATE/UPDATE/DELETE: Only Approvers
   */
  if (this.name === 'CatalogService') {
    // Before CREATE/UPDATE/DELETE: Check Approver role
    this.before(['CREATE', 'UPDATE', 'DELETE'], 'Products', (req) => {
      if (!req.user.is('Approver')) {
        req.reject(403, `Access denied. Only Approvers can modify the product catalog.`);
      }
    });

    // Before CREATE: Validate required fields
    this.before('CREATE', 'Products', (req) => {
      const { name, price, category } = req.data;
      
      if (!name || name.trim().length === 0) {
        req.error(400, 'Product name is required');
      }
      
      if (!price || price <= 0) {
        req.error(400, 'Product price must be greater than 0');
      }
      
      if (!category || category.trim().length === 0) {
        req.error(400, 'Product category is required');
      }

      // Set default availability
      if (req.data.available === undefined) {
        req.data.available = true;
      }
    });

    // Before UPDATE: Validate fields if provided
    this.before('UPDATE', 'Products', (req) => {
      if (req.data.price !== undefined && req.data.price <= 0) {
        req.error(400, 'Product price must be greater than 0');
      }
    });

    // After CREATE: Log creation
    this.after('CREATE', 'Products', async (data, req) => {
      logEvent('PRODUCT_CREATED', data.ID, req.user.id, {
        name: data.name,
        price: data.price,
        category: data.category
      });
    });

    // After UPDATE: Log update
    this.after('UPDATE', 'Products', async (data, req) => {
      logEvent('PRODUCT_UPDATED', data.ID, req.user.id, {
        name: data.name
      });
    });

    // After DELETE: Log deletion
    this.after('DELETE', 'Products', async (data, req) => {
      logEvent('PRODUCT_DELETED', req.data.ID, req.user.id);
    });
  }

});
