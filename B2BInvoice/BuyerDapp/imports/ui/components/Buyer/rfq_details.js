import './rfq_details.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';


var rfqId,rfqStatus;
rfqStatus = 2;
var reqServices = new ReactiveArray();
var Enum = require("enum");
var rfqStatusEnum = new Enum({'Requested': 0, 'Responded': 1, 'Accepted': 2, 'Declined':3});


// This method is rendered on click of RFQ ID
Template['components_rfq_details'].onRendered(function(){
    
    rfqId = new ReactiveVar(FlowRouter.getParam("rfq"));
	var template = this;
	TemplateVar.set(template,'rfqData', {});
    var params = {rfqID:parseInt(rfqId.get())};

    Meteor.call('getRFQDetailByrfqID',params,function(error,result){
        
        if (result) {
            TemplateVar.set(template,'rfqData', 
                                {rfqID: result.rfqID,
                                 requestDate : result.requestDate,
                                 responseBy : result.responseBy,
                                 responseDt : result.responseDt,
                                 rfqValue : result.rfqValue,
                                 rfqStatus: result.status
                                });

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

                var textId,costID; 
                if(result.resproductDetailsJSON && result.resproductDetailsJSON.length > 0){
                    for(var i=0;i<result.resproductDetailsJSON.length; i++)
                    {
                        textId = result.resproductDetailsJSON[i].id +"_value"; 
                        costID = result.resproductDetailsJSON[i].id + "_cost";
                        //textValue = parseInt(result.productDetailsJSON[i].textValue);

                        if(template.find(result.resproductDetailsJSON[i].id)){
                            template.find(result.resproductDetailsJSON[i].id).checked = true;
                            template.find(result.resproductDetailsJSON[i].id).disabled = true;
                        }
                        if(template.find(textId)){
                            template.find(textId).value = parseInt(result.resproductDetailsJSON[i].textvalue);
                            template.find(textId).disabled = true;
                        }
                        if(template.find(costID)){
                            template.find(costID).value = parseFloat(result.resproductDetailsJSON[i].cost).toFixed(2);
                            template.find(costID).disabled = true;
                        }
                    }
                }
                else if(result.reqproductDetailsJSON && result.reqproductDetailsJSON.length > 0){
                    for(var i=0;i<result.reqproductDetailsJSON.length; i++)
                    {
                        textId = result.reqproductDetailsJSON[i].id +"_value"; 


                        if(template.find(result.reqproductDetailsJSON[i].id)){
                            template.find(result.reqproductDetailsJSON[i].id).checked = true;
                            template.find(result.reqproductDetailsJSON[i].id).disabled = true;
                        }
                        if(template.find(textId)){
                            template.find(textId).value = parseInt(result.reqproductDetailsJSON[i].textvalue);
                            template.find(textId).disabled = true;
                        }
                    }
                } 

        }
    });
});

Template['components_rfq_details'].events({

	"change #rfqStatus2": function(event, template){ 
		rfqStatus = event.currentTarget.value;
	},

	"change #rfqStatus3": function(event, template){ 
		rfqStatus = event.currentTarget.value;
	},

	"click #updateRFQStatus": function(event, template){ 
		//template.find("#updateRFQStatus").disabled=true;
    	var username = Session.get("BuyerUserName");
	    var address = Session.get("BuyerUserAddress");
        var data = {rfqID:parseInt(rfqId.get()),status:rfqStatus,nodeAddress:address};
	    TemplateVar.set(template,'state', {isMining: true});
	    Meteor.call('acceptOrDeclineQuote',data,function(error,result){
    	if (!error) 
	    {
	
		    if(typeof result !== 'undefined'){
                template.find("#updateRFQStatus").disabled=false;
		    	TemplateVar.set(template, 'state', {isMined: result, statusUpdated: result});
	    	}
    	}
		    template.find("#updateRFQStatus").disabled=false;
	    }); 
    },
});


