import './rfq_details.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';


var rfqId,rfqStatus;
rfqStatus = 2;
var reqServices = new ReactiveArray();
var Enum = require("enum");
var rfqStatusEnum = new Enum({'Requested': 0, 'Responded': 1, 'Accepted': 2, 'Declined':3});

// Helper method to retrieve RFQ Information for UI




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
                                 rfqValue : result.rfqValue
                                });
        }
    });
});

