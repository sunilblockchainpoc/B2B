import './req_invoice_shipping.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

// This method is rendered on click of RFQ ID
Template['components_invoice_shipping'].onRendered(function(){
    
    rfqId = new ReactiveVar(FlowRouter.getParam("rfq"));

	var template = this;
    TemplateVar.set(template,'rfqData', {});

    var params = {rfqID:parseInt(rfqId.get())};
    console.log(params)
    Meteor.call('getRFQDetailByrfqID',params,function(error,result){
        
        if (result) {
    
            TemplateVar.set(template,'rfqData', 
                                {rfqID: result.rfqID,
                                 requestDate : result.requestDate,
                                 responseBy : result.responseBy,
                                 responseDt : result.responseDt,
                                 rfqValue : result.rfqValue
                                });

        // Get the Product details provided by Buyer
        var reqproductDetailsJSON = result.reqproductDetailsJSON;
        var resproductDetailsJSON = result.resproductDetailsJSON;
        console.log(resproductDetailsJSON)
        if (resproductDetailsJSON.length > 0) {

            for(var i=0;i<resproductDetailsJSON.length; i++) {

                var textId = resproductDetailsJSON[i].id + "_value";
                var textvalue = parseInt(resproductDetailsJSON[i].textvalue);
                var costID = resproductDetailsJSON[i].id + "_cost";

                // Disable the fields as the RFQ is already responded
                template.find(resproductDetailsJSON[i].id).checked = true;
                template.find(resproductDetailsJSON[i].id).disabled = true;
                template.find("#rfqAmount").disabled = true;
                template.find("#respondRFQ").disabled = true;
                template.find(costID).disabled = true;

                // Populate values
                template.find("#rfqAmount").value = result.rfqValue;
                template.find(textId).value = textvalue;
                template.find(costID).value = parseInt(resproductDetailsJSON[i].cost);
            }
        }
        else if(reqproductDetailsJSON.length > 0){ // Product details sent by Buyer
            // Look for individual products
            for(var i=0;i<reqproductDetailsJSON.length; i++) {

                var textId = reqproductDetailsJSON[i].id + "_value";
                var textvalue = parseInt(reqproductDetailsJSON[i].textvalue);

                template.find(reqproductDetailsJSON[i].id).checked = true;
                template.find(reqproductDetailsJSON[i].id).disabled = true;
                template.find(textId).value = textvalue;
            }
        }
        }
    });
});

Template['components_invoice_shipping'].events({

	"click #Generate": function(event, template){ 
        
        template.find("#Generate").disabled=true;

        // Get all the input params
        var poNumber     = template.find("#ponumber").value;
        var packageDesc  = template.find("#packageDesc").value;
        var shippingAddr = template.find("#shippingAddr").value;

        // Get the Invoice/Package File details
        var invoiceReader = new FileReader();
        var packageReader = new FileReader();
        var invoiceFiledata = "";
        var packageFiledata = "";
        
        invoiceReader.onload = function(event){
            
            invoiceFiledata = new Uint8Array(invoiceReader.result);
        }        
        invoiceReader.readAsArrayBuffer(template.find("#invoiceFile").files[0]);
        var fileName = template.find("#uploadResfile").files[0].name;

        packageReader.onload = function(event){
            
            packageFiledata = new Uint8Array(packageReader.result); 
            TemplateVar.set(template,'state', {isMining: true});
                   
            // Populate the data for contract
            var data = {poNumber:poNumber,
                        packageDesc:packageDesc,
                        invoiceFilename:invoiceFilename, 
                        invoideFileData:invoiceFiledata,
                        packageFilename:packageFilename, 
                        packageFiledata:packageFiledata,
                        ResponseBy: username,
                        nodeAddress: address
                        };
                
            Meteor.call('respondRFQ',data,function(error,result){
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
