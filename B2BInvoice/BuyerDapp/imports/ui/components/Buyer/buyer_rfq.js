import './buyer_rfq.html'
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

var sheetInfo = new ReactiveArray(); 

Template['components_buyer_rfq'].onRendered(function(){
	//Session.setDefault('username',BuyerUserName);
    TemplateVar.set('state', {isInactive: true});
});

Template['components_buyer_rfq'].events({
	
	"click input[type=checkbox]":function (event,template){
		var id = event.currentTarget.id;
		var textId = "#"+id + "_value";

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
		var productDetails = template.findAll( "input[type=checkbox]:checked");
		var textId,textValue;
		var jsonObj = [];

		//console.log(productDetails);

		for(var i=0; i<productDetails.length;i++){

			// Get each of the product name
			var textId = "#"+ productDetails[i].id + "_value";
			var textValue = template.find(textId).value;

			var jsonData={};

			jsonData["id"] =  "#" + productDetails[i].id;
			jsonData["textid"] = textId;
			jsonData["textvalue"] = textValue;
			jsonObj.push(jsonData);
		}

		TemplateVar.set(template,'state', {isMining: true});
		var data = {username: username,ProductData:jsonObj, nodeAddress:address};
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
