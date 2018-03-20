import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  declarations: [HomeComponent],
  exports:[ 
    //HeaderComponent, 
    //FooterComponent,
    //ContactComponent, 
    HomeComponent ]
})
export class PagesModule { }
