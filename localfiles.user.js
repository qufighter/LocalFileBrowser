var bodyExists=false;
var directoryURL=window.location.protocol + '//' + window.location.pathname;
var startFileName='';
var dirFiles = [];
var dirCurFile = -1;
var timeoutId=0;
var allowedExt = '.JPG|.GIF|.PNG|.JPEG';
var fileUrlInitComplete = false;

chrome.storage.local.get({matchfiles:false},function(obj){
	if( obj.matchfiles && obj.matchfiles.length ){
		allowedExt = obj.matchfiles;
		if( !fileUrlInitComplete ){
			initFileUrl();
		}
	}
});

if(directoryURL.substr(directoryURL.length-1,1)!='/'){
	initFileUrl();
}else{
	isViewingDirectory_LoadThumbnails();
}

function initFileUrl(){
	if(isValidFile(directoryURL)){
		fileUrlInitComplete=true;
		var dirparts=directoryURL.split('/');
		startFileName=dirparts[dirparts.length-1];
		dirparts.splice(dirparts.length-1,1);
		directoryURL=dirparts.join('/')+'/';
		if( window.location.hash.replace('#','').length ){
			navigationStateHashChange();
		}
		isViewingImage_LoadDirectory();
		isViewingImage_LoadStylesheet();
	}
}

function setApplyStyles(){
	if(startFileName != ''){
		document.body.style.textAlign='center';
		imageViewResizedHandler();
	}
}

function dni(){
	if(document.body){
		bodyExists=true;
		setApplyStyles();
		window.removeEventListener('DOMNodeInserted',dni);
		clearTimeout(timeoutId);
	}
}
if(!document.body){
	window.addEventListener('DOMNodeInserted',dni);
	timeoutId=setTimeout(dni,250);
}else{
	bodyExists=true;
	setApplyStyles()
}

function processFileRows(resp){
	var newDirFiles=[];
	var rows=resp.split('addRow("');
	for(var i=1,l=rows.length;i<l;i++){

		var st=rows[i].indexOf('","')+3;
		var f=rows[i].substr(st,rows[i].indexOf('",',st)-st);

		if(f != '..'){
			if(!isValidFile(f))continue;
			if(f==startFileName){
				dirCurFile=newDirFiles.length;
			}
			var meta = rows[i].split(',');
			var date = meta[4].split('"')[1];
			var size = meta[3].split('"')[1];//convert to kb
			newDirFiles.push({file_name:f,date:date});
		}
	}

	dirFiles = newDirFiles;
	//determineSort();

	if(dirCurFile > -1){
		createNextPrevArrows();
	}

	
	//console.log('httpreq-loaded-parsed',new Date().getTime(),startFileName,dirCurFile);
	chrome.storage.local.set({'dir_url':directoryURL,'dir_cache':JSON.stringify(dirFiles)},function(){});
//	console.log(dirFiles);
//	console.log(dirCurFile);
//	console.log(startFileName);
}

function determineSort(){
	dirFiles = dirFiles.sort(sortby_date_reverse);
	for(var i=0,l=dirFiles.length;i<l;i++){
		if(dirFiles[i].file_name==startFileName){
			dirCurFile=i;
		}
	}
}
function sortby_date(a,b){
	return (new Date(a.date)).getTime() - (new Date(b.date)).getTime();
}
function sortby_date_reverse(a,b){
	return -sortby_date(a,b);
}
function sortby_filename(a,b){
	return a.file_name.localeCompare(b.file_name);
}
function sortby_filename_reverse(a,b){
	return -sortby_filename(a,b);
}

function dirLoaded(){
	if (http.readyState == 4) {
		http.onreadystatechange=null;
  	processFileRows(http.responseText);
	}
};

