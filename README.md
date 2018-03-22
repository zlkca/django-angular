# restful-hub

A powerful tool to generate a demo website of angular5 and django!

Input your model class design into restful-hub, it will generate front-end source code of web pages (say angular5 format) and backend source code of services (say django format).

Currently we only support angular and django, in the near future, we will support more frameworks, angular, react, vue, django, nodejs, flask, java, .net ... are in our list.


## Install and run

Use git to clone the project, and cd to restful-hub folder.

Run `npm install` to install 3rd libraries.

Run `ng build --prod` to build the project, the website will be store in the restful-hub/dist folder.

Run `node server.js` to start a server. 

Then navigate to `http://localhost:5004`. 

Input 'app' field (Say we use 'commerce' as app name) and 'model class' field, then click the 'Generate Files' button, it will generate angular source code under restful-hub/angular/commerce, and django source code under restful-hub/django/commerce. 

Paste those generated files into your angular and django project, add some code to link the module, and your demo project will have CRUD ability quickly.

## Usage

Create your angular project by running `ng new myblog --style=scss` ( The tool require to use scss )

Change the @angular/cli version to "1.6.6" in the myblog/package.json, and run `npm install`.

Copy django-angular/commerce folder to the myblog/.
  
import and add CommerceModule to the myblog/src/app/app.module.ts, eg:
`import { CommerceModule } from './commerce/commerce.module';`
` ... 
  imports: [
    BrowserModule,
    CommerceModule,
    RouterModule.forRoot(
      routes,
    )
  ],
  ...
`
Create your `routes` variable in myblog/src/app/app.module.ts, eg.
`const routes: Routes = [
  { path: '', component:HomeComponent }
]`

In your app.component.html add your component tag, eg. `<app-category-form></app-category-form>`

CD to myblog/ and Run `ng serve` to start the project.

Then navigate to `http://localhost:4200`, you should be able to see the change.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Further help

To get more help go check out the [README](https://rdsource.com).
