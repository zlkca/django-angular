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
    

    function createModels(cls){
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
            s += '}\n\n';
        }

        return s;
    }

    function createServices(app, cls){
        var s = "import { Injectable } from '@angular/core';\n" +
            "import { HttpClient, HttpHeaders } from '@angular/common/http';\n" +
            "import { Observable } from 'rxjs/Observable';\n" +
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

    return {
        getModels: function(req, res){
            var body = req.body;
            var s = createModels(body.classes);
            // var file = fs.createWriteStream("mytest.py");
            // res.pip(file);
            return res.json({ success: true, data: s});
        },
        
        getServices: function(req, rsp){
            var body = req.body;
            var s = createServices(body.app, body.classes);
            return rsp.json({ success: true, data: s});
        },
        
        //--------------------------------------------------------------------------------------
        // find
        // Arguments:
        //      query --- query object, eg
        //      callback --- function(err, docs)
        //--------------------------------------------------------------------------------------
        find: function(query, callback){
            _collection.find(query, callback);
        },
        
        //--------------------------------------------------------------------------------------
        // findOne
        // Arguments:
        //      query --- query object, eg. 
        //      callback --- function(err, doc)
        //--------------------------------------------------------------------------------------
        findOne : function(query, callback){
            _collection.findOne(query, callback);
        }
    }
}
