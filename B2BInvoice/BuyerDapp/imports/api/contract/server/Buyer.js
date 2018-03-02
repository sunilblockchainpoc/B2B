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

  // Contract Definition -     
  //function requestRFQ(string requestBy, uint requestDt, string reqProductFileHash ) onlyBuyer public {
  "requestRFQ" :function(params){
   
    /* Upload Product details file into IPFS */
    var uploadURL = Meteor.settings.server.uploadURL;
    var asyncFunc  = Meteor.wrapAsync( HTTP.post );
    var jsonFileData = {fileName:params.username+".json", file: new Buffer(JSON.stringify(params.ServiceData))};
    
    var jsonresult =  asyncFunc(uploadURL,{
      headers: {
        'Content-Type': 'application/json'
      },  
      content:JSON.stringify(jsonFileData)
    }); 
    
    // Input Params
    var requestBy = params.username;
    var rfqRequestDt = new Date().setHours(0,0,0,0);
    var reqProductFileHash = jsonresult.content;

    // Transaction object
    var transactionObject = {
      data: RFQContractByteCode, 
      from: params.nodeAddress,
      gasPrice: web3.eth.gasPrice,
      gas: const_gas
    };

    web3.eth.estimateGas(transactionObject,function(err,estimateGas){
      if(!err)
        transactionObject.gas = estimateGas * 2;
    });

    // Event Handling
    // event RFQRequested(uint rfqID,string requestBy,bool status);
    var requestRFQEvent = RFQContractInstance.RFQRequested();
    var block = web3.eth.getBlock('latest').number;
    var future = new Future();

    // Sending Transaction
    RFQContractInstance.requestRFQ.sendTransaction(
      requestBy,rfqRequestDt,reqProductFileHash,transactionObject,function(err,result)
    {
      if(err){
        console.log(err);
        future.return(err);
      }
      else{
          requestRFQEvent.watch(function(error,result){
          if(result.blockNumber>block && result.args.status && result.args.requestBy == requestBy ){
              requestRFQEvent.stopWatching();
              console.log("ID:"+result.args.rfqID);
              future.return(parseInt(result.args.rfqID));
          }
        })
      }
    });
    return future.wait();
  },


 // This method is used to get the relevant details of Buyer Dashboard RFQ No,PO,Invoice Num,Shipment Tracking ID
 "getBuyerDashBoardDetails": function(){ 
  var RFQ;
  var reqURL, resURL;
  var RFQCount = RFQContractInstance.getRFQCount.call();
  var RFQList = new Array;

  if(RFQCount > 0) {

    for(var index=0;index<RFQCount;index++) {
      
        RFQ = RFQContractInstance.getRFQDetail.call(index);
        var rfqID = parseInt(RFQ[0]);
        var poNumber = POContractInstance.getPONumberByrfqID(rfqID);        
        var Details = POContractInstance.getInvoiceAndPackageByPO(poNumber);
        var invoiceNo = parseInt(Details[0]);
        var packageID = parseInt(Details[1]);
        var shipmentID = ShipmentContractInstance.getShipmentIDByPackageID(packageID);

        var data = {rfqID:rfqID,poNumber:poNumber,invoiceNo:invoiceNo,shipmentID:shipmentID};

      RFQList.push(data);
    }
  }
  return RFQList;
},

  // This method captures complete RFQ details for the given RFQ ID
  /* Contract method - 
   function getRFQDetail(uint rfqIndex) public view returns(uint rfqId,uint requestDt,   
                    RFQStatus status,string responseBy ,uint responseDt,uint rfqValue, string resFileName, string resFileHash,
                    string reqProductFileHash,string resProductFileHash)


  */
  "getRFQDetailByrfqID": function(params){ 

    var RFQ;
    var reqURL, resURL;
    var RFQCount = RFQContractInstance.getRFQCount.call();
    var RFQList = new Array;
    var rfqID = params.rfqID;

    if(RFQCount > 0) {
      for(var index=0;index<RFQCount;index++) {
        
        RFQ = RFQContractInstance.getRFQDetail.call(index);

        resFileName = RFQ[6];
        resFileHash = RFQ[7];
        resURL = "?name=" +resFileName + "&filehash=" +resFileHash;
        
        reqProductFileName = RFQ[8];
        resProductFileHash = RFQ[9];
        resProductURL = "?name=" +reqProductFileName + "&filehash=" +resProductFileHash;

        var data = {
                      id:parseInt(RFQ[0]),
                      requestDt:parseInt(RFQ[1]),
                      status:rfqStatusEnum.get(parseInt(RFQ[2])).key,
                      responseBy:RFQ[3],
                      responseDt:parseInt(RFQ[4]),
                      rfqValue:parseInt(RFQ[5]),
                      resFileName:resFileName,
                      resURL:resURL,
                      reqProductFileName:reqProductFileName,
                      resProductURL:resProductURL
                   }
       if (rfqID==parseInt(RFQ[0])) {
          RFQList.push(data);
          break;
       }
      }
    }
    return RFQList;
  },

  // This method captures PO details for the given PO Number
  /* Contract method - 
    function getPurchaseOrderDetailByPOIndex(uint poIndex) view public returns 
    (uint rfqID, string description,uint poReqDate) {
  */

 "getPODetailByPONumber": function(params){ 

      var poNumber = params.poNumber;
      var index = poNumber - 1;
      var poDetails;
      var POList = new Array;

      poDetails = POContractInstance.getPurchaseOrderDetailByPOIndex(index);
      var r_poNumber = parseInt(poDetails[1]);

      if (r_poNumber != poNumber) return;
     
      var r_poDescription = poDetails[2];
      var r_poReqDate = parseInt(poDetails[3]);
      var data = {poNumber:r_poNumber,poDescription:r_poDescription,poDate:r_poReqDate};
      POList.push(data);
      return POList;
  },



  //function getInvoiceDetailsByInvoiceIndex(uint invoiceIndex) view public returns 
  //(uint poNumber, uint invoiceNumber, uint packageID, string invoiceReceiptFileName, 
  //string invoiceReceiptFileHash, string packageSlipFileName, string packageSlipFileHash) {

  "getInvoiceDetailByInvoiceNumber": function(params){ 

    var invoiceNumber = params.invoiceNumber;
    var index = invoiceNumber - 1000000;
    var invoiceDetails;
    var InvoiceList = new Array;

    invoiceDetails = POContractInstance.getInvoiceDetailsByInvoiceIndex(index);
    var r_invoiceNumber = parseInt(invoiceDetails[1]);
    
    if (r_invoiceNumber != invoiceNumber) 
      return;
    
    var invoiceFileName = invoiceDetails[3];
    var invoiceFileHash = invoiceDetails[4];
    var invoiceURL = "?name=" +invoiceFileName + "&filehash=" +invoiceFileHash;

    var data = {invoiceNumber:r_invoiceNumber,invoiceFileName:invoiceFileName,invoiceURL:invoiceURL};
    InvoiceList.push(data);
    
    return InvoiceList;
  },


  /*    
      function getShipmentDetail(uint shipmentID) view public returns 
      (uint shipmentNo,uint packageID,string shipmentDescription,uint shipmentDate,ShipmentStatus status,
        string shipmentReceiptFileName,string shipmentReceiptFileHash) {
    */
  "getShippingDetailByShipmentID": function(params){ 

    var shipmentID = params.shipmentID;
    var index = shipmentID - 1;
    var shippingDetails;
    var ShippingList = new Array;

    shippingDetails = ShipmentContractInstance.getShipmentDetail(index);
    var r_shipmentNo = parseInt(invoiceDetails[1]);
    
    if (r_shipmentNo != shipmentID) 
      return;
    
    var shipmentDescription = shippingDetails[2];
    var shipmentDate = shippingDetails[3];
    var shippingStatus = shippingStatusEnum.get(parseInt(shippingDetails[4])).key;

    var shipmentFileName = shippingDetails[5];
    var shipmentFileHash = shippingDetails[6];

    var shippingURL = "?name=" +shipmentFileName + "&filehash=" +shipmentFileHash;

    var data = {shipmentID:r_shipmentNo,shipmentDescription:shipmentDescription,shipmentDate:shipmentDate,
                shippingStatus:shippingStatus,shipmentFileName:shipmentFileName,shippingURL:shippingURL};
    
    ShippingList.push(data);
    
    return ShippingList;
  },

  // This method is used to accept or decline the RFQ
  //function acceptorDeclineQuote(RFQStatus status, uint rfqID) onlyBuyer public {
  "acceptOrDeclineQuote" :function(params){
   
    // Input Params
    var rfqID = params.rfqID;
    var status = params.status;
``
    // Transaction object
    var transactionObject = {
      data: RFQContractByteCode, 
      from: params.nodeAddress,
      gasPrice: web3.eth.gasPrice,
      gas: const_gas
    };

    web3.eth.estimateGas(transactionObject,function(err,estimateGas){
      if(!err)
        transactionObject.gas = estimateGas * 2;
    });

    // Event Handling
    //     event RFQstatusUpdate(uint rfqID,RFQStatus status,bool isSuccess);
    var RFQstatusUpdateEvent = RFQContractInstance.RFQstatusUpdate();
    var block = web3.eth.getBlock('latest').number;
    var future = new Future();
    // Sending Transaction
    RFQContractInstance.acceptorDeclineQuote.sendTransaction(
      status,rfqID,transactionObject,function(err,result)
    {
      if(err){
        console.log(err);
        future.return(err);
      }
      else{
        RFQstatusUpdateEvent.watch(function(error,result){
          if(result.blockNumber>block && result.args.isSuccess && result.args.rfqID == rfqID ){
            RFQstatusUpdateEvent.stopWatching();
              console.log("RFQ status update :"+result.args.isSuccess);
              future.return(parseInt(result.args.isSuccess));
          }
        })
      }
    });
    return future.wait();
  }, 

  // This method is used by the Buyer to create Purchase Order
  // function createPurchaseOrder(uint rfqID,string description,uint poReqDate ) onlyBuyer public {
  "createPurchaseOrder" :function(params){
   
    // Input Params
    var rfqID = params.rfqID;
    var description = params.description;
    var poReqDate = new Date().setHours(0,0,0,0);


    // Transaction object
    var transactionObject = {
      data: RFQContractByteCode, 
      from: params.nodeAddress,
      gasPrice: web3.eth.gasPrice,
      gas: const_gas
    };

    web3.eth.estimateGas(transactionObject,function(err,estimateGas){
      if(!err)
        transactionObject.gas = estimateGas * 2;
    });

    // Event Handling
    // event PurchaseOrderCreated(uint rfqID,uint ponumber,bool status);


    var PurchaseOrderCreatedEvent = POContractInstance.PurchaseOrderCreated();
    var block = web3.eth.getBlock('latest').number;
    var future = new Future();
    // Sending Transaction
    POContractInstance.createPurchaseOrder.sendTransaction(
      rfqID,description,poReqDate,transactionObject,function(err,result)
    {
      if(err){
        console.log(err);
        future.return(err);
      }
      else{
        PurchaseOrderCreatedEvent.watch(function(error,result){
          if(result.blockNumber>block && result.args.isSuccess && result.args.rfqID == rfqID ){
            PurchaseOrderCreatedEvent.stopWatching();
              console.log("PO Number :"+result.args.status);
              future.return(parseInt(result.args.status));
          }
        })
      }
    });
    return future.wait();
  },

  // This method is used by the Buyer to acknowledge the shipment
  "acknowledgeShippment" :function(params){
   
    // Input Params
    var shipmentID = params.shippingID;
    var requestBy = params.username;
    var rfqRequestDt = new Date().setHours(0,0,0,0);
    var reqProductFileHash = jsonresult.content;
``
    // Transaction object
    var transactionObject = {
      data: RFQContractByteCode, 
      from: params.nodeAddress,
      gasPrice: web3.eth.gasPrice,
      gas: const_gas
    };

    web3.eth.estimateGas(transactionObject,function(err,estimateGas){
      if(!err)
        transactionObject.gas = estimateGas * 2;
    });

    // Event Handling
    // event ShipmentStatusUpdate(uint shipmentID, ShipmentStatus status,bool isSuccess);

    var ShipmentStatusEvent = ShipmentContractInstance.ShipmentStatusUpdate();
    var block = web3.eth.getBlock('latest').number;
    var future = new Future();
    ShipmentStatusUpdate
    // Sending Transaction
    ShipmentContractInstance.updateShipmentStatus.sendTransaction(
      shipmentID,shippingStatusEnum.Acknowledged,transactionObject,function(err,result)
    {
      if(err){
        console.log(err);
        future.return(err);
      }
      else{
        ShipmentStatusEvent.watch(function(error,result){
          if(result.blockNumber>block && result.args.isSuccess && result.args.shipmentID == shipmentID ){
              ShipmentStatusEvent.stopWatching();
              console.log("Shipping status update :"+result.args.isSuccess);
              future.return(parseInt(result.args.isSuccess));
          }
        })
      }
    });
    return future.wait();
  },

});

