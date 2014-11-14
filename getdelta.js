'use strict';
var http = require('http');
var readline = require('readline');
var extend = require('node.extend');
var prettyjson = require('prettyjson');


var info = [];
var jobStart = 0;
var jobEnd = 0;
var baseUrl = 'http://jenkins.mindtap.corp.web:8080/view/Deploy-Jobs/job/QAF%20-%20Deploy/';
var apiStuff=  '/api/json?pretty=true&tree=actions[*[*]]';


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function start() {
	askBaseUrl();
}

function askBaseUrl() {
	rl.question('Enter base URL (e.g http://jenkins.mindtap.corp.web:8080/view/Deploy-Jobs/job/QAF%20-%20Deploy/ ) :', function(answer) {
	  // TODO: Log the answer in a database
	  console.log('Thank you.');
	  if (!answer || answer === '') {
	  	answer = 'http://jenkins.mindtap.corp.web:8080/view/Deploy-Jobs/job/QAF%20-%20Deploy/';
	  }
	  baseUrl = answer;

	  askJobRange();
	});
}

function askJobRange() {
	rl.question('Enter start job to analyze (e.g. 183):', function(answer) {
	  if (!answer || answer === '') {
	  	answer = '180';
	  }
	  console.log('Will start analysis on job:', answer);
	  jobStart = parseInt(answer,10);
	  rl.question('Enter job to end on (e.g 185):', function(ans) {
	  	if (!ans || ans === '') {
	  		ans = '183';
	  	}
	  	console.log('Analysis will end on job ', ans, ' (inclusive)');
	  	jobEnd = parseInt(ans,10);
	  	rl.close();
	  	startAnalysis();
	  });
	});
}

function getData(jobNum, isFinal) {
	var url = baseUrl + jobNum + apiStuff;
	console.log('Getting for ', jobNum, isFinal ? ' Last Job.' : '');
	http.get(url, function(res){
	    var data = '';

	    res.on('data', function (chunk){
	        data += chunk;
	    });

	    res.on('end',function(){
	        var obj = JSON.parse(data);
	        var _data = obj.actions[0].parameters;
	        console.log('Done.');
	        info.push(_data);

	        if (isFinal) {
	        	//do the actual analysis;
	        	analyze();
	        } else {
	        	var newJobNum = jobNum + 1;
	        	getData(newJobNum, jobEnd === newJobNum);
	        }
	    });

	});
}

function startAnalysis() {
	getData(jobStart, false);
}

function analyze() {
	var output = {};
	console.log('========================================\n\n\n\n');
	for (var i=0; i<info.length; i++ ){ 
		var datum = {};
		for (var k=0; k<info[i].length; k++){
			var name = info[i][k].name;
			var value = info[i][k].value;
			datum[name] = value;
			if (output !== {} && value === '-- NONE --') { //only use -- NONE -- for the base dict, delete entries after that.
				delete datum[name];						
			}
		}
		info[i] = datum;

		output = extend(output, info[i]);
	}


	console.log('DONE! ::\n\n');
	console.log(prettyjson.render(output));

}


start();
