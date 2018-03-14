import './event_details.html'
import { Meteor } from 'meteor/meteor';

var Events = new ReactiveArray(); 

Template["components_events_view"].onCreated(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: false});
});

Template['components_events_view'].helpers({
		"getEventsList": function()
		{
			return Events.list();
		}
	});


Template['components_events_view'].onRendered(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: true});
	Events.clear();
	var Event_ID = 3000
	Meteor.call('getEventDetails',function(error,result){
	if (result) {
		// Fetching results
			if(result.length >0) {
		
				for (var i=0;i<result.length;i++) {
					// console.log(result[i]);

					Event_ID++;
					var current_status = result[i].status;
					if (current_status) {
						var status = "Successful"	
					}
					else {
						var status = "Failed"	
					}

					var addJSON = result[i].additionalInfo;
					var details = new Array;
					Object.keys(addJSON).forEach(function(key){
						var newKey   = key;
						var newValue = addJSON[key];
						console.log(newValue)
						details.push(newKey+":"+newValue+'\n');
					});
					var data = { 
								 blockNumber:result[i].blockNumber,
								 transactionHash:result[i].transactionHash,								  
								 eventID      : Event_ID,
								 category     : result[i].category,
								 eventType    : result[i].eventType,
								 primary_id   : result[i].primary_id,
								 secondary_id : result[i].secondary_id,
								 state        : result[i].state,
								 status		  : status,
								 additionalInfo: details.join(" ")
								}
							Events.push(data);
					}		
				}
			}
	return Events.list();
	});
})

