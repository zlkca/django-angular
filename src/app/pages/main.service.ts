import { Injectable } from '@angular/core';
import {Observable} from "rxjs/Observable";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { environment } from '../../environments/environment';

@Injectable()
export class MainService {
    API_URL:string = environment.API_URL;
    
    constructor(private http:HttpClient) { }
    
    generateModels(cls:any):Observable<any>{
        const url = this.API_URL + 'models';
        let headers = new HttpHeaders().set('Content-Type', "application/json");
        return this.http.post(url, {'classes':cls}, { 'headers': headers })
          .map((res:any)=>{
              return res.data;
          })
          .catch((err:any)=>{
              return Observable.throw(err.message || err);
          });
    }

    generateServices(app:any, cls:any):Observable<any>{
        const url = this.API_URL + 'services';
        let headers = new HttpHeaders().set('Content-Type', "application/json");
        return this.http.post(url, {'app':app, 'classes':cls}, { 'headers': headers })
          .map((res:any)=>{
              return res.data;
          })
          .catch((err:any)=>{
              return Observable.throw(err.message || err);
          });
    }
}