var zoomedToFit=false,zoomdIsZoomedIn=false,imageIsNarrow=false,hasSizedOnce=false,localfile_zoombtn=false;
function zoom_in(ev){
	zoomedToFit = !zoomedToFit;
	imageViewResizedHandler(ev);
}
function handleImageJustLoaded(){
	determineIfZoomedToFit();
	imageViewResizedHandler();
}
function determineIfZoomedToFit(){
	var im=document.body.getElementsByTagName('img')[0];
	if(im)zoomedToFit=im.naturalWidth != im.clientWidth;
}
var imgViewResizedTimeout=0;
function imageViewResized(){
	clearTimeout(imgViewResizedTimeout);
	imgViewResizedTimeout=setTimeout(imageViewResizedHandler,250);
}
function imageViewResizedHandler(ev){
	var im=document.body.getElementsByTagName('img')[0];
	if(im){
		if(im.complete && im.naturalWidth && im.clientHeight){
			imageIsNarrow = im.naturalWidth < window.innerWidth;
			zoomdIsZoomedIn = imageIsNarrow && im.naturalHeight < window.innerHeight;
			if(zoomedToFit){
				var im_ratio=im.naturalWidth/im.naturalHeight;
				var wn_ratio=window.innerWidth/window.innerHeight;
				if(wn_ratio > im_ratio){
					im.height = window.innerHeight;
					im.width = window.innerHeight * im_ratio;
				}else{
					im.width = window.innerWidth;
					im.height = window.innerWidth / im_ratio;
				}
			}else{
				im.width = im.naturalWidth;
				im.height = im.naturalHeight;
				if( typeof(ev) != 'undefined' &&  ev.clientX){
					//we clicked in a particular spot, make it happen!
					window.scroll(
						((ev.clientX/window.innerWidth)*im.offsetWidth)-(window.innerWidth*0.5),
						((ev.clientY/window.innerHeight)*im.offsetHeight)-(window.innerHeight*0.5)
					);
				}
			}
			if(!hasSizedOnce){
				hasSizedOnce=true;
				im.addEventListener('click',zoom_in);
				im.style.cursor='-webkit-zoom-'+(zoomedToFit?'out':'in');
			}
			if(im.clientHeight){
				if(im.clientHeight < window.innerHeight){
					im.style.marginTop=Math.round((window.innerHeight - im.clientHeight) * 0.5)+'px';
				}else im.style.marginTop='0px';
			}
			if( zoomdIsZoomedIn )
				im.style.cursor=(zoomedToFit?'-webkit-zoom-out':'-webkit-zoom-in');
			else
				im.style.cursor=(zoomedToFit?'-webkit-zoom-in':'-webkit-zoom-out');
		}else{
			im.onload=handleImageJustLoaded;
		}
	}
}

var extraControls=[];
function showExtraControls(){
	for(var i in extraControls){
		extraControls[i].style.display="inline";
	}
}

function hideExtraControls(){
	for(var i in extraControls){
		extraControls[i].style.display="none";
	}
}

