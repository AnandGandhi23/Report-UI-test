import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { flterDropdown } from 'src/model/report.model';
import { distinctFranchiseName } from '../../assets/files/dummy-data';

@Component({
  selector: 'app-balance-sheet',
  templateUrl: './balance-sheet.component.html',
  styleUrls: ['./balance-sheet.component.scss']
})
export class BalanceSheetComponent implements OnInit {

  public selectedFranchiseName = new FormControl([]);
  public searchOptionText = new FormControl('');
  // public filteredOptionsList: flterDropdown[] = [];.
  public allFranchiseNames: flterDropdown[] = distinctFranchiseName;
  

  constructor() { }

  ngOnInit(): void {
  }

  public toggleAllSelection() {

  }

  public onSelectFranchiseName() {

  }

}
