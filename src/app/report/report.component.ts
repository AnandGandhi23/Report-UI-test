import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../service/report.service'
import {FormGroup, FormControl, FormBuilder} from '@angular/forms';
import { flterDropdown, ReportRequest, ReportRequestByYear } from 'src/model/report.model';
import * as moment from 'moment';
import { years } from '../../assets/files/years';
import { reportFields } from '../../assets/files/report-meta';
import { NgxSpinnerService } from "ngx-spinner";
import * as XLSX from 'xlsx';
import {debounce}  from 'lodash';

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
  public filter: string = 'all';
  public filterOptions: flterDropdown[] = [];
  public selectedOptions = new FormControl([]);
  public filteredOptions: flterDropdown[] = [];
  public showFilteredTale: boolean = false;
  public reportFields = reportFields;
  public reportResponse: any = {};
  public initialFilterApplied: boolean = true;

  constructor(private reportService: ReportService, private spinner: NgxSpinnerService) {}

  ngOnInit(): void {
    this.setSelectedDate();
    const reportRequest : ReportRequest = {
      startDate: moment(new Date(this.range.get('start')?.value)).format("YYYY-MM-DD"),
      endDate: moment(new Date(this.range.get('end')?.value)).format("YYYY-MM-DD"),
    };
    // this.getReportData(reportRequest);

    const reportRequestByYear : ReportRequestByYear = {
      year: this.selectedYear
    };
    // this.getReportDataByYear(reportRequestByYear);
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

    const startDate = this.range.get('start')?.value ? moment(new Date(this.range.get('start')?.value)).format("YYYY-MM-DD") : '';
    const endDate = this.range.get('end')?.value ? moment(new Date(this.range.get('end')?.value)).format("YYYY-MM-DD") : ''
    if (startDate && endDate) {
      if (!this.showFilteredTale) {
        this.setSelectedDate();

        const reportRequest : ReportRequest = {
          startDate,
          endDate
        }
        await this.getReportData(reportRequest);
      } else {
        if (this.filter === 'franchiseName') {
          this.reportResponse = await this.getReportDataByFranchiseName(this.selectedOptions.value, startDate, endDate);
        } else if (this.filter === 'locationGroup') {
          this.reportResponse = await this.getReportDataByLocationGroup(this.selectedOptions.value, startDate, endDate);
        } else {
          this.reportResponse = await this.getReportDataByLocationName(this.selectedOptions.value, startDate, endDate);
        }
      }
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
    const fileName = this.filter === 'all' ? `Exhibit B_${this.selectedDate}.xlsx` : `Exhibit B_BY_${this.filter}`;
    XLSX.writeFile(wb, `Exhibit B_${this.selectedDate}.xlsx`);
  }

  public async filterApplied() {
    try {
      this.spinner.show();
      this.filterOptions = [];
      this.reportResponse = {};
      this.initialFilterApplied = true
      
      const startDate = moment(new Date(this.range.get('start')?.value)).format("YYYY-MM-DD");
      const endDate = moment(new Date(this.range.get('end')?.value)).format("YYYY-MM-DD");
      if (this.filter === 'franchiseName') {           // franchise name filter
        this.filterOptions = await this.getFranchiseName();
        
        const selectedOptionValues: string[] = [];
        this.filterOptions.forEach((option) => {
          selectedOptionValues.push(option.value);
        });
        this.selectedOptions.setValue(selectedOptionValues);

        this.reportResponse = await this.reportService.getReportDataByFranchiseName(this.selectedOptions.value, startDate, endDate);
        this.showFilteredTale = true;
      } else if (this.filter === 'locationGroup') {     // location group filter
        this.filterOptions = await this.getLocationGroup();
  
        const selectedOptionValues: string[] = [];
        this.filterOptions.forEach((option) => {
          selectedOptionValues.push(option.value);
        });
        this.selectedOptions.setValue(selectedOptionValues);

        this.reportResponse = await this.reportService.getReportDataByLocationGroup(this.selectedOptions.value, startDate, endDate);
        this.showFilteredTale = true;
      } else if (this.filter === 'locationName') {     // location name filter
        this.filterOptions = await this.getLocationName();
  
        const selectedOptionValues: string[] = [];
        this.filterOptions.forEach((option) => {
          selectedOptionValues.push(option.value);
        });
        this.selectedOptions.setValue(selectedOptionValues);

        this.reportResponse = await this.reportService.getReportDataByLocationName(this.selectedOptions.value, startDate, endDate);
        this.showFilteredTale = true;
      } else {
        this.showFilteredTale = false;
      }
      this.filteredOptions = this.filterOptions;
      setTimeout(() => {
        this.initialFilterApplied = false
      }, 1500);
    } catch(e) {
      console.log('error occured while filtering report', e);
    } finally {
      this.spinner.hide();
    }
  }

  public async getFranchiseName() {
    try {
      return await this.reportService.getFranchiseName();
    } catch(e) {
      console.log('error occured while fetching franchise name', e);
    }
  }

  public async getLocationGroup() {
    try {
      return await this.reportService.getLocationGroup();
    } catch(e) {
      console.log('error occured while fetching location group', e);
    }
  }

  public async getLocationName() {
    try {
      return await this.reportService.getLocationName();
    } catch(e) {
      console.log('error occured while fetching location name', e);
    }
  }

  public async getReportDataByFranchiseName(selectedOptions: string[], startDate: string, endDate: string) {
    try {
      this.spinner.show();
      return await this.reportService.getReportDataByFranchiseName(selectedOptions, startDate, endDate)
    } catch(e) {
      console.log('error occured while fetching report data by franchise name', e);
    } finally {
      this.spinner.hide();
    }
  }

  public async getReportDataByLocationGroup(selectedOptions: string[], startDate: string, endDate: string) {
    try {
      this.spinner.show();
      return await this.reportService.getReportDataByLocationGroup(selectedOptions, startDate, endDate)
    } catch(e) {
      console.log('error occured while fetching report data by location group', e);
    } finally {
      this.spinner.hide();
    }
  }

  public async getReportDataByLocationName(selectedOptions: string[], startDate: string, endDate: string) {
    try {
      this.spinner.show();
      return await this.reportService.getReportDataByLocationName(selectedOptions, startDate, endDate)
    } catch(e) {
      console.log('error occured while fetching report data by location name', e);
    } finally {
      this.spinner.hide();
    }
  }


  onChangeFilter = debounce(() => {
    if (!this.initialFilterApplied) {
      this.filterReportData();
    }
  }, 700);

  public async filterReportData() {
    console.log('filterReportData called---');
    try {
      this.spinner.show();
      
      const selectedOptions: string[] = this.selectedOptions.value;
      this.filteredOptions = this.filterOptions.filter((option) => {
        return selectedOptions.includes(option.value);
      });
      console.log('selectedOptions--', this.selectedOptions.value);
      console.log('filteredOptions--', this.filteredOptions);        
      
    }catch(e) {
      console.log('error occurred in filter report data', e);
    } finally {
      this.spinner.hide();
    }
  } 
}
