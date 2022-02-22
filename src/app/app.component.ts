import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/service/authentication/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Report-UI';

  constructor(public authService: AuthenticationService, private router: Router){}

  public logout() {
    localStorage.setItem('isLoggedIn', JSON.stringify(false));
    this.router.navigate(['/login']);
  }
}
