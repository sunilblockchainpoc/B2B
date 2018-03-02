import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

var Web3 = require('web3');
var Future = require('fibers/future');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var Enum = require('enum');
var request  = require("request");

var rfqStatusEnum = new Enum({'Requested': 0, 'Responded': 1, 'Accepted': 2, 'Declined':3});
var shippingStatusEnum = new Enum({'Unknown': 0, 'Received': 1, 'Shipped': 2, 'Failed':3,'Delivered':4,'Acknowledged':5});

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(Meteor.settings.server.web3api));
}

var rolesRepositoryContractAddr = Meteor.settings.server.RolesRepositoryContractAddress;
const rolesRepositoryContractABI  = require('../../../startup/server/Contract/RolesRepository.json').abi;
const rolesRepositoryContractByteCode  = '0x' + require('../../../startup/server/Contract/RolesRepository.json').bytecode;
var rolesRepositoryContractInstance = web3.eth.contract(JSON.parse(rolesRepositoryContractABI)).at(rolesRepositoryContractAddr);


var userRepositoryContractAddr = Meteor.settings.server.UserRepositoryContractAddress;
const userRepositoryContractABI  = require('../../../startup/server/Contract/UserRepository.json').abi;
const userRepositoryContractByteCode  = '0x' + require('../../../startup/server/Contract/UserRepository.json').bytecode;
var userRepositoryContractInstance = web3.eth.contract(JSON.parse(userRepositoryContractABI)).at(userRepositoryContractAddr);

var RFQContractAddr = Meteor.settings.server.RFQContractAddress;
const RFQContractABI = require('../../../startup/server/Contract/RFQContract.json').abi;
const RFQContractByteCode = "0x" + require('../../../startup/server/Contract/RFQContract.json').bytecode;
var RFQContractInstance = web3.eth.contract(JSON.parse(RFQContractABI)).at(RFQContractAddr);


var POContractAddr = Meteor.settings.server.POContractAddress;
const POContractABI = require('../../../startup/server/Contract/POContract.json').abi;
const POContractByteCode = "0x" + require('../../../startup/server/Contract/POContract.json').bytecode;
var POContractInstance = web3.eth.contract(JSON.parse(POContractABI)).at(POContractAddr);

var ShipmentContractAddr = Meteor.settings.server.ShipmentContractAddress;
const ShipmentContractABI = require('../../../startup/server/Contract/ShipmentContract.json').abi;
const ShipmentContractByteCode = "0x" + require('../../../startup/server/Contract/ShipmentContract.json').bytecode;
var ShipmentContractInstance = web3.eth.contract(JSON.parse(ShipmentContractABI)).at(ShipmentContractAddr);

var const_gas = 4700000;

Meteor.methods({

  // This method is used by different participants to login to the APP
  "login": function(params){
    var loginresult = userRepositoryContractInstance.login.call(params.username,params.password);
   var finalresult={};
   var groups = []
   var roles = [];

   if (loginresult[0]=="0x0000000000000000000000000000000000000000")
   loginresult[0] ="0x";
   
   if(loginresult[0].length > 2){
     for (var i = 0; i < loginresult[1].length;i++){
       if(parseInt(loginresult[1][i]) >0)
           groups.push(loginresult[1][i]);
     }
 
     for (var i = 0; i < loginresult[2].length;i++){
       if(parseInt(loginresult[2][i]) >0)
         roles.push(loginresult[2][i]);
     }
 
   }
   finalresult = {address:loginresult[0], groups: groups, roles:roles}; 
   return finalresult;
 },

  /*    
      function getShipmentDetail(uint shipmentID) view public returns 
      (uint shipmentNo,uint packageID,string shipmentDescription,uint shipmentDate,ShipmentStatus status,
        string shipmentReceiptFileName,string shipmentReceiptFileHash) {
    */
  "getAllShippingDetails": function(params){ 

    var shipmentID = params.shipmentID;
    var index = shipmentID - 1;
    var shippingDetails;
    var ShippingList = new Array;

    // Get all the shipping count 

    var shipmentCount = ShipmentContractInstance.getShipmentCount.call();

    for ( var index = 0 ; index < shipmentCount; index++) {
      
      shippingDetails = ShipmentContractInstance.getShipmentDetail(index);

      var r_shipmentNo = parseInt(shippingDetails[0]);
      var packageID = parseInt(shippingDetails[1]);
      var shipmentDescription = shippingDetails[2];
      var shipmentDate = shippingDetails[3];
      var shippingStatus = shippingStatusEnum.get(parseInt(shippingDetails[4])).key;
      var shipmentFileName = shippingDetails[5];
      var shipmentFileHash = shippingDetails[6];
  
      var shippingURL = "?name=" +shipmentFileName + "&filehash=" +shipmentFileHash;//TODO
  
      var data = {shipmentID:r_shipmentNo,shipmentDescription:shipmentDescription,shipmentDate:shipmentDate,
                  shippingStatus:shippingStatus,shipmentFileName:shipmentFileName,shippingURL:shippingURL};
      
      ShippingList.push(data);
    }
    return ShippingList;
  },





  

});

