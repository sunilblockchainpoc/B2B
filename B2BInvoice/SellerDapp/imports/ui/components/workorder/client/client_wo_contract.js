import './client_wo_contract.html'
import { Meteor } from 'meteor/meteor';

var clientRFQs = new ReactiveArray(); 


Template['components_client_wo'].onRendered(function(){
	
	clientRFQs.clear();
	Meteor.call('viewClientRFQList',function(error,result){
		if (result) {
			if(result.length >0){
				for(var i=0;i<result.length;i++)
				{
					clientRFQs.push(result[i]);
				}
			}
		}
	});

});

Template['components_client_wo'].helpers({
	"getRFQs" : function(){
	 return clientRFQs.list();
	},
});

Template['components_client_wo'].events({
	
		"click #btnSubmitContract": function(event, template){ 
			template.find("#btnSubmitContract").disabled=true;
			
		TemplateVar.set(template,'state', {isMining: true});
		
		var input_client_rfq_id = template.find("#client_rfq_id").value;
		var input_sign_date  = template.find("#sign_date").value;
		var input_po  = template.find("#po_number").value;
		var input_filename   =template.find("#uploadfile").files[0].name;
			
	
		var reader = new FileReader();
		reader.onload = function(event){          
		var filedata = new Uint8Array(reader.result);
		var epochDate = getEpochDate(input_sign_date);
		var data = {client_rfq_id:parseInt(input_client_rfq_id),
					sign_date:epochDate,
					po_number:input_po,
					OriginalFileName:input_filename, 
					File:filedata,
					responseBy: Session.get('CICUserName'),
					address: Session.get("CICUserAddress")}
		
		Meteor.call('submitContract',data,function(error, result){
	
				if (!error)	{
					template.find("#btnSubmitContract").disabled=false;

					return TemplateVar.set(template,'state',{isMined: true});
				}
				template.find("#btnSubmitContract").disabled=false;
				
			});
		}
		
		reader.readAsArrayBuffer(template.find("#uploadfile").files[0]);
	
		}
	});

function getEpochDate(dateString) {

	var epochDate = new Date(dateString).getTime();
	return epochDate;
}