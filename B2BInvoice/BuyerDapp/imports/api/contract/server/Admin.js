import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

var Web3 = require('web3');
var Future = require('fibers/future');
var Enum = require('enum');

var rolesEnum = new Enum({'MunichRe':1,'CIC':2,'GeoTab':3,'MobileEye':4,'Installer':5,'BillItNow':6})
var groupsEnum = new Enum({'MunichReGroup':1,'CICGroup':2,'GeoTabGroup':3,'MobileEyeGroup':4,'InstallerGroup':5,'BillItNowGroup':6})
var statusEnum = new Enum ({'Active':0, 'Inactive':1});

var const_gas = 4700000;

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(Meteor.settings.server.web3api));
}

var RFQContractAddr = Meteor.settings.server.RFQContractAddress;
var rolesRepositoryContractAddr = Meteor.settings.server.RolesRepositoryContractAddress;
var userRepositoryContractAddr = Meteor.settings.server.UserRepositoryContractAddress;

const RFQContractABI = require('../../../startup/server/Contract/RFQContract.json').abi;
const RFQContractByteCode = "0x" + require('../../../startup/server/Contract/RFQContract.json').bytecode;
var RFQContractInstance = web3.eth.contract(JSON.parse(RFQContractABI)).at(RFQContractAddr);

const rolesRepositoryContractABI  = require('../../../startup/server/Contract/RolesRepository.json').abi;
const rolesRepositoryContractByteCode  = '0x' + require('../../../startup/server/Contract/RolesRepository.json').bytecode;
var rolesRepositoryContractInstance = web3.eth.contract(JSON.parse(rolesRepositoryContractABI)).at(rolesRepositoryContractAddr);

const userRepositoryContractABI  = require('../../../startup/server/Contract/UserRepository.json').abi;
const userRepositoryContractByteCode  = '0x' + require('../../../startup/server/Contract/UserRepository.json').bytecode;
var userRepositoryContractInstance = web3.eth.contract(JSON.parse(userRepositoryContractABI)).at(userRepositoryContractAddr);

var rolesRepositorytransactionObject = {from: web3.eth.accounts[0],data: rolesRepositoryContractByteCode,gas:const_gas};
var userRepositoryTransactionObject =  {from: web3.eth.accounts[0],data: userRepositoryContractByteCode,gas:const_gas};


Meteor.methods({

    "createRFQContract": function(){ 
      console.log("Creating RFQ Contract")
        var contract = web3.eth.contract(JSON.parse(RFQContractABI));
        var transactionObject = {from: web3.eth.accounts[0],data: RFQContractByteCode,gas:const_gas};
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
              console.log(RFQContractAddr);
              future.return( result.address );
            }
          }
        });
        return future.wait();
      },
    
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
              console.log(rolesRepositoryContractAddr);
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
              console.log(userRepositoryContractAddr);
              future.return( result.address );
            }
          }
        });
        return future.wait();
      },

   
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
                  console.log("result:"+result);
                  userAddedEvent.watch(function(error,eventResult){
                    if(eventResult){
                        if(eventResult.blockNumber>block && eventResult.args.firstName==params.FirstName && eventResult.args.lastName==params.LastName)
                            userAddedEvent.stopWatching();
                            if (!future.isResolved())  
                                future.return(eventResult.args.success);
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
                                        if (!future.isResolved())  
                                             future.return(eventResult.args.success);
                            }
                           })
                        }
                    }
                )
                return future.wait();
            }
    });


