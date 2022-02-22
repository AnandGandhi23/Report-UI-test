import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { authenticationRequest, authenticationResponse } from 'src/model/authentication.model';
import { AuthenticationService } from 'src/service/authentication/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  form: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl(''),
  });

  error: string | null;

  constructor(private authService: AuthenticationService, private router: Router) { }

  ngOnInit(): void {
  }

  async submit() {
    // if (this.form.valid) {
    //   this.submitEM.emit(this.form.value);
    // }

    const request :authenticationRequest = {
      username: this.form.get('username')?.value,
      password: this.form.get('password')?.value,
    };

    const authenticationDetails: authenticationResponse = await this.authService.authenticateUser(request);

    if (authenticationDetails.isAuthenticated) {
      localStorage.setItem('isLoggedIn', JSON.stringify(true));
      this.router.navigate(['/report']);
    } else {
      this.error = 'Username or Password invalid';
      this.form.reset();
    }
  }
  

}
