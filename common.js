var startFileName = ''
var dirFiles = [];
var dirCurFile = -1;
var allowedExt = '.JPG|.GIF|.PNG|.JPEG';
var directorySortType = 'filename';

function isValidFile(f){
	var rx = new RegExp("("+allowedExt+")$",'gi');
	return f.match(rx);
}

function processFileRows(directoryURL, sentStartFileName, resp, cbf){
	startFileName = sentStartFileName;
	var newDirFiles=[];
	var rows=resp.split('addRow("');
	var f0,f,en,rDat,datetime, date, time, size, timestamp;
	for(var i=1,l=rows.length;i<l;i++){

		en=rows[i].indexOf('");');
		rDat = JSON.parse('["'+rows[i].substr(0,en)+'"]')

		f0 = rDat[0];
		f = rDat[1]; //escaped name

		if(f != '..'){
			if(!isValidFile(f))continue;
			if(f==startFileName || f0 == startFileName ){ // determineSort function seeks again
				dirCurFile=newDirFiles.length;
			}
			datetime = rDat[4].split(', ');
			date = datetime[0];
			time = datetime[1];
			size = rDat[3];
			timestamp = new Date(date + ' ' + time).getTime();

			//console.log(f, size,  date, time, timestamp)
			if( size != "0 B" ){ // we must skip 0byte images where content scripts do not run!
				newDirFiles.push({file_name:f0, date:timestamp});
			}
		}
	}
	dirFiles = newDirFiles;
	determineSort(true);

	var storeObj = {
		'dir_url':directoryURL,
		'dir_cache':JSON.stringify(dirFiles),
		'dir_current':dirCurFile,
		'dir_cur_name':startFileName,
	};

	//console.log('saving directory list for dirCurFile '+ dirCurFile)
	chrome.storage.local.set(storeObj, function(){
		cbf(storeObj);
	});
}

function determineSort(initial){
	// the filename bypass on sorting only applies if this is the initial sort, if we have already sorted with something else then we need to re-sort
	if(!initial||directorySortType!='filename')dirFiles = dirFiles.sort(sorts[directorySortType]);// this is slow, and locks more than just the current process, avoid when possible, needed when non-initial
	seekCurIndex();
}

function seekCurIndex(){
	for(var i=0,l=dirFiles.length;i<l;i++){
		if(dirFiles[i].file_name==startFileName || dirFiles[i].file_name==decodeURIComponent(startFileName)){
			dirCurFile=i;
		}
	}
}

var sorts = {
	date_desc: function(a,b){
		return b.date - a.date;
	},
	date_asc: function(a,b){
		return -sorts.date_desc(a,b);
	},
	filename: function(a,b){
		return a.file_name.localeCompare(b.file_name);
	},
	filename_reverse: function(a,b){
		return -sorts.filename(a,b);
	}
};

function loadCache(cbf){
	chrome.storage.local.get({dir_url:'', dir_cache:'[]', dir_current:-1, dir_cur_name:''}, function(dataObj){
		dirFiles = JSON.parse(dataObj.dir_cache);
		dirCurFile = dataObj.dir_current - 0;
		startFileName = dataObj.dir_cur_name;
		if(typeof(cbf)=='function')cbf(dataObj);
	})
}

function loadPrefs(cbf){
	chrome.storage.local.get({matchfiles:false, sorttype:false},function(obj){
		// after saving prefs current directory is cleared forcing cache refresh...  resort need not be applied
		if( obj.matchfiles && obj.matchfiles.length ){
			allowedExt = obj.matchfiles;
		}
		if( obj.sorttype && sorts[obj.sorttype] ){
			directorySortType = obj.sorttype;
		}
		if(typeof(cbf)=='function')cbf(obj);
	});
}