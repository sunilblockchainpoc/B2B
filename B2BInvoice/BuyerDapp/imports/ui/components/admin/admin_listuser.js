import './admin_listuser.html'
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'

var usersList = new ReactiveArray(); 

Template["components_admin_listuser"].onCreated(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: false});
});

Template['components_admin_listuser'].helpers({
	"getUserList": function(){
			return usersList.list();
		}
	});

Template['components_admin_listuser'].onRendered(function(){
	var template = this;
	TemplateVar.set(template,'state', {list: true});
	usersList.clear();
	Meteor.call('getUsersList',function(error,result){
	if (result) {
		if(result.length >0){
			for(var i=0;i<result.length;i++)
			{
				usersList.push((result[i]));
			}
		}
	}
	return usersList.list();
	});
})


