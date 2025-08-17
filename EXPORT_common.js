// This is part of the "Local Image File Viewer" extension

var navig = (typeof(navigator)!='undefined' ? navigator : false) || {userAgent: 'Chrome', platform: 'win'};
var startFileName = ''; // start and current file name
var dirFiles = [];
var dirCurFile = -1;
var fastmode=false;
var cachelisting=true;
var defaultAllowedExt = '.JPG|.GIF|.PNG|.JPEG|.BMP|.WEBP';
var allowedExt = defaultAllowedExt;
var allowedExtRegex = null;
var directorySortType = 'filename';
var isMac = navig.userAgent.indexOf('Macintosh') > -1;
var isFirefox = navig.userAgent.indexOf('Firefox') > -1;
var isChrome = navig.userAgent.indexOf('Chrome/') > -1;
function addSupportedExtensions(string){
	if( string.indexOf(defaultAllowedExt) < 0 ) {
		if( string.indexOf('.JPG|.GIF|.PNG|.JPEG|.BMP') === 0 ){
			// the user has old 2019 defaults and has not saved prefs since 9/2019
			string = string.replace('.JPG|.GIF|.PNG|.JPEG|.BMP', defaultAllowedExt);
		}
	}
	return string;
}

function updateMatchfileRegex(loadedPrefs){
	if( loadedPrefs ) allowedExt = addSupportedExtensions(allowedExt);
	allowedExtRegex = new RegExp("("+allowedExt+")$",'i');
}
updateMatchfileRegex();

function isValidFile(f){
	return f.match(allowedExtRegex);
}

function goToOrOpenOptions(completedCallback){
  var optionsUrl = chrome.runtime.getURL("about.html"); // typically "options.html"
  chrome.tabs.query({
    url: optionsUrl,
    currentWindow: true
  }, function(tabs){
    if( tabs.length > 0 ){
      chrome.tabs.update(tabs[0].id,{active:true}, completedCallback)
      //chrome.tabs.highlight({tabs:[tabs[0].index], windowId:tabs[0].windowId}, completedCallback);
    }else{
      chrome.tabs.create({
        url: optionsUrl,
        active: true
      }, function(t){
        chrome.tabs.update(t.id,{active:true}, completedCallback)
        // chrome.tabs.highlight({tabs:[t.index]}, completedCallback)
      });
    }
  });
}

function safeUnescape(val){
	try{
		return decodeURIComponent(val);
	}catch(e){}
	return unescape(val);
}

var indexMapHtmlBasicHref = {
	rowEndIndexMatcher: false, // '"',
	eachRowSplitterFn: function(row){
		var hrefEn=row.indexOf('"');
		var hrefVal = row.substr(0,hrefEn);
		// this may be localized... and this date may fail to match some locales...
		// tbd fallbback modes or enhance regex...
		var resultDate = null;
		var dateStrMatch = row.match(/([\d]{1,2}\/[\d]{1,2}\/[\d]{2,4}[\w\s\d:,]+)</)
		if( dateStrMatch && dateStrMatch[1] ){
			resultDate = new Date(dateStrMatch[1]);
		}
		if( !resultDate || resultDate.getTime() <= 0 ){
			//console.warn("no dt for row", row)
			resultDate = new Date();
		}
		return JSON.parse('["'+hrefVal+'", "'+resultDate.getTime()+'"]')
	},
	rowSplitter: 'href="',
	loopStartRow: 1,
	name: function(rDat, directoryURL){ return rDat[0].replace(new RegExp("^"+directoryURL), ''); },
	escapedName: function(rDat, directoryURL){ return escape(rDat[0].replace(new RegExp("^"+directoryURL), '')); },
	isDir: function(rDat){ return 0; },
	size: function(rDat){ return 1; }, // 0 bytes is skipped!
	datetime: function(rDat){ return new Date(rDat[1]); },
	timestamp: function(rDat){ return rDat[1]; }
}

var indexMapChrome = {
	rowEndIndexMatcher: '");',
	eachRowSplitterFn: function(row){return JSON.parse('["'+row+'"]')},
	rowSplitter: 'addRow("',
	loopStartRow: 1,
	name: function(rDat){ return rDat[0]; },
	escapedName: function(rDat){ return rDat[1]; },
	isDir: function(rDat){ return rDat[2]; },
	size: function(rDat){ return rDat[3]; },
	datetime: function(rDat){ return rDat[6]; },
	timestamp: function(rDat){ return rDat[5]; }
};

