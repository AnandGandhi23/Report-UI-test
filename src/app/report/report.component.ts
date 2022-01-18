import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../service/report.service'
import {FormGroup, FormControl, FormBuilder} from '@angular/forms';
import { ReportRequest, ReportRequestByYear } from 'src/model/report.model';
import * as moment from 'moment';
import { years } from '../../assets/files/years';
import { NgxSpinnerService } from "ngx-spinner";
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {

  public Math = Math;
  public reportData: any = {};
  public reportDataByYear: any = {};
  range = new FormGroup({
    start: new FormControl('2021-01-01'),
    end: new FormControl('2021-08-31'),
  });
  public selectedDate: string = '';
  public years = years;
  public selectedYear = 2021;

  constructor(private reportService: ReportService, private spinner: NgxSpinnerService) {}

  ngOnInit(): void {
    this.setSelectedDate();
    const reportRequest : ReportRequest = {
      startDate: moment(new Date(this.range.get('start')?.value)).format("YYYY-MM-DD"),
      endDate: moment(new Date(this.range.get('end')?.value)).format("YYYY-MM-DD"),
    };
    this.getReportData(reportRequest);

    const reportRequestByYear : ReportRequestByYear = {
      year: this.selectedYear
    };
    this.getReportDataByYear(reportRequestByYear);
  }

  public getReportData = async (reportRequest: ReportRequest) => {
    try {
      this.spinner.show();
      const response : any[] = await this.reportService.getReportData(reportRequest);
      response.map((data) => {
        const objData = data[0];
        Object.keys(objData).forEach(key => {
          this.reportData[key] = objData[key];
        });
      });
    } catch(e) {
      console.log('error occured while fetching report data', e);
    } finally {
      this.spinner.hide();
    }
  }

  public getReportDataByYear = async (reportRequest: ReportRequestByYear) => {
    try {
      this.spinner.show();
      const response : any[] = await this.reportService.getReportDataByYear(reportRequest);
      response.map((data) => {
        const objData = data[0];
        Object.keys(objData).forEach(key => {
          this.reportDataByYear[key] = objData[key];
        });
      });
    } catch(e) {
      console.log('error occured while fetching yearly report data', e);
    } finally {
      this.spinner.hide();
    }
  }

  public async dateChanged() {
    const startDate = this.range.get('start')?.value;
    const endDate = this.range.get('end')?.value;

    if (startDate && endDate) {
      this.setSelectedDate();

      const reportRequest : ReportRequest = {
        startDate: moment(new Date(startDate)).format("YYYY-MM-DD"),
        endDate: moment(new Date(endDate)).format("YYYY-MM-DD"),
      }
      await this.getReportData(reportRequest);
    }
  }

  public yearChanged() {
    const reportRequestByYear : ReportRequestByYear = {
      year: this.selectedYear
    };
    this.getReportDataByYear(reportRequestByYear);
  }

  public setSelectedDate() {
    const startDate = this.range.get('start')?.value;
    const endDate = this.range.get('end')?.value;

    const startDateMonth = new Date(startDate).toLocaleString('default', { month: 'long' }).substr(0, 3);
    const endDateMonth = new Date(endDate).toLocaleString('default', { month: 'long' }).substr(0, 3);

    const startDateYear = new Date(startDate).getFullYear().toString().substr(2, 2);
    const endDateYear = new Date(endDate).getFullYear().toString().substr(2, 2);

    this.selectedDate = `${startDateMonth} ${startDateYear} - ${endDateMonth} ${endDateYear}`;
  }

  exportexcel(): void
  {
    /* pass here the table id */
    let element = document.getElementById('reportTable');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
 
    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
 
    /* save to file */  
    XLSX.writeFile(wb, `Exhibit B_${this.selectedDate}.xlsx`);
 
  }

}
