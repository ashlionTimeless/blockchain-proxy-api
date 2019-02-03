// ERROR_MESSAGES
const NO_COOKIES_FOUND='No valid cookies found';
const COOKIE_PARSING_ERROR=' Cookie parsing error';
const SERIALiZATION_ERROR = 'SERIALIZATION ERROR';
const relogin = require('../exceptions/reloginException');

// params
const cookieName=process.env.cookieName;
const soughtToken='auth_token';
const csrfBackend=process.env.csrfBackend;

var Cookies = require('cookies');
require('../config/enviroment');
const validator = require('../utilites/validator');
var httpService = require('./httpService');
var serializer = require('../utilites/php-js-serializer');
const urlMap = require('../config/urlMap');
const logger = require('../utilites/logger');
var authService = function(){
    return {
        getUser: async function(){
            try{
                var req_url=urlMap.server+urlMap.get_user;
                var data=await httpService.requestHttp(req_url);
                validator.validate(data,'object','User');
                return data;
            }catch (e) {
                console.log(e);
            }
        },
        getUserByToken: async function(auth_token){
            try{
                validator.validateAuthToken(auth_token);
                var auth_data = {auth_token:auth_token};
                var req_url=urlMap.server+urlMap.get_user_by_token;
                var data=await httpService.requestHttp(req_url,auth_data);
                validator.validate(data,'object','User');
                return data;
            }catch (e) {
                console.log(e);
            }
        },
        getAuthTokenFromReq: function(req,res){
            try{
                var keys = "TODO";
                var cookies = new Cookies(req, res, { keys: keys });
                var auth =  cookies.get(cookieName,{signed:false});

                console.log(cookieName);
                console.log(cookies)
                validator.validate(auth,'string','Cookies');
                if(auth)
                {
                    var raw_token = cookies.get(soughtToken, { signed: false });
                    validator.validate(raw_token,'string','Raw Auth Token');
                    var auth_token = parseCookie(raw_token);
                    validator.validateAuthToken(auth_token)
                    return auth_token;
                }else{
                    throw NO_COOKIES_FOUND;
                }

                function parseCookie(raw)
                {
                    try{
                        raw = unescape(raw).replace(/['"]+/g, '');
                        var data = raw.substring(raw.lastIndexOf(':')+1,raw.length-2);
                        if(data){
                            return data;
                        }else{
                            throw COOKIE_PARSING_ERROR;
                        }
                    }catch(e){
                        throw COOKIE_PARSING_ERROR;
                    }
                }
            }catch(e){
                logger.logError('Chat',e);
                throw relogin;
            }
        },
        getAuthTokenFromRawCookie:function(cookieFile){
            try{
                validator.validate(cookieFile,'string','Cookie File');
                var data = parseRawCookies(cookieFile);
                validator.validate(data,'object','Parsed Raw Cookies');
                var serializedCookie = fetchSerializable(data.auth_token);
                validator.validate(serializedCookie,'string','Serializable Cookie');
                var result = serializer.deserialize(serializedCookie)[1];
                validator.validate(result,'string','Parsed Auth Token');
                return result;
            }catch (e) {
                logger.logError('Chat',SERIALiZATION_ERROR,e);
                throw COOKIE_PARSING_ERROR;
            }

            function parseRawCookies(str) {
                validator.validate(str,'string','Raw Cookie File');
                var cookie = str.split("; ");
                var object = {};
                for(var i=0; i<cookie.length; i++){
                    cookie[i] = cookie[i].split('=');
                    if(cookie[i][0]!=csrfBackend){
                        try{
                            // console.log('FULL');
                            // console.log(cookie[i]);
                            // console.log('PREPARSE')
                            // console.log(cookie[i][1]);
                            object[cookie[i][0]] = decodeURIComponent(cookie[i][1]);
                            // console.log('------------------------------------------------');
                            // console.log('AFTER PARSE')
                            // console.log(cookie[i][0]);

                        }catch (e) {
                            throw COOKIE_PARSING_ERROR;
                        }
                    }
                }
                if(object){
                    validator.validate(object,'object','Parsed Cookie');
                    return object;
                }
                throw COOKIE_PARSING_ERROR;
            }

            function fetchSerializable(str)
            {
                //NOT SURE IF NOT KRUTCH
                if(str.indexOf('a:2')){
                    return str.substring(str.indexOf('a:2'),str.length)
                }
                return str;
            }
        }
    }
};

module.exports = authService();