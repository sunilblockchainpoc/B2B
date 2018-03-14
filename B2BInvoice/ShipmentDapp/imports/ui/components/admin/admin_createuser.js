import './admin_createuser.html'
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

var roles = new ReactiveArray(); 
var groups = new ReactiveArray(); 



Template['components_admin_createuser'].onRendered(function(){

	TemplateVar.set('state', {isInactive: true});
	
	Meteor.call('getRoles',function(error,result){
		if (!error) {
			if(result) {
				if(result.length >0){
					for(var i=0;i<result.length;i++) {
						roles.push(result[i]);
					}
				}
			}
		}
	});

	Meteor.call('getGroups',function(error,result){
		if (!error) {
			if(result) {
				if(result.length >0){
					for(var i=0;i<result.length;i++) {
						groups.push(result[i]);
					}
				}
			}
		}
	});

});

Template['components_admin_createuser'].helpers({

	"getRoles" : function(){
		return roles.list();
	   },
	
	"getGroups" : function(){
	return groups.list();
	},
	
});


Template['components_admin_createuser'].events({
	
	
	"click #createUserbtn": function(event, template){ 
		template.find("#createUserbtn").disabled=true;
		
		
		var userName =template.find("#userName").value;
		var firstName = template.find("#firstName").value;
		var lastName = template.find("#lastName").value;
		var orgName = template.find("#orgName").value;
		var password = template.find("#password").value;
		//var groupId = template.find("#group").value;
		//var roleId = template.find("#role").value;
		var address = template.find("#address").value;

		TemplateVar.set(template,'state', {isMining: true});
		var data = {UserName:userName,FirstName:firstName,LastName:lastName, Password: password,
					Organization: orgName, Address: address};
		Meteor.call('createUser',data,function(error,result){
		if (!error) {
			template.find("#createUserbtn").disabled=false;
			
			if(typeof result !== 'undefined'){
				console.log(result);
				if(result)
					TemplateVar.set(template, 'state', {isMined: true});
				else
					TemplateVar.set(template, 'state', {isError: true});
			}
		}
			template.find("#createUserbtn").disabled=false;
		});
	},
	
});
