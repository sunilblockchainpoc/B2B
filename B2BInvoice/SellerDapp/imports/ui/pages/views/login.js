import './login.html';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

Template['login'].events({
    
        "click #loginbtn": function(event, template){ 
            template.find("#loginbtn").disabled=true;
            
            TemplateVar.set(template, 'login', {isError: false});
            var data = {username:template.find("#username").value, password:template.find("#password").value};
            Meteor.call('login',data,function(error, result){
            if (!error) 
            {
                template.find("#loginbtn").disabled=false;
                
                if(result.address.length > 2){
                    Session.set ({CICUserName:template.find("#username").value,
                                CICUserAddress:result.address
                                })
                   FlowRouter.go('App.home');
               }
               else
                {
                    template.find("#loginbtn").disabled=false;
                    
                    template.find("#password").value ="";
                    TemplateVar.set(template, 'login', {isError: true});
                }
            }
    });
    }
})
    