# Django-Angular

A powerful tool to generate model classes of django format to angular5 components !

You just need to define your Model Class with Django format, and this tool will generate 'ready to use' Angular modules, services and component.

## Install and run

Use git to clone the project and cd to djanto-angular folder.

Run `npm install` to install 3rd libraries.

Run `ng build --prod` to build the project, the website will be store in the django-angular/dist folder.

Run `node server.js` to start a server. 

Then navigate to `http://localhost:5004`. 

Input 'app' field (Here we use 'commerce' as app name) and 'model class field', you will get files under django-angular/commerce 


Then paste your model classes of django project and input your django app name, the angular5 components will be generated.

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
