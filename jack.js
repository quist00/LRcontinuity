var csv = require('csv-parser')
var fs = require('fs')
var dict = require("dict");
var Regex = require("regex");


var d = dict({});
var missing = dict({});
var proxyiedResources;
var outcomes = "OutComes: ";

//check for missing arguments
if (process.argv.length !== 4) {
    console.error('Exactly two argument required');
    process.exit(1);
}
//notice that processing has started
console.log("Processing . . .");
//create handles for files
var input = process.argv[2];
var input2 = process.argv[3];

function CompareLists() {
    //console.log("2nd Last");
    //console.log(d.size);
    var found = 0;
    var notfound = 0;
    var lvl1MatchFailures = 0;
    var lvl2MatchFailures = 0;
    var lvl3MatchFailures = 0;
    var proxiedUrlCount = 0;
    d.forEach(function (value, key) {
        //console.log("URL: " + key);
        //var myRegexp = /(https?:\/\/0-)(([a-zA-Z\-]*\.)?[^/]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2})*)(\.patris\.apu\.edu)/gm;
        if (key == "http://0-www.ipasource.com.patris.apu.edu") {
            console.log("processing specific key: ");
            var myRegexp = /(https?:\/\/0-)(([a-zA-Z\-]*\.)?[^\/]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2})*)(\.patris\.apu\.edu)/gm;

            //var matches = key.match(myRegexp);
            var matches = myRegexp.exec(key);
            //console.log(key);
            if (matches !== null) {
                proxiedUrlCount++;
                //var contstructedRegex = /ipasource.com/gm;
                var contstructedRegex = new RegExp(matches[2], 'gm');
                //console.log(matches[2])
                var matchResults = proxyiedResources.match(contstructedRegex);
                if (matchResults !== null) {
                    // outcomes += "Match found for " + key + "\n";
                    // outcomes += "Using " + contstructedRegex + "\n";
                    //console.log(matchResults[0]);
                    found++
                } else {
                    //console.log("Level 2 Match Failure matching against: " + contstructedRegex);
                    lvl2MatchFailures++;
                    //outcomes += "Match not found for " + key + "\n";
                    if (matches[3]) {
                        var refineddRegex = new RegExp("\\*\\." + matches[2].slice(matches[3].length), 'gm');
                        //console.log("Refined Regex: " + matches[2].slice(matches[3].length))
                        var refinedMatchResults = proxyiedResources.match(refineddRegex);
                        if (refinedMatchResults !== null) {
                            //outcomes += "Match found for " + key + "\n";
                            //console.log(refinedMatchResults[0]);
                            found++
                        } else {
                            //console.log("Level 3 Match Failure matching against: " + refineddRegex);
                            lvl3MatchFailures++;
                            notfound++
                            outcomes += "Match not found for " + key + "\n";

                        }
                    } else {
                        //inital was not found and there is no match 3 to slice off the start
                        notfound++
                        outcomes += "Match not found for " + key + "\n";
                    }

                }
            } else {
                //console.log("Level 1 Match Failure : " + key);
                lvl1MatchFailures++;
            }
        }
    });

    console.log(outcomes);
    console.log("Found: " + found);
    console.log("Not Found: " + notfound);
    console.log("Unique URLs in KB " + d.size);
    console.log("Proxied Items to be Checked " + proxiedUrlCount);
    //console.log("LEVEL 1 Match Failures " + lvl1MatchFailures);
    //console.log("LEVEL 2 Match Failures " + lvl2MatchFailures);
    //console.log("LEVEL 3 Match Failures " + lvl3MatchFailures);
    //console.log(proxyiedResources);
}


// while ((m = regex.exec(str)) !== null) {
//     // This is necessary to avoid infinite loops with zero-width matches
//     if (m.index === regex.lastIndex) {
//         regex.lastIndex++;
//     }

//     // The result can be accessed through the `m`-variable.
//     m.forEach((match, groupIndex) => {
//         console.log(`Found match, group ${groupIndex}: ${match}`);
//     });
// }
var progressTicker = 0;
var progressBar = "*"


fs.createReadStream(input)
    .pipe(csv())
    .on('data', function (data) {

        if (typeof data.ProxiedURL === 'string') {

            var myRegexp = /^https?:\/\/([a-zA-Z\-]*\.)?[^/]+\.[a-zA-Z]{2,}/gm;
            var res = data.ProxiedURL.match(myRegexp);

            if (res !== null) {
                d.set(res[0], "0");
                progressTicker++;
                if (progressTicker >= 20000) {
                    console.log(progressBar);
                    progressBar += "*";
                    progressTicker = 0;
                }

            }

            // if (res !== null) {
            //     console.log(res[0]);
            // }
        }
        //console.log(typeof data.ProxiedURL);
        //console.log(data.ProxiedURL);
        //console.log(d.size);

    }).on('end', CompileProxyList);

function CompileProxyList() {
    fs.createReadStream(input2)
        .pipe(csv())
        .on('data', function (data) {

            if (typeof data.IP === 'string') {
                proxyiedResources += data.IP
                // var myRegexp = /^([a-zA-Z\-]*\.)?[^/]+\.[a-zA-Z]{2,}/gm;
                // var res = data.IP.match(myRegexp);

                // if (res !== null) {
                //     d.set(res[0], "0");
                //     progressTicker++;
                //     if (progressTicker >= 20000) {
                //         console.log(progressBar);
                //         progressBar += "*";
                //         progressTicker = 0;
                //     }

            }

            // if (res !== null) {
            //     console.log(res[0]);
            // }
            //}
            //console.log(typeof data.ProxiedURL);
            //console.log(data.ProxiedURL);
            //console.log(d.size);

        }).on('end', CompareLists);
}
// d.forEach(function (value, key) {
//     console.log("Proxied URL:  " + key);
// });

//************************ */
//regex that breaks apart APU urls into protocal+0-, full resource domaine, resource subdomains, apu suffixs
//(https ?:\/\/0-)(([a-zA-Z\-]*\.)?[^/]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2})*)(\.patris\.apu\.edu)(https?:\/\/0-)(([a-zA-Z\-]*\.)?[^/]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2})*)(\.patris\.apu\.edu)

//************************ */