var startFileName = ''
var dirFiles = [];
var dirCurFile = -1;
var fastmode=false;
var cachelisting=true;
var allowedExt = '.JPG|.GIF|.PNG|.JPEG';
var allowedExtRegex = null;
var directorySortType = 'filename';

function updateMatchfileRegex(){
	allowedExtRegex = new RegExp("("+allowedExt+")$",'gi');
}
updateMatchfileRegex();

function isValidFile(f){
	return f.match(allowedExtRegex);
}

function goToOrOpenOptions(completedCallback){
  var optionsUrl = chrome.extension.getURL("about.html"); // typically "options.html"
  chrome.tabs.query({
    url: optionsUrl,
    currentWindow: true
  }, function(tabs){
    if( tabs.length > 0 ){
      chrome.tabs.highlight({tabs:[tabs[0].index], windowId:tabs[0].windowId}, completedCallback);
    }else{
      chrome.tabs.create({
        url: optionsUrl,
        active: true
      }, function(t){
        chrome.tabs.highlight({tabs:[t.index]}, completedCallback)
      });
    }
  });
}

function processFileRows(directoryURL, sentStartFileName, resp, storeItAll, cbf){
	//var resDirName = resp.match(/start\(\"([\/\w]+)\"\);/);
	//console.log('processFileRows', directoryURL, sentStartFileName, resDirName[1], storeItAll)
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
			size = rDat[3];
			datetime = rDat[6];
			timestamp = rDat[5];

			//console.log(f, size,  date, time, timestamp)
			if( size > 0 ){ // we must skip 0byte images where content scripts do not run!
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

	if( storeItAll && !cachelisting) storeItAll = false;

	//console.log('saving directory list for dirCurFile '+ dirCurFile)
	if( storeItAll ){
		chrome.storage.local.set(storeObj, function(){
			cbf(storeObj);
		});
	}else{
		cbf(storeObj);
	}
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
	},
	random: function(a,b){
		return Math.random() < 0.5;
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
	/* defaults for pref read */
	chrome.storage.local.get({fastmode: false, matchfiles:false, sorttype:false, cachelisting:'true'},function(obj){
		// after saving prefs current directory is cleared forcing cache refresh...  resort need not be applied
		if( obj.matchfiles && obj.matchfiles.length ){
			allowedExt = obj.matchfiles;
			updateMatchfileRegex();
		}
		if( obj.sorttype && sorts[obj.sorttype] ){
			directorySortType = obj.sorttype;
		}
		fastmode=obj.fastmode=='true';
		cachelisting = obj.cachelisting=='true';
		if(typeof(cbf)=='function')cbf(obj);
	});
}
