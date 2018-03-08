import { FlowRouter } from 'meteor/kadira:flow-router';
import './Invoice_Details_view.html';
import '../../components/Seller/invoice_details.js';
import { ReactiveVar } from 'meteor/reactive-var';

var invoiceNo = new ReactiveVar();

Template['Invoice_Details_view'].onRendered(function(){
     invoiceNo = new ReactiveVar(FlowRouter.getParam("inv"));
});

Template.Invoice_Details_view.helpers({
    getInvoiceNo:function(){
      return FlowRouter.getParam("inv");
    }
});

    