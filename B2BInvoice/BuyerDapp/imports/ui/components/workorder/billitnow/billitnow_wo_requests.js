import './billitnow_wo_requests.html';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

var getInvoiceWOs = new ReactiveArray(); 

Template["components_billitnow_wo_dashboard"].onCreated(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: false});
});

Template['components_billitnow_wo_dashboard'].helpers({
		"getInvoiceWO": function()
		{
			return getInvoiceWOs.list();
		}
	});

Template['components_billitnow_wo_dashboard'].onRendered(function(){
	var template = this;
	getInvoiceWOs.clear();

	var username = Session.get("BillUserName");
	var address = Session.get("BillUserAddress");
	TemplateVar.set(template,'state', {list: true});
	
	Meteor.call('getMunichReInvoice',function(error,result){
	if (result) {
		if(result.length >0){
			for(var i=0;i<result.length;i++)
				{
					//console.log(result[i]);
					getInvoiceWOs.push((result[i]));
				}
		}
	}
	if (error) {
		console.log("Error occured while fetching Invoice info from MunichRE");
	}
	return getInvoiceWOs.list();
	});
}),


Template['components_billitnow_wo_dashboard'].events({
	
		  "click .billfilelink": function(event, template){
			var data = event.currentTarget.id;
			var text = event.currentTarget.text.trim();
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
               // console.log(result);
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