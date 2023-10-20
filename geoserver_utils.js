'use strict';
const path = require('path');
const geoserver_api = "http://localhost/geoserver/rest";
const username = "admin";
const password = "geoserver";
const axios = require('axios');

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
      });
    };
  }

async function getLayers(){
    console.log("fetching layers ...");
    let res = await axios.get(geoserver_api + "/layers", {
        auth: {
          username: username,
          password: password
        }
      });
    console.log("layers fetched, printing them ...");
    console.log(JSON.stringify(res.data, null, 2));
    return res.data;
}

async function getLayerByID(id){
    let layers = await getLayers();
    const layer_name = layers["layers"]["layer"][id]["name"];
    const layer_href = layers["layers"]["layer"][id]["href"];
    console.log("fetching layer {0} ...".format(layer_name));
    let res = await axios.get(layer_href, {
        auth: {
            username: username,
            password: password
          }
    });
    console.log("layer fetched, printing details ...");
    console.log(JSON.stringify(res.data, null, 2));
    return res.data;
}

async function getLayerNameByID(id){
    let layers = await getLayers();
    const layer_name = layers["layers"]["layer"][id]["name"];
    return layer_name;
}

async function extractGeometryFromLayerResource(resource){
    let attributes = resource.featureType.attributes.attribute;
    let binding;
    if (Array.isArray(attributes)) {
        binding = attributes[0].binding;

    }
    else{
        binding = attributes.binding;
    }
    let geometry = binding.split(".").slice(-1)[0];
    console.log("geometry is {0}".format(geometry));
    return geometry;
}

async function getLayerGeometryById(id){
    let layer = await getLayerByID(id);
    const resource_href = layer.layer.resource.href
    console.log("fetching layer resource ...");
    let res = await axios.get(resource_href, {
        auth: {
            username: username,
            password: password
          }
    });
    console.log("layer resource fetched, extracting geometry ...");
    const geometry = extractGeometryFromLayerResource(res.data);
    return geometry;
}

async function getLayerQualifierById(id){
    let name = await getLayerNameByID(id);
    let geometry = await getLayerGeometryById(id);
    const qualifier = geometry + '.' + name;
    console.log("Qualifier is {0}".format(qualifier))
    return qualifier;
}

module.exports  = {
    getLayers,
    getLayerByID,
    getLayerNameByID,
    extractGeometryFromLayerResource,
    getLayerGeometryById,
    getLayerQualifierById
};
