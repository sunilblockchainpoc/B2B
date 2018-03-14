import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

var Web3 = require('web3');
var Future = require('fibers/future');
var Enum = require('enum');

var rolesEnum = new Enum({'Participant1':1,'Participant2':2,'Participant3':3,'Participant4':4,'Participant5':5,'Participant6':6})
var groupsEnum = new Enum({'Group1':1,'Group2':2,'Group3':3,'Group4':4,'Group5':5,'Group6':6})
var statusEnum = new Enum ({'Active':0, 'Inactive':1});

var const_gas = 4700000;

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(Meteor.settings.server.web3api));
}

const rolesRepositoryContractABI  = require('../../../startup/server/Contract/RolesRepository.json').abi;
const rolesRepositoryContractByteCode  = '0x' + require('../../../startup/server/Contract/RolesRepository.json').bytecode;

const userRepositoryContractABI  = require('../../../startup/server/Contract/UserRepository.json').abi;
const userRepositoryContractByteCode  = '0x' + require('../../../startup/server/Contract/UserRepository.json').bytecode;

const RFQContractABI = require('../../../startup/server/Contract/RFQContract.json').abi;
const RFQContractByteCode = "0x" + require('../../../startup/server/Contract/RFQContract.json').bytecode;


const POContractABI = require('../../../startup/server/Contract/POContract.json').abi;
const POContractByteCode = "0x" + require('../../../startup/server/Contract/POContract.json').bytecode;

const ShipmentContractABI = require('../../../startup/server/Contract/ShipmentContract.json').abi;
const ShipmentContractByteCode = "0x" + require('../../../startup/server/Contract/ShipmentContract.json').bytecode;

var rolesRepositorytransactionObject = {from: web3.eth.accounts[0],data: rolesRepositoryContractByteCode,gas:const_gas};
var userRepositoryTransactionObject =  {from: web3.eth.accounts[0],data: userRepositoryContractByteCode,gas:const_gas};
var rolesRepositoryContractAddr = Meteor.settings.server.RolesRepositoryContractAddress;
var userRepositoryContractAddr = Meteor.settings.server.UserRepositoryContractAddress;

var userRepositoryContractInstance = web3.eth.contract(JSON.parse(userRepositoryContractABI)).at(userRepositoryContractAddr); 

Meteor.methods({
  
      "createRolesRepository": function(){ 
        var rolesRepositoryContract = web3.eth.contract(JSON.parse(rolesRepositoryContractABI));
        var transactionObject = {from: web3.eth.accounts[0],data: rolesRepositoryContractByteCode,gas:const_gas};
        web3.eth.estimateGas(transactionObject,function(err,estimateGas){
          if(!err)
            transactionObject.gas = estimateGas * 2;
        });
        var future = new Future();
        rolesRepositoryContract.new(transactionObject,function(error,result){
          if(error) {
            console.log(error);
            future.return( error );
          }
          if(result) {
            if(typeof result.address !== 'undefined') {
              rolesRepositoryContractAddr = result.address;
              console.log("Roles Repository Contract Address = "+ rolesRepositoryContractAddr );
              future.return( result.address );
            }
          }
        });
        return future.wait();
      },
    
      "createUserRepository": function(params){ 
        var userRepositoryContract = web3.eth.contract(JSON.parse(userRepositoryContractABI));
        var transactionObject = {from: web3.eth.accounts[0],data: userRepositoryContractByteCode,gas:const_gas};
        web3.eth.estimateGas(transactionObject,function(err,estimateGas){
          if(!err)
            transactionObject.gas = estimateGas * 2;
        });
        var future = new Future();
        userRepositoryContract.new(rolesRepositoryContractAddr,transactionObject,function(error,result){
          if(error) {
            console.log(error);
            future.return( error );
          }
          if(result) {
            if(typeof result.address !== 'undefined') {
              userRepositoryContractAddr = result.address;
              console.log("User Repository Contract Address = "+ userRepositoryContractAddr );
              future.return( result.address );
            }
          }
        });
        return future.wait();
      },

      "createRFQContract": function(){ 
        console.log("Creating RFQ Contract")
          var contract = web3.eth.contract(JSON.parse(RFQContractABI));
          var transactionObject = {from: web3.eth.accounts[0],data:RFQContractByteCode,gas:const_gas};
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
                RFQContractAddr = result.address;
                console.log("RFQ Contract Address = "+ RFQContractAddr );
                future.return( result.address );
              }
            }
          });
          return future.wait();
        },

        "createPurchaseOrderContract": function(){ 
          console.log("Creating Purchase Order Contract")
            var contract = web3.eth.contract(JSON.parse(POContractABI));
            var transactionObject = {from: web3.eth.accounts[0],data: POContractByteCode,gas:const_gas};
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
                  POContractAddr = result.address;
                  console.log("Purchase Order Contract Address = "+ POContractAddr );
                  future.return( result.address );
                }
              }
            });
            return future.wait();
          },
  
                   
          "createShipmentContract": function(){ 
            console.log("Creating Shipment Contract")
              var contract = web3.eth.contract(JSON.parse(ShipmentContractABI));
              var transactionObject = {from: web3.eth.accounts[0],data: ShipmentContractByteCode,gas:const_gas};
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
                    ShipmentContractAddr = result.address;
                    console.log("Shipment Contract Address = "+ ShipmentContractAddr );
                    future.return( result.address );
                  }
                }
              });
              return future.wait();
            } ,    
                 
             
   
    "createUser":function(params){

        var dateint = parseInt(new Date().setHours(0,0,0,0));
        var block = web3.eth.getBlock('latest').number;
        var userAddedEvent = userRepositoryContractInstance.UserAdded();
        var future = new Future();
        userRepositoryContractInstance.addUser.sendTransaction(
            params.UserName,params.FirstName,params.LastName,params.Password,params.Organization,0,
            dateint, params.Address,
            userRepositoryTransactionObject,function(err,result){
                if(err){
                    console.log(err);
                    future.return(err);
                }
                if(result){
                  userAddedEvent.watch(function(error,eventResult){
                    if(eventResult){
                        if(eventResult.blockNumber>block && eventResult.args.firstName==params.FirstName && eventResult.args.lastName==params.LastName)
                            userAddedEvent.stopWatching();
                            if (!future.isResolved())  {
                                console.log("User ID - "+params.UserName+ "is successfully created.")
                                future.return(eventResult.args.success);
                            }
                    }
                   })
                }
            }
        )
        return future.wait();
    },


    "changePassword":function(params){
        
                var dateint = parseInt(new Date().setHours(0,0,0,0));
                var block = web3.eth.getBlock('latest').number;
                var passwordChangedEvent = userRepositoryContractInstance.PasswordChanged();
                var future = new Future();
                userRepositoryContractInstance.changePassword.sendTransaction(
                    params.UserName,params.OldPassword,params.NewPassword,
                    userRepositoryTransactionObject,function(err,result){
                        if(err){
                            console.log(err);
                            future.return(err);
                        }
                        if(result){
                            passwordChangedEvent.watch(function(error,eventResult){
                            if(eventResult){
                                if(eventResult.blockNumber>block)
                                     passwordChangedEvent.stopWatching();
                                        if (!future.isResolved())  {
                                          console.log("Password change successfull for User ID - "+params.UserName)
                                          future.return(eventResult.args.status);
                                        }
                            }
                           })
                        }
                    }
                )
                return future.wait();
            }
    });


