// Author: Zane Lackey <zane@lowfidelity.net>
// Requires the following NodeJS modules:
// request
// jsdom
// nodemailer 

// Usage: node xssver.js js_overrides_file.html target_url
main();

function main() {

// This must be set to the FQDN that any relative JS scripts will be loaded from
var baseJsUrl = "http://www.example.com";

// open js overrides file, read in contents 
var overridesFs = require('fs');
jsOverrides =  overridesFs.readFileSync(process.argv[2]);

// grab test url from the command line
url = process.argv[3];

// Fetch the potential XSS URL, but don't interpret the content yet
var request = require('request');
request({ uri:url }, function (error, response, body) {
    // We deliberately don't check that response code is 200 for the case where XSS shows up in a non-200 error page
    if (error) {
        console.log('FATAL: Couldn\'t fetch the url')
    }

    // Inject our instrumented JS overrides at the top of the returned content
    body = jsOverrides + body;

    // Now that we've overridden our JS methods, create a window that interprets the content
    var jsdom = require('jsdom');
    jswindow = jsdom.jsdom(body, null, { url: baseJsUrl }).createWindow();
    // See if our overridden methods were called
    if (jswindow.location == "XSSDETECTED") {
        sendXSSAlert();
        }
    });


function sendXSSAlert() {
    var querystring = require("querystring"); // URL encoder
    var email = require('nodemailer');
    email.SMTP = { 
        host: 'localhost'
    }

    url = querystring.escape(url); // Encode our hostile URL before notifying people of it
    
    email.send_mail({
        from : "Node XSS Test <node@example.com>",
        to : "alerts@example.com",
        subject : "Example XSS Alert",
        html: "Example XSS detected at <b>" + url + "</b>",
        },
        function(err, result){
            if(err){ console.log(err); }
        });
    process.exit();
    };
};
