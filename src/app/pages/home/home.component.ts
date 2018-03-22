import { Component, OnInit } from '@angular/core';
import { MainService } from '../main.service';
import { NgForm } from '@angular/forms';

@Component({
  providers:[MainService],
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    public source:string = '';
    public model:string = '';
    public service:string = '';
    public app:any = {'name':'commerce', 'source':'', 'classes':[], 'angular':[], 'django':[]};

    constructor(private mainServ:MainService) {

    }

    ngOnInit() {

    }

    toggleTextarea(item){
        item.expanded = !item.expanded;
    }

    generateFiles(){
        this.mainServ.generateModels(this.app.name, this.app.classes).subscribe(
            (ps:any) => {
                console.log(ps.data);
                //self.model = ps.data;//self.toProductGrid(data);
            },
            (err:any) => {
                //self.model = 'Error';
            }
        );
    }

    convert(){
        let app = this.app;
        let self = this;
        let lines = app.source.match(/[^\r\n]+/g);
        let classes = this.getClass(app.name, lines);
        let appName = this.app.name;

        this.app.classes = classes;

        this.app.angular = [
                {file: 'angular/' + appName + '/' + appName + '.ts', content:self.createModels(classes), expanded:false},
                {file: 'angular/' + appName + '/' + appName + '.service.ts', content:self.createServices(appName, classes), expanded:false},
                {file: 'angular/' + appName + '/' + appName + '.module.ts', content:self.createModule(appName, classes), expanded:false}
            ];

        this.app.django = [
                {file:'django/' + appName + '/views.py', content:self.createView(appName, classes), expanded:false},
                {file:'django/' + appName + '/urls.py', content:self.createUrls(appName, classes), expanded:false}
            ]; 
    }

    findModelClassHead(s){
        // return array of the match string
        var m = s.match(/class[\s]+[$a-zA-Z_][a-zA-Z0-9_$]*\([Model|models.Model]+\)/g);
        if(m){
            return m;
        }else{
            return null;
        }
    }

    getType(line){
        if(line.indexOf('CharField')!=-1||line.indexOf('DateTimeField')!=-1){
            return 'string';
        }else if(line.indexOf('ForeignKey')){
            return 'string';
        }else if(line.indexOf('DecimalField')!=-1||line.indexOf('IntegerField')!=-1){
            return 'number';
        }else{
            return 'string';
        }
    }
    
    getMembers(lines, i){
        var line = lines[i];
        var a = [];
        var found = false;
        while(!(i > lines.length || found)){
            var TYPES = ['CharField', 'DateTimeField','ImageField','ForeignKey', 'DecimalField', 'IntegerField'];
            var re = new RegExp(TYPES.join("|"));
            var r = re.test(line);
            if(r){
                console.log(r);
                var s = line.split('=');
                var name = s[0].trim();

                if(name.indexOf('#')==-1){
                    var t = this.getType(line);
                    a.push({'name':name, 'type':t});
                }
            }
            i++;
            line = lines[i];
            if(line){
                found = this.findModelClassHead(line);
            }
        }
        return a;//{'line':i, 'members':a};
    }

    getClass(app, lines){
        var nLines = lines.length;
        var cls = [];

        for(var i=0; i<nLines; i++){
            var line = lines[i];

            var m = this.findModelClassHead(line);
            if(m){
                var s = m[0].split('(')[0];

                //if(s.split(' ')[0].indexOf('#')==-1){ //skip comment
                var className = s.split(' ')[1];
                var ms = this.getMembers(lines, i+1);
                var cs = this.getComponents(app, className, ms);
                cls.push({'name':className, 'members':ms, 'components':cs});
                //}
            }
        }
        return cls;
    }

    getContent(app, uClassName, members, cat, ext){
        if(cat=='list'){ 
            if(ext == '.ts'){
                return this.createListComponents(app, uClassName);
            }else if(ext == '.html'){
                return this.createListHtml(uClassName);
            }else{
                return '';
            }
        }else if(cat=='detail'){
            if(ext == '.ts'){
                this.createDetailComponents(app, uClassName);
            }else{
                return '';
            }
        }else if(cat=='form'){
            if(ext == '.ts'){
                return this.createFormComponents(app, uClassName);
            }else if(ext == '.html'){
                return this.createFormHtml(uClassName, members);
            }else{
                return '';
            }
        }else{
            return '';
        }
    }
    
    getComponents(app, uClassName, members){
        let lClassName = uClassName.toLowerCase();
        let components = [];
        let cats = ['list', 'form'];
        for(let cat of cats){
            let componentName = lClassName + '-' + cat;
            let fileName = componentName + '.component';
            let exts = ['.html', '.scss', '.spec.ts', '.ts'];
            let files = [];
            let componetClassName = uClassName + cat.charAt(0).toUpperCase() + cat.slice(1) + 'Component';

            for(let ext of exts){
                let content = this.getContent(app, uClassName, members, cat, ext);
                files.push({'name':fileName + ext, 'content':content, 'expanded':false});
            }
            components.push({'name':componentName, 'className': componetClassName, 'files':files })
        }
        return components;
    }

    createModels(cls){
        // app --- django app
        // cls --- django model class

        var s = '';
        for(var i=0; i<cls.length; i++){
            var className = cls[i].name;
            var members = cls[i].members;
            s += 'export class ' + className + '{\n';

            for(var j=0; j<members.length; j++){
                s += '  public ' + members[j].name + ':'+ members[j].type +';\n';
            }
            s += '  constructor(o?:any){\n';
            s += '      if(o){\n';
            for(var j=0; j<members.length; j++){
                s += '          this.' + members[j].name + ' = o.'+ members[j].name +';\n';
            }
            s += '      }\n';
            s += '  }\n';
            s += '}\n\n';
        }

        return s;
    }

    createListHtml(className){
        var lClassName = className.toLowerCase();
        var s = '<div class="container ' + lClassName + '-list">\n' +
            '    <div class="list-head">\n'+
            '        <div *ngFor="let field of fields">{{field}}</div>\n'+
            '    </div>\n'+
            '    <div class="list-body">\n'+
            '        <div class="row" *ngFor="let r of ' + lClassName + 'List" (click)="toDetail(r)">\n'+
            '            <div *ngFor="let field of fields">{{r["field"]}}</div>\n'+
            '        </div>\n'+
            '    </div>\n'+
            '</div>';

        return s;
    }

    createFormHtml(className, members){
        var lClassName = className.toLowerCase();
        var s = '<div class="container">\n'+
            '    <form class="' + lClassName + '-form">\n';

        for(let m of members){
            s += '        <div class="row">\n'+
                '            <div>'+ m.name +'</div>\n'+
                '            <input name="' + m.name + '" [(ngModel)]="'+ lClassName +'.'+ m.name +'"/>\n'+
                '        </div>\n';
        }
        
        s += '        <button (click)="save()">Save</button>\n'+    
        '    </form>\n'+
        '</div>';

        return s;
    }

    createListComponents(app, uClassName){
        var s = "import { Component, OnInit } from '@angular/core';\n";
        var uServiceName = app.charAt(0).toUpperCase() + app.slice(1) + "Service";
        var lClassName = uClassName.toLowerCase();
        var serviceVar = lClassName + "Serv";
        var getListFunc = "get" + uClassName + "List";

        s += "import { " + uServiceName + " } from '../" + app + ".service';\n";
        s += "import { " + uClassName + " } from '../" + app + "';\n\n";

        s += "@Component({\n"+
        "    providers:[" + uServiceName + "],\n"+
        "    selector: 'app-" + lClassName + "-list',\n"+
        "    templateUrl: './" + lClassName + "-list.component.html',\n"+
        "    styleUrls: ['./" + lClassName + "-list.component.scss']\n"+
        "})\n"+
        "export class " + uClassName + "ListComponent implements OnInit {\n"+
        "    " + lClassName + "List:" + uClassName + "[];\n\n"+
        "    fields:string[] = [];\n"+
        "    constructor(private " + serviceVar + ":" + uServiceName + "){}\n\n"+
        "    ngOnInit() {\n"+
        "        let self = this;\n"+
        "        let " + lClassName + " = new "+ uClassName +"()\n"+
        "        this.fields = Object.getOwnPropertyNames("+ lClassName + ");\n"+
        "        this." + serviceVar + "." + getListFunc + "().subscribe(\n"+
        "            (r:"+ uClassName + "[]) => {\n"+
        "                self." + lClassName + "List = r;\n"+
        "            },\n"+
        "            (err:any) => {\n"+
        "                self." + lClassName + "List = [];\n"+
        "            });\n"+
        "    }\n\n"+
        "    toDetail(r){}\n\n"+
        "}\n\n";

        return s;
    }

    createFormComponents(app, uClassName){
        var s = "import { Component, OnInit } from '@angular/core';\n"+
                "import { Router, ActivatedRoute } from '@angular/router';\n";

        var uServiceName = app.charAt(0).toUpperCase() + app.slice(1) + "Service";
        var lClassName = uClassName.toLowerCase();
        var serviceVar = lClassName + "Serv";
        var getFunc = "get" + uClassName;
        var saveFunc = "save" + uClassName;

        s += "import { " + uServiceName + " } from '../" + app + ".service';\n";
        s += "import { " + uClassName + " } from '../" + app + "';\n\n";

        s += "@Component({\n"+
        "    providers:[" + uServiceName + "],\n"+
        "    selector: 'app-" + lClassName + "-form',\n"+
        "    templateUrl: './" + lClassName + "-form.component.html',\n"+
        "    styleUrls: ['./" + lClassName + "-form.component.scss']\n"+
        "})\n"+
        "export class " + uClassName + "FormComponent implements OnInit {\n"+
        "    " + lClassName + ":" + uClassName + " = new " + uClassName + "();\n\n"+
        "    constructor(private " + serviceVar + ":" + uServiceName + ", private route: ActivatedRoute){}\n\n"+
        "    ngOnInit() {\n"+
        "        let self = this;\n"+
        "        self.route.params.subscribe((params:any)=>{\n"+
        "            this." + serviceVar + "." + getFunc + "(params.id).subscribe(\n"+
        "                (r:"+ uClassName + ") => {\n"+
        "                    self." + lClassName + " = r;\n"+
        "                },\n"+
        "                (err:any) => {\n"+
        "                    self." + lClassName + " = new " + uClassName + "();\n"+
        "                });\n"+
        "        });\n"+
        "    }\n\n"+
        "    save() {\n"+
        "        let self = this;\n"+
        "        self." + serviceVar + "." + saveFunc + "(self."+ lClassName +").subscribe(\n"+
        "            (r:"+ uClassName + ") => {\n"+
        "                self." + lClassName + " = r;\n"+
        "            },\n"+
        "            (err:any) => {\n"+
        "                self." + lClassName + " = new " + uClassName + "();\n"+
        "            });\n"+
        "    }\n"+
        "}\n\n";

        return s;
    }

    createDetailComponents(app, uClassName){
        var s = "import { Component, OnInit } from '@angular/core';\n"+
            "import { Router, ActivatedRoute } from '@angular/router';\n";

        var uServiceName = app.charAt(0).toUpperCase() + app.slice(1) + "Service";
        var lClassName = uClassName.toLowerCase();
        var serviceVar = lClassName + "Serv";
        var getFunc = "get" + uClassName;

        s += "import { " + uServiceName + " } from '../" + app + ".service';\n";
        s += "import { " + uClassName + " } from '../" + app + "';\n\n";

        s += "@Component({\n"+
        "    providers:[" + uServiceName + "],\n"+
        "    selector: 'app-" + lClassName + "-detail',\n"+
        "    templateUrl: './" + lClassName + "-detail.component.html',\n"+
        "    styleUrls: ['./" + lClassName + "-detail.component.scss']\n"+
        "})\n"+
        "export class " + uClassName + "DetailComponent implements OnInit {\n"+
        "    " + lClassName + ":" + uClassName + ";\n\n"+
        "    constructor(private " + serviceVar + ":" + uServiceName + ", private route: ActivatedRoute){}\n\n"+
        "    ngOnInit() {\n"+
        "        let self = this;\n"+
        "        self.route.params.subscribe((params:any)=>{\n"+
        "            this." + serviceVar + "." + getFunc + "(params.id).subscribe(\n"+
        "                (r:"+ uClassName + ") => {\n"+
        "                    self." + lClassName + " = r;\n"+
        "                },\n"+
        "                (err:any) => {\n"+
        "                    self." + lClassName + " = null;\n"+
        "                });\n"+
        "        });\n"+
        "    }\n"+
        "}\n\n";

        return s;
    }


    createServices(app, cls){
        var s = "import { Injectable } from '@angular/core';\n" +
            "import { HttpClient, HttpHeaders } from '@angular/common/http';\n" +
            "import { Observable } from 'rxjs/Observable';\n" +
            "import 'rxjs/add/operator/map';\n" +
            "import 'rxjs/add/operator/catch';\n" +
            "import { environment } from '../../environments/environment';\n";

        var serviceName = app.charAt(0).toUpperCase() + app.slice(1);
        var cNames = [];    
        for(var i=0; i<cls.length; i++){
            cNames.push(cls[i].name);
        }

        s += "import { " + cNames.join(',') + " } from './" + app + "';\n\n";
        s += "@Injectable()\n"
        s += "export class " + serviceName + "Service {\n";
        s += "    private API_URL = environment.API_URL;\n\n";
        s += "    constructor(private http:HttpClient){ }\n\n";

        for(var i=0; i<cls.length; i++){
            var className = cls[i].name;
            var lClassName = className.charAt(0).toLowerCase() + className.slice(1);
            var members = cls[i].members;

            s += "    get" + className + "List(query?:string):Observable<" + className + "[]>{\n";
            s += "        const url = this.API_URL + '" + lClassName + "' + query ? query:'';\n";
            s += "        let headers = new HttpHeaders().set('Content-Type', 'application/json');\n";
            s += "        return this.http.get(url, {'headers': headers}).map((res:any) => {\n";
            s += "            let a:"+ className +"[] = [];\n";
            s += "            if( res.data && res.data.length > 0){\n";
            s += "                for(var i=0; i<res.data.length; i++){\n";
            s += "                    a.push(new " + className + "(res.data[i]));\n";
            s += "                }\n";
            s += "            }\n";
            s += "            return a;\n";
            s += "        })\n";
            s += "        .catch((err) => {\n";
            s += "            return Observable.throw(err.message || err);\n";
            s += "        });\n";
            s += "    }\n\n";

            s += "    get" + className + "(id:number):Observable<" + className + ">{\n";
            s += "        const url = this.API_URL + '" + lClassName + "/id';\n";
            s += "        let headers = new HttpHeaders().set('Content-Type', 'application/json');\n";
            s += "        return this.http.get(url, {'headers': headers}).map((res:any) => {\n";
            s += "            return new "+ className +"(res.data);\n";
            s += "        })\n";
            s += "        .catch((err) => {\n";
            s += "            return Observable.throw(err.message || err);\n";
            s += "        });\n";
            s += "    }\n\n";


            s += "    save" + className + "(d:" + className + "):Observable<" + className + ">{\n";
            s += "        const url = this.API_URL + '" + lClassName + "';\n";
            s += "        let headers = new HttpHeaders().set('Content-Type', 'application/json');\n";
            s += "        let data = {\n";

            for(var j=0; j<members.length; j++){
                s += "          '" + members[j].name + "': d." + members[j].name + ",\n";
            }

            s += "        }\n";
            s += "        return this.http.post(url, data, {'headers': headers}).map((res:any) => {\n";
            s += "            return new "+ className +"(res.data);\n";
            s += "        })\n";
            s += "        .catch((err) => {\n";
            s += "            return Observable.throw(err.message || err);\n";
            s += "        });\n";
            s += "    }\n\n";
        }
        s += "}\n\n";

        return s;
    }

    createModule(app, classes){
        var s = "import { NgModule } from '@angular/core';\n"+
            "import { CommonModule } from '@angular/common';\n"+
            "import { FormsModule } from '@angular/forms';\n"+
            "import { RouterModule } from '@angular/router';\n"+
            "import { HttpClientModule } from '@angular/common/http';\n";

        var appName = app.charAt(0).toUpperCase() + app.slice(1);
        var moduleName = appName + 'Module';

        var cNames = [];
        var cList = [];

        for(var j=0; j<classes.length; j++){
            var components = classes[j].components;
            for(var i=0; i<components.length; i++){
                var clName = components[i].className;
                var name = components[i].name;
                s += "import { " + clName + " } from './" + name + "/" + name + ".component';\n";
                cList.push(clName);
            }
        }

        s += "@NgModule({\n"+
        "   imports:[\n"+
        "      CommonModule,\n"+
        "      FormsModule,\n"+
        "      RouterModule,\n"+
        "      HttpClientModule\n"+
        "   ],\n"+
        "   exports:[" +  cList.join(',') +"],\n"+
        "   declarations:[" + cList.join(',') +"]\n"+
        "})\n"+
        "export class " + moduleName + " { }\n";
        return s;
    }

    // django
    createView(app, classes){
        let s = "import json\n"+
            "from django.http import JsonResponse\n"+
            "from django.core import serializers\n"+
            "from django.views.generic import View\n"+
            "from django.views.decorator.csrf import csrf_exempt\n";
        
        let cNames = [];
        for(let c of classes){
            cNames.push(c.name);
        }
        s += "from " + app + ".models import " + cNames.join(', ') + "\n\n";

        for(let c of classes){

            s += "@method_decorator(csrf_exempt, name='dispatch')\n"+
            "class " + c.name + "View(View):\n"+
            "   def get(self, req, *args, **kwargs):\n"+
            "       try:\n"+
            "           items = " + c.name + ".objects.all()\n"+
            "       except Exception as e:\n"+
            "           return JsonResponse({data:[]})\n"+
            "       d = serializers.serialize(\"json\", items)\n"+
            "       return JsonResponse({data:d})\n\n"+
            "   def post(self, req, *args, **kwargs):\n"+
            "       params = json.loads(req.body)\n"+
            "       item = " + c.name + "()\n";
            for(let m of c.members){
                s += "       item." + m.name + " = params.get('" + m.name + "')\n";
            }

            s += "       item.save()\n"+
            "       d = serializers.serialize(\"json\")\n"+
            "       return JsonResponse({data:d})\n\n";
        }

        return s;
    }

    createUrls(app, classes){
        let s = "from django.conf.urls import url\n"+
        "from " + app + ".views import ";

        let vs = [];
        for(let c of classes){
            vs.push(c.name + 'View');
        }
        s += vs.join(', ') + "\n\n"+
        "urlpatterns = [\n";

        for(let c of classes){
            s += "   url(r'^api/" + c.name.toLowerCase() + "', " + c.name + "View.as_view()),\n"
        }
        s += "]\n";

        return s;
    }
}
