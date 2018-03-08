import { FlowRouter } from 'meteor/kadira:flow-router';
import './PurchaseOrder_Create.html';
import '../../components/Buyer/buyer_po_create.js';
import { ReactiveVar } from 'meteor/reactive-var'

var rfqid = new ReactiveVar();
Template['PurchaseOrder_Create'].onCreated(function(){
    //Meta.setSuffix(TAPi18n.__("dapp.view1.title"));
     //rfqid = new ReactiveVar(FlowRouter.getParam("rfq"));
});

Template.PurchaseOrder_Create.helpers({

   /*  getRFQId:function(){
      return rfqid.get();
    } */
  });
  