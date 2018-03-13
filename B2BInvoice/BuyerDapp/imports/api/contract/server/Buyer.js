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
   
   console.log("Login method invoked")
   var loginresult = userRepositoryContractInstance.login.call(params.username,params.password);
   var finalresult={};
   var groups = []
   var roles = [];
   console.log("loginresult[0]"+loginresult[0]);

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
    var jsonFileData = {fileName:params.username+".json", file: new Buffer(JSON.stringify(params.ProductData))};
    
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
        var poNumber = parseInt(POContractInstance.getPONumberByrfqID(rfqID));
        var Details = POContractInstance.getInvoiceAndPackageByPO(poNumber);
        var invoiceNo = parseInt(Details[0]);
        var packageID = parseInt(Details[1]);
        var shipmentID = parseInt(ShipmentContractInstance.getShipmentIDByPackageID(packageID));

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

    var reqURL, resURL;
    var RFQDetail;
  
    var index = params.rfqID - 1;
    var RFQ = RFQContractInstance.getRFQDetail.call(index)
    var rfqID = parseInt(RFQ[0]);
    var requestDate = new Date(parseInt(RFQ[1])).toISOString().slice(0,10);
    var reqProductFileHash = RFQ[8]; 
    var resProductFileHash = RFQ[9];   
    var reqproductDetailsJSON;
    if (reqProductFileHash.length > 0)
      reqproductDetailsJSON = getJSONObject(params.rfqID,reqProductFileHash);

    // Information Populated only when the RFQ Status is - Requested    
    // Requested Product information services file

    var resFileName = ""
    var resFileHash = ""
    var responseDate = ""
    var resURL = ""
    var resproductDetailsJSON = ""
    // Information Populated only when the RFQ Status is - Responded
    if (rfqStatusEnum.get(parseInt(RFQ[2])).value != rfqStatusEnum.Requested ){

      if (resProductFileHash.length > 0)
        resproductDetailsJSON = getJSONObject(params.rfqID,resProductFileHash);
      
      resFileName = RFQ[6];// Seller Responded RFQ Filename
      resFileHash = RFQ[7];// Seller Responded RFQ FileHash
  
      resURL = "?name=" +resFileName + "&filehash=" +resFileHash
      responseDate = new Date(parseInt(RFQ[4])).toISOString().slice(0,10);
    }

    var data = {
                  rfqID:rfqID,
                  requestDate:requestDate,
                  status:rfqStatusEnum.get(parseInt(RFQ[2])).key,
                  responseBy:RFQ[3],
                  responseDt:responseDate,
                  rfqValue:parseInt(RFQ[5]),
                  resFileName:resFileName,
                  resURL:resURL,
                  reqproductDetailsJSON:reqproductDetailsJSON,
                  resproductDetailsJSON:resproductDetailsJSON
               }
    RFQDetail = data;
    return RFQDetail;
  },


  /************************************************************************************************** 
    Get Account Balance
   ***************************************************************************************************/   
  "getBalance":function(params) {
    var accountInfo = new Array;
    //console.log(params);
    var result = web3.eth.getBalance(params.address);
    bal = web3.fromWei(result,"ether");
    data = { account_number:params.address, balance:parseInt(bal)}
    console.log(data)
    return data;
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
      var rfqID = parseInt(poDetails[0]);
      var r_poDescription = poDetails[2];
      var r_poReqDate = parseInt(poDetails[3]);
      var poFileName = poDetails[4];
      var poFileHash = poDetails[5];
      var poFileURL = "?name=" +poFileName + "&filehash=" +poFileHash;
      var data = {rfqID: rfqID,poNumber:r_poNumber,poDescription:r_poDescription,poDate:r_poReqDate,FileName:poFileName,poFileURL:poFileURL};
      return data;
  },



  //function getInvoiceDetailsByInvoiceIndex(uint invoiceIndex) view public returns 
  //(uint poNumber, uint invoiceNumber, uint packageID, string invoiceReceiptFileName, 
  //string invoiceReceiptFileHash, string packageSlipFileName, string packageSlipFileHash) {

    "getInvoiceDetailByInvoiceNumber": function(params){ 

      var invoiceNumber = params.invoiceNumber;
      var index = invoiceNumber - 1;
  
      var invoiceDetails = POContractInstance.getInvoiceDetailsByInvoiceIndex(index);
      var InvoiceList;
  
      var r_invoiceNumber = parseInt(invoiceDetails[1]);
      
      if (r_invoiceNumber != invoiceNumber) 
        return;
      
      var poNumber = parseInt(invoiceDetails[0]);
      var invoiceAmount = parseInt(invoiceDetails[2]);
      var invoiceFileName = invoiceDetails[3];
      var invoiceFileHash = invoiceDetails[4];
      var invoiceDate  = new Date(parseInt(invoiceDetails[5])).toISOString().slice(0,10);
      var requestBy = invoiceDetails[6];
  
      var invoiceURL = "?name=" +invoiceFileName + "&filehash=" +invoiceFileHash;
      var data = {poNumber:poNumber,invoiceNumber:r_invoiceNumber,invoiceAmount:invoiceAmount,invoiceFileName:invoiceFileName,invoiceURL:invoiceURL,invoiceDate:invoiceDate,requestBy:requestBy};
      
      InvoiceList = data;
      return InvoiceList;
    },

  /*    
      function getShipmentDetail(uint shipmentID) view public returns 
      (uint shipmentNo,uint packageID,string shipmentDescription,uint shipmentDate,ShipmentStatus status,
        string shipmentReceiptFileName,string shipmentReceiptFileHash) {
    */
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

  // This method is used to accept or decline the RFQ
  //function acceptorDeclineQuote(RFQStatus status, uint rfqID) onlyBuyer public {
  "acceptOrDeclineQuote" :function(params){
   
    // Input Params
    var rfqID = params.rfqID;
    var status = params.status;
    var rfqAmount = params.rfqAmount;

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
              future.return(result.args.isSuccess);
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
    var fileName = params.OriginalFileName;

    var uploadURL = Meteor.settings.server.uploadURL;
    var data = {fileName:params.OriginalFileName, file: new Buffer(params.File)}
    var asyncFunc  = Meteor.wrapAsync( HTTP.post );

    var uploadResult = asyncFunc(uploadURL,{
      headers: {
        'Content-Type': 'application/json'
      },
      content:JSON.stringify(data)
    }); 

    var poFileHash = uploadResult.content;

    // Transaction object
    var transactionObject = {
      data: POContractByteCode, 
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
      rfqID,description,poReqDate,fileName,poFileHash,transactionObject,function(err,result)
    {
      if(err){
        console.log(err);
        future.return(err);
      }
      else{
          PurchaseOrderCreatedEvent.watch(function(error,result){
          if(result.blockNumber>block && result.args.status && result.args.rfqID == rfqID ){
            PurchaseOrderCreatedEvent.stopWatching();
              console.log("PO Number :"+result.args.status);
              future.return(parseInt(result.args.ponumber));
          }
        })
      }
    });
    return future.wait();
  },

  
    // This method is used to the send payment according to invoice number
    "payInvoiceAmountToContract" : function(params) {
       
      var invoiceAmount = params.invoiceAmount;
      var index = params.invoiceNumber - 1;

      // Transaction object
        var transactionObject = {
        data: POContractByteCode, 
        from: params.nodeAddress,
        to: POContractAddr,
        value: web3.toWei(invoiceAmount,'ether'),
        gasPrice: web3.eth.gasPrice,
        gas: const_gas
      };

    var PaymentStatusEvent = POContractInstance.PaymentStatus();
    var block = web3.eth.getBlock('latest').number;
    var future = new Future();
    
      POContractInstance.payInvoiceAmountToContract.sendTransaction(
                                    index,transactionObject,function(err,result)
      {
        if(err){
          console.log(err);
        }
        else{
      /************************* PaymentStatus Event Handling start**********************************/
          console.log("PaymentStatus  - Event watch started")
          PaymentStatusEvent.watch(function(error,result){
          console.log(result.blockNumber+">"+block)
          console.log(result.args.status)
          
          if(result.blockNumber>block && result.args.status){
              PaymentStatusEvent.stopWatching();
              console.log("Payment complete")
              future.return(true);
          }
        });
        console.log("PaymentStatus  - Event watch ended")
        /************************* PaymentStatus Event Handling End  **********************************/
        }
      });
      return future.wait();
    },

  // This method is used by the Buyer to acknowledge the shipment
  "updateShipmentStatus": function(params){ 

    // Transaction object
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
    console.log("Shipping  - Update status")

    ShipmentContractInstance.updateShipmentStatus.sendTransaction(
      params.shipmentID, params.Status,params.StatusDate,params.StatusBy,transactionObject,function(err,result){
      if(err){
        console.log(err);
        future.return(err);
      }
      else{

        console.log("Shipping Event watch Started")

        ShipmentStatusUpdateEvent.watch(function(error,result){
          console.log(result.blockNumber+">"+block)
          console.log(result.args.isSuccess)
          console.log(result.args.shipmentID+"="+params.shipmentID)


          if(result.blockNumber>block && result.args.isSuccess && result.args.shipmentID == params.shipmentID ){
                  ShipmentStatusUpdateEvent.stopWatching();

                  console.log("Shipping Event watch Ended")
                  
/************************* Release Payment to Shipper - START **************************** */
     //    function releasePayment(uint packageID) public onlyBuyer {
      console.log("Shipping Event watch stopped")
      console.log("Shipment ID:"+params.shipmentID)
         
      var shippingDetails = ShipmentContractInstance.getShipmentDetail(params.shipmentID);
      var r_shipmentNo = parseInt(shippingDetails[0]);
      var packageID = parseInt(shippingDetails[1]);
      console.log("Shipment Number:"+r_shipmentNo);
      console.log("Package ID:"+packageID);
      var po_transactionObject = {
                                  data: POContractByteCode, 
                                  from: params.nodeAddress,
                                  gasPrice: web3.eth.gasPrice,
                                  gas: const_gas
                                  };
      var block1 = web3.eth.getBlock('latest').number;
      var PaymentStatusEvent = POContractInstance.PaymentStatus();

      // Sending Transaction
      POContractInstance.releasePayment.sendTransaction(
        packageID,po_transactionObject,function(err,result)
      {

      /************************* PaymentStatus Event Handling start**********************************/
      console.log("PaymentStatus  - Event watch started")
      PaymentStatusEvent.watch(function(error,result){
      console.log(result.blockNumber+">"+block)
      console.log(result.args.status)
      
      if(result.blockNumber>block1 && result.args.status){
          PaymentStatusEvent.stopWatching();
          console.log("Payment complete")
          future.return(true);
      }
      else {
          future.return(false);
      }

    });
    console.log("PaymentStatus  - Event watch ended")
    /************************* PaymentStatus Event Handling End  **********************************/
      });                   
                 
    /************************* Release Payment to Shipper - END **************************** */
                 
                  future.return(result.args.isSuccess);
              }
            })
      }
    });
    return future.wait();
  },
});

function getJSONObject (name,filehash)
{
  var downloadURL = Meteor.settings.server.downloadURL;
  var finalparams = {"name":name + ".json","filehash": filehash};
  var url = path.join(Meteor.settings.server.tempPath,'downloads',name + ".json");
  var future = new Future();
  request({url:downloadURL,qs:finalparams},function(err,response,body){
  if(!err & response.statusCode==200)
    {
      fs.writeFileSync(url,response.body,{encoding:'base64'})
      fs.readFile(url,function(err,contents){
        if(err)
          future.return(err);
        if(contents) {
          var reqJSON = JSON.parse(contents);
          future.return(reqJSON);
        }
      })
      
    }
  });return future.wait();
}