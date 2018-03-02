import './client_rfq.html'
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

const XLSX = require("xlsx");
var sheetInfo = new ReactiveArray(); 

Template['components_client_rfq'].onRendered(function(){
	Session.setDefault('username','ramamosr');
    TemplateVar.set('state', {isInactive: true});
});

Template['components_client_rfq'].helpers({
	
		"getSheetInfo": function()
		{
			return sheetInfo.list();
		}
	});


Template['components_client_rfq'].events({
	
	/*"change #uploadReqfile": function(event, template){ 
		TemplateVar.set(template,'showInfo',{show:true});
		const file = event.currentTarget.files[0];
		const reader = new FileReader();
		reader.onload = function(e) {
			const data = e.target.result;
		  	const name = file.name;
			var wb = XLSX.read(btoa(data), {type: 'base64'});
			var result = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:0});
		  	for (var i=0;i<result.length;i++)
			{
			  sheetInfo.push(result[i]);
			}
		};
		reader.readAsBinaryString(file);
	},*/

	"click input[type=checkbox]":function (event,template){
		var id = event.currentTarget.id;
		var textId = "#NoV" + id;
		if(event.currentTarget['checked']){
				template.find(textId).disabled = false;
			}
			else{
				template.find(textId).value="";
				template.find(textId).disabled = true;
			}
	},

	"click #submitRequestRFQ": function(event, template){ 
		template.find("#submitRequestRFQ").disabled=true;
		
		var rfqName =template.find("#rfqName").value;
		var rfqDescription = template.find("#rfqDescription").value;
		var file = template.find("#uploadReqfile").files[0].name;
		
		var username = Session.get("CICUserName");
		var address = Session.get("CICUserAddress");
		if(!file)
			return;
		var filext = file.split(".")[1];
		if(filext=="xlsx" || filext=="xls" ){
			
		var selectedServices = template.findAll( "input[type=checkbox]:checked");
		var textId,textValue;
		var jsonObj = [];
		for(var i=0; i<selectedServices.length;i++){
			textId = "#NoV" + selectedServices[i].id;
			textValue = template.find(textId).value;
			var jsonData={};
			jsonData["id"] = "#" + selectedServices[i].id;
			jsonData["textid"] = textId;
			jsonData["NoV"] = textValue;
			jsonObj.push(jsonData);
		}

		TemplateVar.set(template,'state', {isMining: true});
		var reader = new FileReader();
		reader.onload = function(event){          
			var filedata = new Uint8Array(reader.result);
			var data = {Name:rfqName,Description:rfqDescription,FileName:file,
						OriginalFileName: file, File:filedata, RequestBy:username,
						ServiceData:jsonObj, nodeAddress:address};
			
			
			Meteor.call('requestClientRFQ',data,function(error,result){
				if (!error) 
				{
					if(typeof result !== 'undefined'){
						template.find("#submitRequestRFQ").disabled=false;
						
						TemplateVar.set(template, 'state', {isMined: true, rfqName: result});
					}
				}
				template.find("#submitRequestRFQ").disabled=false;
			
			});
		}
		reader.readAsArrayBuffer(template.find("#uploadReqfile").files[0]);
	}
	else{
		TemplateVar.set(template,'state', {isError: true,error:"Invalid file type. Only xls, xlsx file types are allowed."});
		return;
	}
		
	},
	
});
