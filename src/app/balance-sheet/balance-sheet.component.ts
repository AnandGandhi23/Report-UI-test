import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { debounce } from 'lodash';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { flterDropdown } from 'src/model/report.model';
import { ReportService } from 'src/service/report.service';
import { distinctFranchiseName } from '../../assets/files/dummy-data';

@Component({
  selector: 'app-balance-sheet',
  templateUrl: './balance-sheet.component.html',
  styleUrls: ['./balance-sheet.component.scss']
})
export class BalanceSheetComponent implements OnInit {

  public Math = Math;
  public selectedFranchiseName = new FormControl([]);
  public searchOptionText = new FormControl('');
  // public filteredOptionsList: flterDropdown[] = [];.
  public allFranchiseNames: flterDropdown[];
  public searchedFranchiseNames: flterDropdown[];
  @ViewChild('allSelected') private allSelected: MatOption;
  public cashAndCashEq: any = {};
  public accountsReceivables: any = {};
  public initialFilterApplied: boolean = false;
  public franchiseToShow: flterDropdown[];
  public totalCashAndCashEq: any;
  public totalAccountsReceivables: any;
  
  protected _onDestroy = new Subject<void>();
  

  constructor(private reportService: ReportService, private spinner: NgxSpinnerService) { }

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
      const response = await Promise.all([this.reportService.getCashAndCashEq(options), this.reportService.getAccountsReceivables(options)]);
      console.log('response---', response[0], response[1]);
      this.cashAndCashEq = response[0];
      this.accountsReceivables = response[1];
      this.calcualateTotal()
    } finally {
      this.spinner.hide();
    }
  }

  public calcualateTotal() {
    this.totalCashAndCashEq = 0;
    this.totalAccountsReceivables = 0;
    Object.keys(this.cashAndCashEq).forEach((item) => {
      if (this.selectedFranchiseName.value.includes(item)) {
        this.totalCashAndCashEq += this.cashAndCashEq[item];
      }
    })

    Object.keys(this.accountsReceivables).forEach((item) => {
      if (this.selectedFranchiseName.value.includes(item)) {
        const value = this.accountsReceivables[item]['netPrice']+(this.accountsReceivables[item]['tax'] || 0)+Math.abs(this.accountsReceivables[item]['refund'])-this.accountsReceivables[item]['amountPaid']-this.accountsReceivables[item]['writeOffs'];
        console.log('value---', value);
        this.totalAccountsReceivables += value;
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

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
