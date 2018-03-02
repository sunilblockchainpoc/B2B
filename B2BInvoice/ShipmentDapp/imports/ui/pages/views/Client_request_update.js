import { FlowRouter } from 'meteor/kadira:flow-router';
import './Client_request_update.html';
import '../../components/client/client_rfq_update.js';
import { ReactiveVar } from 'meteor/reactive-var'

var rfqid = new ReactiveVar();
Template['Client_request_update'].onCreated(function(){
    //Meta.setSuffix(TAPi18n.__("dapp.view1.title"));
     rfqid = new ReactiveVar(FlowRouter.getParam("rfq"));
});

Template.Client_request_update.helpers({

    getRFQId:function(){
      return rfqid.get();
    }
  });
  