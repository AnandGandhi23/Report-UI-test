import { Component, OnInit, ViewChild } from '@angular/core';
import { ReportService } from '../../service/report.service'
import {FormGroup, FormControl} from '@angular/forms';
import { flterDropdown, ReportRequest, ReportRequestByYear } from 'src/model/report.model';
import * as moment from 'moment';
import { years } from '../../assets/files/years';
import { reportFields } from '../../assets/files/report-meta';
import { distinctFranchiseName } from '../../assets/files/dummy-data';
import { NgxSpinnerService } from "ngx-spinner";
import * as XLSX from 'xlsx';
import {debounce}  from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatOption } from '@angular/material/core';

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
  public optionsList: flterDropdown[] = [];
  public filteredOptionsList: flterDropdown[] = [];
  public selectedOptions = new FormControl([]);
  public filteredOptions: flterDropdown[] = [];
  public showFilteredTale: boolean = false;
  public reportFields = reportFields;
  public reportResponse: any = {};
  public initialFilterApplied: boolean = true;
  public searchOptionText = new FormControl('');
  public total: any = {};
  public selectAll = new FormControl(true);
  @ViewChild('allSelected') private allSelected: MatOption;

  protected _onDestroy = new Subject<void>();

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

    this.searchOptionText.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterOptions();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
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
      this.optionsList = [];
      this.reportResponse = {};
      this.initialFilterApplied = true
      
      const startDate = moment(new Date(this.range.get('start')?.value)).format("YYYY-MM-DD");
      const endDate = moment(new Date(this.range.get('end')?.value)).format("YYYY-MM-DD");
      if (this.filter === 'franchiseName') {           // franchise name filter
        this.optionsList = this.filteredOptionsList = await this.getFranchiseName();
        const selectedOptionValues: string[] = [];
        this.optionsList.forEach((option) => {
          selectedOptionValues.push(option.value);
        });
        this.selectedOptions.setValue([...selectedOptionValues, 'all']);

        this.reportResponse = await this.getReportDataByFranchiseName(this.selectedOptions.value, startDate, endDate);
        this.showFilteredTale = true;
      } else if (this.filter === 'locationGroup') {     // location group filter
        this.optionsList = this.filteredOptionsList = await this.getLocationGroup();
  
        const selectedOptionValues: string[] = [];
        this.optionsList.forEach((option) => {
          selectedOptionValues.push(option.value);
        });
        this.selectedOptions.setValue([...selectedOptionValues, 'all']);

        this.reportResponse = await this.getReportDataByLocationGroup(this.selectedOptions.value, startDate, endDate);
        this.showFilteredTale = true;
      } else if (this.filter === 'locationName') {     // location name filter
        this.optionsList = this.filteredOptionsList = await this.getLocationName();
  
        const selectedOptionValues: string[] = [];
        this.optionsList.forEach((option) => {
          selectedOptionValues.push(option.value);
        });
        this.selectedOptions.setValue([...selectedOptionValues, 'all']);

        this.reportResponse = await this.getReportDataByLocationName(this.selectedOptions.value, startDate, endDate);
        this.showFilteredTale = true;
      } else {
        this.showFilteredTale = false;
      }
      this.filteredOptions = this.optionsList;
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
      const options = selectedOptions.slice();
      const index = options.indexOf('all');
      if (index > -1) {
        console.log('splice--', index);
        options.splice(index, 1);
      }
      const reportData: any[] = await this.reportService.getReportDataByFranchiseName(options, startDate, endDate);

      this.total = {};
      reportFields.forEach((field: any) => {
        Object.keys(reportData).forEach((key: any) => {
          this.total[field.value] = (this.total[field.value] || 0) + (reportData[key][field.value] || 0);
        });
      });
      return reportData;
    } catch(e) {
      console.log('error occured while fetching report data by franchise name', e);
      return;
    } finally {
      this.spinner.hide();
    }
  }

  public async getReportDataByLocationGroup(selectedOptions: string[], startDate: string, endDate: string) {
    try {
      this.spinner.show();
      const options = selectedOptions.slice();
      const index = options.indexOf('all');
      if (index > -1) {
        console.log('splice--', index);
        options.splice(index, 1);
      }
      const reportData: any[] = await this.reportService.getReportDataByLocationGroup(options, startDate, endDate);
      
      this.total = {};
      reportFields.forEach((field: any) => {
        Object.keys(reportData).forEach((key: any) => {
          this.total[field.value] = (this.total[field.value] || 0) + (reportData[key][field.value] || 0);
        });
      });
      return reportData;
    } catch(e) {
      console.log('error occured while fetching report data by location group', e);
      return;
    } finally {
      this.spinner.hide();
    }
  }

  public async getReportDataByLocationName(selectedOptions: string[], startDate: string, endDate: string) {
    try {
      this.spinner.show();
      const options = selectedOptions.slice();
      const index = options.indexOf('all');
      if (index > -1) {
        console.log('splice--', index);
        options.splice(index, 1);
      }
      const reportData: any[] = await this.reportService.getReportDataByLocationName(options, startDate, endDate);
      this.total = {};
      reportFields.forEach((field: any) => {
        Object.keys(reportData).forEach((key: any) => {
          this.total[field.value] = (this.total[field.value] || 0) + (reportData[key][field.value] || 0);
        });
      });
      return reportData;
    } catch(e) {
      console.log('error occured while fetching report data by location name', e);
      return;
    } finally {
      this.spinner.hide();
    }
  }


  onOptionSelectionChange = debounce(() => {
    if (!this.initialFilterApplied) {
      const index = this.selectedOptions.value.indexOf('all');
      const lengthToCompare = (index > -1) ? this.optionsList.length + 1 : this.optionsList.length;
      if (this.selectedOptions.value.length !== lengthToCompare) {
        if (index > -1) {
          this.selectedOptions.setValue(this.selectedOptions.value.filter((option: any) => option !== 'all'));
        }
      } else {
        this.selectedOptions.setValue([...this.selectedOptions.value, 'all']);
      }
      this.filterReportData();
    }
  }, 700);

  public async filterReportData() {
    try {
      this.spinner.show();
      
      const selectedOptions: string[] = this.selectedOptions.value;
      console.log('selectedOptions--', this.selectedOptions.value);
      this.filteredOptions = this.optionsList.filter((option) => {
        return selectedOptions.includes(option.value);
      });
      
      this.changeTotalValues();
    }catch(e) {
      console.log('error occurred in filter report data', e);
    } finally {
      this.spinner.hide();
    }
  }

  public changeTotalValues() {
    this.total = {};
    
    reportFields.forEach((field: any) => {
      Object.keys(this.reportResponse).forEach((key: any) => {
        if (this.selectedOptions.value.includes(key)) {
          this.total[field.value] = (this.total[field.value] || 0) + (this.reportResponse[key][field.value] || 0);
        }
      });
    });
  }

  public filterOptions() {
    if (!this.optionsList) {
      return;
    }
    // get the search keyword
    let search = this.searchOptionText.value;
    if (!search) {
      this.filteredOptionsList = this.optionsList;
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the option
    this.filteredOptionsList = this.optionsList.filter(option => option.label.toLowerCase().indexOf(search) > -1)
  }

  public toggleAllSelection() {
    if (this.allSelected.selected) {
      this.selectedOptions.setValue([...this.optionsList.map((option) => option.value), 'all']);
      this.filterReportData();
    } else {
      this.selectedOptions.setValue([]);
      this.filterReportData();
    }
  }
}
