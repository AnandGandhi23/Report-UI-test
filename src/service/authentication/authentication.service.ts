import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { authenticationRequest, authenticationResponse } from 'src/model/authentication.model';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(private http: HttpClient) { }

  public authenticateUser(request: authenticationRequest): Promise<authenticationResponse> {
    const headers = { 'Content-Type': 'application/json'}
    const option = {
      headers
    }
    return this.http
      .post<authenticationResponse>(environment.serverUrl + "/authentication", request, option)
      .toPromise();
  }

  public isLoggedIn() {
    const storageValue = localStorage.getItem('isLoggedIn') || '';
    return storageValue? JSON.parse(storageValue) : false;
  } 
}
