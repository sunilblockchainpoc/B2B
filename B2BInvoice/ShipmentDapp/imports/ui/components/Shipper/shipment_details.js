import './shipment_details.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';


var Enum = require("enum");
var shippingStatusEnum = new Enum({'Requested': 0, 'Received': 1, 'Shipped': 2, 'Failed':3,'Delivered':4,'Acknowledged':5});
var shipID;
var statusList = new ReactiveArray();

Template['components_shipment_details'].helpers({
	
    "getStatus": function()
    {
        return statusList.list();
    }
});

// This method is rendered on click of RFQ ID
Template['components_shipment_details'].onRendered(function(){
    
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
                                 shipmentDescription : result.shipmentDescription,
                                 shipmentDate : result.shipmentDate,
                                 shipmentStatus:result.shippingStatus,
                                 shipmentCost: result.Cost,
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

Template['components_shipment_details'].events({
	
    "click #btnupdateShipment": function(event, template){ 
    
    TemplateVar.set(template,'state', {isMining: true});
    
    var shipmentID = parseInt(shipID.get());
    var shipmentDate = template.find("#shipment_date").value;
    var shipmentDescription  = template.find("#ship_description").value;
    var shipFileName =template.find("#uploadfile").files[0].name;
    var shipmentCost =  template.find("#shipment_cost").value;
    var shipmentStatus =  template.find("#shipmentStatus").value;
        

    var reader = new FileReader();
    reader.onload = function(event){          
    var filedata = new Uint8Array(reader.result);
    //var epochDate = getInputDate(input_sign_date);
    var data = {shipmentID:shipmentID,
                shipmentDescription:shipmentDescription,
                shipmentDate: shipmentDate,
                shipmentCost:shipmentCost,
                OriginalFileName:shipFileName, 
                File:filedata,
                Status: parseInt(shipmentStatus),
                StatusDate: parseInt(new Date().setHours(0,0,0,0)),
                StatusBy:Session.get("ShipperUserName"),
                nodeAddress: Session.get("ShipperUserAddress")};

       
    Meteor.call('updateShimpmentDetails',data,function(error, result){

            if (!error)	{
                template.find("#btnupdateShipment").disabled=false;
                return TemplateVar.set(template,'state',{isMined: true,isUpdated: result});
            }
            template.find("#btnupdateShipment").disabled=false;
            
        });
    }
    
    reader.readAsArrayBuffer(template.find("#uploadfile").files[0]); 

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


