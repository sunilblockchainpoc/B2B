import './admin_changepassword.html'
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'


Template['components_admin_changepassword'].onRendered(function(){

    TemplateVar.set('state', {isInactive: true});
});

Template['components_admin_changepassword'].helpers({
	
});


Template['components_admin_changepassword'].events({
	
	"click #changePasswordbtn": function(event, template){ 

		//$(event.currentTarget).prop('disabled', true); 
		template.find("#changePasswordbtn").disabled=true;
		var userName =template.find("#userName").value;
		var oldPassword = template.find("#oldPassword").value;
		var newPassword = template.find("#newPassword").value;
		var confirmPassword = template.find("#confirmPassword").value;
		
		if (newPassword!=confirmPassword) {
			alert("New Password entered isn't matching.Please re-enter")
			template.find("#changePasswordbtn").disabled=false;
		}
		else {		
			TemplateVar.set(template,'state', {isMining: true});
			var data = {UserName:userName,OldPassword:oldPassword,NewPassword: newPassword};
			Meteor.call('changePassword',data,function(error,result){
			if (!error) {
				if(typeof result !== 'undefined'){
					if(result)
						TemplateVar.set(template, 'state', {isMined: true});
					else
						TemplateVar.set(template, 'state', {isError: true});
					}
				}
				//$(event.currentTarget).prop('disabled', false); 
				template.find("#changePasswordbtn").disabled=false;
			});
		}

	},
	
});
