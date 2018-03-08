import { FlowRouter } from 'meteor/kadira:flow-router';
import './Shipment_Details_view.html';
import '../../components/Seller/shipping_details.js';
import { ReactiveVar } from 'meteor/reactive-var';

var shipID = new ReactiveVar();

Template['Invoice_Details_view'].onRendered(function(){
  shipID = new ReactiveVar(FlowRouter.getParam("ship"));
});

Template.Invoice_Details_view.helpers({
    getShipmentID:function(){
      return FlowRouter.getParam("ship");
    }
});
    