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


  // This method is used by seller to respond with RFQ Details
  /* Contract Definition -     
     function respondToRFQ (uint rfqId, uint rfqValue, string responseBy, 
     uint responseDt, string resFileName, string resFileHash, string resProductFileHash, RFQStatus status) onlySeller public {
  */

  "respondRFQ" :function(params){
       /* Upload Product details file into IPFS */
    var uploadURL = Meteor.settings.server.uploadURL;
    var asyncFunc  = Meteor.wrapAsync( HTTP.post );
    var jsonFileData = {fileName:params.username+".json", file: new Buffer(JSON.stringify(params.ProductDetails))};

    var jsonresult =  asyncFunc(uploadURL,{
      headers: {
        'Content-Type': 'application/json'
      },  
      content:JSON.stringify(jsonFileData)
    }); 

    var responseFileName = params.OriginalFileName;
    var resFileData = {fileName:params.OriginalFileName, file: new Buffer(params.FileData)}

    // Upload the Quote information File into IPFS
    var uploadResult = asyncFunc(uploadURL,{
      headers: {
        'Content-Type': 'application/json'
      },
      content:JSON.stringify(resFileData)
    }); 

    // Response filename and filehash to be added
    var resFileHash = uploadResult.content;
    // Input Params
    var rfqID = params.rfqID;
    var rfqValue = params.rfqAmount;
    var responseBy = params.ResponseBy;
    var responseDt = new Date().setHours(0,0,0,0);
    var resProductFileHash = jsonresult.content;

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
    // event RFQResponded(uint rfqID,uint respondDate, bool status);
    var respondRFQEvent = RFQContractInstance.RFQResponded();
    var block = web3.eth.getBlock('latest').number;
    var future = new Future();

    /*   function respondToRFQ (uint rfqId, uint rfqValue, string responseBy, 
        uint responseDt, string resFileName, string resFileHash, string resProductFileHash, 
        RFQStatus status) onlySeller public {
    */
    // Sending Transaction
    RFQContractInstance.respondToRFQ.sendTransaction(
                                                       rfqID,
                                                       rfqValue,
                                                       responseBy,
                                                       responseDt,
                                                       responseFileName,
                                                       resFileHash,
                                                       resProductFileHash,
                                                       transactionObject,function(err,result)
    {
      if(err){
        console.log(err);
        future.return(err);
      }
      else{
        console.log("Response Event watch started")
        respondRFQEvent.watch(function(error,result){
        if(result.blockNumber>block && result.args.status && result.args.rfqID == rfqID ){
              respondRFQEvent.stopWatching();
              console.log("Responded to RFQ-ID :"+result.args.rfqID);
              console.log("Response Event watch Ended")
              future.return(parseInt(result.args.rfqID));
          }
        })
      }
    });
    return future.wait();
  },


 // This method is used to get the relevant details of Seller Dashboard RFQ No,PO,Invoice Num,Shipment Tracking ID
 "getSellerDashBoardDetails": function(){ 
  var RFQ;
  var reqURL, resURL;
  var RFQCount = RFQContractInstance.getRFQCount.call();
  var RFQList = new Array;

  if(RFQCount > 0) {

    for(var index=0;index<RFQCount;index++) {
        RFQ = RFQContractInstance.getRFQDetail.call(index);
        var rfqID = parseInt(RFQ[0]);
        var status = rfqStatusEnum.get(parseInt(RFQ[2])).key;
        var PODetail = POContractInstance.getPONumberByrfqID(rfqID);
        var poNumber = parseInt(PODetail);
        var invoiceNo = "";
        var packageNo = "";
        var shipmentStatus = "";
        var shipmentID = ""
        if (poNumber > 0) {

          var Details = POContractInstance.getInvoiceAndPackageByPO(poNumber);
          console.log(Details)
          var invoiceID = parseInt(Details[0])
          
          if (invoiceID > 0) {
            invoiceNo = invoiceID;
            packageNo = parseInt(Details[1]);
            shipmentID = parseInt(ShipmentContractInstance.getShipmentIDByPackageID(packageNo));
            var ShippingDetails = ShipmentContractInstance.getShipmentDetail(shipmentID);
            shipmentStatus = shippingStatusEnum.get(parseInt(ShippingDetails[4])).key;
          }
        }
        else {
          poNumber ="";
        }
        var data = {rfqID:rfqID,status:status,poNumber:poNumber,invoiceNo:invoiceNo,shipmentID:shipmentID,shipmentStatus:shipmentStatus};

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
    console.log(RFQDetail)
    return RFQDetail;
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

/* function getInvoiceDetailsByInvoiceIndex(uint invoiceIndex) view public returns 
  (uint poNumber, uint invoiceNumber, string invoiceReceiptFileName, string invoiceReceiptFileHash, 
  uint invoiceDate, string requestBy) {*/

   "getInvoiceDetailByInvoiceNumber": function(params){ 

    var invoiceNumber = params.invoiceNumber;
    var index = invoiceNumber - 1;
    console.log(index)

    var invoiceDetails = POContractInstance.getInvoiceDetailsByInvoiceIndex(index);
    var InvoiceList;
    console.log(invoiceDetails)

    var r_invoiceNumber = parseInt(invoiceDetails[1]);
    
    if (r_invoiceNumber != invoiceNumber) 
      return;
    
    var poNumber = parseInt(invoiceDetails[0]);
    var invoiceFileName = invoiceDetails[2];
    var invoiceFileHash = invoiceDetails[3];
    var invoiceDate = invoiceDetails[4];
    var requestBy = invoiceDetails[5];

    var invoiceURL = "?name=" +invoiceFileName + "&filehash=" +invoiceFileHash;
    var data = {poNumber:poNumber,invoiceNumber:r_invoiceNumber,invoiceFileName:invoiceFileName,invoiceURL:invoiceURL,invoiceDate:invoiceDate,requestBy:requestBy};
    
    InvoiceList = data;
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

  // This method is used by the Seller to create Invoice and Package Slip

  /* function createInvoice(address shipContractAddress,string packageDescription,
   uint poNumber,string invoiceReceiptFileName,string invoiceReceiptFileHash,
   string packageSlipFileName, string packageSlipFileHash ) onlySeller public {
  */
    "createInvoiceAndPurchaseSlip":function(params){

      // Config Params
      var uploadURL = Meteor.settings.server.uploadURL;
      var asyncFunc  = Meteor.wrapAsync( HTTP.post );

      // Input Params
      var packageDescription = params.packageDesc;
      var poNumber = params.poNumber;
      var invoiceFileName = params.invoiceFilename;
      var packageSlipFileName = params.packageFilename;
      var username = params.username;
      var address = params.address;
      var responseBy = params.ResponseBy;
      var responseDt = new Date().setHours(0,0,0,0);
  
      /****************** Uploading Invoice file to IPFS  ***************************************************/
      var invoiceFiledata = {fileName:params.invoiceFilename, file: new Buffer(params.invoiceFiledata)}
      
      var invoiceResult = asyncFunc(uploadURL,{
        headers: {
          'Content-Type': 'application/json'
        },
        content:JSON.stringify(invoiceFiledata)
      }); 
  
      // Invoice Filehash from IPFS
      var invoiceFileHash = invoiceResult.content;

      /****************** Uploading Package file to IPFS  ***************************************************/

      var packageFiledata = {fileName:params.packageFilename, file: new Buffer(params.packageFiledata)}
      
      var packageResult = asyncFunc(uploadURL,{
        headers: {
          'Content-Type': 'application/json'
        },
        content:JSON.stringify(packageFiledata)
      }); 
  
      // Invoice Filehash from IPFS
      var packageFileHash = packageResult.content;
      // Transaction object
      var transactionObject = {
        data: POContractByteCode,from: params.nodeAddress,gasPrice: web3.eth.gasPrice,gas: const_gas
      };
  
      web3.eth.estimateGas(transactionObject,function(err,estimateGas){
        if(!err)
          transactionObject.gas = estimateGas * 2;
      });
  
      // Event Handling
      // event InvoiceCreated(uint ponumber,uint invoiceNumber,uint packageID,bool status);

      var InvoiceCreatedEvent = POContractInstance.InvoiceCreated();
      var before_invoice_block = web3.eth.getBlock('latest').number;
      console.log("block="+before_invoice_block)
      var future = new Future();

      /* function createInvoice(uint invoiceDate,string reqBy,uint poNumber
      ,string invoiceReceiptFileName,string invoiceReceiptFileHash) onlySeller public { */

      // Sending Invoice Creation Transaction

      /********************************** Start Invoice Creation *************************************************** */
      
      POContractInstance.createInvoice.sendTransaction(  responseDt,
                                                         responseBy,
                                                         poNumber,
                                                         invoiceFileName,
                                                         invoiceFileHash,
                                        transactionObject,function(err,result) {
      if(err){
          console.log(err);
          future.return(err);
      }
      else {
              console.log("***********   Invoice Event watch started *****************")
              
              InvoiceCreatedEvent.watch(function(error,result){

              console.log("result.blockNumber="+result.blockNumber+",before_invoice_block="+before_invoice_block)
              console.log("result.args.status="+result.args.status)
              console.log("result.args.ponumber="+result.args.ponumber+",poNumber="+poNumber)
              console.log("Invoice Number : "+result.args.invoiceNumber);

              console.log("***********   Invoice Event watch Ended *****************")

                     if(result.blockNumber>before_invoice_block && result.args.status && result.args.ponumber == poNumber ) {
                        // Stop watching
                        InvoiceCreatedEvent.stopWatching();

                        var PackageSlipCreatedEvent = POContractInstance.PackageSlipCreated();
                        var block = web3.eth.getBlock('latest').number;
                        // Succes - Send another transaction.

      /********************************** Start Package Slip Creation *************************************************** */


                        POContractInstance.createPackageSlip.sendTransaction(responseDt,
                                                                           responseBy,
                                                                           packageDescription,
                                                                           poNumber,
                                                                           packageSlipFileName,
                                                                           packageFileHash,
                                                  transactionObject,function(err1,result1) {
                        if(err1){
                          console.log(err);
                          future.return(err1);
                        }
                        else {
                          console.log("\n\n***********   PackageSlip Event watch started *****************")

                          PackageSlipCreatedEvent.watch(function(error2,result2){

                            console.log("result2.blockNumber="+result2.blockNumber+",block="+block)
                            console.log("result2.args.status="+result2.args.status)
                            console.log("result2.args.ponumber="+result2.args.ponumber+",poNumber="+poNumber)
                            console.log("PackageSlip Number : "+result2.args.packageID);


                            console.log("***********   PackageSlip Event watch Ended *****************")

                                  if(result2.blockNumber>block && result2.args.status && result2.args.ponumber == poNumber ) {
                                  // Stop watching
                                    PackageSlipCreatedEvent.stopWatching();

          /********************************** Start Shipping Request *************************************************** */
          // function requestForShipment(uint packageID,string shipmentDescription, uint shipmentStatusDate,string shipmentStatusBy)  onlySeller public {

                    ShipmentContractInstance.requestForShipment.sendTransaction(result2.args.packageID,
                                                                         packageDescription,
                                                                         responseDt,
                                                                         responseBy,
                                                                         transactionObject,function(err3,result3) {

                      if(err3){
                        console.log(err3);
                        future.return(err3);
                      }
                      else {
                                  var ShipmentRequestedEvent = ShipmentContractInstance.ShipmentRequested();
                                  var block = web3.eth.getBlock('latest').number;
  
                                  console.log("\n\n***********   ShipmentRequested Event watch started *****************")
                                  ShipmentRequestedEvent.watch(function(error4,result4){

                                  console.log("result4.blockNumber="+result4.blockNumber+",block="+block)
                                  console.log("result4.args.status="+result4.args.status)
                                  console.log("shipmentID ="+result4.args.shipmentID);

                                  console.log("***********   ShipmentRequested Event watch Ended *****************")

                                  ShipmentRequestedEvent.stopWatching();
                                  // event ShipmentRequested(uint packageID,uint shipmentID,bool status);
  
                                  if(result4.blockNumber>block && result4.args.status) {
  
                                    result4.args.shipmentID
                                    future.return(result.args.status);
  
                                  }
                                  else {
                                    future.return(result.args.status);
                                  }
                              });
                      }
                    });

        /********************************** End Shipping Request *************************************************** */
                                   }
                                  else {
                                    // PackageSlip Event result - Failed
                                    future.return(false);
                                  }
                          });
                        }
                      });
        /********************************** End of Package Slip Creation *************************************************** */
                     
                    }
                    else {
                      // Invoice Event result - Failed
                      future.return(false);
                  }
              });
            }
        /********************************** End of  Invoice Creation *************************************************** */
            
      });
      return future.wait();
}
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