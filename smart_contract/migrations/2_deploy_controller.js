const Contract = artifacts.require("MyAdvancedToken");
const SafeMath = artifacts.require("SafeMath");
module.exports = function(deployer, network, accounts) {


    // const rate = 21285400;
    const wallet = accounts[0];
    // const cap = 1000000000000000;

    return deployer.deploy(SafeMath).then(function()
        {
            return deployer.deploy(Contract).then(function()
            {
                deployer.link(SafeMath, Contract)
                return Contract.deployed();
            });            
        });

}