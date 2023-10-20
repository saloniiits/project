const express = require('express');
const axios = require('axios');
const { Gateway, Wallets } = require('fabric-network');
const { FileSystemWallet, X509WalletMixin } = Wallets;
const fs = require('fs');
const path = require('path');
const fabricUtilModule = require('./utils/fabric_utils');
const gisUtilModule = require('./utils/geoserver_utils');
const app = express();
const port = 3000;
let contract;

(async function() {
  let start = new Date().getTime();
  contract = await fabricUtilModule.getContract();
  acl_contract = contract.acl;
  drs_contract = contract.drs;
  let end = new Date().getTime();
  let time_taken = end-start
  console.log("time taken = " + time_taken + " milliseconds")
})()

// const contract = fabricUtilModule.getContract();

app.get('/send-request', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/send-response');
    // The data was responded with
    console.log(response.data);
    res.send(response.data);
  } catch (error) {
    // No response data, so we raise a dispute
    // TODO: generalize the requested data using the req object
    // generalize dispute naming
    console.error(error);
    const date = new Date();
    let date_text = date.toString();
    const error_json = {requested_data: "org2-0", timestamp: date_text, error: error};
    const myJSON_error = JSON.stringify(error_json); 
    await fabricUtilModule.RaiseDispute(drs_contract, 'dispute_001', 'Org1', 'Org2', myJSON_error)
    // await drs_contract.submitTransaction('RaiseDispute', );

    console.log('Dispute raised successfully, sending response');

    res.send("Error occured, dispute raised successfully, with ID: dispute_001 " + "error is the following: " + error);
  }
});

app.get('/send-response', (req, res) => {
    // TODO: use req object to do retrive and send relevant data from geoserver (check ACL too)
    const response = 'Hello from Server 1';
    console.log(response);
    res.send(response);
  });

app.post('/respond-dispute', async (req, res) => {
    let dispute_id = req.query.dispute_id;
    let index = req.query.index;
    // TODO: use the index to respond with the correct data after ACL check
    await fabricUtilModule.RespondToDispute(drs_contract, dispute_id, 'The response data');
    console.log('responded to dispute');
    var response = {
      status  : 200,
      success : 'Responded to Dispute Successfully'
    }
    res.send(response)
});

app.get('/get-dispute', async (req, res) => {
  let dispute = await fabricUtilModule.GetDispute(drs_contract, 'dispute_001');
  console.log(dispute);
  let dispute_obj = JSON.parse(dispute);
  res.send(dispute_obj)
});

app.post('/confirm-dispute-resolution', async (req, res) => {
  // generalize dispute identifier for this 
  await fabricUtilModule.ConfirmResolution(drs_contract, 'dispute_001');
  console.log('Dispute resolved successfully');
  var response = {
    status  : 200,
    success : 'Resolved Dispute Successfully'
  }
  res.send(response)
});

app.get('/get-acl', async (req, res) => {
  // expects ACL id as query params
  let id = req.query.id;
  let acl = await fabricUtilModule.GetACL(acl_contract, id);
  console.log(acl);
  res.send(acl)
});

app.post('/update-acl', async (req, res) => {
  // expects ACL id and data index as query params
  let id = req.query.id;
  let index = req.query.index;
  let data_qualifier = gisUtilModule.getLayerQualifierById(parseInt(index))
  await fabricUtilModule.UpdateACL(acl_contract, id, data_qualifier);
  console.log('ACL Update applied, sending response');
  var response = {
    status  : 200,
    success : 'ACL updated Successfully'
  }
  res.send(response)
});

app.post('/create-acl', async (req, res) =>{
  // expects new ACL id and data index and org whos is given access as query params
  let id = req.query.id;
  let index = req.query.index;
  const data_identifier = 'org1-' + index;
  let access_org = req.query.org;
  let data_qualifier = await gisUtilModule.getLayerQualifierById(parseInt(index));

  await fabricUtilModule.AddACL(acl_contract, id, access_org, data_identifier, data_qualifier, '2023-12-25 11:59:59');

  console.log('ACL entry added successfully, sending response');
  var response = {
    status  : 200,
    success : 'ACL entry added successfully'
  }
  res.send(response);

})

app.listen(port, () => {
  console.log(`Server 1 running on port ${port}`);
});
