using PurchaseRequestService from '../srv/service';

////////////////////////////////////////////////////////////////////////////
//
//	Purchase Requests List Page
//
annotate PurchaseRequestService.PurchaseRequests with @(
	UI: {
		SelectionFields: [ status, requester, createdAt ],
		LineItem: [
			{ Value: ID, Label: 'Request ID' },
			{ Value: title, Label: 'Title' },
			{ Value: totalAmount, Label: 'Total Amount' },
			{ Value: status, Label: 'Status', Criticality: statusCriticality },
			{ Value: requester, Label: 'Requester' },
			{ Value: createdAt, Label: 'Created At' }
		],
		HeaderInfo: {
			TypeName: 'Purchase Request',
			TypeNamePlural: 'Purchase Requests',
			Title: { Value: title },
			Description: { Value: description }
		},
		Facets: [
			{
				$Type: 'UI.ReferenceFacet',
				Label: 'General Information',
				Target: '@UI.FieldGroup#GeneralInfo'
			},
			{
				$Type: 'UI.ReferenceFacet',
				Label: 'Items',
				Target: 'items/@UI.LineItem'
			}
		],
		FieldGroup#GeneralInfo: {
			Data: [
				{ Value: ID, Label: 'Request ID' },
				{ Value: title, Label: 'Title' },
				{ Value: description, Label: 'Description' },
				{ Value: totalAmount, Label: 'Total Amount' },
				{ Value: status, Label: 'Status' },
				{ Value: requester, Label: 'Requester' },
				{ Value: createdAt, Label: 'Created At' },
				{ Value: modifiedAt, Label: 'Modified At' }
			]
		}
	}
);

////////////////////////////////////////////////////////////////////////////
//
//	Purchase Items
//
annotate PurchaseRequestService.PurchaseItems with @(
	UI: {
		LineItem: [
			{ Value: productName, Label: 'Product' },
			{ Value: quantity, Label: 'Quantity' },
			{ Value: price, Label: 'Unit Price' },
			{ Value: totalPrice, Label: 'Total' }
		],
		Facets: [
			{
				$Type: 'UI.ReferenceFacet',
				Label: 'Item Details',
				Target: '@UI.FieldGroup#ItemDetails'
			}
		],
		FieldGroup#ItemDetails: {
			Data: [
				{ Value: productName, Label: 'Product Name' },
				{ Value: quantity, Label: 'Quantity' },
				{ Value: price, Label: 'Unit Price' }
			]
		}
	}
);

////////////////////////////////////////////////////////////////////////////
//
//	Field Labels and Value Helps
//
annotate PurchaseRequestService.PurchaseRequests with {
	ID @title: 'Request ID';
	title @title: 'Title';
	description @title: 'Description' @UI.MultiLineText;
	totalAmount @title: 'Total Amount';
	status @title: 'Status' @readonly;
	requester @title: 'Requester' @readonly;
	createdAt @title: 'Created At' @readonly;
	modifiedAt @title: 'Modified At' @readonly;
};

annotate PurchaseRequestService.PurchaseItems with {
	ID @title: 'Item ID';
	productName @title: 'Product Name';
	quantity @title: 'Quantity';
	price @title: 'Unit Price';
};
