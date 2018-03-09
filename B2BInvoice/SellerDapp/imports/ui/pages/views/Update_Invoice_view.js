/**
Template Controllers

@module Templates
*/

/**
The view1 template

@class [template] views_view1
@constructor
*/
import './Update_Invoice_view.html';
import '../../components/Seller/req_invoice_shipping.js';


var poNumber = new ReactiveVar();


Template['Update_Invoice_view'].helpers({
    /**
    Get the name

    @method (name)
    */

  /*  'name': function(){
        return this.name || TAPi18n.__('dapp.view1.defaultName');
    }*/
});

// When the template is created
Template['Update_Invoice_view'].onCreated(function(){

	//Meta.setSuffix(TAPi18n.__("dapp.view1.title"));poNumber
});

