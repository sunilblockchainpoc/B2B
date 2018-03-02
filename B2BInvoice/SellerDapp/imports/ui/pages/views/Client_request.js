/**
Template Controllers

@module Templates
*/

/**
The view1 template

@class [template] views_view1
@constructor
*/
import './Client_request.html';
import '../../components/client/client_rfq.js';

Template['Client_request'].helpers({
    /**
    Get the name

    @method (name)
    */

  /*  'name': function(){
        return this.name || TAPi18n.__('dapp.view1.defaultName');
    }*/
});

// When the template is created
Template['Client_request'].onCreated(function(){
	//Meta.setSuffix(TAPi18n.__("dapp.view1.title"));
});
