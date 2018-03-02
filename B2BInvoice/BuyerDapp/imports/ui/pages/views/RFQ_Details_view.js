import { FlowRouter } from 'meteor/kadira:flow-router';
import './RFQ_Details_view.html';
import '../../components/Buyer/rfq_details.js';
import { ReactiveVar } from 'meteor/reactive-var';

var rfqid = new ReactiveVar();

Template['RFQ_Details_view'].onRendered(function(){
    console.log(FlowRouter.getParam("rfq"));
     rfqid = new ReactiveVar(FlowRouter.getParam("rfq"));
     console.log(rfqid.get());
});

Template.RFQ_Details_view.helpers({

    getRFQId:function(){
      console.log(FlowRouter.getParam("rfq"));
      return FlowRouter.getParam("rfq");
     // return rfqid.get();
    }
  });

    