var arrowsCreated=false;
function createNextPrevArrows(){
	if(arrowsCreated)return;
	if(!bodyExists){
		setTimeout(createNextPrevArrows,10);
		return;
	}
	arrowsCreated=true;

	document.body.style.textAlign='center';
	determineIfZoomedToFit();
	imageViewResizedHandler();

	var showArrows = dirFiles.length > 1;
	var leftElm=[];
	if(showArrows){
		leftElm.push(
			Cr.elm('img',{'title':getPrevName(dirCurFile),
												id :'previous_file',
											'src':chrome.extension.getURL('img/arrow_left.png'),
											width:'77',events:[['mouseup',nav_prev],['dragstart',cancelEvent]],
											style:'cursor:pointer;vertical-align: bottom;'
									 }
			)
		);
	}
	extraControls.push(
		Cr.elm('img',{'title':'View Parent Directory',
										'src':chrome.extension.getURL('img/arrow_up.png'),
										width:'77',events:[['click',nav_up]],
										style:'cursor:pointer;display:none;vertical-align: bottom;'
								 }
		)
	);
	leftElm.push(extraControls[extraControls.length-1]);

	extraControls.push(
		Cr.elm('input',{'type':'text',
										id:'os_path',
										readonly:'readonly',
										title:'Current Image Path',
										'value':osFormatPath(directoryURL+startFileName),
										events:['mouseover',selectSelf,true],
										style:'cursor:text;display:none;width:350px;padding:8px;margin:10px;box-shadow:3px 3px 15px #444;margin-right:100px;direction:rtl;'
								 }
		)
	);
	leftElm.push(extraControls[extraControls.length-1]);

	extraControls.push(
		Cr.elm('input',{'type':'button',
										value:'Go',
										title:'Navigate URL bar to current path',
										events:['click',winLocGoCurrent,true],
										style:'position:relative;left:-100px;display:none;'
								 }
		)
	);
	leftElm.push(extraControls[extraControls.length-1]);

//	if(!zoomedToFit){
//		localfile_zoombtn = Cr.elm('img',{'title':'Zoom',
//											'src':chrome.extension.getURL('img/'+(zoomedToFit?'zoom_out.png':'zoom_in.png')),
//											width:'77',events:['click',zoom_in],
//											style:'cursor:pointer;display:none;'
//									 }
//		);
//		extraControls.push(localfile_zoombtn);
//		leftElm.push(localfile_zoombtn);
//	}

	Cr.elm('div',{id:'arrowsleft',style:'position:fixed;opacity:0;-webkit-transition: opacity 0.5s linear;bottom:0px;left:0px;z-index:2147483600;',class:'printhidden',events:[['mouseover',showExtraControls],['mouseout',hideExtraControls]]},leftElm,document.body);

	if(showArrows){
		Cr.elm('img',{'title':getNextName(dirCurFile),
										  src:chrome.extension.getURL('img/arrow_right.png'),
										width:'77',events:[['mouseup',nav_next],['dragstart',cancelEvent]],
										style:'position:fixed;opacity:0;-webkit-transition: opacity 0.5s linear;bottom:0px;right:0px;z-index:2147483600;cursor:pointer;',
										class:'printhidden',
										id:'arrowsright'
									},[],document.body);
		window.addEventListener('mousemove', mmov);
	}

	window.addEventListener('resize', imageViewResized);
	window.addEventListener('keyup',wk);
	window.addEventListener('popstate',navigationStatePop);
	window.addEventListener('hashchange',navigationStateHashChange);
	//preLoadFile(getNextName(dirCurFile));
}
function mmov(){
	gel('arrowsleft').style.opacity="1",
	gel('arrowsright').style.opacity="1";
	clearTimeout(hidTimeout);
	hidTimeout=setTimeout(hid,1000);
}
var hidTimeout=0;
function hid(){
	gel('arrowsleft').style.opacity="0",
	gel('arrowsright').style.opacity="0";
}
function wk(ev){
	if(ev.keyCode==37){//left
		if(zoomdIsZoomedIn || imageIsNarrow || zoomedToFit) nav_prev();
	}else if(ev.keyCode==39){//right
		if(zoomdIsZoomedIn || imageIsNarrow || zoomedToFit) nav_next();
	}else if(ev.keyCode==32){//space
		zoom_in();
	}
}
function osFormatPath(path){
	if(navigator.platform.substr(0,3)=='Win')
		return decodeURIComponent(path.substr(8).split('/').join('\\'));
	else return decodeURIComponent(path.substr(8));
}
function selectSelf(ev){
	var elm=getEventTarget(ev);
	setTimeout(function(){
		elm.select();
	},10);//or prevent bubble
}
function gel(n){
		return document.getElementById(n);
}
function getEventTarget(ev){
	ev = ev || event;
	var targ=(typeof(ev.target)!='undefined') ? ev.target : ev.srcElement;
	if(targ !=null){
	    if(targ.nodeType==3)
	        targ=targ.parentNode;
	}
	return targ;
}
function cancelEvent(e){
  e = e ? e : window.event;
  if(e.stopPropagation)
    e.stopPropagation();
  if(e.preventDefault)
    e.preventDefault();
  e.cancelBubble = true;
  e.cancel = true;
  //e.returnValue = false;
  return false;
}
function getOffset( el ){
    var _x=0,_y=0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
    		_x+=el.offsetLeft;// - el.scrollLeft;
    		_y+=el.offsetTop;// - el.scrollTop;  
        el=el.offsetParent;
    }return { y: _y, x: _x };
}
function isElementInView(elm){
	var elp=getOffset(elm);
	var scry=window.pageYOffset;
	var maxy=scry + window.innerHeight;
	if(elp.y < maxy && elp.y + elm.offsetHeight > scry) return true;
	return false;
}

var unloadedImages=[];

