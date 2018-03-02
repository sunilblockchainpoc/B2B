// All links-related publications
import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

var Web3 = require('web3');
var Future = require('fibers/future');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var Enum = require('enum');

var WorkOrderStatus = new Enum({'Initiated': 0, 'Completed': 1});
var VendorWorkOrderStatus = new Enum({'Initiated': 0, 'Completed': 1});
var VendorType = new Enum({'Geotab': 0, 'MobileEye': 1});
var InstallStatus = new Enum({'Initiated': 0, 'PartsReceived': 1});

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(Meteor.settings.server.web3api));
}

const RolesContractABI = require('../../../startup/server/Contract/RolesRepository.json').abi;
const RolesContractData = '0x' + require('../../../startup/server/Contract/RolesRepository.json').bytecode;
var RolesContract = web3.eth.contract(JSON.parse(RolesContractABI));

const UserContractABI  = require('../../../startup/server/Contract/UserRepository.json').abi;
const UserContractData  = '0x' + require('../../../startup/server/Contract/UserRepository.json').bytecode;
var UserContract = web3.eth.contract(JSON.parse(UserContractABI));


const WORFQContractABI  = require('../../../startup/server/Contract/WorkOrder.json').abi;
const WORFQContractData  = '0x' + require('../../../startup/server/Contract/WorkOrder.json').bytecode;
var WORFQContract = web3.eth.contract(JSON.parse(WORFQContractABI));

var userConAddr = Meteor.settings.server.UseContractAddress;
var roleConAddr = Meteor.settings.server.RolesRepositoryAddress;
var WOConAddr = Meteor.settings.server.WorkOrderContractAddress;

var const_gas = 4700000;

WOContractInstance = web3.eth.contract(JSON.parse(WORFQContractABI)).at(WOConAddr);

