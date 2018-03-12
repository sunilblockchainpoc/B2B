import './invoice_details.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

var invoiceNo = new ReactiveVar();
var InvoiceData = new ReactiveVar();

// This method is rendered on click of Invoice number
Template['components_invoice_details'].onRendered(function(){
    
    invoiceNo = new ReactiveVar(FlowRouter.getParam("inv"));
    var params = {invoiceNumber:parseInt(invoiceNo.get())};
	var template = this;
    TemplateVar.set(template,'InvoiceData', {});
    console.log(params)
    Meteor.call('getInvoiceDetailByInvoiceNumber',params,function(error,result){

        if (result) {
            TemplateVar.set(template,'InvoiceData', 
                                {InvoiceNumber      : result.invoiceNumber,
                                 InvoiceAmount      : result.invoiceAmount,
                                 InvoiceDate        : result.invoiceDate,
                                 RequestBy          : result.requestBy,
                                 InvoiceFileName    : result.invoiceFileName,
                                 InvoiceFileURL     : result.invoiceURL,
                                });
        }
    });
});

Template['components_invoice_details'].events({

 // File download event
 "click .invoicefilelink": function(event, template){
      var data = event.currentTarget.id;
      var text = event.currentTarget.text.trim();
      getData(data,text);
  },

  "click #btnSendAmount": function(event, template){ 
		
    TemplateVar.set(template,'state', {isMining: true});
    var data = TemplateVar.get('InvoiceData');
    var data = {invoiceNumber:data.InvoiceNumber,
                invoiceAmount:data.InvoiceAmount,
                nodeAddress: Session.get("BuyerUserAddress")}
    
    Meteor.call('payInvoiceAmountToContract',data,function(error, result){

            if (!error)	{
                template.find("#btnCreatePO").disabled=false;

                return TemplateVar.set(template,'state',{isMined: true, poNumber:result});
            }
            template.find("#btnCreatePO").disabled=false;
            
        });
    }
});

// This utility function is used to download the file from IPFS to local storage
function getData(data,text) {
    HTTP.get('/Filedownloads'+data,function (err,result) {
        if(result){
            //console.log(result);
            var uri = "data:"+ result.headers['content-type'] +";base64," + result.content;
            var downloadLink = document.createElement("a");
            downloadLink.href = uri;
            downloadLink.download = text;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink)
        }
        if (err)
            console.log("Failed in downloading the file");
    });
}