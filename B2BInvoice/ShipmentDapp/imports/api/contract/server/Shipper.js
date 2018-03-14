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
var shippingStatusEnum = new Enum({'Requested': 0, 'Received': 1, 'Shipped': 2, 'Failed':3,'Delivered':4,'Acknowledged':5});

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
  "getShipmentList": function(){ 

    //var shipmentID = params.shipmentID;
    //var index = shipmentID - 1;
    var shippingDetails,additionalDetails;
    var ShippingList = new Array;

    // Get all the shipping count 

    var shipmentCount = ShipmentContractInstance.getShipmentCount.call();
    console.log(shipmentCount);

    for ( var index = 0 ; index < shipmentCount; index++) {
      
      shippingDetails = ShipmentContractInstance.getShipmentDetail(index+1);

      var r_shipmentNo = parseInt(shippingDetails[0]);
      var packageID = parseInt(shippingDetails[1]);
      var shipmentDescription = shippingDetails[2];
      var shipmentDate = parseInt(shippingDetails[3]);
      var shippingStatus = shippingStatusEnum.get(parseInt(shippingDetails[4])).key;
      var shippingCost = parseInt(shippingDetails[5]);

      var shipmentStatusDate;
      var shipmentStatusBy;
      var shipmentFileName;
      var shipmentFileHash;
      var shippingURL;

      additionalDetails = ShipmentContractInstance.getShipmentAdditionalDetail(index+1);

      additionalShipmentNo = parseInt(additionalDetails[0]);
      if(r_shipmentNo==additionalShipmentNo) {
        shipmentStatusDate = parseInt(additionalDetails[1]);
        shipmentStatusBy = additionalDetails[2];
        shipmentFileName = additionalDetails[3];
        shipmentFileHash = additionalDetails[4];
        shippingURL = "?name=" +shipmentFileName + "&filehash=" +shipmentFileHash;//TODO
      }
  
      var data = {shipmentID:r_shipmentNo,shipmentDescription:shipmentDescription,shipmentDate:shipmentDate,
                  shippingStatus:shippingStatus,Cost: shippingCost,statusBy: shipmentStatusBy,statusDate: shipmentStatusDate,shipmentFileName:shipmentFileName,shippingURL:shippingURL};
      
      ShippingList.push(data);
    }
    return ShippingList;
  },

  "getShipmentDetail": function(params){ 

    var shipmentID = params.shipmentID;
    //var index = shipmentID - 1;
    var shippingDetails,additionalDetails;
    var shipmentStatusDate;
    var shipmentStatusBy;
    var shipmentFileName;
    var shipmentFileHash;
    var shippingURL;
    
    shippingDetails = ShipmentContractInstance.getShipmentDetail(shipmentID);

    var r_shipmentNo = parseInt(shippingDetails[0]);
    var packageID = parseInt(shippingDetails[1]);
    var shipmentDescription = shippingDetails[2];
    
    var shipmentDate = new Date(parseInt(shippingDetails[3])).toISOString().slice(0,10);
    var shippingStatus = shippingStatusEnum.get(parseInt(shippingDetails[4])).key;

    var shippingCost = parseInt(shippingDetails[5]);
 
    additionalDetails = ShipmentContractInstance.getShipmentAdditionalDetail(shipmentID );

    additionalShipmentNo = parseInt(additionalDetails[0]);
    if(r_shipmentNo==additionalShipmentNo) {
      shipmentStatusDate = new Date(parseInt(additionalDetails[1])).toISOString().slice(0,10);
      shipmentStatusBy = additionalDetails[2];
      shipmentFileName = additionalDetails[3];
      shipmentFileHash = additionalDetails[4];
      shippingURL = "?name=" +shipmentFileName + "&filehash=" +shipmentFileHash;//TODO
    }
  
    var data = {shipmentID:r_shipmentNo,shipmentDescription:shipmentDescription,shipmentDate:shipmentDate,
                shippingStatus:shippingStatus,Cost: shippingCost,statusBy: shipmentStatusBy,statusDate: shipmentStatusDate,shipmentFileName:shipmentFileName,shippingURL:shippingURL};
    
    return data;
  },

  "updateShimpmentDetails": function(params){ 

    var uploadURL = Meteor.settings.server.uploadURL;
    var data = {fileName:params.OriginalFileName, file: new Buffer(params.File)}
    var asyncFunc  = Meteor.wrapAsync( HTTP.post );

    var shipmentDate = new Date(params.shipmentDate).setHours(0,0,0,0);

    var uploadResult = asyncFunc(uploadURL,{
      headers: {
        'Content-Type': 'application/json'
      },
      content:JSON.stringify(data)
    }); 

    var shipmentFileHash = uploadResult.content;

    var transactionObject = {
      data: ShipmentContractByteCode, 
      from: params.nodeAddress,
      gasPrice: web3.eth.gasPrice,
      gas: const_gas
    };

    web3.eth.estimateGas(transactionObject,function(err,estimateGas){
      if(!err)
        transactionObject.gas = estimateGas * 2;
    });

    var ShipmentUpdatedEvent = ShipmentContractInstance.ShipmentUpdated();
    var block = web3.eth.getBlock('latest').number;
    var future = new Future();
   
    ShipmentContractInstance.updateShipmentDetails.sendTransaction(
      params.shipmentID,shipmentDate,params.shipmentDescription,params.shipmentCost,params.OriginalFileName,shipmentFileHash,transactionObject,function(err,result){
      if(err){
        console.log(err);
        future.return(err);
      }
      else{
            ShipmentUpdatedEvent.watch(function(error,result){
              if(result.blockNumber>block && result.args.updated && result.args.shipmentID == params.shipmentID ){
                  ShipmentUpdatedEvent.stopWatching();
                  console.log("Shipment Details Updated" + result.args.updated)
                  //future.return(result.args.updated);

                  var ShipmentStatusUpdateEvent = ShipmentContractInstance.ShipmentStatusUpdate();
                  var block2 = web3.eth.getBlock('latest').number;
              
                  ShipmentContractInstance.updateShipmentStatus.sendTransaction(
                  params.shipmentID, params.Status,params.StatusDate,params.StatusBy,transactionObject,function(err,result){
                  if(err){
                    console.log(err);
                    future.return(err);
                  }
                  else{
                        ShipmentStatusUpdateEvent.watch(function(error,result2){
                          if(result2.blockNumber>block2 && result2.args.isSuccess && result2.args.shipmentID == params.shipmentID ){
                            console.log(result2);
                              ShipmentStatusUpdateEvent.stopWatching();
                              future.return(result2.args.isSuccess);
                          }
                        })
                      }
                  });
              }
            })
      }
    });
    return future.wait();
  },

  "updateShipmentStatus": function(params){ 

    var transactionObject = {
      data: ShipmentContractByteCode, 
      from: params.nodeAddress,
      gasPrice: web3.eth.gasPrice,
      gas: const_gas
    };

    web3.eth.estimateGas(transactionObject,function(err,estimateGas){
      if(!err)
        transactionObject.gas = estimateGas * 2;
    });

    var ShipmentStatusUpdateEvent = ShipmentContractInstance.ShipmentStatusUpdate();
    var block = web3.eth.getBlock('latest').number;
    var future = new Future();


    ShipmentContractInstance.updateShipmentStatus.sendTransaction(
      params.shipmentID, params.Status,params.StatusDate,params.StatusBy,transactionObject,function(err,result){
      if(err){
        console.log(err);
        future.return(err);
      }
      else{
            ShipmentStatusUpdateEvent.watch(function(error,result){
              if(result.blockNumber>block && result.args.isSuccess && result.args.shipmentID == params.shipmentID ){
                  ShipmentStatusUpdateEvent.stopWatching();
                  future.return(result.args.isSuccess);
              }
            })
      }
    });
    return future.wait();
  },





  

});

