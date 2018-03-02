import './billitnow_wo_contract.html'
import { Meteor } from 'meteor/meteor';

Template['components_billitnow_wo'].onRendered(function(){
	var username = Session.get("BillUserName");
	Session.setDefault('username','ramamosr');
});

Template['components_billitnow_wo'].events({

	"click #btnSubmitContract": function(event, template){ 
		template.find("#btnSubmitContract").disabled=true;
		
		var address = Session.get("BillUserAddress");	
		
	TemplateVar.set(template,'state', {isMining: true});
	var account_address = template.find("#account_address").value;
	var amount  = template.find("#amount").value;

	var data = {account:address,toAccount:account_address,
				amount:amount};

	Meteor.call('makePayment',data,function(error, result){
			if (!error)	{
				//console.log(result);
				template.find("#btnSubmitContract").disabled=false;
				
				return TemplateVar.set(template,'state',{isMined: true});
			}
			else{
				template.find("#btnSubmitContract").disabled=false;
				
				return TemplateVar.set(template,'state',{isError: true});
			}
		});
	}
});
