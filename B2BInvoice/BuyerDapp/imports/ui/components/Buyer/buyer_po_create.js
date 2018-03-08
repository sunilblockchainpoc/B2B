import './buyer_po_create.html'
import { Meteor } from 'meteor/meteor';

var buyerRFQs = new ReactiveArray(); 


Template['components_buyer_po_create'].onRendered(function(){
	
	buyerRFQs.clear();
	Meteor.call('getBuyerDashBoardDetails',function(error,result){
		if (result) {
			var data;
			if(result.length >0){
				for(var i=0;i<result.length;i++)
				{
					data = {index:result[i].rfqID - 1, id:result[i].rfqID};
					buyerRFQs.push(data);
				}
			}
		}
	});

});

Template['components_buyer_po_create'].helpers({
	"getRFQs" : function(){
	 return buyerRFQs.list();
	},
});

Template['components_buyer_po_create'].events({
	
		"click #btnCreatePO": function(event, template){ 
		
		TemplateVar.set(template,'state', {isMining: true});
		
		var rfqID = template.find("#buyer_rfq_id").value;
		var description  = template.find("#po_description").value;
		var poFileName   =template.find("#uploadfile").files[0].name;
			
	
		var reader = new FileReader();
		reader.onload = function(event){          
		var filedata = new Uint8Array(reader.result);
		//var epochDate = getInputDate(input_sign_date);
		var data = {rfqID:parseInt(rfqID),
					description:description,
					OriginalFileName:poFileName, 
					File:filedata,
					nodeAddress: Session.get("BuyerUserAddress")}
		
		Meteor.call('createPurchaseOrder',data,function(error, result){
	
				if (!error)	{
					template.find("#btnCreatePO").disabled=false;

					return TemplateVar.set(template,'state',{isMined: true, poNumber:result});
				}
				template.find("#btnCreatePO").disabled=false;
				
			});
		}
		
		reader.readAsArrayBuffer(template.find("#uploadfile").files[0]); 
	
		}
	});

function getEpochDate(dateString) {

	var epochDate = new Date(dateString).getTime();
	return epochDate;
}

function getDate(inputDate){
	if(inputDate > 0)
	{
		return (new Date(inputDate).toDateString())
	}
	else
		return "";
}
