'use strict';
const winston = require('winston');
// const myFormat = printf(info => {
//     return '${info.timestamp} [${info.label}] ${info.level}: ${info.message}';
// });
const myFormat = {info :'${info.timestamp} [${info.label}] ${info.level}: ${info.message}'
};

const someLogger = winston.createLogger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: process.env.logDir+'/error.log', level: 'error' }),
      new winston.transports.File({ filename: process.env.logDir+'/info.log', level: 'info' }),
      new winston.transports.File({ filename: process.env.logDir+'/combined.log' })
    ],
    format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
    winston.format.simple()
    )
});
// const someLogger =winston.createLogger({
//     level: 'info',
//     format: winston.format.json(),
//     transports: [
//         new winston.transports.Console(),
//         new winston.transports.File({ filename: process.env.logDir+'/error.log', level: 'error' }),
//         new winston.transports.File({ filename: process.env.logDir+'/info.log', level: 'info' }),
//         new winston.transports.File({ filename: process.env.logDir+'/combined.log' })
//     ]
// });

class Logger{
    constructor(){
        this.subjects = {};
        this.subjects.TwilioSubject="Twilio";
        this.subjects.ChatSubject="Chat";
        this.subjects.WorkflowSubject="Workflow";
        return this;
    };
    logEvent(subject,message,data,may_include_pers_data){
      if(may_include_pers_data==true){
            this.log('info',subject+":"+message);
      }else{
        if(data!=undefined){
                this.log('info',subject+":"+message,data);
        }else{
                this.log('info',subject+":"+message);
        }
      return false;
      //log
      }
    };
    logError(subject,message,data,may_include_pers_data){
      if(typeof message === 'string' && data==undefined){
        this.log('error',subject+":"+message);
        return true;
      }else{

        if(may_include_pers_data===true){
              this.log('error',subject+":"+message);
        }else{
          if(typeof message === 'object'){
            if(message.message){
              var log_data = {data:data}
              if(!message.data){
                message.data = {};
              }                
              if(message.stack){
                console.log(message.stack);
//                log_data.stack = message.stack;
              }
              this.log('error',subject+":"+message.message,log_data);
              return true;
            }
          }
          if(data!==undefined){
            if(typeof data === 'object'){
                if(data.message){
                    data = data.message;
                }else{
                    data = JSON.stringify(data);
                }
                if(data.auth_token){
                    data.auth_token='HIDDEN';
                }
            }
            this.log('error',subject+":"+message,data);
          }else{
            this.log('error',subject+":"+message);
          }
        }        
      }
      return false;
  };
  log(level,message,data){
        //if (process.env.NODE_ENV !== 'production') {
            someLogger.log({
                level: level,
                message: message,
                data:JSON.stringify(data)
            });
        //}
  };
   }
module.exports=Logger;