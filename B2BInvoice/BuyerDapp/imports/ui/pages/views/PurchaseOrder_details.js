import { FlowRouter } from 'meteor/kadira:flow-router';
import './PurchaseOrder_details.html';
import '../../components/Buyer/buyer_po_details.js';
import { ReactiveVar } from 'meteor/reactive-var'

var rfqid = new ReactiveVar();
Template['PurchaseOrder_details'].onCreated(function(){
    //Meta.setSuffix(TAPi18n.__("dapp.view1.title"));
     //rfqid = new ReactiveVar(FlowRouter.getParam("rfq"));
});

Template.PurchaseOrder_details.helpers({

   /*  getRFQId:function(){
      return rfqid.get();
    } */
  });
  