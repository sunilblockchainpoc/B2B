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


if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(Meteor.settings.server.web3api));
}

var rolesRepositoryContractAddr = Meteor.settings.server.RolesRepositoryContractAddress;
var userRepositoryContractAddr = Meteor.settings.server.UserRepositoryContractAddress;

const clientRFQContractABI = require('../../../startup/server/Contract/ClientRFQContract.json').abi;
const clientRFQContractByteCode = "0x" + require('../../../startup/server/Contract/ClientRFQContract.json').bytecode;
var clientRFQContractInstance;
var clientRFQContractAddr;
var const_gas = 4700000;

clientRFQContractAddr = Meteor.settings.server.ClientRFQContractAddress;
clientRFQContractInstance = web3.eth.contract(JSON.parse(clientRFQContractABI)).at(clientRFQContractAddr);

const rolesRepositoryContractABI  = require('../../../startup/server/Contract/RolesRepository.json').abi;
const rolesRepositoryContractByteCode  = '0x' + require('../../../startup/server/Contract/RolesRepository.json').bytecode;
var rolesRepositoryContractInstance = web3.eth.contract(JSON.parse(rolesRepositoryContractABI)).at(rolesRepositoryContractAddr);

const userRepositoryContractABI  = require('../../../startup/server/Contract/UserRepository.json').abi;
const userRepositoryContractByteCode  = '0x' + require('../../../startup/server/Contract/UserRepository.json').bytecode;
var userRepositoryContractInstance = web3.eth.contract(JSON.parse(userRepositoryContractABI)).at(userRepositoryContractAddr);

