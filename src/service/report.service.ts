import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { ReportRequest, ReportRequestByYear } from "src/model/report.model";

@Injectable({
  providedIn: "root"
})
export class ReportService {
  constructor(private http: HttpClient) {}

  public getReportData(reportRequest: ReportRequest): Promise<any> {
    return this.http
      .get(environment.serverUrl + "/getReportData", {
        params: {
          startDate: reportRequest.startDate,
          endDate: reportRequest.endDate
        }
      })
      .toPromise();
  }

  public getReportDataByYear(reportRequest: ReportRequestByYear): Promise<any> {
    return this.http
      .get(environment.serverUrl + "/getReportDataByYear", {
        params: {
          year: reportRequest.year.toString()
        }
      })
      .toPromise();
  }

  public getFranchiseName(): Promise<any> {
    return this.http
      .get(environment.serverUrl + "/franchise-location/getDistinctFranchiseName")
      .toPromise();
  }

  public getReportDataByFranchiseName(franchiseIds: string[], startDate: string, endDate: string): Promise<any> {
    const headers = { 'Content-Type': 'application/json'};
    const body = { franchiseIds };
    const option = {
      params: {
        startDate: startDate,
        endDate: endDate
      }, 
      headers
    }
    return this.http
      .post(environment.serverUrl + "/getReportDataByFranchiseName", body, option)
      .toPromise();
  }

  public getReportDataByLocationGroup(franchiseIds: string[], startDate: string, endDate: string): Promise<any> {
    const headers = { 'Content-Type': 'application/json'}
    const body = { franchiseIds };
    const option = {
      params: {
        startDate: startDate,
        endDate: endDate
      }, 
      headers
    }
    return this.http
      .post(environment.serverUrl + "/getReportDataByLocationGroup", body, option)
      .toPromise();
  }

  public getReportDataByLocationName(franchiseIds: string[], startDate: string, endDate: string): Promise<any> {
    const headers = { 'Content-Type': 'application/json'};
    const body = { franchiseIds };
    const option = {
      params: {
        startDate: startDate,
        endDate: endDate
      }, 
      headers
    };
    return this.http
      .post(environment.serverUrl + "/getReportDataByLocationName", body, option)
      .toPromise();
  }

  public getLocationGroup(): Promise<any> {
    return this.http
      .get(environment.serverUrl + "/franchise-location/getDistinctLocationGroup")
      .toPromise();
  }

  public getLocationName(): Promise<any> {
    return this.http
      .get(environment.serverUrl + "/franchise-location/getDistinctLocationName")
      .toPromise();
  }

  public makeDataForDropdown(data: any[]) {
    const returnValue: any = [];
    const uniqueLocations = [...new Set(data.map(item => item.locationGroup))];

    console.log('unique--', uniqueLocations);
    uniqueLocations.forEach((uniqueValue: string) => {
      let objToPush: any = {
        item: uniqueValue,
        value: data.find((o) => o.locationGroup === uniqueValue).locationId,
        children: []
      }
      data.filter((t) => t.locationGroup === uniqueValue).forEach((objMatch) => {
        objToPush.children.push({
          item: objMatch.locationName,
          value: objMatch.locationId
        })
      })

      returnValue.push(objToPush);
      objToPush = [];
    })
    console.log('return value --', returnValue)
    return returnValue;
  }

  public getCashAndCashEq(franchiseIds: string[]): Promise<any> {
    const headers = { 'Content-Type': 'application/json'};
    const body = { franchiseIds };
    const option = {
      headers
    };
    return this.http
      .post(environment.serverUrl + "/balance-sheet/getCashAndCashEq", body, option)
      .toPromise();
  }

  public getAccountsReceivables(franchiseIds: string[]): Promise<any> {
    const headers = { 'Content-Type': 'application/json'};
    const body = { franchiseIds };
    const option = {
      headers
    };
    return this.http
      .post(environment.serverUrl + "/balance-sheet/getAccountsReceivables", body, option)
      .toPromise();
  }
}
