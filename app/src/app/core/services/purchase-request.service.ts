import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ODataService } from './odata.service';
import { 
  PurchaseRequest, 
  ODataResponse, 
  ApprovalAction 
} from '../models/purchase-request.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequestService extends ODataService {
  private readonly serviceUrl = environment.odataV4.purchaseRequest;
  private readonly approvalServiceUrl = environment.odataV4.approval;

  getPurchaseRequests(): Observable<ODataResponse<PurchaseRequest>> {
    const params = new HttpParams()
      .set('$expand', 'items')
      .set('$orderby', 'createdAt desc');
    
    return this.get<ODataResponse<PurchaseRequest>>(this.serviceUrl, 'PurchaseRequests', params);
  }

  getPurchaseRequestById(id: string): Observable<PurchaseRequest> {
    return this.getById<PurchaseRequest>(this.serviceUrl, 'PurchaseRequests', id, 'items');
  }

  createPurchaseRequest(request: PurchaseRequest): Observable<PurchaseRequest> {
    return this.post<PurchaseRequest>(this.serviceUrl, 'PurchaseRequests', request);
  }
  
  activateDraft(draftId: string): Observable<PurchaseRequest> {
    const url = `${environment.apiUrl}${this.serviceUrl}/PurchaseRequests(ID=${draftId},IsActiveEntity=false)/PurchaseRequestService.draftActivate`;
    return this.http.post<PurchaseRequest>(url, {}, { headers: this.getHeaders() });
  }

  updatePurchaseRequest(id: string, request: Partial<PurchaseRequest>): Observable<PurchaseRequest> {
    return this.patch<PurchaseRequest>(this.serviceUrl, 'PurchaseRequests', id, request);
  }

  deletePurchaseRequest(id: string): Observable<void> {
    return this.delete(this.serviceUrl, 'PurchaseRequests', id);
  }

  // Approval Service Methods
  getPendingApprovals(): Observable<ODataResponse<PurchaseRequest>> {
    const params = new HttpParams()
      .set('$filter', "status eq 'Pending'")
      .set('$expand', 'items')
      .set('$orderby', 'createdAt desc');
    
    return this.get<ODataResponse<PurchaseRequest>>(this.approvalServiceUrl, 'PurchaseRequests', params);
  }

  approvePurchaseRequest(id: string, comment?: string): Observable<PurchaseRequest> {
    // Use ApprovalService URL for approve action
    const url = `${environment.apiUrl}${this.approvalServiceUrl}/PurchaseRequests(ID=${id},IsActiveEntity=true)/ApprovalService.approve`;
    return this.http.post<PurchaseRequest>(url, comment ? { comment } : {}, { headers: this.getHeaders() });
  }

  rejectPurchaseRequest(id: string, comment?: string): Observable<PurchaseRequest> {
    // Use ApprovalService URL for reject action
    const url = `${environment.apiUrl}${this.approvalServiceUrl}/PurchaseRequests(ID=${id},IsActiveEntity=true)/ApprovalService.reject`;
    return this.http.post<PurchaseRequest>(url, comment ? { comment } : {}, { headers: this.getHeaders() });
  }
}
