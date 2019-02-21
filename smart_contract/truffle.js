//const Web3 = require('web3');
module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // for more about customizing your Truffle configuration!
    networks: {
        development: {
            host: "127.0.0.1",
            port: 5545,
            network_id: "2994",
            gas:2800000,
            gasPrice:1000,
            from: "0xdc3c89119cf36d24a6bc6ad2b5f6c82e6b7882f8"
        },
    },
compilers: {
     solc: {
       version:  "0.4.24"
     }
  }
};
