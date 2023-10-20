'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../fabric-samples/test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../fabric-samples/test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'drs';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


async function getContract(){

    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();

    // build an instance of the fabric ca services client based on
    // the information in the network configuration
    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    // in a real application this would be done on an administrative flow, and only once
    await enrollAdmin(caClient, wallet, mspOrg1);

    // in a real application this would be done only when a new user was required to be added
    // and would be part of an administrative flow
    await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

    // Create a new gateway instance for interacting with the fabric network.
    // In a real application this would be done as the backend server session is setup for
    // a user that has been verified.
    const gateway = new Gateway();

    
    // setup the gateway instance
    // The user will now be able to create connections to the fabric network and be able to
    // submit transactions and query. All transactions submitted by this gateway will be
    // signed by this user using the credentials stored in the wallet.
    await gateway.connect(ccp, {
        wallet,
        identity: org1UserId,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });

    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    let drs_contract = network.getContract('drs');
    let acl_contract = network.getContract('acl');
    return {
        drs: drs_contract,
        acl: acl_contract
    }
    
    // const ccpPath = path.resolve(__dirname, 'connection-profile.yaml');
    // const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // const walletPath = path.join(process.cwd(), 'wallet');
    // const wallet = new FileSystemWallet(walletPath);
    // const identity = identity_name;

    // const gateway = new Gateway();
    // gateway.connect(ccp, { wallet, identity: identity, discovery: { enabled: true, asLocalhost: true } });

    // // Get the network and contract
    // const network = gateway.getNetwork(channel_name);
    // const contract = network.getContract(contract_name);
    // return contract;
}

async function RaiseDispute(contract, dispute_id = 'dispute_001', raiser = 'Server1', defendant = 'Server2', description = 'Data not received from Server2'){
    await contract.submitTransaction('RaiseDispute', dispute_id, raiser, defendant, description);
    console.log('Dispute raised successfully');
}

async function RespondToDispute(contract, dispute_id = 'dispute_001', response = 'Data from Server2'){
    await contract.submitTransaction('RespondToDispute', dispute_id, response);
    console.log('Responded to dispute  successfully');
}

async function GetDispute(contract, dispute_id = 'dispute_001'){
    let result = await contract.evaluateTransaction('GetDispute', dispute_id);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
    return result;
}

async function ConfirmResolution(contract, dispute_id = 'dispute_001'){
    await contract.submitTransaction('ConfirmResolution', dispute_id);
    console.log('Dispute resolved successfully');
}

async function AddACL(contract, Id = '1', Identity = 'org2', Identifier = 'org1-69', Qualifier = 'MultiPolygon.poly_landmarks', Validity = '2024-1-1 0:0:0'){
    await contract.submitTransaction('AddACL', Id, Identity, Identifier, Qualifier, Validity);
    console.log('ACL entry created successfully');
}

async function GetACL(contract, Id = '1' ){
    let result = await contract.evaluateTransaction('GetACL', Id);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
    return result;
}

async function UpdateACL(contract, Id = '1', Qualifier = 'MultiPolygon.poly_landmarks'){
    await contract.submitTransaction('UpdateACL', Id, Qualifier);
    console.log('ACL entry updated successfully');
}



module.exports  = {
    getContract,
    RaiseDispute,
    RespondToDispute,
    GetDispute,
    ConfirmResolution,
    AddACL,
    GetACL,
    UpdateACL

};