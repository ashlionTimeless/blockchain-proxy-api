'use strict';
const ETH_PROXY_SUBJECT = 'EthProxy';
// require('daemon')();
var fs = require('fs');
require('../../enviroment');
require('./config-local');
const validator = require('../../utilites/validator');
var HttpService = require('../../services/httpService');

const urlMap = require('./urlMap');
const logger = require('../../utilites/logger');
var http = require('http');
var https = require('https');
const request = require('request');
const requestPromise = require("request-promise");
const express = require('express');
const bodyParser=require('body-parser');
const app = express();
const Web3 = require('web3');
const asyncLoop = require('node-async-loop');
const EthereumTx = require('ethereumjs-tx');

var httpServer = http.createServer(app);

//var httpsServer = https.createServer(credentials, app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

httpServer.listen(process.env.PORT, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on `+process.env.PORT)
});

class EthProxy{

    constructor(){
        return new Promise(async(resolve,reject)=>{
            try{
                this.urlMap = urlMap;
                this.logger = new logger();
                this.validator = new validator();
                this.httpService = new HttpService(this);
                var provider= await this.getProviderAddress();
                var contract= await this.getContractAddress();
                var abi = await this.getContractAbi();

                var adminAccount = await this.getAdminAccount();
                this.web3 = new Web3(new Web3.providers.WebsocketProvider(provider),{
                    headers: {
                        Origin: "some_meaningful_name"
                    }
                });
                var key = fs.readFileSync(process.env.KEY_PATH,'utf8');
                var privKey = key;
                this.validator.validateString(privKey,'Private Key',true);
                this.admin={};
                this.admin.address=adminAccount;
                this.admin.key= privKey;
                this.web3.eth.defaultAccount=adminAccount;
                var Contract= new this.web3.eth.Contract(
                    abi);
                Contract.options.address=contract;
                this.contract = Contract;
                this.validator.validateObject(this.contract, 'Smart Contract');
                this.run();    
            }catch (e) {
                this.logger.logError(ETH_PROXY_SUBJECT,e);
            }
        });    
    }

    run(){
        try{
        	//TESTING
        	app.post(this.urlMap.transfer_event_post_url,(request,response)=>{
        		try{
	            	var data = this.processRequestData(request);
	            	var message = 'Transfer Event Received';
	            	console.log(data);
	                return this.processResponseData(response,true,message);
        		}catch(e){
        			this.logger.logError(ETH_PROXY_SUBJECT,e);
	                return this.processResponseData(response,false,e.message);
	            }
            })
            /*http://127.0.0.1:3000/admin-received
{ data:
   '{"from":"0x4348F93046A432b74DE668d67CA389cfacfc2c93","amount":"1","hash":"0xdf8eaf14ee2cf86880ea7492e9a7d84a7659636f165e20fec4e066a45b7e743a","status":"RECEIVED"}' }*/
        	app.post(this.urlMap.admin_received_event_post_url,(request,response)=>{
        		try{
	            	var data = this.processRequestData(request);
	            	var message = "Admin Received Tokens Event Received";
	            	console.log(data);
	                return this.processResponseData(response,true,message);
        		}catch(e){
        			this.logger.logError(ETH_PROXY_SUBJECT,e);
	                return this.processResponseData(response,false,e.message);
        		}
            })
            /*
http://127.0.0.1:3000/admin-sent
{ data:
   '{"hash":"0xce195a4489dc09adf5c4c096c45c79e59354cdf897e8aee1188c37ebd57b37ee","status":"RECEIVED"}' }
            */
            app.post(this.urlMap.admin_sent_event_post_url,(request,response)=>{
        		try{
	            	var data = this.processRequestData(request);

	            	console.log(data);
	            	var message = "Admin Sent Tokens Event Received";
	                return this.processResponseData(response,true,message);
        		}catch(e){
        			this.logger.logError(ETH_PROXY_SUBJECT,e);
	                return this.processResponseData(response,false,e.message);
        		}
            })
            /*http://127.0.0.1:3000/check-address
{ data:
   '{"user_address":"0xab558A0ABC8e2af2F4684aBb7bA634A11f8A6677"}' }*/

// { result: true,
//   data:
//    '"92daaebab8a854a3eb3c32dd97ca66f32b2248bfb1c9d35a4bcd94618fa20aa7"' }
            app.get(this.urlMap.check_user_address_url,(request,response)=>{
            	try{
	            	var data = this.processRequestData(request);
	            	var user_address = data.user_address;
	            	var result = false;
	            	if(user_address=='0x4348F93046A432b74DE668d67CA389cfacfc2c93'){
	            		result= "cdc2a15145f42282303d82fc21c5ea286c99be91ee0a53c1d9fe260144d9ea21";
	            	}
	            	if(user_address=='0xab558A0ABC8e2af2F4684aBb7bA634A11f8A6677'){
		           		result= "92daaebab8a854a3eb3c32dd97ca66f32b2248bfb1c9d35a4bcd94618fa20aa7";
	            	}
	                return this.processResponseData(response,true,result);
            	}catch(e){
            		this.logger.logError(ETH_PROXY_SUBJECT,e);
            		return this.processResponseData(response,false,e.message);
            	}
            })

//curl --data "address=0x50b97997ec3c1f8f8aDC81E603f2bd320C69C24a" http://127.0.0.1:3000/get-single-balance -X POST
            app.post('/get-single-balance', async (request, response) => {
                try{
                	var data = this.processRequestData(request);
                	var user_address = data.user_address;
                	this.validator.validateEthAddress(user_address,'User Address');
                    var result = await this.getSingleBalance(user_address);
                    return this.processResponseData(response,true,result);
                }catch(e)
                {
                	this.logger.logError(ETH_PROXY_SUBJECT,e);
                    return this.processResponseData(response,false,e.message);
                }
            });

            app.post('/transfer-tokens-out', async (request, response) => {
                try{
	                var data = this.processRequestData(request);
	                var user_address = data.user_address;
	                var amount = data.amount;
                    var result = await this.transferTokens(amount,user_address);
                    return this.processResponseData(response,true,result)
                }catch(e){
                	this.logger.logError(ETH_PROXY_SUBJECT,e);
                    return this.processResponseData(response,false,e.message);
                }
            });
            
                app.post('/transfer-tokens-in', async (request, response) => {
                try{
	                var data = this.processRequestData(request);
	                var user_address = data.user_address;
	                var amount = data.amount;
	                var privateKey = data.privateKey;
                    var result = await this.transferTokens(amount,this.admin.address,user_address,privateKey);
                    return this.processResponseData(response,true,result)
                }catch(e){
                	this.logger.logError(ETH_PROXY_SUBJECT,e);
                    return this.processResponseData(response,false,e.message);
                }
            });
            
            /*
curl --data "data"="[{\"user_id\":1,\"address\":\"0x50b97997ec3c1f8f8aDC81E603f2bd320C69C24a\"},{\"user_id\":2,\"address\":\"0x50b97997ec3c1f8f8aDC81E603f2bd320C69C24a\"},{\"user_id\":3,\"address\":\"0x50b97997ec3c1f8f8aDC81E603f2bd320C69C24a\"}]" http://127.0.0.1:3000/get-balances -X POST
            */
            app.post('/get-balances', async (request, response) => {
                var users = this.processRequestData(request);
                try{
                    var result = await this.getBalances(users);
                    return this.processResponseData(response,true,result);
                }catch(e){
                	this.logger.logError(ETH_PROXY_SUBJECT,e);                	
                    return this.processResponseData(response,false,e.message);
                }
            });

            var TransferEvent = this.contract.events.Transfer({},
                async(error,result)=>
            {
                try{
                    if(!error)
                    {
                        this.logger.logEvent(ETH_PROXY_SUBJECT,'Transfer Event',result);
                        var args = result.returnValues;
                        var _from = args.from;
                        var _to = args.to;
                        var _amount = args.value;
                        var _hash = result.transactionHash;

                        this.validator.validateEthAddress(args.to,'To Address');
                        this.validator.validateEthAddress(args.from,'From Address');
                        this.validator.validateString(_hash,'TxHash');

                        var url ='';
                        var data ={};

                        if(_to==this.admin.address || _from == this.admin.address){
	                        if(_to==this.admin.address){
	   	                        url = this.urlMap.server+this.urlMap.admin_received_event_post_url;
		                        data = {from:_from,amount:_amount,hash:_hash,status:'RECEIVED'};
	                        }
	                        if(_from == this.admin.address){
	   	                        url = this.urlMap.server+this.urlMap.admin_sent_event_post_url;
		                        data = {hash:_hash,status:'RECEIVED'};
	                        }                        	
                        }else{
	                        var userPrivateKey = await this.checkUserAddress(_to);
	                        if(userPrivateKey){

	                        	var transferResult = await this.transferTokens(_amount,this.admin.account,_to,userPrivateKey);
	   	                        url = this.urlMap.server+this.urlMap.transfer_event_post_url;
		                        data = {to:_to,amount:_amount,hash:transferResult};
	                        }                        	
                        }
                        if(url && data){
	                        var result = await this.postEventData(url,data);
	                        this.logger.logEvent(ETH_PROXY_SUBJECT,'Delivered Transfer Event Data',result);                        	
                        }
                    }else
                    {
                        this.logger.logError(ETH_PROXY_SUBJECT,'Error Handling Transfer Event',error)
                        return false;
                    }
                }catch (e) {
                    this.logger.logError(ETH_PROXY_SUBJECT,e)
                    return false;
                }
            });

        }catch(e){
            this.logger.logError(ETH_PROXY_SUBJECT,e);
        }
    }
    postEventData(req_url,data){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateUrl(req_url,'Request Url');
                this.validator.validateObject(data,'Request Data');
                var result = await this.httpService.postRequest(req_url, data);
                return resolve(result);                    
            }catch(e){
                this.logger.logError(ETH_PROXY_SUBJECT,e);
                return reject(e);
            }
        });
    }
    processRequestData(request){
    	try{
    		console.log('processRequestData')
    		return this.processArrayForData(request.body);

    	}catch(e){

    		console.log(typeof request.body['data']);
    		throw e;
    	}
    }
    processArrayForData(array){
   		var data = array['data'];
   		this.validator.validateJson(data,'Request Data')
    	return JSON.parse(data);
    }
    processResponseData(response,result,data){
    	var code = 200;
    	if(!result){
    		code = 400;
    	}
    	if(result){
    		data = JSON.stringify(data)
	    	response.setHeader('Content-Type','application/json');
    	}
    	var all = {result:result,data:data};
    	console.log(all);
    	return response.send(all);
    }
    getProviderAddress(){
        return new Promise((resolve,reject)=>{
            try{
               var result = process.env.PROVIDER_ADDRESS;
               this.validator.validateString(result,'Provider Address');
               return resolve(result);                    
            }catch(e){
                this.logger.logError(ETH_PROXY_SUBJECT,e);
                return reject(e);
           }
        });
    }

    getContractAddress(){
        return new Promise((resolve,reject)=>{
            try{
               var result = process.env.CONTRACT_ADDRESS;
               this.validator.validateString(result,'Contract Address');               
               return resolve(result);                    
            }catch(e){
                this.logger.logError(ETH_PROXY_SUBJECT,e);
                return reject(e);
           }
        });
    }

    getContractAbi(){
        return new Promise((resolve,reject)=>{
            try{
               var result = fs.readFileSync(process.env.ABI_PATH,'utf8');
               if(result){
                this.validator.validateJson(result,'Contract ABI');
                result = JSON.parse(result);
                return resolve(result);                
               }else{
                throw new Error('Error Reading Contract Abi');
               }
            }catch(e){
                this.logger.logError(ETH_PROXY_SUBJECT,e);
                return reject(e);
            }
        });    
    }

    getAdminAccount(){
        return new Promise((resolve,reject)=>{
            try{
               var result = process.env.ADMIN_ADDRESS;
               this.validator.validateString(result,'Admin Address');               
               return resolve(result);                    
            }catch(e){
                this.logger.logError(ETH_PROXY_SUBJECT,e);
                return reject(e);
           }
        });
    }
    checkUserAddress(user_address){
    	return new Promise(async(resolve,reject)=>{
    		try{
    			this.validator.validateEthAddress(user_address);
    			var url = this.urlMap.server+this.urlMap.check_user_address_url;
    			var data ={user_address:user_address};
    			var result = false;
    			try{
    				var tmp= await this.httpService.getRequest(url,data);
	    			// console.log(tmp)
	    			// result = processArrayForData(tmp);  
	    			result = tmp;

    			}catch(err){
    				result = false;
    			}
    			return resolve(result);
    		}catch(e){
    			return reject(e);
    		}
    	});
    };
    transferTokens(amount,to_address,from_address,privateKey){
        return new Promise(async(resolve, reject)=> {
            try{
            	if(to_address==undefined){
            		to_address=this.admin.address;
            	}
            	if(privateKey==undefined){
	                privateKey = this.admin.key;            		
            	}
            	if(from_address==undefined){
            		from_address=this.admin.address;
            	}
            	if(to_address == from_address){
            		throw new Error('TO and FROM cannot be same');
            	}
                this.validator.validateString(privateKey,'Private Key String',true);
                this.validator.validateString(from_address,'From Address');
                this.validator.validateString(to_address,'To Address');
                this.validator.validateNumber(amount,'Amount Transferred');

                var params=this.formatTransactionParams(from_address,this.contract.options.address, privateKey);
                params.data=this.contract.methods.transfer(to_address, amount).encodeABI();
                var result = await this.makeTransaction(params);
                this.logger.logEvent(ETH_PROXY_SUBJECT,'Transfer Tokens To ',{address:to_address,amount:amount,hash:result});
                return resolve(result.transactionHash);                
            }catch(e)
            {
                this.logger.logError(ETH_PROXY_SUBJECT,e);
                return reject(e);
            }
        });
    }

    getBalances(users){
        return new Promise(async(resolve,reject)=>{
            try{
               this.validator.validateObject(users,'Users');                
               var result = await this.loopThroughTokenBalances(users);
               this.validator.validateObject(result,'User Balances');               
               return resolve(result);                    
            }catch(e){
                this.logger.logError(ETH_PROXY_SUBJECT,e);
                return reject(e);
           }
        });
    }

    getSingleBalance(user_address){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateEthAddress(user_address,'User Address');
                var result = await this.contract.methods.balanceOf(user_address).call();
                this.validator.validateNumber(result,'User Token Balance');
                if(result){
                    return resolve(result);
                }else{
                    throw new Error(result);
                }
            }catch(e){
                return reject(e);
            }
        })
    }

    loopThroughTokenBalances(wallets){
        return new Promise((resolve, reject)=>{
            let balances={};
            asyncLoop(wallets,async(wallet,next)=>{
               try{
                    this.validator.validateEthAddress(wallet.address);
                    this.validator.validateUserId(wallet.user_id);
                    var key = wallet.user_id;
                    if(!balances[key]){
                        balances[key]={};
                    }
                    balances[key][wallet.address]={'user_id':key,'tokens':0};
                    balances[key][wallet.address].tokens=await this.getSingleBalance(wallet.address);
                    //balances[key][wallet.address].eth = await this.web3.eth.getBalance(wallet.address);
                    next();
                }catch(e){
                    this.logger.logError(ETH_PROXY_SUBJECT,e);
                    next();
                }
            },
            function (err) {
                if (err) {
                    this.logger.logError(ETH_PROXY_SUBJECT,e);
                    return;
                }
                resolve(balances);
            });
        });
    }

    formatTransactionParams(_from,_to,_privkey,_value=0, _data='',_gasLimit=3000000,_gasPrice=1000000000){
        this.validator.validateEthAddress(_from,'_From Address');
        this.validator.validateEthAddress(_to,'_To Address');
        //this.validator.validateString(_privkey,'Private Key',true);
        return {
            from:_from,
            to:_to,
            privateKey:_privkey,
            gasLimit:_gasLimit,
            gasPrice:_gasPrice,
            data:_data,
            value:_value,
        }
    }

    makeTransaction(params)
    {
        return new Promise(async (resolve,reject)=>
        {
            try{
                var nonce = await this.getNextNonce(params.from);
                var data = params.data;
                var tx = new EthereumTx({
                    nonce: nonce,
                    gasPrice: this.web3.utils.numberToHex(this.web3.utils.toWei('3', 'gwei')),
                    gasLimit: params.gasLimit,
                    to: params.to,
                    value: params.value,
                    data: params.data,
                 	from:params.from
                });
                // console.log(params.privateKey);
                // console.log(new Buffer.from(params.privateKey),'hex');
                tx.sign(new Buffer.from(params.privateKey,'hex'));
                var raw = '0x' + tx.serialize().toString('hex');
                var result = this.web3.eth.sendSignedTransaction(raw);
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        });
    }
    getNextNonce(address)
    {
        return new Promise(async(resolve,reject)=>{
            try{
                var result = await this.getNonces(address);
                for(var i = Math.min(...result.nonces); i<=Math.max(...result.nonces);i++)
                {
                    if(!result.nonces.includes(i+1))
                    {
                        result.nextNonce=i;
                        break;
                    }
                }
                this.validator.validateNumber(result.nextNonce,'Next Nonce');

                return resolve(result.nextNonce);
            }catch(e){
                return reject(e);
            }
        });
    }

    getNonces(address)
    {
        return new Promise(async(resolve,reject)=> {
            try{
                this.validator.validateEthAddress(address);
                var result={nonces:[],nextNonce:undefined,tx:{pending:{},queued:{}}};
                var accountNonce = await this.getAccountNonce(address);
                result.nonces.push(accountNonce);
                var pendingAccountNonce = await this.getPendingAccountNonce(address,result);
                result.nonces.push(pendingAccountNonce);
                try{
                    var txAccountNonces = await this.getTxNonces(address,result);
                    for(txNonce in txAccountNonces){
                        result.nonces.push(txANonce);                        
                    }
                }catch(err){
                    this.logger.logError(ETH_PROXY_SUBJECT,err.message,err);
                }
                this.validator.validateObject(result,'Nonce Array');
                return resolve(result);
            }catch(e){
                return reject(e);                
            }
        })
    }

    getAccountNonce(address)
    {
        return new Promise(async (resolve, reject)=>{
            try{
                var nonce = parseInt(await this.web3.eth.getTransactionCount(address));
                this.validator.validateNumber(nonce,'Account Nonce');
                return resolve(nonce);
            }catch(e){
                return reject(e);
            }
        });
    }

    getPendingAccountNonce(address,result){
        return new Promise(async(resolve, reject)=>{
            try{
                var nonce = parseInt(await this.web3.eth.getTransactionCount(address,'pending'));
                this.validator.validateNumber(nonce,'Pending Account Nonce');
                return resolve(nonce);
            }catch(e){
                return reject(e);
            }
        });
    }

    getTxNonces(address,result)
    {
        return new Promise(async (resolve,reject)=>{
            try{
                try{
                    var txpool = await this.web3.eth.txpool.content();
                }catch(err){
                    throw new Error('Could not connect to txpool');
                }
                var tx = {};
                var nonces = [];
                if(txpool.pending[address])
                {
                    tx.pending=txpool.pending[address];
                    for(var pending_nonce in tx.pending[address])
                    {
                        nonces.push(parseInt(pending_nonce));
                    }
                }
                if(txpool.queued[address])
                {
                    tx.queued=txpool.queued[address];
                    for(var queued_nonce in tx.queued[address])
                    {
                        nonces.push(parseInt(queued_nonce));
                    }
                }
                this.validator.validateObject(nonces,'Txpool Nonce Array');
                return resolve(nonces);
            }catch(e){
                return reject(e);
        }
    });
    }
}

var proxy = new EthProxy();