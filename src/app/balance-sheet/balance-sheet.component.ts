import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { Router } from '@angular/router';
import { debounce } from 'lodash';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { flterDropdown } from 'src/model/report.model';
import { ReportService } from 'src/service/report.service';
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';
import { cachAndCash, distinctFranchiseName } from '../../assets/files/dummy-data';

@Component({
  selector: 'app-balance-sheet',
  templateUrl: './balance-sheet.component.html',
  styleUrls: ['./balance-sheet.component.scss']
})
export class BalanceSheetComponent implements OnInit {

  public Math = Math;
  public moment = moment;

  public selectedFranchiseName = new FormControl([]);
  public searchOptionText = new FormControl('');
  // public filteredOptionsList: flterDropdown[] = [];.
  public allFranchiseNames: flterDropdown[];
  public searchedFranchiseNames: flterDropdown[];
  @ViewChild('allSelected') private allSelected: MatOption;
  public cashAndCashEq: any = {};
  public cashAndCashEqMain: any = {};
  public compareCashAndCashEqMain: any = {};
  public accountsReceivables: any = {};

  public compareCashAndCashEq: any = {};
  public compareAccountsReceivables: any = {};

  public initialFilterApplied: boolean = false;
  public franchiseToShow: flterDropdown[];
  public totalCashAndCashEq: any;
  public totalAccountsReceivables: any;

  public totalCompareCashAndCashEq: any;
  public totalCompareAccountsReceivables: any;

  public activeIds1: string[] = ['asset-panel'];
  public activeIds2: string[] = ['current-asset'];
  public activeIds3: string[] = [];

  public invoiceCreatedDate = new FormControl(moment(new Date()).format("YYYY-MM-DD"), [Validators.required]);
  public tempInvoiceCreatedDate = moment(new Date(this.invoiceCreatedDate.value)).format("YYYY-MM-DD");
  public comparisonDate = new FormControl();
  public date1ToDisplay: any;
  public date2ToDisplay: any;
  
  public expandMain: boolean = true;
  public expandCash: boolean = false;
  public expandFranchise: boolean[] = [];
  
  public expandAccount: boolean = false;
  public displayComparisonFields: boolean = false;
  
  protected _onDestroy = new Subject<void>();
  

  constructor(private reportService: ReportService, private spinner: NgxSpinnerService, private router: Router) { }

  async ngOnInit() {
    try {
      this.spinner.show();
      this.allFranchiseNames = this.searchedFranchiseNames =this.franchiseToShow = await this.reportService.getFranchiseName();
      const selectedOptionValues: string[] = [];
        this.allFranchiseNames.forEach((option) => {
          selectedOptionValues.push(option.value);
        });
      this.selectedFranchiseName.setValue([...selectedOptionValues, 'all']);
      await this.getReportData();
      this.searchOptionText.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.searchFranchiseName();
        });

      // set date values to display in UI
      this.date1ToDisplay = moment(new Date(this.invoiceCreatedDate.value)).format("LL");

      this.comparisonDate.valueChanges
        .subscribe(async (value) => {
          if (value) {
            console.log('value changed---', value);
            const date = moment(new Date(value)).format("YYYY-MM-DD");
            await this.getComparisonData(date);
            this.displayComparisonFields = true;
            this.date2ToDisplay = moment(new Date(this.comparisonDate.value)).format("LL");
          } else {
            console.log('value null---', value);
            this.displayComparisonFields = false;
          }
        });

