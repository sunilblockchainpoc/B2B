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
                    Session.set ({SellerUserName:template.find("#username").value,
                                SellerUserAddress:result.address
                                })
                   FlowRouter.go('App.order');
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
    