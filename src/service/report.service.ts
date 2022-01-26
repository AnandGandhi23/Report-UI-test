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

  public getReportDataByFranchiseName(franchiseIds: string[]): Promise<any> {
    const headers = { 'Content-Type': 'application/json'}
    return this.http
      .post(environment.serverUrl + "/getReportDataByFranchiseName", {franchiseIds: franchiseIds}, {headers})
      .toPromise();
  }

  public getReportDataByLocationGroup(franchiseIds: string[]): Promise<any> {
    const headers = { 'Content-Type': 'application/json'}
    return this.http
      .post(environment.serverUrl + "/getReportDataByLocationGroup", {franchiseIds: franchiseIds}, {headers})
      .toPromise();
  }

  public getReportDataByLocationName(franchiseIds: string[]): Promise<any> {
    const headers = { 'Content-Type': 'application/json'}
    return this.http
      .post(environment.serverUrl + "/getReportDataByLocationName", {franchiseIds: franchiseIds}, {headers})
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
}
