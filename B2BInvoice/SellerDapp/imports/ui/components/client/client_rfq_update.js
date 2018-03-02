import './client_rfq_update.html'
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';


var rfqId,rfqStatus;
rfqStatus = 2;
var reqServices = new ReactiveArray();
var Enum = require("enum");
var rfqStatusEnum = new Enum({'Requested': 0, 'Responded': 1, 'Accepted': 2, 'Declined':3});

Template['components_client_rfq_update'].onRendered(function(){
	rfqId = new ReactiveVar(FlowRouter.getParam("rfq"));
	var template = this;
	TemplateVar.set(template,'rfqData', {});
	var params = {rfqid:parseInt(rfqId.get())};
	Meteor.call('getClientRFQ',params,function(error,result){
	if (result) {
		TemplateVar.set(template,'rfqData', {rfqName: result.name, rfqDescription:result.description
											, rfqStatus: result.status,rfqValue: parseInt(result.rfqValue),
											requestBy:result.requestBy,requestDt:getDate(parseInt(result.requestDt)),responseBy:result.responseBy,
											responseDt:getDate(parseInt(result.responseDt)),reqServicesDetails:JSON.stringify(reqServices)});

		if(rfqStatusEnum.get(result.status.trim()).value==3){
			template.find("#rfqStatus3").checked = true;
			template.find("#rfqStatus2").checked = false;
		}
		else {
			template.find("#rfqStatus2").checked = true;
			template.find("#rfqStatus3").checked = false;
		}
		
		if(rfqStatusEnum.get(result.status.trim()).value >1){
			TemplateVar.set(template,'readonly',{show:false});
			template.find("#rfqStatus2").disabled = true;
			template.find("#rfqStatus3").disabled = true;
		}
		else{
			TemplateVar.set(template,'readonly',{show:true});
		}	

		if(!result.resServices){
			if(result.reqServices.length > 0){
				for(var i=0;i<result.reqServices.length; i++)
				{
					if(template.find(result.reqServices[i].id)){
						template.find(result.reqServices[i].id).checked = true;
						template.find(result.reqServices[i].id).disabled = true;
					}
					if(template.find(result.reqServices[i].textid)){
						template.find(result.reqServices[i].textid).value = parseInt(result.reqServices[i].NoV);
						template.find(result.reqServices[i].textid).disabled = true;
					}
				}
			}
		}
		else{
			for(var i=0;i<result.resServices.length; i++)
			{
				if(template.find(result.resServices[i].id)){
					template.find(result.resServices[i].id).checked = true;
					template.find(result.resServices[i].id).disabled = true;
				}
				if(template.find(result.resServices[i].textid)){
					template.find(result.resServices[i].textid).value = parseInt(result.reqServices[i].NoV);
					template.find(result.resServices[i].textid).disabled = true;
				}
				if(result.resServices[i].Fees.length >0){
					var Fees = result.resServices[i].Fees;
					for(var feeCount = 0;feeCount < Fees.length;feeCount++){
						if(template.find(Fees[feeCount].feeId)){
							template.find(Fees[feeCount].feeId).value = Fees[feeCount].feeAmount;
						}
					}
				}
			}
		}											
	}
	});
});


Template['components_client_rfq_update'].events({

	"change #rfqStatus2": function(event, template){ 
		rfqStatus = event.currentTarget.value;
	},

	"change #rfqStatus3": function(event, template){ 
		rfqStatus = event.currentTarget.value;
	},

	"click #updateRFQStatus": function(event, template){ 
		template.find("#updateRFQStatus").disabled=true;
		
	var username = Session.get("CICUserName");
	var address = Session.get("CICUserAddress");
	var data = {Id:parseInt(rfqId.get()),Status:rfqStatus,nodeAddress:address};
	TemplateVar.set(template,'state', {isMining: true});
	 Meteor.call('updateClientRFQStatus',data,function(error,result){
	if (!error) 
	{
	
		if(typeof result !== 'undefined'){
			template.find("#updateRFQStatus").disabled=false;
			
			TemplateVar.set(template, 'state', {isMined: true, rfqName: result.args.rfqName});
		}
	}
		template.find("#updateRFQStatus").disabled=false;
	}); 
	
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

