import './admin.html'
import { Meteor } from 'meteor/meteor';

var rolesRepositoryAddress;


Template['components_admin'].events({

	"click #createRFQbtn": function(event, template){ 
		template.find("#createRFQbtn").disabled=true;
		
	TemplateVar.set(template,'state', {isMining: true});
	Meteor.call('createRFQContract',function(error, result){
	if (!error) 
	{
		template.find("#createRFQbtn").disabled=false;
		
		if(typeof result !== 'undefined'){
			TemplateVar.set(template, 'state', {isMined: true, address: result});
		}
	}
	template.find("#createRFQbtn").disabled=false;
	
});
},

"click #createPObtn": function(event, template){ 
	template.find("#createPObtn").disabled=true;
	
		TemplateVar.set(template,'state', {isMining: true});
		Meteor.call('createVendorRFQContract',function(error, result){
		if (!error) 
		{
			template.find("#createPObtn").disabled=false;
			
			if(typeof result !== 'undefined'){
				TemplateVar.set(template, 'state', {isMined: true, address: result});
			}
		}
		template.find("#createPObtn").disabled=false;
		
	});
},

"click #createRoleRepositorybtn": function(event, template){ 
	template.find("#createRoleRepositorybtn").disabled=true;
	
		TemplateVar.set(template,'state', {isMining: true});
		console.log("####")
		Meteor.call('createRolesRepository',function(error, result){
		if (!error) 
		{
			console.log("----")

			template.find("#createRoleRepositorybtn").disabled=false;
			
			if(typeof result !== 'undefined'){
				TemplateVar.set(template, 'state', {isMined: true, address: result});
				rolesRepositoryAddress = result;
			}
		}

		template.find("#createRoleRepositorybtn").disabled=false;
		
	});
},


"click #createUACbtn": function(event, template){ 
	template.find("#createUACbtn").disabled=true;
	
		TemplateVar.set(template,'state', {isMining: true});
		var data={rolesRepositoryAddr:rolesRepositoryAddress}
		Meteor.call('createUserRepository',data,function(error, result){
		if (!error) 
		{
			template.find("#createUACbtn").disabled=false;
			
			if(typeof result !== 'undefined'){
				TemplateVar.set(template, 'state', {isMined: true, address: result});
				//rolesRepositoryAddress = result;
			}
		}
		template.find("#createUACbtn").disabled=false;
		
	});
},


"click #createShipmentbtn": function(event, template){ 
	template.find("#createShipmentbtn").disabled=true;
	
		TemplateVar.set(template,'state', {isMining: true});
		Meteor.call('createWorkOrderContract',function(error, result){
		if (!error) 
		{
			template.find("#createShipmentbtn").disabled=false;
			
			if(typeof result !== 'undefined'){
				TemplateVar.set(template, 'state', {isMined: true, address: result});
				//rolesRepositoryAddress = result;
			}
		}
		template.find("#createShipmentbtn").disabled=false;
		
	});
},


});

