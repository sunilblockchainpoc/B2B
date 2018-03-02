import './billitnow_invoice_update.html'
import { Meteor } from 'meteor/meteor';

Template['components_billitnow_invoice_update'].onRendered(function(){
	var username = Session.get("BillUserName");
	TemplateVar.set(template,'state', {isMining: true});
	TemplateVar.set(template,'state', {test: this.data.id});
});

Template['components_billitnow_invoice_update'].events({

	"click #btnSubmitContract": function(event, template){ 
	template.find("#btnSubmitContract").disabled=true;
		
	TemplateVar.set(template,'state', {isMining: true});
	var address = Session.get("BillUserAddress");	
	
	var wo_number = template.find("#wo_number").value;
	var invoice_number  = template.find("#invoice_number").value;
	var invoice_file   =template.find("#uploadfile").files[0].name;

	var reader = new FileReader();
	reader.onload = function(event) {          
    var filedata = new Uint8Array(reader.result);
	
	var data = {wo_id:wo_number,
				invoice_number:invoice_number,
				OriginalFileName:invoice_file, 
				File:filedata,
				nodeAddress: address}	

	Meteor.call('generateInvoiceToCic',data,function(error, result){
			if (!error)	{
				//console.log(result);
				template.find("#btnSubmitContract").disabled=false;
				return TemplateVar.set(template,'state',{isMined: true});
			}
			template.find("#btnSubmitContract").disabled=false;
		});
		}
		reader.readAsArrayBuffer(template.find("#uploadfile").files[0]);
		
	}
});
