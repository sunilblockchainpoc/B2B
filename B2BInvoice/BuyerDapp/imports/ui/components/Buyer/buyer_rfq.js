import './buyer_rfq.html'
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

const XLSX = require("xlsx");
var sheetInfo = new ReactiveArray(); 

Template['components_buyer_rfq'].onRendered(function(){
	Session.setDefault('username','ramamosr');
    TemplateVar.set('state', {isInactive: true});
});

Template['components_buyer_rfq'].helpers({
	
		"getSheetInfo": function()
		{
			return sheetInfo.list();
		}
	});


Template['components_buyer_rfq'].events({
	
	"click input[type=checkbox]":function (event,template){
		var id = event.currentTarget.id;
		var textId = "#NoV" + id;
		if(event.currentTarget['checked']){
				template.find(textId).disabled = false;
			}
			else{
				template.find(textId).value="";
				template.find(textId).disabled = true;
			}
	},

	"click #submitRequestRFQ": function(event, template){ 

		template.find("#submitRequestRFQ").disabled=true;
		var username = Session.get("BuyerUserName");
		var address = Session.get("BuyerUserAddress");
		var selectedServices = template.findAll( "input[type=checkbox]:checked");
		var textId,textValue;
		var jsonObj = [];
		for(var i=0; i<selectedServices.length;i++){
			textId = "#NoV" + selectedServices[i].id;
			textValue = template.find(textId).value;
			var jsonData={};
			jsonData["id"] = "#" + selectedServices[i].id;
			jsonData["textid"] = textId;
			jsonData["NoV"] = textValue;
			jsonObj.push(jsonData);
		}

		TemplateVar.set(template,'state', {isMining: true});
		var data = {username: username,ServiceData:jsonObj, nodeAddress:address};
						
			Meteor.call('requestRFQ',data,function(error,result){
				if (!error) 
				{
					if(typeof result !== 'undefined'){
						template.find("#submitRequestRFQ").disabled=false;
						TemplateVar.set(template, 'state', {isMined: true, rfqName: result});
					}
				}
				template.find("#submitRequestRFQ").disabled=false;
			
			});
		
	},
	
});
