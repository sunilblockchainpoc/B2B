import './client_dashboard.html'
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

var clientRFQs = new ReactiveArray(); 

Template["components_client_dashboard"].onCreated(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: false});
});

Template['components_client_dashboard'].helpers({
	
		"getClientRFQList": function()
		{
			return clientRFQs.list();
		}
	});

Template['components_client_dashboard'].onRendered(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: true});
	clientRFQs.clear();
	Meteor.call('viewClientRFQList',function(error,result){
	if (result) {
		if(result.length >0){
			for(var i=0;i<result.length;i++)
			{
				clientRFQs.push((result[i]));
			}
		}
	}
	return clientRFQs.list();
	});
}),


Template['components_client_dashboard'].events({

	  "click .reqfilelink": function(event, template){
		var data = event.currentTarget.id;
		var text = event.currentTarget.text.trim();
		getData(data,text);
	},
	
	"click .resfilelink": function(event, template){
		var data = event.currentTarget.id;
		var text = event.currentTarget.text.trim();
		getData(data,text);
	},
	
});

function getData(data,text) {
	HTTP.get('/Filedownloads'+data,function (err,result){
		if(result){
//			console.log(result);
			var uri = "data:"+ result.headers['content-type'] +";base64," + result.content;
			var downloadLink = document.createElement("a");
			downloadLink.href = uri;
			downloadLink.download = text;
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink)
		}
	});

}