import './rfq_details.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';


var rfqId,rfqStatus;
rfqStatus = 2;
var reqServices = new ReactiveArray();
var Enum = require("enum");
var rfqStatusEnum = new Enum({'Requested': 0, 'Responded': 1, 'Accepted': 2, 'Declined':3});

// This method is rendered on click of RFQ ID
Template['components_rfq_details'].onRendered(function(){
    rfqId = new ReactiveVar(FlowRouter.getParam("rfq"));

	var template = this;
    TemplateVar.set(template,'rfqData', {});

    var params = {rfqID:parseInt(rfqId.get())};
    console.log(params)
    Meteor.call('getRFQDetailByrfqID',params,function(error,result){
        
        if (result) {
    
            TemplateVar.set(template,'rfqData', 
                                {rfqID: result.rfqID,
                                 requestDate : result.requestDate,
                                 responseBy : result.responseBy,
                                 responseDt : result.responseDt,
                                 rfqValue : result.rfqValue
                                });

        // Get the Product details provided by Buyer
        var reqproductDetailsJSON = result.reqproductDetailsJSON;
        var resproductDetailsJSON = result.resproductDetailsJSON;
        console.log(resproductDetailsJSON)
        if (resproductDetailsJSON.length > 0) {

            for(var i=0;i<resproductDetailsJSON.length; i++) {

                var textId = resproductDetailsJSON[i].id + "_value";
                var textvalue = parseInt(resproductDetailsJSON[i].textvalue);
                var costID = resproductDetailsJSON[i].id + "_cost";

                // Disable the fields as the RFQ is already responded
                template.find(resproductDetailsJSON[i].id).checked = true;
                template.find(resproductDetailsJSON[i].id).disabled = true;
                template.find("#rfqAmount").disabled = true;
                template.find("#respondRFQ").disabled = true;
                template.find(costID).disabled = true;

                // Populate values
                template.find("#rfqAmount").value = result.rfqValue;
                template.find(textId).value = textvalue;
                template.find(costID).value = parseInt(resproductDetailsJSON[i].cost);
            }
        }
        else if(reqproductDetailsJSON.length > 0){ // Product details sent by Buyer
            // Look for individual products
            for(var i=0;i<reqproductDetailsJSON.length; i++) {

                var textId = reqproductDetailsJSON[i].id + "_value";
                var textvalue = parseInt(reqproductDetailsJSON[i].textvalue);

                template.find(reqproductDetailsJSON[i].id).checked = true;
                template.find(reqproductDetailsJSON[i].id).disabled = true;
                template.find(textId).value = textvalue;
            }
        }
        }
    });
});

Template['components_rfq_details'].events({

	"click #respondRFQ": function(event, template){ 
        
        template.find("#respondRFQ").disabled=true;
        var rfqID = parseInt(rfqId.get());
        var rfqAmount =template.find("#rfqAmount").value;
        var fileName = template.find("#uploadResfile").files[0].name;
		var username = Session.get("SellerUserName");
        var address = Session.get("SellerUserAddress");
        var jsonObj =[];
        if(!fileName)
			return;

        // Get all the product information
        var productDetails = template.findAll( "input[type=checkbox]:checked");

		for(var i=0; i<productDetails.length;i++){

			var textId = "#"+ productDetails[i].id + "_value";
            var textValue = template.find(textId).value;
            var costID = "#"+ productDetails[i].id + "_cost";
            var costValue = template.find(costID).value;
			var jsonData={};

			jsonData["id"] =  "#" + productDetails[i].id;
			jsonData["textid"] = textId;
			jsonData["textvalue"] = textValue;
			jsonData["cost"] = costValue;
            jsonObj.push(jsonData);

        }
        
		TemplateVar.set(template,'state', {isMining: true});
		var reader = new FileReader();
        
        reader.onload = function(event){          
            
            var filedata = new Uint8Array(reader.result);

            var data = {rfqID:rfqID,
                        rfqAmount:rfqAmount,
                        OriginalFileName: fileName, 
                        FileData:filedata,
                        ResponseBy: username,
                        ProductDetails:jsonObj,
                        nodeAddress: address
                        };
        
            TemplateVar.set(template,'state', {isMining: true});
                        
			Meteor.call('respondRFQ',data,function(error,result){
				if (!error) 
				{
					template.find("#respondRFQ").disabled=false;
					console.log()
					if(typeof result !== 'undefined'){
						TemplateVar.set(template, 'state', {isMined: true, rfqID: result});
					}
				}
				template.find("#respondRFQ").disabled=false;
				
			});
        }
        reader.readAsArrayBuffer(template.find("#uploadResfile").files[0]);
    }
});
