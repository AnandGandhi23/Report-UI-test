import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/guard/auth.guard';
import { LoginGuard } from 'src/guard/login.guard';
import { LoginComponent } from './login/login.component';
import { ReportComponent } from './report/report.component';

const routes: Routes = [
  { path: '', redirectTo:'login', pathMatch: 'full'},
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
  { path: 'report', component: ReportComponent, canActivate: [AuthGuard], },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
