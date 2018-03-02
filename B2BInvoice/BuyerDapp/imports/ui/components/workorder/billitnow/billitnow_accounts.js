import './billitnow_accounts.html';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

var getClientWOs = new ReactiveArray(); 

Template["components_billitnow_acounts"].onCreated(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: false});
	
});

Template['components_billitnow_acounts'].helpers({
		"getClientWO": function()
		{
			return getClientWOs.list();
		}
	});

Template['components_billitnow_acounts'].onRendered(function(){

	var username = Session.get("BillUserName");
	var address = Session.get("BillUserAddress");
	
	var template = this;
	getClientWOs.clear();
	TemplateVar.set(template,'state', {list: true});

	var data = {nodeAddress:address}
	Meteor.call('getBillitNowBalance',data,function(error,result){
	if (result) {
		if(result.length >0){
			for(var i=0;i<result.length;i++)
				{
					//sconsole.log(result[i]);
					getClientWOs.push((result[i]));
				}
		}
	}
	if (error) {
		console.log("Error occured while fetching getBillitNowBalance results");
	}
	return getClientWOs.list();
	});
})
