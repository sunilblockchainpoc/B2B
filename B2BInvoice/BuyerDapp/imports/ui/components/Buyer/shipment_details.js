import './shipment_details.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';


var Enum = require("enum");
var shippingStatusEnum = new Enum({'Requested': 0, 'Received': 1, 'Shipped': 2, 'Failed':3,'Delivered':4,'Acknowledged':5});
var shipID;

var shipStatus = 5;

// This method is rendered on click of RFQ ID
Template['components_shipment_details'].onRendered(function(){
    
    shipID = new ReactiveVar(FlowRouter.getParam("ship"));
	var template = this;
	TemplateVar.set(template,'shipmentData', {});
    var params = {shipmentID:parseInt(shipID.get())};

    Meteor.call('getShipmentDetail',params,function(error,result){
        
        if (result) {
            TemplateVar.set(template,'shipmentData', 
                                {shipmentId: result.shipmentID,
                                 shipmentDescription : result.shipmentDescription,
                                 shipmentDate : result.shipmentDate,
                                 shipmentStatus:result.shippingStatus,
                                 shipmentCost: result.Cost,
                                 shipFileName: result.shipmentFileName,
                                 shipFileURL: result.shippingURL
                                });
       }
    });
});

Template['components_shipment_details'].events({
	
    
	"change #shipStatus5": function(event, template){ 
		shipStatus = event.currentTarget.value;
	},

	"change #shipStatus3": function(event, template){ 
		shipStatus = event.currentTarget.value;
    },
    
    "click #btnUpdShipmentStatus": function(event, template){ 
    
        TemplateVar.set(template,'state', {isMining: true});
        
        var shipmentID = parseInt(shipID.get());
        var data = {shipmentID:shipmentID,
                    Status: parseInt(shipStatus),
                    StatusDate: parseInt(new Date().setHours(0,0,0,0)),
                    StatusBy:Session.get("BuyerUserName"),
                    nodeAddress: Session.get("BuyerUserAddress")};
        
        Meteor.call('updateShipmentStatus',data,function(error, result){
    
                if (!error)	{
                    template.find("#btnUpdShipmentStatus").disabled=false;
                    return TemplateVar.set(template,'state',{isMined: true,isUpdated: result});
                }
                template.find("#btnUpdShipmentStatus").disabled=false;
                
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


