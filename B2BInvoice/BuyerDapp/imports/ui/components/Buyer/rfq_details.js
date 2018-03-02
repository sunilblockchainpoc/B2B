import './rfq_details.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';


var rfqId,rfqStatus;
rfqStatus = 2;
var reqServices = new ReactiveArray();
var Enum = require("enum");
var rfqStatusEnum = new Enum({'Requested': 0, 'Responded': 1, 'Accepted': 2, 'Declined':3});

Template['components_rfq_details'].onRendered(function(){
	rfqId = new ReactiveVar(FlowRouter.getParam("rfq"));
	var template = this;
	TemplateVar.set(template,'rfqData', {});
    var params = {rfqid:parseInt(rfqId.get())};
    
    Meteor.call('getRFQDetail',params,function(error,result){
        if (!error)
        console.log(result);
    })
});