        this.invoiceCreatedDate.valueChanges
        .subscribe(async (value) => {
          if (value) {
            this.tempInvoiceCreatedDate = moment(new Date(value)).format("YYYY-MM-DD");
            this.date1ToDisplay = moment(new Date(value)).format("LL");
            await this.getReportData();
          }
        });
    } finally {
      this.spinner.hide();
    }
  }

  public searchFranchiseName() {
    if (!this.allFranchiseNames) {
      return;
    }
    // get the search keyword
    let search = this.searchOptionText.value;
    if (!search) {
      this.searchedFranchiseNames = this.allFranchiseNames;
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the option
    this.searchedFranchiseNames = this.allFranchiseNames.filter((option) => {
      return option?.label?.toLowerCase().indexOf(search) > -1
    })
  }

  public toggleAllSelection() {
      if (this.allSelected.selected) {
        this.selectedFranchiseName.setValue([...this.allFranchiseNames.map((option) => option.value), 'all']);
        this.filterReportData();
      } else {
        this.selectedFranchiseName.setValue([]);
        this.filterReportData();
      }
      this.calcualateTotal();
  }

  public async getReportData() {
    try {
      this.spinner.show();
      const options = this.selectedFranchiseName.value.slice();
      const index = options.indexOf('all');
      if (index > -1) {
        options.splice(index, 1);
      }
      console.log('options---', options);
      const invoiceCreatedDate = moment(new Date(this.invoiceCreatedDate.value)).format("YYYY-MM-DD");
      console.log('invoiceCreatedDate--', invoiceCreatedDate)
      const response = await Promise.all([this.reportService.getCashAndCashEq(options, invoiceCreatedDate), this.reportService.getAccountsReceivables(options, invoiceCreatedDate)]);
      console.log('response---', response[0], response[1]);
      this.cashAndCashEq = response[0];
      this.accountsReceivables = response[1];
      // this.cashAndCashEq = cachAndCash;

      this.setCashAndCashMainValue()
      this.calcualateTotal()
    } finally {
      this.spinner.hide();
    }
  }

  public setCashAndCashMainValue(){
    Object.keys(this.cashAndCashEq).forEach((item) => {
      if (this.selectedFranchiseName.value.includes(item)) {
        this.cashAndCashEqMain[item] = this.cashAndCashEq[item]['endingBankBalance'] + (this.cashAndCashEq[item]['unclearedCheck'] || 0); // here
      }
    })
  }

  public setCashAndCashCompareMainValue(){
    Object.keys(this.compareCashAndCashEq).forEach((item) => {
      if (this.selectedFranchiseName.value.includes(item)) {
        this.compareCashAndCashEqMain[item] = this.compareCashAndCashEq[item]['endingBankBalance'] + (this.compareCashAndCashEq[item]['unclearedCheck'] || 0); // here
      }
    })

    console.log('this.compareCashAndCashEqMain---', this.compareCashAndCashEqMain);
  }

  public async getComparisonData(invoiceCreatedDate: string) {
    try {
      this.spinner.show();
      const options = this.selectedFranchiseName.value.slice();
      const index = options.indexOf('all');
      if (index > -1) {
        options.splice(index, 1);
      }
      
      const response = await Promise.all([this.reportService.getCashAndCashEq(options, invoiceCreatedDate), this.reportService.getAccountsReceivables(options, invoiceCreatedDate)]);
      console.log('response---', response[0], response[1]);
      this.compareCashAndCashEq = response[0];
      this.compareAccountsReceivables = response[1];

      this.setCashAndCashCompareMainValue();

      this.calcualateCompareTotal()
    } finally {
      this.spinner.hide();
    }
  }

  public calcualateTotal() {
    this.totalCashAndCashEq = 0;
    this.totalAccountsReceivables = 0;
    Object.keys(this.cashAndCashEq).forEach((item) => {
      if (this.selectedFranchiseName.value.includes(item)) {
        this.totalCashAndCashEq += this.cashAndCashEqMain[item];
      }
    })

    Object.keys(this.accountsReceivables).forEach((item) => {
      if (this.selectedFranchiseName.value.includes(item)) {
        const value = this.accountsReceivables[item]['netPrice'] + (this.accountsReceivables[item]['tax'] || 0) + Math.abs(this.accountsReceivables[item]['refund']) + (this.accountsReceivables[item]['donation'] || 0) -
            this.accountsReceivables[item]['amountPaid']-(this.accountsReceivables[item]['writeOffs'] || 0);
        console.log('value---', value);
        this.accountsReceivables[item]['displayAmount'] = value;
        this.totalAccountsReceivables += value;
      }
    })
  }

  public calcualateCompareTotal() {
    this.totalCompareCashAndCashEq = 0;
    this.totalCompareAccountsReceivables = 0;
    Object.keys(this.compareCashAndCashEq).forEach((item) => {
      if (this.selectedFranchiseName.value.includes(item)) {
        this.totalCompareCashAndCashEq += this.compareCashAndCashEqMain[item];
      }
    })

    console.log('totalCompareCashAndCashEq--', this.totalCompareCashAndCashEq);

    Object.keys(this.compareAccountsReceivables).forEach((item) => {
      if (this.selectedFranchiseName.value.includes(item)) {
        const value = this.compareAccountsReceivables[item]['netPrice'] + (this.compareAccountsReceivables[item]['tax'] || 0) + Math.abs(this.compareAccountsReceivables[item]['refund']) + (this.compareAccountsReceivables[item]['donation'] || 0) -
            this.compareAccountsReceivables[item]['amountPaid']-(this.compareAccountsReceivables[item]['writeOffs'] || 0);
        
        this.compareAccountsReceivables[item]['displayAmount'] = value;
        this.totalCompareAccountsReceivables += value;
      }
    })
  }

  

  onSelectFranchiseName = debounce(() => {
    if (!this.initialFilterApplied) {
      const index = this.selectedFranchiseName.value.indexOf('all');
      const lengthToCompare = (index > -1) ? this.allFranchiseNames.length + 1 : this.allFranchiseNames.length;
      if (this.selectedFranchiseName.value.length !== lengthToCompare) {
        if (index > -1) {
          this.selectedFranchiseName.setValue(this.selectedFranchiseName.value.filter((option: any) => option !== 'all'));
        }
      } else {
        this.selectedFranchiseName.setValue([...this.selectedFranchiseName.value, 'all']);
      }
      this.filterReportData();
    }
  }, 700);

  public async filterReportData() {
    try {
      this.spinner.show();
      
      const selectedOptions: string[] = this.selectedFranchiseName.value;
      this.franchiseToShow = this.allFranchiseNames.filter((option) => {
        return selectedOptions.includes(option.value);
      });
      this.calcualateTotal();
    }catch(e) {
      console.log('error occurred in filter report data', e);
    } finally {
      this.spinner.hide();
    }
  }

  expandAll(){
    this.activeIds1 = ['asset-panel'];
    this.activeIds2 = ['current-asset'];
    this.activeIds3 = ['cashAndCashEq', 'accountReceivables'];
  }
  collapseAll() {
    this.activeIds1 = [];
    this.activeIds2 = [];
    this.activeIds3 = [];
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  openPDF(franchise: any) {
    console.log('data--', franchise);

    const dataToPass = {
      franchise,
      invoiceCreatedDate: moment(new Date(this.invoiceCreatedDate.value)).format("YYYY-MM-DD")
    } 
    this.router.navigate(['pdf'], { 
      queryParams: { franchiseName: franchise.label,  franchiseValue: franchise.value, invoiceCreatedDate: moment(new Date(this.invoiceCreatedDate.value)).format("YYYY-MM-DD")} 
    });
  }
}
