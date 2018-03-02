/**
Template Controllers

@module Templates
*/

/**
The client_wo template

@class [template] client_wo
@constructor
*/
import './client_wo.html';
import '../../../components/workorder/client/client_wo_contract.js';
import '../../../components/workorder/client/client_wo_requests.js';

var woId = new ReactiveVar();


Template['client_wo'].helpers({
    /**
    Get the name

    @method (name)
    */

  /*  'name': function(){
        return this.name || TAPi18n.__('dapp.view1.defaultName');
    }*/
   
});

// When the template is created
Template['client_wo'].onCreated(function(){
    var template = this;
    template.data.show = new ReactiveVar(false);
	//Meta.setSuffix(TAPi18n.__("dapp.view1.title"));
});
