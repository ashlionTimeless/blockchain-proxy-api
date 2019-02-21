process.env.NODE_ENV = 'production';
if(process.env.NODE_ENV==='development'){
    process.env.PORT=3000;
    process.env.SERVER = "http://127.0.0.1";
    process.env.fileMode='0666';
    process.env.maxFileSize=5000000;//5mb
    process.env.logDir = '.';
    process.env.node_address='http://127.0.0.1:6546';
    process.env.CONTRACT_ADDRESS='0xc777fc9d7e6f77eca8bd9c17fb91976ed04a02be';
    process.env.PROVIDER_ADDRESS='http://127.0.0.1:6546';
    process.env.ADMIN_ADDRESS="0xA02aBC8436a61ACB05DBF8aF6DeD2842E8A8CC27";
    process.env.KEY_PATH='blockchain_proxy//ethereum//key';
    process.env.ABI_PATH='smart_contract//abi/synthera.json';

}else{
    if(process.env.NODE_ENV==='production'){
        process.env.PORT=3000;
        process.env.SERVER = "http://127.0.0.1";
        process.env.fileMode='0666';
        process.env.maxFileSize=5000000;//5mb
        process.env.logDir = '.';
        process.env.node_address='http://127.0.0.1:6548';
        process.env.CONTRACT_ADDRESS='0x08ceed1e8db59acbb687a5752f0a7db815cfda5e';
        process.env.PROVIDER_ADDRESS='http://127.0.0.1:6548';
        process.env.ADMIN_ADDRESS='0x875Fb514E050958f25A79dBdB74130eD545504aD';
 	process.env.KEY_PATH='blockchain_proxy//ethereum//key';
	process.env.ABI_PATH='smart_contract//abi/synthera.json';

    }
}
