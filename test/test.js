var parser = require('../index');

parser.getParser().then(parser => {
	
	var parsedString = parser.parse(`
	2016-11-15 02:12:03      ReloadCodebase                Classic
	2016-11-15 02:12:04      Reload Executed By            UserDirectory=INTERNAL; UserId=sa_scheduler
	2016-11-15 02:12:04      Process Executing             Qlik Sense Server
	2016-11-15 02:12:04      Process ID                    4940
	2016-11-15 02:12:04 0048 set c_lightblue 			= 'RGB(188,181,201)' & (c + 1 + (3 + 4) *
	2016-11-15 02:12:04 0048 2)
	`);
	
	console.log(parsedString);

})