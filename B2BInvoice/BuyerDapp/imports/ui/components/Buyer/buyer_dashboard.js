import './buyer_dashboard.html'
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

var RFQs = new ReactiveArray(); 

Template["components_buyer_dashboard"].onCreated(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: false});
});

Template['components_buyer_dashboard'].helpers({
	
		"getRFQList": function()
		{
			return RFQs.list();
		}
	});

Template['components_buyer_dashboard'].onRendered(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: true});
	RFQs.clear();
	Meteor.call('getBuyerDashBoardDetails',function(error,result){
	if (result) {
		if(result.length >0){
			for(var i=0;i<result.length;i++)
			{
				RFQs.push((result[i]));
			}
		}
	}
	return RFQs.list();
	});
})


