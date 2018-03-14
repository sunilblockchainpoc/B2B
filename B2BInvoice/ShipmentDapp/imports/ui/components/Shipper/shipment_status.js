import './shipment_status.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';


var Enum = require("enum");
var shippingStatusEnum = new Enum({'Requested': 0, 'Received': 1, 'Shipped': 2, 'Failed':3,'Delivered':4,'Acknowledged':5});
var shipID;
var statusList = new ReactiveArray();

Template['components_shipment_status'].helpers({
	
    "getStatus": function()
    {
        return statusList.list();
    }
});

// This method is rendered on click of RFQ ID
Template['components_shipment_status'].onRendered(function(){
    
    shipID = new ReactiveVar(FlowRouter.getParam("ship"));
	var template = this;
	TemplateVar.set(template,'shipmentData', {});
    var params = {shipmentID:parseInt(shipID.get())};

    statusList.clear();
    shippingStatusEnum.enums.forEach(function(shipStatus) {
        var data = {key:shipStatus.key,value:parseInt(shipStatus.value)};
        statusList.push(data);
      });

    


    Meteor.call('getShipmentDetail',params,function(error,result){
        
        if (result) {
            TemplateVar.set(template,'shipmentData', 
                                {shipmentId: result.shipmentID,
                                 shipmentStatus:result.shippingStatus,
                                });
        
        var selectlist = template.find("#shipmentStatus");
        var selected = document.createAttribute("selected");
        selected.value='selected';
        
        for (var i = 0; i < selectlist.length; i++) {
            if (selectlist[i].text==result.shippingStatus){               
                return selectlist[i].setAttributeNode(selected);
            }
        }
       }
    });
});

Template['components_shipment_status'].events({
	
    "click #btnupdateShipmentStatus": function(event, template){ 
    
    TemplateVar.set(template,'state', {isMining: true});
    
    var shipmentID = parseInt(shipID.get());
    var shipmentStatus =  template.find("#shipmentStatus").value;
     
    //var epochDate = getInputDate(input_sign_date);
    var data = {shipmentID:shipmentID,
                Status: parseInt(shipmentStatus),
                StatusDate: parseInt(new Date().setHours(0,0,0,0)),
                StatusBy:Session.get("ShipperUserName"),
                nodeAddress: Session.get("ShipperUserAddress")};
    
    Meteor.call('updateShipmentStatus',data,function(error, result){

            if (!error)	{
                template.find("#btnupdateShipmentStatus").disabled=false;
                return TemplateVar.set(template,'state',{isMined: true,isUpdated: result});
            }
            template.find("#btnupdateShipmentStatus").disabled=false;
            
        });
    }
    
});


function getDate(inputDate){
	if(inputDate > 0)
	{
		return (new Date(inputDate).toDateString())
	}
	else
		return "";
}


