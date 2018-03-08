import './buyer_po_details.html'
import { Meteor } from 'meteor/meteor';

var poNumber,rfqID;
var rfqDetails = new ReactiveArray(); 



Template['components_buyer_po_details'].helpers({
	"getRFQDetails" : function(){
	 return rfqDetails.list();
	},
});

Template['components_buyer_po_details'].onRendered(function(){
	

	poNumber = new ReactiveVar(FlowRouter.getParam("poNumber"));
	var template = this;
	TemplateVar.set(template,'poData', {});
    var params = {poNumber:parseInt(poNumber.get())};

	Meteor.call('getPODetailByPONumber',params,function(error,result){
	if (result) {
		rfqID = parseInt(result.rfqID);
		TemplateVar.set(template,'poData', 
			{rfqID: parseInt(result.rfqID),
				poNumber : parseInt(result.poNumber),
				poDescription : result.poDescription,
				RequestDate : getDate(result.poDate),
				FileName: result.FileName,
				poFileURL: result.poFileURL
			});
	}
	});

	var params = {rfqID:rfqID};
	var prodName;
	rfqDetails.clear();
	Meteor.call('getRFQDetailByrfqID',params,function(error,result){
		if (result) {
			if(result.resproductDetailsJSON && result.resproductDetailsJSON.length > 0){
				for(var i=0;i<result.resproductDetailsJSON.length; i++){
					prodName = result.resproductDetailsJSON[i].id.substring(1);
					result.resproductDetailsJSON[i].id = prodName;
					rfqDetails.push(result.resproductDetailsJSON[i]);
				}
			}
		}
	});
});

Template['components_buyer_po_details'].helpers({
	"getRFQs" : function(){
	 return buyerRFQs.list();
	},
});

Template['components_buyer_po_details'].events({

	"click .poFileLink": function(event, template){
		var data = event.currentTarget.id;
		var text = event.currentTarget.text.trim();
		getData(data,text);
	},
	
		
});

function getEpochDate(dateString) {

	var epochDate = new Date(dateString).getTime();
	return epochDate;
}

function getDate(inputDate){
	if(inputDate > 0)
	{
		return (new Date(inputDate).toDateString())
	}
	else
		return "";
}

function getData(data,text) {
	HTTP.get('/Filedownloads'+data,function (err,result){
		if(result){
//			console.log(result);
			var uri = "data:"+ result.headers['content-type'] +";base64," + result.content;
			var downloadLink = document.createElement("a");
			downloadLink.href = uri;
			downloadLink.download = text;
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink)
		}
	});

}