function anImageLoaded(ev){
	var im=getEventTarget(ev);
	var cvs=gel('cicn_'+im.id);
	var ctx=cvs.getContext('2d');
	var ow=im.naturalWidth,oh=im.naturalHeight;
	//var asp=ow/oh;
	if(ow < oh){
		//var nw=75;
		//var nh=(75/ow)*oh;
		var srcd=ow;
	}else{//width is greater, use height
		//var nh=75;
		//var nw=(75/oh)*ow;
		var srcd=oh;
	}
	ctx.drawImage(im,0,0,srcd,srcd,0,0,75,75);

//drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) //CANVAS
}

function loadDirFileIdToCvs(dirId){
	Cr.elm('img',{loadevent:['load',anImageLoaded],id:dirId,src:directoryURL+dirFiles[dirId].file_name});
}

var pageScrTimeout=0;
function pageScrolled(){
	clearTimeout(pageScrTimeout);
	pageScrTimeout=setTimeout(pageScrolledHandler,1000);
}

function pageScrolledHandler(){
	for(var i=0;i<unloadedImages.length;i++){
		if(isElementInView(gel('cicn_'+unloadedImages[i]))){
			loadDirFileIdToCvs(unloadedImages[i]);
			unloadedImages.splice(i--,1)
		}
	}
}
function createThumbnailsBrowser(){
	gel('loadThumbsBtn').parentNode.removeChild(gel('loadThumbsBtn'));
	window.addEventListener('scroll', pageScrolled);
	window.addEventListener('resize', pageScrolled);
	processFileRows(document.body.innerHTML);
	for(var i=0,l=dirFiles.length;i<l;i++){
		if(isValidFile(dirFiles[i].file_name)){
			var c=Cr.elm('canvas',{id:'cicn_'+i,title:dirFiles[i].file_name,'name':dirFiles[i].file_name,width:75,height:75,style:'display:inline-block;cursor:pointer;',events:['click',navToFileByElmName]},[],document.body);
			if(isElementInView(c)){
				loadDirFileIdToCvs(i);
			}else{
				unloadedImages.push(i);
			}
		}
	}
}
function prepareThumbnailsBrowser(){
	Cr.elm('button',{id:'loadThumbsBtn',events:['click',createThumbnailsBrowser]},[Cr.txt('Show Thumbnails...')],document.body)
}

var fastmode=false;
function isViewingImage_LoadDirectory(){

	chrome.storage.local.get(null,function(obj){
		//obj.bodystyle='background-color:grey;';
		if(obj.bodystyle && obj.bodystyle.length > 0){
			document.body.setAttribute('style',document.body.getAttribute('style')+obj.bodystyle);
		}

		if(obj.fastmode && obj.fastmode=='true')fastmode=true;

		//console.log('storage-loaded-parsed',new Date().getTime());
		if(obj.dir_url == directoryURL){
			var dirCachedFiles=JSON.parse(obj.dir_cache);
			if( dirCachedFiles.length > 0 ){
				dirFiles=dirCachedFiles;
				for(var i=0,l=dirFiles.length;i<l;i++){
					if(dirFiles[i].file_name==startFileName){
						//console.log('found current file in cache!');
						dirCurFile=i;
						createNextPrevArrows();
						break;
					}
				}
			}
		}
	});
	fetchNewDirectoryListingRequest();
}

function fetchNewDirectoryListingRequest(){
	http = new XMLHttpRequest();
	http.open("GET",directoryURL);
	http.onreadystatechange=dirLoaded;
	http.send(null);
}

function isViewingDirectory_LoadThumbnails(){
	document.addEventListener('DOMContentLoaded', prepareThumbnailsBrowser);
}

function isViewingImage_LoadStylesheet(){
	document.addEventListener('DOMContentLoaded', injectStyleSheet);
}

function injectStyleSheet(){
	Cr.elm('link',{href:chrome.extension.getURL('localfiles_print.css'),rel:'stylesheet',type:'text/css',media:'print'},[],document.head);
}

function navToFileByElmName(ev){
	var im=getEventTarget(ev);
	window.location=directoryURL+im.getAttribute('name');
}

function winLocGoCurrent(){
	window.location=directoryURL+startFileName;
}

