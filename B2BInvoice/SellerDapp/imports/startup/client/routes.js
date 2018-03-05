import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';

// Import needed templates
import '../../ui/layouts/body/body.js';
import '../../ui/layouts/header/header.js';
import '../../ui/layouts/header/loginheader.js';
import '../../ui/layouts/footer/footer.js';
import '../../ui/pages/views/Seller_view.js';
import '../../ui/pages/views/Admin_view.js';
import '../../ui/pages/views/RFQ_Details_view.js';
import '../../ui/pages/views/login.js';

// Set up all routes in the app

FlowRouter.route('/admin', {
  name: 'App.admin',
  triggersEnter: [function(context, redirect) {
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'Admin_view', footer:'footer' });
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
    if(!Session.get("SellerUserName"))
      redirect('/login');
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'Seller_view', footer:'footer' });
  },
});

FlowRouter.route('/order', {
  name: 'App.order',
  triggersEnter: [function(context, redirect) {
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'Seller_view', footer:'footer' });
  },
});

FlowRouter.route('/Request/:rfq', {
  name: 'App.rfq.details',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("SellerUserName"))
      redirect('/login');
  }],
  action:function(params,queryParams) {
    console.log(params)
      BlazeLayout.render('App_body', { top:'header', main: 'RFQ_Details_view',footer:'footer'});  
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
    BlazeLayout.render('App_body', { top:'header', main: 'Seller_view', footer:'footer' });
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

  