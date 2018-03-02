import './admin.html'
import { Meteor } from 'meteor/meteor';

Template['components_admin'].onRendered(function(){
    TemplateVar.set('state', {isInactive: true});
});


Template['components_admin'].events({

	"click #createClientRFQbtn": function(event, template){ 

		template.find("#createClientRFQbtn").disabled=true;
		
	TemplateVar.set(template,'state', {isMining: true});
	Meteor.call('createClientRFQContract',function(error, result){
	if (!error) 
	{
		if(typeof result !== 'undefined'){
			template.find("#createClientRFQbtn").disabled=false;
			
			TemplateVar.set(template, 'state', {isMined: true, address: result});
		}
	}
	template.find("#createClientRFQbtn").disabled=false;
	
});
}

});