function navToFile(file,suppressPushState){
	if(!fastmode){
		window.location=directoryURL+file;
		return;
	}
	//this would be WAY better!  unfortunately:
	//"A history state object with URL 'http://webifire/' cannot be created in a document with origin 'null'."
	// - we can load the next image without reloading the page - we CANNOT update the URL :/...

	//document.getElementsByTagName('img')[0].src=directoryURL+file;
	if(typeof(suppressPushState)=='undefined')suppressPushState=false;
	var loadedFileName = file;
	var origImg = document.getElementsByTagName('img')[0];
	var origNextSibl = origImg.nextSibling;
	var newimg = origImg.cloneNode();
	newimg.removeAttribute('width');
	newimg.removeAttribute('height');
	newimg.onload=function(ev){
		if(!origImg)return;
		document.body.removeChild(origImg);//breaks here sometimes, but its good execution stops here too, this is when going fast and an image takes too long to load but they click next, the next image loads faster, eventually the orig image loads, it tries to remove the previous image but that one no longer exists (since the smaller image already removed it)
		startFileName=loadedFileName;

		var im=getEventTarget(ev);
		//var ow=im.naturalWidth,oh=im.naturalHeight;
		hasSizedOnce=true;//do not add event listener twice

		//based on if we are zoomed in or not lets pick a reasonable zoom to fit value?
		zoomdIsZoomedIn = im.naturalWidth < window.innerWidth && im.naturalHeight < window.innerHeight;
		zoomedToFit = !zoomdIsZoomedIn;
		//perhaps an option to preserve zoomed state??

		document.body.insertBefore(newimg,origNextSibl);
		imageViewResizedHandler();

		gel('os_path').value=osFormatPath(directoryURL+startFileName);
		gel('arrowsright').title = getNextName(dirCurFile);
		gel('previous_file').title = getPrevName(dirCurFile);

		if(!suppressPushState){
			try{
				//document.origin='thebannanarepublic';
				//run this when we first load:
				//history.replaceState({filename:startFileName},document.title,window.location.href);
				history.pushState({filename:startFileName},startFileName,newimg.src);
			}catch(e){
				//console.log('SORRY cannot update window URL :/ - SecurityError: A history state object cannot be created in a document with origin \'null\'.');
				//window.location=directoryURL+startFileName;
				window.location.hash = startFileName;
			}
		}
		newimg.addEventListener('click',zoom_in);
		//now refrsh our copy of the directory listing....
		fetchNewDirectoryListingRequest();
		//don't do this every time! slows things down!
	}
	newimg.src=directoryURL+file;
}

function navigationStatePop(ev){//NOT implemented (cannot trigger, cannot replace state)
	if(ev && ev.type && ev.type == 'popstate'){
		if(ev.state && ev.state.filename){
			navToFile(ev.state.filename,true);
		}
	}
}
function navigationStateHashChange(ev){
	var fname = window.location.hash.replace('#','');
	if( startFileName != fname){
		navToFile(fname,true);
	}
}

function preLoadFile(file){
	var im=new Image();
	im.onload=function(){console.log('preloaded_next'+directoryURL+file)}
	im.src=directoryURL+file;
}

function isValidFile(f){
	var rx = new RegExp("("+allowedExt+")$",'gi');
	return f.match(rx);
}

function nav_up(){
	window.location=directoryURL;
}

function nav_prev(ev){
	if(ev && ev.which && ev.which == 3)return;
	dirCurFile--;
	if(dirCurFile < 0)dirCurFile=dirFiles.length-1;
	if(!isValidFile(dirFiles[dirCurFile].file_name))nav_prev()
	else navToFile(dirFiles[dirCurFile].file_name);
}

function nav_next(ev){
	if(ev && ev.which && ev.which == 3)return;
	dirCurFile++;
	if(dirCurFile > dirFiles.length-1)dirCurFile=0;
	if(!isValidFile(dirFiles[dirCurFile].file_name))nav_next()
	else navToFile(dirFiles[dirCurFile].file_name);
}

function getNextName(cf){
	var d=cf+1;
	if(d > dirFiles.length-1)d=0;
	if(!isValidFile(dirFiles[d].file_name))return getNextName(d);
	else return 'Next: '+dirFiles[d].file_name;
}
function getPrevName(cf){
	var d=cf-1;
	if(d < 0)d=dirFiles.length-1;
	if(!isValidFile(dirFiles[d].file_name))return getPrevName(d);
	else return 'Previous: '+dirFiles[d].file_name;
}
