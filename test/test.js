var fs = require('fs');
var path = require('path');
var util = require('util')
var promise = require('q');

var perfy = require('perfy');

var parser = require('../index');

var readdir = promise.denodeify(fs.readdir);
var readFile = promise.denodeify(fs.readFile);

var logFilesDirectoryName = 'log files';

var logFilesFilter = [
	
];

var logFilesForce = [

];

var logFilesDirectoryFullPaths = [
	path.join(__dirname, logFilesDirectoryName, 'spare35'),
	path.join(__dirname, logFilesDirectoryName, 'brice'),
	path.join(__dirname, logFilesDirectoryName, 'iberia', 'alberto'),
	path.join(__dirname, logFilesDirectoryName, 'iberia', 'ivan'),
	path.join(__dirname, logFilesDirectoryName, 'iberia', 'renato'),
	path.join(__dirname, logFilesDirectoryName, 'iberia', 'iberia aws'),
	path.join(__dirname, logFilesDirectoryName, 'iberia', 'desktop'),
];

parser.getParser().then(parser => {
	
	return promise.all(logFilesDirectoryFullPaths.map(logFilesDirectoryFullPath => readdir(logFilesDirectoryFullPath).then(files => {
		
		return files.map(file => {
			
			if(fs.lstatSync(path.join(logFilesDirectoryFullPath, file)).isFile()) {
				
				return {
					fileName: file,
					fullName: path.join(logFilesDirectoryFullPath, file)
				};
				
			}
			
			return false;
			
		})
		.filter(i => i && logFilesFilter.indexOf(i.fileName) == -1)
		.filter(i => i && (logFilesForce.length == 0 || logFilesForce.indexOf(i.fileName) !== -1));
		
	}))).then(files => {
		
		return promise.all([
	
			parser,
			
			[].concat.apply([], files)
		
		]);
		
	})
	
}).then(reply => {
	
	var parser = reply[0];
	var files = reply[1];

	var step = promise([]);
	files.forEach(file => {

		step = step.then(function(arr) {
			
			return promise().then(() => {
				
				return readFile(file.fullName, 'utf-8').then(fileContent => {
					
					return {
						fullName : file.fullName,
						fileName: file.fileName,
						fileContent: fileContent
					}
					
				});
				
			}).then(file => {
			
				perfy.start('process');
				
				var parsing = 'parsing ' + file.fileName + ' ...';
				process.stdout.write(parsing);
				
				var parsedFile = parseQlikLogFile(parser, file)
					
				process.stdout.write('\r' + ' '.repeat(parsing.length + 1) + '\r');

				if (
					!parsedFile.parsed || (
						parsedFile.result.filter(blk => blk.blockType == 'FAILED').length == 0 &&
						parsedFile.result.filter(blk => blk.blockType == 'UNKNOWN').length > 0
					)
				) {

					var strParsed = util.inspect(parsedFile, { showHidden: false, depth: null, colors: false, maxArrayLength: null });
				
					console.log('err', file.fileName, perfy.end('process').time);
					
					fs.writeFileSync(path.join(__dirname, 'log files out', 'err-' + file.fileName), strParsed);
						
					return promise.resolve(arr.concat([{ type: 'err', file: file }]));
					
				} else {
				
					console.log('done', file.fileName, perfy.end('process').time);
					
					// fs.writeFileSync(path.join(__dirname, 'test', 'log files out', 'done-' + file.fileName), JSON.stringify(parsedFile));
					
					return promise.resolve(arr.concat([{ type: 'done', file: file }]));
					
				}
					

				
			})
			
		});
		
	});
	
	return step;
	
}).then(function(arr) {
	
	console.log('\n' + arr.filter(file => file.type == 'err').map(file => "'" + file.file.fileName + "',").join('\n'))

	
}).fail(function(err) {
	
    console.log('fail', util.inspect(err, { showHidden: true, depth: null, colors: true, maxArrayLength: null }));
	
});
	
function parseQlikLogFile(parser, file) {
	
	try {
		
		var parsed = parser.parse(file.fileContent);
		parsed.fileName = file.fileName;
		
		return parsed
		
	} catch (e) {
		
		if (e.name === 'SyntaxError') {
			
			return {
				fileName: file.fileName,
				parsed: false,
				message: e.message,
				expected: e.expected,
				found: e.found,
				location: e.location
			}
			
		} else {
			throw e;
		}
		
	}
	
}