var indexMapFirefox = {
	rowEndIndexMatcher: false,
	eachRowSplitterFn: function(row){
		row = row.replace(/\s$/, '');
		row = row.replace(/\s/g, '","');
		return JSON.parse('["'+row+'"]');
	},
	rowSplitter: "\n",
	loopStartRow: 2,
	name: function(rDat){ return safeUnescape(rDat[1]); },
	escapedName: function(rDat){ return rDat[1]; },
	isDir: function(rDat){ return rDat[2]; },
	size: function(rDat){ return rDat[2]; },
	datetime: function(rDat){ return rDat[3]; },
	timestamp: function(rDat){ return new Date(safeUnescape(rDat[3])).getTime(); }
};

function processFileRowsWithIndexMap(directoryURL, resp, indexMap){
	var newDirFiles=[];
	directoryURL = directoryURL.replace(/^file:\/\//, '');
	var rows=resp.split(indexMap.rowSplitter);
	var f0,f,en,rDat,datetime, date, time, size, timestamp;
	for(var i=indexMap.loopStartRow,l=rows.length;i<l;i++){
		if(!rows[i]) continue;
		if( indexMap.rowEndIndexMatcher ){
			en=rows[i].indexOf(indexMap.rowEndIndexMatcher);
			rows[i] = rows[i].substr(0,en)
		}
		
		rDat = indexMap.eachRowSplitterFn(''+rows[i]);
		if( !rDat || !rDat.length )continue;

		f0 = indexMap.name(rDat, directoryURL);
		f = indexMap.escapedName(rDat, directoryURL); //escaped name

		if(f != '..'){
			if(!isValidFile(f))continue;
			if(f==startFileName || f0 == startFileName ){ // determineSort function seeks again
				dirCurFile=newDirFiles.length;
			}
			size = indexMap.size(rDat);
			datetime = indexMap.datetime(rDat);
			timestamp = indexMap.timestamp(rDat) - 0;

			//console.log(f, size,  date, time, timestamp)
			if( size > 0 ){ // we must skip 0byte images where content scripts do not run!
				newDirFiles.push({file_name:f0, date:timestamp});
			}
		}
	}
	// console.log(directoryURL, newDirFiles, indexMap); // TESTING ONLY
	return newDirFiles;
}

function processFileRows(directoryURL, sentStartFileName, resp, storeItAll, cbf){
	if(!resp) return;
	//var resDirName = resp.match(/start\(\"([\/\w]+)\"\);/);
	//console.log('processFileRows', directoryURL, sentStartFileName, resDirName[1], storeItAll)
	startFileName = sentStartFileName;
	var indexMap = indexMapChrome;
	if( resp.match(/^300: /) ){
		indexMap = indexMapFirefox;
	}
	var newDirFiles = processFileRowsWithIndexMap(directoryURL, resp, indexMap);
	// newDirFiles=[]; // simulate failure TESTING ONLY
	if(newDirFiles.length < 1 ){
		newDirFiles = processFileRowsWithIndexMap(directoryURL, resp, indexMapHtmlBasicHref);
	}
	
	dirFiles = newDirFiles;
	determineSort(true);

	//console.log('we got this result', dirFiles);

	var storeObj = {
		'dir_url':directoryURL,
		'dir_cache':JSON.stringify(dirFiles),
		'dir_current':dirCurFile,
		'dir_cur_name':startFileName,
	};

	if( storeItAll && !cachelisting) storeItAll = false;

	//console.log('saving directory list for dirCurFile '+ dirCurFile, storeItAll, storeObj)
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

var dec_regex = /(\d)+\.{0,1}(\d)*/;
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
	filename_numeric: function(a,b){
		var a0 = a.file_name.match(dec_regex);
		var b0 = b.file_name.match(dec_regex);
		var result = (a0 ? (a0[0] || 0) : 0) - (b0 ? (b0[0] || 0) : 0);
		return result ;
	},
	filename_numeric_reverse: function(a,b){
		return -sorts.filename_numeric(a,b);
	},
	random: function(a,b){
		return Math.random() < 0.5 ? 1 : -1;
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
			updateMatchfileRegex(true);
		}
		if( obj.sorttype && sorts[obj.sorttype] ){
			directorySortType = obj.sorttype;
		}
		fastmode=obj.fastmode=='true';
		cachelisting = obj.cachelisting=='true';
		if(typeof(cbf)=='function')cbf(obj);
	});
}

//run build_exports.sh to create EXPORT_common.js
export { loadPrefs, goToOrOpenOptions, processFileRows, isFirefox }
