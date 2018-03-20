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
    public apps:any[] = [
        {name:'commerce', source:'', classes:[], 
            model:{file:'',content:'', expanded:false}, 
            service:{file:'',content:'', expanded:false}
        }];

    constructor(private mainServ:MainService) { }

    ngOnInit() {

    }

    toggleTextarea(item){
        item.expanded = !item.expanded;
    }
    convert(){
        for(let app of this.apps){
            app.model.file = app.name + '/' + app.name + '.ts';
            app.service.file = app.name + '/' + app.name + '.service.ts';

            var lines = app.source.match(/[^\r\n]+/g);
            app.classes = this.getClass(app.name, lines);
            app.model.content = this.createModels(app.classes);
            app.service.content = this.createServices('commerce', app.classes);    
        }
                // this.mainServ.generateModels(cls).subscribe(
        //     (ps:any) => {
        //         console.log(ps.data);
        //         self.model = ps.data;//self.toProductGrid(data);
        //     },
        //     (err:any) => {
        //         self.model = 'Error';
        //     }
        // );

        // this.mainServ.generateServices('commerce', cls).subscribe(
        //     (ps:any) => {
        //         console.log(ps.data);
        //         self.service = ps.data;//self.toProductGrid(data);
        //     },
        //     (err:any) => {
        //         self.service = 'Error';
        //     }
        // );
        //this.model = this.createModels(cls);
        //this.service = this.createService('commerce', cls);
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
                    var cs = this.getComponents(app, className);
                    cls.push({'name':className, 'members':ms, 'components':cs});
                //}
            }
        }
        return cls;
    }

    getComponents(app, uClassName){
        let lClassName = uClassName.toLowerCase();
        let components = [];
        let cats = ['list', 'detail'];
        for(let cat of cats){
            let componentName = lClassName + '-' + cat;
            let fileName = componentName + '.component';
            let exts = ['.html', '.scss', '.spec.ts', '.ts'];
            let files = [];
            for(let ext of exts){
                let content ='';
                if(cat=='list'){ 
                    if(ext == '.ts'){
                        content = this.createListComponents(app, uClassName);
                    }else if(ext == '.html'){
                        content = this.createListHtml(uClassName);
                    }
                }
                if(cat=='detail'){
                    if(ext == '.ts'){
                        content = this.createDetailComponents(app, uClassName);
                    }
                }
                files.push({'name':fileName + ext, 'content':content, 'expanded':false});
            }
            components.push({'name':componentName, 'files':files })
        }
        return components;
    }
    
    // createComponents(cls){
    //     for(var i=0; i<cls.length; i++){
    //         getComponents
    //     }
    // }

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
            s += '        if(o){\n';
            for(var j=0; j<members.length; j++){
                s += '            this.' + members[j].name + ' = o.'+ members[j].name +';\n';
            }
            s += '        }\n';
            s += '    }\n';
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

    createListComponents(app, uClassName){
        var s = "import { Component, OnInit } from '@angular/core';\n";
        var uServiceName = app.charAt(0).toUpperCase() + app.slice(1) + "Service";
        var lClassName = uClassName.toLowerCase();
        var serviceVar = lClassName + "Serv";
        var getFunc = "get" + uClassName;

        s += "import { " + uServiceName + " } from '../" + app + ".service';\n";
        s += "import { " + uClassName + " } from '../" + app + "';\n\n";

        s += "@Component({\n"+
        "    providers:[" + uServiceName + "]\n"+
        "    selector: 'app-" + lClassName + "-list',\n"+
        "    templateUrl: './" + lClassName + "-list.component.html'],\n"+
        "    styleUrls: './" + lClassName + "-list.component.scss']\n"+
        "})\n"+
        "export class " + uClassName + "ListComponent implements OnInit {\n"+
        "    " + lClassName + "List:" + uClassName + "[];\n\n"+
        "    fields:string[] = [];\n"+
        "    constructor(private " + serviceVar + ":" + uServiceName + "){}\n\n"+
        "    ngOnInit() {\n"+
        "        let " + lClassName + " = new "+ uClassName +"()\n";
        "        this.fields = Object.getOwnPropertyNames("+ lClassName + ");"
        "        this." + serviceVar + "." + getFunc + "().subscribe(\n"+
        "            (r:"+ uClassName + "[]) => {\n"+
        "                self." + lClassName + "List = r;\n"+
        "            },\n"+
        "            (err:any) => {\n"+
        "                self." + lClassName + "List = [];\n"+
        "            });\n"+
        "        });\n"+
        "    }\n\n"+
        "    toDetail(r){}\n\n"+
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
        "    providers:[" + uServiceName + "]\n"+
        "    selector: 'app-" + lClassName + "-detail',\n"+
        "    templateUrl: './" + lClassName + "-detail.component.html'],\n"+
        "    styleUrls: './" + lClassName + "-detail.component.scss']\n"+
        "})\n"+
        "export class " + uClassName + "DetailComponent implements OnInit {\n"+
        "    " + lClassName + ":" + uClassName + ";\n\n"+
        "    constructor(private " + serviceVar + ":" + uServiceName + ", private route: ActivatedRoute){}\n\n"+
        "    ngOnInit() {\n"+
        "        let self = this;\n"+
        "        self.route.params.subscribe((params:any)=>{"+
        "            this." + serviceVar + "." + getFunc + "(params.id).subscribe(\n"+
        "                (r:"+ uClassName + ") => {\n"+
        "                    self." + lClassName + " = r;\n"+
        "                },\n"+
        "                (err:any) => {\n"+
        "                    self." + lClassName + " = null;\n"+
        "                });\n"+
        "            });\n"+
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
            "import { environment } from '../../../envionments/environment';\n";

        var serviceName = app.charAt(0).toUpperCase() + app.slice(1);
        var cNames = [];    
        for(var i=0; i<cls.length; i++){
            cNames.push(cls[i].name);
        }

        s += "import { " + cNames.join(',') + " } from " + app + ".model;\n\n";
        s += "@Injectable()\n"
        s += "export class " + serviceName + "Service {\n";
        s += "    private API_URL = environment.API_URL;\n\n";
        s += "    constructor(private http:HttpClient){ }\n\n";

        for(var i=0; i<cls.length; i++){
            var className = cls[i].name;
            var lClassName = className.charAt(0).toLowerCase() + className.slice(1);
            var members = cls[i].members;

            s += "    get" + className + "(query?:any):Obervable<" + className + "[]>{\n";
            s += "        const url = this.API_URL + '" + lClassName + "';\n";
            s += "        let headers = new HttpHeaders().set('Content-Type', 'application/json');\n";
            s += "        return this.http.get(url, {'headers': headers}).map((res) => {\n";
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

            s += "    get" + className + "(id:number):Obervable<" + className + ">{\n";
            s += "        const url = this.API_URL + '" + lClassName + "/id';\n";
            s += "        let headers = new HttpHeaders().set('Content-Type', 'application/json');\n";
            s += "        return this.http.get(url, {'headers': headers}).map((res) => {\n";
            s += "            return new "+ className +"(res.data);\n";
            s += "        })\n";
            s += "        .catch((err) => {\n";
            s += "            return Observable.throw(err.message || err);\n";
            s += "        });\n";
            s += "    }\n\n";


            s += "    save" + className + "(d:" + className + "):Obervable<" + className + ">{\n";
            s += "        const url = this.API_URL + '" + lClassName + ";\n";
            s += "        let headers = new HttpHeaders().set('Content-Type', 'application/json');\n";
            s += "        let data = {\n";

            for(var j=0; j<members.length; j++){
                s += "          '" + members[j].name + "': d." + members[j].name + ",\n";
            }

            s += "        return this.http.post(url, data, {'headers': headers}).map((res) => {\n";
            s += "            return new "+ className +"(res.data);\n";
            s += "        })\n";
            s += "        .catch((err) => {\n";
            s += "            return Observable.throw(err.message || err);\n";
            s += "        });\n";
            s += "    }\n\n";
        }

        return s;
    }
}
