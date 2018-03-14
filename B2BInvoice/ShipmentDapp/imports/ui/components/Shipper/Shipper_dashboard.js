import './Shipper_dashboard.html'
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

var shipments = new ReactiveArray(); 

Template["components_Shipper_dashboard"].onCreated(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: false});
});

Template['components_Shipper_dashboard'].helpers({
	
		"getShipments": function()
		{
			return shipments.list();
		}
	});

Template['components_Shipper_dashboard'].onRendered(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: true});
	shipments.clear();
	Meteor.call('getShipmentList',function(error,result){
	if (result) {
		if(result.length >0){
			for(var i=0;i<result.length;i++)
			{
				result[i].shipmentDate = getDate(result[i].shipmentDate);
				shipments.push((result[i]));
			}
		}
	}
	return shipments.list();
	});
})

Template['components_Shipper_dashboard'].events({

	"click .shipFilelink": function(event, template){
		var data = event.currentTarget.id;
		var text = event.currentTarget.text.trim();
		getData(data,text);
	},
	
		
});

function getDate(inputDate){
	if(inputDate > 0)
	{
		return (new Date(inputDate).toDateString())
	}
	else
		return "";
}


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


