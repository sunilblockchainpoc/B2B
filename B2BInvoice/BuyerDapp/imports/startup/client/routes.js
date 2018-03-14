import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';

// Import needed templates
import '../../ui/layouts/body/body.js';
import '../../ui/layouts/header/header.js';
import '../../ui/layouts/header/loginheader.js';
import '../../ui/layouts/footer/footer.js';
import '../../ui/pages/views/Buyer_view.js';
import '../../ui/pages/views/Admin_view.js';
import '../../ui/pages/views/RFQ_Details_view.js';
import '../../ui/pages/views/PurchaseOrder_Create.js';
import '../../ui/pages/views/PurchaseOrder_details.js';
import '../../ui/pages/views/Invoice_Details_view.js';
import '../../ui/pages/views/login.js';
import '../../ui/pages/views/Shipment_Details_view.js';
import '../../ui/pages/views/Events_view.js';

// Set up all routes in the app

FlowRouter.route('/admin', {
  name: 'App.admin',
  triggersEnter: [function(context, redirect) {
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'Admin_view', footer:'footer' });
  },
});


FlowRouter.route('/events', {
  name: 'App.events',
  triggersEnter: [function(context, redirect) {
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'Events_view', footer:'footer' });
  },
});


FlowRouter.route('/login', {
  name: 'App.login',
  triggersEnter: [function(context, redirect) {
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'login', footer:'footer' });
  },
});

FlowRouter.route('/', {
  name: 'App.home',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("BuyerUserName"))
      redirect('/login');
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'Buyer_view', footer:'footer' });
  },
});

FlowRouter.route('/order', {
  name: 'App.order',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("BuyerUserName"))
    redirect('/login');
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'Buyer_view', footer:'footer' });
  },
});

FlowRouter.route('/Request/:rfq', {
  name: 'App.rfq.details',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("BuyerUserName"))
      redirect('/login');
  }],
  action:function(params,queryParams) {
      BlazeLayout.render('App_body', { top:'header', main: 'RFQ_Details_view',footer:'footer'});  
  },
});

FlowRouter.route('/PurchaseOrder/Create', {
  name: 'App.po.create',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("BuyerUserName"))
      redirect('/login');
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'PurchaseOrder_Create', footer:'footer' });
  },
});

FlowRouter.route('/blockData/:blockNumber', {
  name: 'App.block.details',
  triggersEnter: [function(context, redirect) {
  //window.open("http://localhost:8000/#/block/284")
      //redirect('/login');
  }],
  action:function(params,queryParams) {
    window.open("http://localhost:8000/#/block/"+params.blockNumber)
    //console.log(params)
    BlazeLayout.render('App_body', { top:'header', main: 'Events_view', footer:'footer' });
  },
});

FlowRouter.route('/PurchaseOrder/Details/:poNumber', {
  name: 'App.po.details',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("BuyerUserName"))
      redirect('/login');
  }],
  action:function(params,queryParams) {
    //console.log(params)
    BlazeLayout.render('App_body', { top:'header', main: 'PurchaseOrder_details', footer:'footer' });
  },
});

FlowRouter.route('/Invoice/:inv', {
  name: 'App.invoice.details',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("BuyerUserName"))
      redirect('/login');
  }],
  action:function(params,queryParams) {
      BlazeLayout.render('App_body', { top:'header', main: 'Invoice_Details_view',footer:'footer'});  
  },
});

FlowRouter.route('/Shipment/:ship', {
  name: 'App.shipment.details',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("BuyerUserName"))
    redirect('/login');
  }],
  action:function (params,queryParams) {
    BlazeLayout.render('App_body', { top:'header', main: 'Shipment_Details_view', footer:'footer' });
  },
});



FlowRouter.route('/logout', {
  name: 'App.logout',
  triggersEnter: [function(context, redirect) {
    Session.clear();
    redirect('/login');
  }]
});
/*
FlowRouter.route('/', {
  name: 'App.home',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("CICUserName"))
      redirect('/login');
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'Buyer_view', footer:'footer' });
  },
});

FlowRouter.route('/login', {
  name: 'App.login',
  action() {
    BlazeLayout.render('App_body', { top:'loginheader', main: 'login', footer:'footer' });
  },
});


FlowRouter.route('/Request', {
  name: 'App.request',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("CICUserName"))
      redirect('/login');
  }],
  action() {
      BlazeLayout.render('App_body', {top:'header', main: 'Client_request', footer:'footer' });
  }
});

FlowRouter.route('/Request/:rfq', {
  name: 'App.client.rfq.update',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("CICUserName"))
      redirect('/login');
  }],
  action:function(params,queryParams) {
      BlazeLayout.render('App_body', { top:'header', main: 'Client_request_update',footer:'footer'});  
  },
});




FlowRouter.route('/client_wo', {
  name: 'App.client.workorder',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("CICUserName"))
      redirect('/login');
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'client_wo', footer:'footer' });
  },
});

FlowRouter.notFound = {
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'App_notFound',footer:'footer' });
  },
};

*/

  