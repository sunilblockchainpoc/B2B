import './client_wo_requests.html';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

var getClientWOs = new ReactiveArray(); 

Template["components_client_wo_dashboard"].onCreated(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: false});
});

Template['components_client_wo_dashboard'].helpers({
		"getClientWO": function()
		{
			return getClientWOs.list();
		}
	});

Template['components_client_wo_dashboard'].onRendered(function(){
	var template = this;
	getClientWOs.clear();
	TemplateVar.set(template,'state', {list: true});
	Meteor.call('getAllClientWO',function(error,result){
	if (result) {
		if(result.length >0){
			for(var i=0;i<result.length;i++)
				{
					//console.log(result[i]);
					getClientWOs.push((result[i]));
				}
		}
	}
	if (error) {
		console.log("Error occured while fetching Client Work Order results");
	}
	return getClientWOs.list();
	});
}),


Template['components_client_wo_dashboard'].events({
	
		  "click .confilelink": function(event, template){
			var data = event.currentTarget.id;
			var text = event.currentTarget.text.trim();
			console.log("###"+data);
			console.log("###"+text);
			
			getData(data,text);
		},
		
		"click .invfilelink": function(event, template){
			var data = event.currentTarget.id;
			var text = event.currentTarget.text.trim();
			getData(data,text);
		},

		"click .wolink": function(event, template){
			var woNumber = event.currentTarget.id;
			Template.parentData().__helpers.get('setWOId')(woNumber);
		}
		
	});

function getData(data,text) {
        HTTP.get('/Filedownloads'+data,function (err,result) {
            if(result){
                console.log(result);
                var uri = "data:"+ result.headers['content-type'] +";base64," + result.content;
                var downloadLink = document.createElement("a");
                downloadLink.href = uri;
                downloadLink.download = text;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink)
            }
            if (err)
                console.log("Failed in downloading the file");
        });
}