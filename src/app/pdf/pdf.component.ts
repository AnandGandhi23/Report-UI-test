import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfService } from 'src/service/pdf.service';
import * as moment from 'moment';

@Component({
  selector: 'app-pdf',
  templateUrl: './pdf.component.html',
  styleUrls: ['./pdf.component.scss']
})
export class PdfComponent implements OnInit {
  public data: any = {}
  public debitReponse: any[] = [];
  public creditReponse: any[] = [];
  public unclearedCheckReponse: any[] = [];
  public currentTime = moment(new Date()).format("hh:mm A");
  public currentDate = moment(new Date()).format("L");

  public debitTotal: number = 0;
  public creditTotal: number = 0;
  public unclearedCheckTotal: number = 0;
  public totalClearedTransaction: number = 0;
  public registeredBalance: number = 0;
  public overallRegisteredBalance: number = 0;
  
  public moment = moment;
  public Math = Math;

  constructor(private router: Router, private pdfService: PdfService, private spinner: NgxSpinnerService, private route: ActivatedRoute) { 
    
    this.data = {
      "franchise":{
        "label": this.route.snapshot.queryParamMap.get('franchiseName'),
        "value": this.route.snapshot.queryParamMap.get('franchiseValue')
      },
      "invoiceCreatedDate": this.route.snapshot.queryParamMap.get('invoiceCreatedDate'),
      "totalAmount": this.route.snapshot.queryParamMap.get('amount')
    }
  }

  async ngOnInit() {
    
    if (this.data) {
      // this.getDebitedValues();
      // this.getCreditedValues();
      // this.getUnusedCheckValues();

      await Promise.all([this.getDebitedValues(), this.getCreditedValues(), this.getUnusedCheckValues()]);
    }

    this.calculateTotal();
  }

  public calculateTotal() {
    this.totalClearedTransaction = this.creditTotal - this.debitTotal;
    this.registeredBalance = this.totalClearedTransaction - this.unclearedCheckTotal;
    this.overallRegisteredBalance = this.data.totalAmount - this.unclearedCheckTotal
  }

  public async getDebitedValues() {
    try {
      this.spinner.show();
      this.debitReponse = await this.pdfService.getDebitedValues(this.data.franchise.value, this.data.invoiceCreatedDate);

      console.log('debit response---', this.debitReponse);
      this.debitReponse.forEach((debit: any) => {
        this.debitTotal = this.debitTotal + debit.amount;
      });
    } catch (e) {
      console.log('error occurred while getting debited values---');
    } finally {
      this.spinner.hide();
    }
  }

  public async getCreditedValues() {
    try {
      this.spinner.show();
      this.creditReponse = await this.pdfService.getCreditedValues(this.data.franchise.value, this.data.invoiceCreatedDate);

      console.log('credit response---', this.creditReponse);
      this.creditReponse.forEach((credit: any) => {
        this.creditTotal = this.creditTotal + credit.amount;
      });
    } catch (e) {
      console.log('error occurred while getting credited values---');
    } finally {
      this.spinner.hide();
    }
  }

  public async getUnusedCheckValues() {
    try {
      this.spinner.show();
      this.unclearedCheckReponse = await this.pdfService.getUnusedCheckValues(this.data.franchise.value, this.data.invoiceCreatedDate);

      this.unclearedCheckReponse.forEach((unclearedCheck: any) => {
        this.unclearedCheckTotal = this.unclearedCheckTotal + unclearedCheck.amount;
      });
      console.log('unusedCheck response---', this.unclearedCheckReponse);
    } catch (e) {
      console.log('error occurred while getting unused check values---');
    } finally {
      this.spinner.hide();
    }
  }
}
