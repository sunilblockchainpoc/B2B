import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';

// Import needed templates
import '../../ui/layouts/body/body.js';
import '../../ui/layouts/header/header.js';
import '../../ui/layouts/header/loginheader.js';
import '../../ui/layouts/footer/footer.js';
import '../../ui/pages/views/Shipper_view.js';
import '../../ui/pages/views/Shipment_Details_view.js';
import '../../ui/pages/views/Admin_view.js';
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
    if(!Session.get("ShipperUserName"))
      redirect('/login');
  }],
  action() {
    BlazeLayout.render('App_body', { top:'header', main: 'Shipper_view', footer:'footer' });
  },
});

FlowRouter.route('/Shipment/:ship', {
  name: 'App.shipment.details',
  triggersEnter: [function(context, redirect) {
    if(!Session.get("ShipperUserName"))
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

  