import { Component, Injectable, OnInit, ViewChild } from '@angular/core';
import { ReportService } from '../../service/report.service'
import {FormGroup, FormControl} from '@angular/forms';
import { flterDropdown, ReportRequest, ReportRequestByYear } from 'src/model/report.model';
import * as moment from 'moment';
import { years } from '../../assets/files/years';
import { reportFields } from '../../assets/files/report-meta';
import { distinctFranchiseName, distinctLocationGroup, reportData, reportDataForLocationName } from '../../assets/files/dummy-data';
import { NgxSpinnerService } from "ngx-spinner";
import * as XLSX from 'xlsx';
import {debounce, filter}  from 'lodash';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatOption } from '@angular/material/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';

/**
 * Node for to-do item
 */
 export class FoodNode {
   item: string;
   value?: string;
   children?: FoodNode[];
}
export class FoodFlatNode {
  item: string;
  value?: string;
  level: number;
  expandable: boolean;
}

/**
 * The Json object for to-do list data.
 */
 const TREE_DATA: FoodNode[] = [
  {
    item: "Fruit",
    children: [
      { item: "Apple" },
      { item: "Banana" },
      {
        item: "Fruit loops",
        children: [
          { item: "Cherry" },
          { item: "Grapes", children: [{ item: "Oranges" }] }
        ]
      }
    ]
  },
  {
    item: "Vegetables",
    children: [
      {
        item: "Green",
        children: [{ item: "Broccoli" }, { item: "Brussels sprouts" }]
      },
      {
        item: "Orange",
        children: [{ item: "Pumpkins" }, { item: "Carrots" }]
      }
    ]
  }]

  /**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable({ providedIn: "root" })
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<FoodNode[]>([]);
  treeData: any[];

  get data(): FoodNode[] {
    return this.dataChange.value;
  }

  constructor() {
    this.initialize(TREE_DATA);
  }

  initialize(treeData: any) {
    this.treeData = treeData;
    // Build thethis.treeData tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    const data = treeData;

    // Notify the change.
    this.dataChange.next(treeData);
  }

  public filter(filterText: string) {
    let filteredTreeData;
    if (filterText) {
      // Filter the tree
      function filter(array: any, text: any) {
        const getChildren = (result: any, object: any) => {
          if (object.item .toLowerCase().includes(text.toLowerCase())) {
            result.push(object);
            return result;
          }
          if (Array.isArray(object.children)) {
            const children = object.children.reduce(getChildren, []);
            if (children.length) result.push({ ...object, children });
          }
          return result;
        };

        return array.reduce(getChildren, []);
      }

      filteredTreeData = filter(this.treeData, filterText);
    } else {
      // Return the initial tree
      filteredTreeData = this.treeData;
    }

    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    // file node as children.
    const data = filteredTreeData;
    // Notify the change.
    this.dataChange.next(data);
  }
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {

  public Math = Math;
  public reportData: any = {};
  public reportDataByYear: any = {};
  public originalReportData: any = {};
  public originalReportDataByYear: any = {};

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
  public originalReportResponse: any = {};
  public initialFilterApplied: boolean = true;
  public searchOptionText = new FormControl('');
  public total: any = {};
  public selectAll = new FormControl(true);
  @ViewChild('allSelected') private allSelected: MatOption;
  showHierarchicalDD: boolean = false;
  selectAllHierarchical: boolean = true;
  public showEditReportbtn = true;
  public editReportMode = false;
  public aboveTotalIncome = ['grossSale', 'returnSale', 'cancelIncome'];
  public belowTotalIncome = ['cogs', 'commissionConsultant', 'commissionPCC', 'commissionTelemarketing', 'operatingExpenses'];

  /** The selection for checklist */
  checklistSelection = new SelectionModel<FoodFlatNode>(true /* multiple */);
  dataSource: MatTreeFlatDataSource<FoodNode, FoodFlatNode>;
  treeControl: FlatTreeControl<FoodFlatNode>;
  treeFlattener: MatTreeFlattener<FoodNode, FoodFlatNode>;
  treeData: any[];
  dataChange = new BehaviorSubject<FoodNode[]>([]);
  selectedNodes: string[] = [];

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<FoodFlatNode, FoodNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<FoodNode, FoodFlatNode>();


  get data(): FoodNode[] {
    return this.dataChange.value;
  }

  protected _onDestroy = new Subject<void>();

  constructor(private reportService: ReportService, private spinner: NgxSpinnerService, private _database: ChecklistDatabase) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<FoodFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );

    _database.dataChange.subscribe(data => {
      console.log('data---', data);
      this.checklistSelection = new SelectionModel<FoodFlatNode>(true /* multiple */);
      this.dataSource.data = data;
    });
  }

  getLevel = (node: FoodFlatNode) => node.level;

  isExpandable = (node: FoodFlatNode) => node.expandable;

  getChildren = (node: FoodNode): FoodNode[] => node.children || [];

  hasChild = (_: number, _nodeData: FoodFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: FoodFlatNode) => _nodeData.item === "";

  async ngOnInit() {
    try {
      this.spinner.show();
      this.setSelectedDate();
      const reportRequest : ReportRequest = {
        startDate: moment(new Date(this.range.get('start')?.value)).format("YYYY-MM-DD"),
        endDate: moment(new Date(this.range.get('end')?.value)).format("YYYY-MM-DD"),
      };

      const reportRequestByYear : ReportRequestByYear = {
        year: this.selectedYear
      };
      await Promise.all([this.getReportData(reportRequest), this.getReportDataByYear(reportRequestByYear)]);
      // await this.getReportData(reportRequest);
  
      // await this.getReportDataByYear(reportRequestByYear);
  
      this.searchOptionText.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.filterOptions();
        });
    } catch(e) {
      console.log('error occured while fetching data', e);
    } finally {
      this.spinner.hide();
    }
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  public getReportData = async (reportRequest: ReportRequest) => {
    try {
      
      this.reportData = await this.reportService.getReportData(reportRequest);
      Object.assign(this.originalReportData, this.reportData); 
    } catch(e) {
      console.log('error occured while fetching report data', e);
    }
  }

  public getReportDataByYear = async (reportRequest: ReportRequestByYear) => {
    try {
      
      this.reportDataByYear = await this.reportService.getReportDataByYear(reportRequest);
      Object.assign(this.originalReportDataByYear, this.reportDataByYear);
    } catch(e) {
      console.log('error occured while fetching yearly report data', e);
    } finally {
      
    }
  }

  public async dateChanged() {
    console.log('startDate---', this.range.get('start')?.value);
    console.log('endDate---', this.range.get('end')?.value);

    if (this.range.get('start')?.value && this.range.get('end')?.value) {
    const startDate = this.range.get('start')?.value ? moment(new Date(this.range.get('start')?.value)).format("YYYY-MM-DD") : '';
    const endDate = this.range.get('end')?.value ? moment(new Date(this.range.get('end')?.value)).format("YYYY-MM-DD") : '';
    
      if (!this.showFilteredTale) {
        try {
          this.spinner.show();
          this.setSelectedDate();
  
          const reportRequest : ReportRequest = {
            startDate,
            endDate
          }
          await this.getReportData(reportRequest);
        } finally{
          this.spinner.hide();
        }
      } else {
        if (this.filter === 'franchiseName') {
          this.reportResponse = await this.getReportDataByFranchiseName(this.selectedOptions.value, startDate, endDate);
        } else if (this.filter === 'locationGroup') {
          this.reportResponse = await this.getReportDataByLocationGroup(this.selectedOptions.value, startDate, endDate);
        } else {
          this.reportResponse = await this.getReportDataByLocationName(this.selectedNodes, startDate, endDate);
        }
        Object.assign(this.originalReportResponse, this.reportResponse);
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
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element, {raw:true});
 
    var range = XLSX.utils.decode_range(ws['!ref'] || '');

    for(var R = range.s.r; R <= range.e.r; ++R) {
      for(var C = range.s.c; C <= range.e.c; ++C) {
        var cell_address = {c:C, r:R};
        /* if an A1-style address is needed, encode the address */
        var cell_ref = XLSX.utils.encode_cell(cell_address);
        console.log('cell_address--', cell_address,  ws[cell_ref]?.v);

        if (R === 0) {
          if (ws[cell_ref]) {
            ws[cell_ref].s={
              	font:{
              		bold:true
              }};
            // ws[cell_ref].v = ws[cell_ref]?.v.bold();
          }
        }
      }
    }
    
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
        this.showHierarchicalDD = false;
        this.optionsList = this.filteredOptionsList = await this.getFranchiseName();
        const selectedOptionValues: string[] = [];
        this.optionsList.forEach((option) => {
          selectedOptionValues.push(option.value);
        });
        this.selectedOptions.setValue([...selectedOptionValues, 'all']);

        this.reportResponse = await this.getReportDataByFranchiseName(this.selectedOptions.value, startDate, endDate);
        Object.assign(this.originalReportResponse, this.reportResponse);
        this.showFilteredTale = true;
        this.filteredOptions = this.optionsList;
      } else if (this.filter === 'locationGroup') {     // location group filter
        this.showHierarchicalDD = false;
        this.optionsList = this.filteredOptionsList = await this.getLocationGroup();

        const selectedOptionValues: string[] = [];
        this.optionsList.forEach((option) => {
          selectedOptionValues.push(option.value);
        });
        this.selectedOptions.setValue([...selectedOptionValues, 'all']);

        this.reportResponse = await this.getReportDataByLocationGroup(this.selectedOptions.value, startDate, endDate);
        Object.assign(this.originalReportResponse, this.reportResponse);
        this.showFilteredTale = true;
        this.filteredOptions = this.optionsList;
      } else if (this.filter === 'locationName') {     // location name filter
        this.showHierarchicalDD = true;
        this.optionsList = this.filteredOptionsList = await this.getLocationName();

        // this._database.initialize(this.reportService.makeDataForDropdown(distinctLocationGroup));
        this._database.initialize(this.reportService.makeDataForDropdown(this.optionsList));
        this.selectAllNodes();

        this.setProperDataForReport();
        // this.optionsList.forEach((option) => {
          //   selectedOptionValues.push(option.value);
          // });
          // this.selectedOptions.setValue([...selectedOptionValues, 'all']);
          this.selectedNodes = [];
        this.treeControl.dataNodes.forEach((node) => {
          if (this.checklistSelection.isSelected(node) && !node.expandable) {
            this.selectedNodes.push(node.value || '');
          }
        })

        this.reportResponse = await this.getReportDataByLocationName(this.selectedNodes, startDate, endDate);
        // this.reportResponse = reportDataForLocationName;
        Object.assign(this.originalReportResponse, this.reportResponse);
        console.log('reportResponse---', this.reportResponse);
        this.showFilteredTale = true;
      } else {
        this.showFilteredTale = false;
        this.showHierarchicalDD = false;
      }
      setTimeout(() => {
        this.initialFilterApplied = false
      }, 1500);
    } catch(e) {
      console.log('error occured while filtering report', e);
    } finally {
      this.spinner.hide();
    }
  }

  public selectAllNodes() {
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(!this.checklistSelection.isSelected(this.treeControl.dataNodes[i]))
        this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
    }
  }

  public setProperDataForReport(calculateTotalValue: boolean = false) {
    this.filteredOptions = [];
    this.selectedNodes = [];
    this.treeControl.dataNodes.forEach((node) => {
      if (this.checklistSelection.isSelected(node) && !node.expandable) {
        this.filteredOptions.push({
          label: node.item,
          value: node.value || ''
        })

        this.selectedNodes.push(node.value || '');
      }
    });

    this.selectAllHierarchical = this.treeControl.dataNodes.length === this.checklistSelection.selected.length;

    if (calculateTotalValue)
      this.setTotalValue();
  }

  public selectAllNode() {
    this.filteredOptions = [];
    this.selectedNodes = [];

    if (this.selectAllHierarchical) {
      this.treeControl.dataNodes.forEach((node) => {
        this.checklistSelection.select(node);
        if (!node.expandable) {
          this.filteredOptions.push({
            label: node.item,
            value: node.value || ''
          })
        }
        this.selectedNodes.push(node.value || '');
      })
    } else {
      this.treeControl.dataNodes.forEach((node) => {
        this.checklistSelection.deselect(node);
      })
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
      // const options = selectedOptions.slice();
      // const index = options.indexOf('all');
      // if (index > -1) {
      //   console.log('splice--', index);
      //   options.splice(index, 1);
      // }
      const reportData: any[] = await this.reportService.getReportDataByLocationName(selectedOptions, startDate, endDate);
      console.log('selectedOptions---', selectedOptions);
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

  public setTotalValue() {
    this.total = {};
    
    reportFields.forEach((field: any) => {
      Object.keys(this.reportResponse).forEach((key: any) => {
        if (this.selectedNodes.includes(key)) {
          this.total[field.value] = (parseFloat(this.total[field.value]) || 0) + (parseFloat(this.reportResponse[key][field.value]) || 0);
        }
      });
    });
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
          this.total[field.value] = (parseFloat(this.total[field.value]) || 0) + (parseFloat(this.reportResponse[key][field.value]) || 0);
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

  // for hierarchy dropdown
  getSelectedItems(): string {
    if (!this.checklistSelection.selected.length) return "Options";

    const selectedItem: string[] = [];
    this.checklistSelection.selected.forEach((s: any) => {
      if(!s.expandable)
      {
        selectedItem.push(s.item)
      }
    });

    return selectedItem.join(", ");
  }

  filterChanged(event: any) {
    console.log("filterChanged", event.target.value);
    const filterText = event.target.value
    this._database.filter(filterText);
    if (filterText) {
      this.treeControl.expandAll();
    } else {
      this.treeControl.collapseAll();
    }
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: FoodFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);

    this.setProperDataForReport(true);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: FoodFlatNode): void {
    let parent: FoodFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: FoodFlatNode): FoodFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: FoodFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: FoodFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: FoodFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child =>
      this.checklistSelection.isSelected(child)
    );
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: FoodFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.every(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);

    this.setProperDataForReport(true);
  }

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
   transformer = (node: FoodNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.item === node.item
        ? existingNode
        : new FoodFlatNode();
    flatNode.item = node.item;
    flatNode.value = node.value;
    flatNode.level = level;
    flatNode.expandable = !!node.children;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  public editReport() {
    this.editReportMode = true;
    this.showEditReportbtn = false;
  }

  public resetReport() {
    this.editReportMode = false;
    this.showEditReportbtn = true;
    Object.assign(this.reportResponse, this.originalReportResponse);
    Object.assign(this.reportData, this.originalReportData);
    Object.assign(this.reportDataByYear, this.originalReportDataByYear);
  }

  public reportValueChanged = debounce((fieldValue, event, isAmountValueChanged, isYearWiseTable) => {
    let objToChange = isYearWiseTable ? this.reportData : this.reportDataByYear;
    if (this.aboveTotalIncome.includes(fieldValue.value)) {
      const changedPercent = event.target.value;
      const totalIncome = parseFloat(objToChange['totalIncome'].toFixed(2));
      const cogsPercent = parseFloat((objToChange['cogs']/totalIncome*100).toFixed(2));
      const commissionConsultantPerent = parseFloat((objToChange['commissionConsultant']/totalIncome*100).toFixed(2));
      const commissionPCCPercent = parseFloat((objToChange['commissionPCC']/totalIncome*100).toFixed(4));
      const commissionTelemarketingPercent = parseFloat((objToChange['commissionTelemarketing']/totalIncome*100).toFixed(2));

      let count = 0;
      while(true) {
        console.log('loop---');
        objToChange[fieldValue.value] = objToChange['totalIncome']*changedPercent/100;
        objToChange['totalIncome'] = Math.abs(objToChange['grossSale'])-Math.abs(objToChange['returnSale'])-Math.abs(objToChange['cancelIncome']);

        if (objToChange['totalIncome']*changedPercent/100 == objToChange[fieldValue.value]) {
          console.log('final---', objToChange['totalIncome'], cogsPercent, commissionConsultantPerent);
          const totalIncome = parseFloat(objToChange['totalIncome'].toFixed(2));
          objToChange['cogs'] = totalIncome*cogsPercent/100;
          objToChange['commissionConsultant'] = totalIncome*commissionConsultantPerent/100;
          objToChange['commissionPCC'] = totalIncome*commissionPCCPercent/100;
          objToChange['commissionTelemarketing'] = totalIncome*commissionTelemarketingPercent/100;
          break;
        }

        if(count >= 1000) {
          break;
        }
        count++;
      }
    } else {
      if (isAmountValueChanged) {
        const changedAmount = event.target.value;
        objToChange[fieldValue.value] = changedAmount;
      } else {
        const changedPercent = event.target.value;
        objToChange[fieldValue.value] = objToChange['totalIncome']*changedPercent/100;
      }
    }
  }, 600);

  public filteredReportValueChanged = debounce((id, fieldValue, event, isAmountValueChanged) => {
    let changedObj: any = {};
    Object.assign(changedObj, this.reportResponse[id]);

    if (this.aboveTotalIncome.includes(fieldValue.value)) {
      const changedPercent = event.target.value;
      const totalIncome = parseFloat(changedObj['totalIncome'].toFixed(2));

      const cogsPercent = parseFloat((changedObj['cogs']/totalIncome*100).toFixed(2));
      const commissionConsultantPerent = parseFloat((changedObj['commissionConsultant']/totalIncome*100).toFixed(2));
      const commissionPCCPercent = parseFloat((changedObj['commissionPCC']/totalIncome*100).toFixed(4));
      const commissionTelemarketingPercent = parseFloat((changedObj['commissionTelemarketing']/totalIncome*100).toFixed(2));

      let count = 0;
      while(true) {
        console.log('loop---');
        changedObj[fieldValue.value] = changedObj['totalIncome']*changedPercent/100;
        changedObj['totalIncome'] = Math.abs(changedObj['grossSale'])-Math.abs(changedObj['returnSale'])-Math.abs(changedObj['cancelIncome']);

        if (changedObj['totalIncome']*changedPercent/100 == changedObj[fieldValue.value]) {
          console.log('final percent--',changedObj['totalIncome'], cogsPercent);
          const totalIncome = parseFloat(changedObj['totalIncome'].toFixed(2));

          changedObj['cogs'] = totalIncome*cogsPercent/100;
          changedObj['commissionConsultant'] = totalIncome*commissionConsultantPerent/100;
          changedObj['commissionPCC'] = totalIncome*commissionPCCPercent/100;
          changedObj['commissionTelemarketing'] = totalIncome*commissionTelemarketingPercent/100;
          this.reportResponse[id] = changedObj;
          break;
        }

        if(count >= 1000) {
          break;
        }
        count++;
      }
    } else {
      if (isAmountValueChanged) {
        const changedAmount = event.target.value;
        changedObj[fieldValue.value] = changedAmount;
      } else {
        const changedPercent = event.target.value;
        changedObj[fieldValue.value] = changedObj['totalIncome']*changedPercent/100;
      }
      this.reportResponse[id] = changedObj;
    }
    if (this.filter === 'locationName') {
      this.setTotalValue();
    } else {
      this.changeTotalValues();
    }
  }, 600)
}
