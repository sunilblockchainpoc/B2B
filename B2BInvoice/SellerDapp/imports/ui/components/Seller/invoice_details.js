import './invoice_details.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

var invoiceNo = new ReactiveVar();

// This method is rendered on click of Invoice number
Template['components_invoice_details'].onRendered(function(){
    
    invoiceNo = new ReactiveVar(FlowRouter.getParam("inv"));
    var params = {invoiceNumber:parseInt(invoiceNo.get())};
	var template = this;
    TemplateVar.set(template,'InvoiceData', {});

    Meteor.call('getInvoiceDetailByInvoiceNumber',params,function(error,result){
        
        if (result) {

            TemplateVar.set(template,'InvoiceData', 
                                {PONumber           : result.poNumber,
                                 InvoiceNumber      : result.invoiceNumber,
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