Meteor.methods({
  


  /************************************************************************************************** 
   Commercial insured submits contract file - Both contract gets created as well as Work Order is generated
   2 Transactions happens while invoking this method
   ***************************************************************************************************/

  "submitContract":function(params) {

    // Input Parameters
    var rfq_id = params.client_rfq_id;
    var signDate = params.sign_date;
    var poNumber = params.po_number;
    var filename = params.OriginalFileName;
    var username = params.responseBy;

    // Frame the current date timestamp as start date
    var startDate = new Date().getTime();

     //Upload the file into IPFS and ge the hash
    var uploadURL = Meteor.settings.server.uploadURL;
    var data = {fileName:params.OriginalFileName, file: new Buffer(params.File)}
    var asyncFunc  = Meteor.wrapAsync( HTTP.post );
  
    var uploadResult = asyncFunc(uploadURL,{
    headers: {
             'Content-Type': 'application/json'
            },
              content:JSON.stringify(data)
    }); 

    var filehash = uploadResult.content;
    //console.log("Contract document Submitted.");
      
    
    //This method is used by commercial insured participant to submit the finalized contract document.

    var transactionObject = { from: params.address,data: WORFQContractData, gas: 30000000 };
   
    var block_number_before = web3.eth.getBlock('latest').number;
   // console.log("block_number_before"+block_number_before);
    var future = new Future();
    
    WOContractInstance.submitContract.sendTransaction(  rfq_id,
                                                        filename,
                                                        filehash,
                                                        startDate, 
                                                        signDate,
                                                        username,
                                                        transactionObject,
                                                        function (error, result) {

    var contractSubmitEvent = WOContractInstance.ContractSubmitted();

    if(error) {
      console.log(error);
      future.return(error);
    }
    else {
         // console.log("Contract submission - Transaction submitted, waiting for mining completion.");
          contractSubmitEvent.watch(function(error,result) {
          //  console.log(result);
            if(error) {
              console.log(error);
              future.return(error);
          }
          else {
               //   console.log("Event watch success.")
                  var contractID = result.args.contractID;
                  var status = WorkOrderStatus.Initiated;
            
                  if(result.blockNumber>block_number_before && result.args.status && result.args.rfqID==rfq_id ) {
                    contractSubmitEvent.stopWatching();
                    
                    var block = web3.eth.getBlock('latest').number;
                    
                    WOContractInstance.generateWorkOrder.sendTransaction( contractID,
                                                                    poNumber,
                                                                    startDate, 
                                                                    transactionObject,
                                                                    function (error, result) {
   
                    var contractWorkOrderEvent = WOContractInstance.WorkOrderSubmitted();
   
                    if(error) {
                      console.log(error);
                      future.return(error);
                  }
                    else {
                          //  console.log("Work Order - Transaction submitted, waiting for mining completion.");
                            
                            contractWorkOrderEvent.watch(function(err,res) {
                              if(err) {
                                  console.log(err);
                                  future.return(err);
                              }
                          //    console.log(res.blockNumber+">"+block);
                          //    console.log(res.args.status);
                          //    console.log(res.args.contractID+"="+contractID);
                         //     console.log("Work Order ID="+res.args.woID);
                              
                              if( res.blockNumber>block && res.args.status && parseInt(res.args.contractID)==contractID)
                                  {    
                                    
                                 //     console.log("Work Order ID="+res.args.woID);
                                     
                                      contractWorkOrderEvent.stopWatching();
                                //      console.log("Contract Event Watch is stopped.");

                                     // console.log("Work Order Event Watch is stopped.");
                                     if (!future.isResolved())  
                                      future.return(rfq_id);
                                      
                                    }
                            });
                          }
                     });
                 }
        }
      });
    }
    })

    return future.wait();
  },



  /************************************************************************************************** 
    Get all the details related to Commercial insured
   ***************************************************************************************************/    
    "getAllClientWO": function(params){ 
    var count = WOContractInstance.getMSSContractCount.call();
   // console.log("Number of Contracts signed = "+count);
    var clientWOList = new Array;
    
    for (var i=0; i<count ;i++) {

      // Get Contract details
        var result = WOContractInstance.getMSSContractDeatils.call(i);
        var v_contract_id = parseInt(result[0]);
        var v_client_id = parseInt(result[1]);
        var v_contract_fileName = result[2];
        var v_contract_fileHash = result[3];
        var v_contract_signDate = getDate(parseInt(result[5]));
   
        var v_contract_signBy = result[6];
        // Get the corresponding Work order details.
  
        var wo_result = WOContractInstance.getWorkerOrderStatusByCID.call(v_contract_id);
        
        var v_wo_Number = parseInt(wo_result[1]);
        var v_po_Number = wo_result[2];
        var v_wo_date   = getDate(parseInt(wo_result[4]));
        var v_wo_status = WorkOrderStatus.get(parseInt(wo_result[3])).key;
        // Frame the url for both request file and response file. This will be used to download the file from the browser
        var v_contractURL = "?name=" + v_contract_fileName + "&filehash=" + v_contract_fileHash;
        
        var billitNowResult = WOContractInstance.getBillInvoices.call(v_wo_Number-1);
        var invoiceURL  = "?name=" +  billitNowResult[2]  + "&filehash=" + billitNowResult[3];

        var v_invoice_Number = billitNowResult[1];
        if (v_invoice_Number==0) v_invoice_Number = "";

        var data = {     rfq_ref_id:v_client_id,
                         contract_id:v_contract_id,
                         contract_fileName:v_contract_fileName,
                         contractURL:v_contractURL,
                         wo_number:v_wo_Number,
                         wo_status:v_wo_status,
                         wo_date:v_wo_date,
                         po_number:v_po_Number,
                         invoice_Number:v_invoice_Number,
                         invoice_fileName:billitNowResult[2],
                         invoiceURL:invoiceURL
                  };
        clientWOList.push(data);
      }
      //console.log(clientWOList);
      return clientWOList;
  },

 });

function getDate(inputDate) {

  if(inputDate > 0) {
    return (new Date(inputDate).toISOString().slice(0,10))
	}
	else
		return "";
}