Meteor.methods({
  "createClientRFQContract": function(){ 
    var contract = web3.eth.contract(JSON.parse(clientRFQContractABI));
    var transactionObject = {from: web3.eth.accounts[0],data: clientRFQContractByteCode,gas:const_gas};
    web3.eth.estimateGas(transactionObject,function(err,estimateGas){
      if(!err)
        transactionObject.gas = estimateGas * 2;
    });
    var future = new Future();
    contract.new(transactionObject,function(error,result){
      if(error) {
        console.log(error);
        future.return( error );
      }
      if(result) {
        if(typeof result.address !== 'undefined') {
          clientRFQContractAddr = result.address;
          console.log(clientRFQContractAddr);
          future.return( result.address );
        }
      }
    });
    return future.wait();
  },

  "requestClientRFQ" :function(params){
    //clientRFQContractInstance = web3.eth.contract(clientRFQContractABI).at(clientRFQContractAddr);
    var rfqRequestDt = new Date().setHours(0,0,0,0);
    var uploadURL = Meteor.settings.server.uploadURL;
    var data = {fileName:params.OriginalFileName, file: new Buffer(params.File)}
    var asyncFunc  = Meteor.wrapAsync( HTTP.post );
    var jsonFileData = {fileName:params.Name+".json", file: new Buffer(JSON.stringify(params.ServiceData))};
    
    var jsonresult =  asyncFunc(uploadURL,{
      headers: {
        'Content-Type': 'application/json'
      },  
      content:JSON.stringify(jsonFileData)
    }); 
    var jsonFileHash = jsonresult.content;
    
    var uploadResult = asyncFunc(uploadURL,{
      headers: {
        'Content-Type': 'application/json'
      },
      content:JSON.stringify(data)
    }); 

    var reqFileHash = uploadResult.content;
    
    var transactionObject = {
      data: clientRFQContractByteCode, 
      from: params.nodeAddress,
      gasPrice: web3.eth.gasPrice,
      gas: const_gas
    };

    web3.eth.estimateGas(transactionObject,function(err,estimateGas){
      if(!err)
        transactionObject.gas = estimateGas * 2;
    });
    var requestClientRFQEvent = clientRFQContractInstance.clientRFQRequested();
    var block = web3.eth.getBlock('latest').number;
    var future = new Future();
    clientRFQContractInstance.requestRFQ.sendTransaction(params.Name, params.Description, 
                              params.RequestBy,rfqRequestDt,params.OriginalFileName, reqFileHash,jsonFileHash,transactionObject,function(err,result)
    {
      if(err){
        console.log(err);
        future.return(err);
      }
      else{
          requestClientRFQEvent.watch(function(error,result){
          if(result.blockNumber>block && result.args.success && result.args.rfqName==params.Name ){
              requestClientRFQEvent.stopWatching();
              future.return(result.args.rfqName);
          }
        })
      }
    });
    return future.wait();
  },

  "viewClientRFQList": function(){ 

    var clientRFQCount;
    var clientRFQList = new Array;
    var clientRFQ;
    var reqURL, resURL;
    clientRFQCount = clientRFQContractInstance.getClientRFQCount.call();
    if(clientRFQCount > 0) {
      for(var index=0;index<clientRFQCount;index++) {
        clientRFQ = clientRFQContractInstance.getClientRFQs.call(index);
        reqURL = "?name=" + clientRFQ[3] + "&filehash=" + clientRFQ[4];
        resURL = "?name=" + clientRFQ[7] + "&filehash=" + clientRFQ[8];
        var data = {id:parseInt(clientRFQ[0]), name: clientRFQ[1], description: clientRFQ[2],reqFileName:clientRFQ[3], status:rfqStatusEnum.get(parseInt(clientRFQ[5])).key,
                    rfqValue:parseInt(clientRFQ[6]), resFileName:clientRFQ[7], reqURL:reqURL, resURL:resURL};
        clientRFQList.push(data);
      }
    }
    return clientRFQList;
  },

  "getClientRFQ": function(params){ 
    var clientRFQDetail,clientRFQ,reqURL,resURL,index,reqServices, resServices,reqServicesFileHash, resServicesFileHash;
    index = params.rfqid - 1;
    clientRFQ = clientRFQContractInstance.getClientRFQs.call(index);
    clientRFQDetail = clientRFQContractInstance.getClientRFQAuditDetails.call(index);
    if(parseInt(clientRFQ[0]) > 0 && parseInt(clientRFQDetail[0]) >0){
      reqURL = "?name=" + clientRFQ[3] + "&filehash=" + clientRFQ[4];
      resURL = "?name=" + clientRFQ[7] + "&filehash=" + clientRFQ[8];
      reqServicesFileHash = clientRFQDetail[5];
      resServicesFileHash = clientRFQDetail[6];
      if(reqServicesFileHash.length > 0)
         reqServices = getJSONObject(clientRFQ[1],clientRFQDetail[5]);
      if(resServicesFileHash.length > 0)
         resServices = getJSONObject(clientRFQ[1],clientRFQDetail[6]);

      var data = {id:parseInt(clientRFQ[0]), name: clientRFQ[1], description: clientRFQ[2],reqFileName:clientRFQ[3], status:rfqStatusEnum.get(parseInt(clientRFQ[5])).key,
                  rfqValue:parseInt(clientRFQ[6]), resFileName:clientRFQ[7], reqURL:reqURL, resURL:resURL,
                  requestBy: clientRFQDetail[1],requestDt:parseInt(clientRFQDetail[2]),responseBy: clientRFQDetail[3],
                  responseDt:parseInt(clientRFQDetail[4]), reqServices: reqServices, resServices:resServices
                };
      return data;
    }
  },

  "updateClientRFQStatus" :function(params){
   // var data = {rfqId:params.Id, status: params.Status}
       
    var transactionObject = {
    data: clientRFQContractByteCode, 
    from: params.nodeAddress,
    gasPrice: web3.eth.gasPrice,
    gas: const_gas
  };

    web3.eth.estimateGas(transactionObject,function(err,estimateGas){
      if(!err)
        transactionObject.gas = estimateGas * 2;
    });
    var updateClientRFQStatusEvent = clientRFQContractInstance.clientRFQStatusUpdated();
    var block = web3.eth.getBlock('latest').number;
    var future = new Future();
    clientRFQContractInstance.updateRFQStatus.sendTransaction(params.Id,params.Status
                              ,transactionObject,function(err,result)
    {
      if(err){
        console.log(err);
        future.return(err);
      }
      else{
        updateClientRFQStatusEvent.watch(function(error,result){
          if(result.blockNumber>block && result.args.success && parseInt(result.args.rfqId)==params.Id ){
            updateClientRFQStatusEvent.stopWatching();
              future.return(result);
          }
        })
      }
    });
    return future.wait();
  },

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