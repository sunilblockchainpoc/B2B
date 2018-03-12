import './req_invoice_shipping.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';


var PONumbers = new ReactiveArray(); 

Template['components_invoice_shipping'].onRendered(function(){
	
	PONumbers.clear();
	Meteor.call('getSellerDashBoardDetails',function(error,result){
		if (result) {
            var data;
			if(result.length >0){
				for(var i=0;i<result.length;i++)
				{
                    if (result[i].poNumber!="") {
                        data = {index:result[i].poNumber - 1, poNumber:result[i].poNumber};
                        PONumbers.push(data);
                    }
				}
			}
		}
	});

});


Template['components_invoice_shipping'].helpers({
	"getPOs" : function(){
	 return PONumbers.list();
	},
});



// This method is rendered on click of RFQ ID
Template['components_invoice_shipping'].onRendered(function(){
    
    poNumber =  new ReactiveVar(FlowRouter.getParam("poNumber"));
    var po_number = parseInt(poNumber.get());
    var template = this;
    TemplateVar.set(template,'poData', {poNumber:po_number});
});

Template['components_invoice_shipping'].events({

	"click #Generate": function(event, template){ 
        
        template.find("#Generate").disabled=true;

        // Get all the input params
        var poNumber =  template.find("#poNumber").value;
        var packageDesc  = template.find("#packageDesc").value;
        var invoiceAmt  = template.find("#invoiceAmt").value;
        //var shippingAddr = template.find("#shippingAddr").value;
		var username = Session.get("SellerUserName");
        var address = Session.get("SellerUserAddress");

        // Get the Invoice/Package File details
        var invoiceReader = new FileReader();
        var invoiceFilename = template.find("#invoiceFile").files[0].name;

        var packageReader = new FileReader();
        var packageFilename = template.find("#packageFile").files[0].name;
       
        invoiceReader.onload = function(event){
            
            invoiceFiledata = new Uint8Array(invoiceReader.result);
        }        
        invoiceReader.readAsArrayBuffer(template.find("#invoiceFile").files[0]);

        packageReader.onload = function(event){
            
            packageFiledata = new Uint8Array(packageReader.result); 
            TemplateVar.set(template,'state', {isMining: true});
                   
            // Populate the data for contract
            var data = {poNumber:poNumber,
                        packageDesc:packageDesc,
                        invoiceAmt:invoiceAmt,
                        invoiceFilename:invoiceFilename, 
                        invoiceFiledata:invoiceFiledata,
                        packageFilename:packageFilename, 
                        packageFiledata:packageFiledata,
                        ResponseBy: username,
                        nodeAddress: address
                        };
             
                        console.log(data)

            Meteor.call('createInvoiceAndPurchaseSlip',data,function(error,result){
                    if (!error) 
                    {
                        template.find("#Generate").disabled=false;
                        if(typeof result !== 'undefined'){
                            TemplateVar.set(template, 'state', {isMined: true, rfqID: result});
                        }
                    }
                    template.find("#Generate").disabled=false;
            });
        }         
        packageReader.readAsArrayBuffer(template.find("#packageFile").files[0]);
    }
});
