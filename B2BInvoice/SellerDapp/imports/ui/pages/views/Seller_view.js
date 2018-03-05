/**
Template Controllers

@module Templates
*/

/**
The view1 template

@class [template] views_view1
@constructor
*/
import './Seller_view.html';
import '../../components/Seller/seller_dashboard.js';
import '../../components/Seller/seller_rfq.js';

Template['Seller_view'].helpers({
    /**
    Get the name

    @method (name)
    */

  /*  'name': function(){
        return this.name || TAPi18n.__('dapp.view1.defaultName');
    }*/
});

// When the template is created
Template['Seller_view'].onCreated(function(){
	//Meta.setSuffix(TAPi18n.__("dapp.view1.title"));
});
