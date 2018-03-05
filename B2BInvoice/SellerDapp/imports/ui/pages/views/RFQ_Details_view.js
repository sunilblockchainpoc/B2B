import { FlowRouter } from 'meteor/kadira:flow-router';
import './RFQ_Details_view.html';
import '../../components/Seller/rfq_details.js';
import { ReactiveVar } from 'meteor/reactive-var';

var rfqid = new ReactiveVar();

Template['RFQ_Details_view'].onRendered(function(){
    console.log(FlowRouter.getParam("rfq"));
     rfqid = new ReactiveVar(FlowRouter.getParam("rfq"));
     console.log(rfqid.get());
});

Template.RFQ_Details_view.helpers({
    getRFQId:function(){
      return FlowRouter.getParam("rfq");
    }
  });

    