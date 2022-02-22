import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from 'src/service/authentication/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private authService: AuthenticationService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
      console.log('login guard--', typeof(this.authService.isLoggedIn()), this.authService.isLoggedIn())
    if (!this.authService.isLoggedIn()) {
      console.log('returned true--')
      return true;
    }
    this.router.navigate(['/report']); 
    console.log('returned fasle--')
    return false;
  }
  
}
