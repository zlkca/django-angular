//----------------------------------------------------
// Author:  Martin.Zhang
// Date:    December 29 2017
// All right reserved.
//----------------------------------------------------
'use strict';

var fs = require('fs');
// var DB = require('../db.js');
// var Logger = require('../logger.js');
// var Utils = require('./utils');
// var ut = Utils();

module.exports = function(){    
//     var _name = 'cities';
//     var _db = new DB();
//     var _collection = _db.getCollection(_name);
    

    // convert(){
    //     for(let app of this.apps){
    //         app.model.file = app.name + '/' + app.name + '.ts';
    //         app.service.file = app.name + '/' + app.name + '.service.ts';

    //         var lines = app.source.match(/[^\r\n]+/g);
    //         app.classes = this.getClass(app.name, lines);
    //         app.model.content = this.createModels(app.classes);
    //         app.service.content = this.createServices('commerce', app.classes);    
    //     }
    // }

    

    var self = {
        getModels: function(req, res){
            var body = req.body;
            //var s = createModels(body.classes);
            
            var apps = [
                {name:body.app, source:'', classes:body.classes, 
                    model:{file:'',content:'', expanded:false}, 
                    service:{file:'',content:'', expanded:false}
                }];

            for(let app of apps){
                app.model.file = app.name + '/' + app.name + '.ts';
                app.service.file = app.name + '/' + app.name + '.service.ts';

                //var lines = app.source.match(/[^\r\n]+/g);
                //app.classes = body.classes;//this.getClass(app.name, lines);
                app.model.content = self.createModels(app.classes);
                app.service.content = self.createServices('commerce', app.classes);    
            }

            let app = apps[0];
            let folder = './' + app.name;

            fs.stat(folder, (err, status)=>{
                    //console.log(err);
                    //console.log(status);

                    fs.mkdir(folder, (err, status)=>{
                        fs.writeFile(app.model.file, app.model.content, (err, status)=>{});
                        fs.writeFile(app.service.file, app.service.content, (err, status)=>{});

                        for(let cl of app.classes){
                            for(let c of cl.components){
                                let d = folder + '/' + c.name.toLowerCase();
                                fs.mkdir(d, (err, status)=>{
                                    for(let f of c.files){
                                        let fname = d + '/' + f.name;
                                        fs.writeFile(fname, f.content, (err, status)=>{

                                        });
                                    }
                                });
                            }
                        }
                    });
            });

            // var file = fs.createWriteStream("mytest.py");
            // res.pip(file);
            return res.json({ success: true, data: ''});
        },
        
        getServices: function(req, rsp){
            var body = req.body;
            var s = createServices(body.app, body.classes);
            return rsp.json({ success: true, data: s});
        },
        
        findModelClassHead: function(s){
            // return array of the match string
            var m = s.match(/class[\s]+[$a-zA-Z_][a-zA-Z0-9_$]*\([Model|models.Model]+\)/g);
            if(m){
                return m;
            }else{
                return null;
            }
        },

        getType:function(line){
            if(line.indexOf('CharField')!=-1||line.indexOf('DateTimeField')!=-1){
                return 'string';
            }else if(line.indexOf('ForeignKey')){
                return 'string';
            }else if(line.indexOf('DecimalField')!=-1||line.indexOf('IntegerField')!=-1){
                return 'number';
            }else{
                return 'string';
            }
        },
        
        getMembers:function(lines, i){
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
        },

        getClass:function(app, lines){
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
        },

        getContent:function(app, uClassName, members, cat, ext){
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
                }else if(ext = '.html'){
                    return this.createFormHtml(uClassName, members);
                }else{
                    return '';
                }
            }else{
                return '';
            }
        },
        
        getComponents:function(app, uClassName, members){
            let lClassName = uClassName.toLowerCase();
            let components = [];
            let cats = ['list', 'form'];
            for(let cat of cats){
                let componentName = lClassName + '-' + cat;
                let fileName = componentName + '.component';
                let exts = ['.html', '.scss', '.spec.ts', '.ts'];
                let files = [];
                for(let ext of exts){
                    let content = this.getContent(app, uClassName, members, cat, ext);
                    files.push({'name':fileName + ext, 'content':content, 'expanded':false});
                }
                components.push({'name':componentName, 'files':files })
            }
            return components;
        },

        createModels:function(cls){
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
        },

        createListHtml:function(className){
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
        },

        createFormHtml:function(className, members){
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
        },

        createListComponents:function(app, uClassName){
            var s = "import { Component, OnInit } from '@angular/core';\n";
            var uServiceName = app.charAt(0).toUpperCase() + app.slice(1) + "Service";
            var lClassName = uClassName.toLowerCase();
            var serviceVar = lClassName + "Serv";
            var getListFunc = "get" + uClassName + "List";

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
            "        let " + lClassName + " = new "+ uClassName +"()\n"+
            "        this.fields = Object.getOwnPropertyNames("+ lClassName + ");\n"+
            "        this." + serviceVar + "." + getListFunc + "().subscribe(\n"+
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
        },

        createFormComponents:function(app, uClassName){
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
            "    providers:[" + uServiceName + "]\n"+
            "    selector: 'app-" + lClassName + "-form',\n"+
            "    templateUrl: './" + lClassName + "-form.component.html'],\n"+
            "    styleUrls: './" + lClassName + "-form.component.scss']\n"+
            "})\n"+
            "export class " + uClassName + "FormComponent implements OnInit {\n"+
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
            "            });\n"+
            "        });\n"+
            "    }\n\n"+
            "    save() {\n"+
            "        let self = this;\n"+
            "        self." + serviceVar + "." + saveFunc + "(self."+ lClassName +").subscribe(\n"+
            "            (r:"+ uClassName + ") => {\n"+
            "                self." + lClassName + " = r;\n"+
            "            },\n"+
            "            (err:any) => {\n"+
            "                self." + lClassName + " = null;\n"+
            "            });\n"+
            "        });\n"+
            "    }\n"+
            "}\n\n";

            return s;
        },

        createDetailComponents:function(app, uClassName){
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
            "        self.route.params.subscribe((params:any)=>{\n"+
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
        },


        createServices:function(app, cls){
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

                s += "    get" + className + "List(query?:str):Obervable<" + className + "[]>{\n";
                s += "        const url = this.API_URL + '" + lClassName + "' + query;\n";
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

                s += "        }\n";
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

    return self;
}
