'use strict';
require('../enviroment');
var request = require("request");
var requestPromise = require("request-promise");

class httpService{
    constructor(app){
        // this.mSAuthService = app.mSAuthService;
        this.logger = app.logger;
        this.validator = app.validator;
        return this;
    };
    postRequest(req_url,data,protocolCompliant=true) {
        // if(protocolCompliant!==false){
        //     data = this.mSAuthService.signMSRequest(data);
        //     protocolCompliant = true;
        // }
        try{
            this.validator.validate(req_url,'url');
            //this.validator.validateObject(data,'Service Request Data');
            //data = {data:JSON.stringify(data)};

            console.log(req_url);
            console.log(data);

            var options={
                uri:req_url,
                body:data,
                method: 'POST',
                // headers: {
                //     'Content-Type': 'application/x-www-form-urlencoded',
                // }
                headers: {
                    'Content-Type': 'application/json',
                }
                ,json:true
            };
            return new Promise(async(resolve, reject)=> {
                requestPromise(options,(err,res,body)=>
            {
                try{
                    if (err) { return reject(err); }
                    return resolve(body);
                }catch(e){
                    return reject(e);
                }
            });
        });
        }catch (e) {
            throw e;
        }
    };
    getRequest(req_url,data,protocolCompliant=true) {
        try{
            this.validator.validate(req_url,'url');
//            this.validator.validateObject(data,'Request Data');
  //          data = {data:JSON.stringify(data)};
            var options={
                uri:req_url,
                body:data,
                method: 'GET',
                json:true
            };
                            console.log(req_url);
                console.log(data);

            return new Promise(async(resolve, reject)=> {
                requestPromise(options,(err,res,body)=>
            {
                try{
                    if (err) { return reject(err); }
                    return resolve(body);
                }catch(e){
                    return reject(e);
                }
            });
        });
        }catch (e) {
            throw e;
        }
    };
}

module.exports=httpService;
