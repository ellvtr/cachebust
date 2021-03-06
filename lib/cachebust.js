/*
 *
 * https://github.com/furzeface/cachebust
 *
 * Copyright (c) 2014 Daniel Furze
 * Licensed under the MIT license.]
 *
 */

'use strict';

var cheerio = require('cheerio'),
  MD5 = require('md5'),
  fs = require('fs');

function loadAttribute(content) {
  if (content.name.toLowerCase() === 'link') {
    return content.attribs.href;
  }


  if (content.name.toLowerCase() === 'script') {
    return content.attribs.src;
  }

  throw "No content awaited in this step of process";
}


exports.busted = function(fileContents, options) {
  var self = this, $ = cheerio.load(fileContents);

  self.MD5 = function(fileContents, originalAttrValue, options) {
    // Pull request by ellvtr, workaround for issue https://github.com/furzeface/cachebust/issues/19
    // Continue to next file if you can't open it by using try/catch1
    var originalAttrValueWithoutCacheBusting = originalAttrValue.split("?")[0];
    try {
      // var originalAttrValueWithoutCacheBusting = originalAttrValue.split("?")[0],
      var hash = MD5(fs.readFileSync(options.basePath + originalAttrValueWithoutCacheBusting).toString());

      return fileContents.replace(originalAttrValue, originalAttrValueWithoutCacheBusting + '?v=' + hash);
    } catch(e){
      console.log("gulp-cache-bust error:",e);
      return fileContents;
    }
  };
  
  self.timestamp = function(fileContents, originalAttrValue, options) {
    var originalAttrValueWithoutCacheBusting = originalAttrValue.split("?")[0];
    return fileContents.replace(originalAttrValue, originalAttrValueWithoutCacheBusting + '?t=' + options.currentTimestamp);
  };

  self.constant = function(fileContents, originalAttrValue, options) {
      var originalAttrValueWithoutCacheBusting = originalAttrValue.split("?")[0];
      return fileContents.replace(originalAttrValue, originalAttrValueWithoutCacheBusting + '?v=' + options.value);
  };

  options = {
    basePath : options.basePath || "",
    type : options.type || "MD5",
    currentTimestamp : new Date().getTime(),
    value: options.value || ''
  };

  var protocolRegEx = /^(http(s)?)|\/\//, elements = $('script[src], link[rel=stylesheet][href], link[rel=import][href]');

  for (var i = 0, len = elements.length; i < len; i++) {
    var originalAttrValue = loadAttribute(elements[i]);

    // Test for http(s) and // and don't cache bust if (assumed) served from CDN
    if (!protocolRegEx.test(originalAttrValue)) {
      fileContents = self[options.type](fileContents, originalAttrValue, options);
    }
  }

  return fileContents;
};
