'use strict';
// var HttpService = require("./httpService.js");
// const httpService = new HttpService();

const ROOT_TOKEN = "s.gBe4q15mByueVtRhVvhV4gcT";

const urlMap = {
    vaultServer:'http://127.0.0.1:8200',
    init:'v1/sys/init',
  	addSecret:'v1/secret/data/eth-proxy',
  	getSecret:'v1/secret/data/eth-proxy',
  	lookupSelf:'v1/auth/token/lookup-self',
}

class VaultService{
    constructor(app){
        this.urlMap = urlMap;
        this.httpService=app.httpService;
        return this;
    }

    addSecret(namespace,key,value){
        return new Promise(async(resolve,reject)=>{
            try{
                var url = this.urlMap.addSecret+'/'+namespace;
                var innerData = {};
                innerData[key]=value;

                var data = {
                    data:innerData
                };

                data = JSON.stringify(data);
                var headers= {};
                headers["Content-Type"]="application/json";
                var result = await this.sendPostRequest(url,data,headers);
                if(result){
                    return resolve(true);
                }
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        });
    }

    getSecret(namespace,key){
        return new Promise(async(resolve,reject)=>{
            try{
                var url = this.urlMap.getSecret+'/'+namespace;
                var result = await this.sendGetRequest(url);
                try{
                    result = result.data.data[key];                                     
                }catch(e){
                    throw e;
                }
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        });
    }
    lookupSelf(){
        return new Promise(async(resolve,reject)=>{
            try{
                var url = this.urlMap.lookupSelf;
                var result = await this.sendPostRequest(url);
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        });
    }

    sendPostRequest(url,data,headers){
        return new Promise(async(resolve,reject)=>{
            try{
                var result = await this.httpRequest('POST',url,data,headers,true);
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        }); 
    }

    sendGetRequest(url,data,headers){
        return new Promise(async(resolve,reject)=>{
            try{
                var result = await this.httpRequest('GET',url,data,headers,true);
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        });
    }

    httpRequest(type,url,data,headers,json){
        return new Promise(async(resolve,reject)=>{
            try{
                if(!headers){
                    headers= {};
                }
                if(!data){
                    data = {};
                }
                headers['X-Vault-Token']= this.getAuthToken();
                url = this.urlMap.vaultServer+'/'+url;
                switch(type){
                    case 'POST':
                        var result = await this.httpService.postRequest(url,data,headers,json);
                        break;
                    case 'GET':
                        var result = await this.httpService.getRequest(url,data,headers,json);
                        break;
                    default:
                        throw 'Unknown HTTP Request Type';
                }
                if(result.errors){
                    if(result.errors.length===1){
                        throw result.errors[0];
                    }else{                      
                        throw JSON.stringify(result.errors);
                    }
                }
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        });
    }
    getAuthToken(){
        return ROOT_TOKEN;
    }

    // vaultServiceTest(){
    //     try{
    //      console.log(await addSecret('eth-proxy','private_key','MUCH_PRIVATE2'));
    //      console.log(await getSecret('eth-proxy','private_key','key'));  
    //     }catch(e){
    //         console.log(e)
    //     }
    //     return true;
    // }
}

module.exports=VaultService;