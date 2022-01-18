import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ReportRequest, ReportRequestByYear } from 'src/model/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private http: HttpClient) {}

  public getReportData(reportRequest: ReportRequest) : Promise<any> {
    return this.http.get(environment.serverUrl + '/getReportData', {
      params: {
        startDate: reportRequest.startDate,
        endDate: reportRequest.endDate,
      }
    }).toPromise();
  }

  public getReportDataByYear(reportRequest: ReportRequestByYear) : Promise<any> {
    return this.http.get(environment.serverUrl + '/getReportDataByYear', {
      params: {
        year: reportRequest.year.toString()
      }
    }).toPromise();
  }
}
