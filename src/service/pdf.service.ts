import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor(private http: HttpClient) { }

  public getDebitedValues(franchiseId: string[], invoiceCreatedDate: string): Promise<any> {
    const headers = { 'Content-Type': 'application/json'};
    const body = { franchiseIds: franchiseId };
    const option = {
      headers,
      params: {
        invoiceCreationDate: invoiceCreatedDate
      }
    };
    return this.http
      .post(environment.serverUrl + "/balance-sheet/getDebitedValues", body, option)
      .toPromise();
  }

  public getCreditedValues(franchiseId: string[], invoiceCreatedDate: string): Promise<any> {
    const headers = { 'Content-Type': 'application/json'};
    const body = { franchiseIds: franchiseId };
    const option = {
      headers,
      params: {
        invoiceCreationDate: invoiceCreatedDate
      }
    };
    return this.http
      .post(environment.serverUrl + "/balance-sheet/getCreditedValues", body, option)
      .toPromise();
  }

  public getUnusedCheckValues(franchiseId: string[], invoiceCreatedDate: string): Promise<any> {
    const headers = { 'Content-Type': 'application/json'};
    const body = { franchiseIds: franchiseId };
    const option = {
      headers,
      params: {
        invoiceCreationDate: invoiceCreatedDate
      }
    };
    return this.http
      .post(environment.serverUrl + "/balance-sheet/getUnusedCheckValues", body, option)
      .toPromise();
  }
}
