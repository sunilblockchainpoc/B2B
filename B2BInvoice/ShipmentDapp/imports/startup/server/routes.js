import { Picker } from 'meteor/meteorhacks:picker';
var bodyparser = require ('body-parser');
var path=require('path');
var fs = require('fs');
var Future = require('fibers/future');
var mime = require("mime"); 
var request  = require("request");

Picker.middleware(bodyparser.json());
Picker.middleware( bodyparser.urlencoded( { extended: false } ) );

Picker.route( '/Filedownloads', function( params, req, resp, next ) {
    
      var data = {
        params: params,
        query: params.query,
        body: req.body
      };
        var downloadURL = Meteor.settings.server.downloadURL;
        var finalparams = {"name":data.query.name,"filehash": data.query.filehash};
        var url = path.join(Meteor.settings.server.tempPath,'downloads',data.query.name);
        var future = new Future();
        request({url:downloadURL,qs:finalparams},function(err,response,body){
        if(!err & response.statusCode==200)
          {
            fs.writeFileSync(url,response.body,{encoding:'base64'});
            var file = fs.createReadStream(url,{encoding:'base64'});
            var mimetype = mime.lookup(url); 
            resp.setHeader('Content-disposition', 'attachment; filename=' + data.query.name);
            resp.setHeader('Content-type', mimetype);
            resp.statusCode = 200;
            future.return(file.pipe(resp));
          }
        });return future.wait();
        
       
        
    });