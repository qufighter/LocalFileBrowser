var bodyExists=false;
var directoryURL=window.location.href;
var startFileName='';
var dirFiles = [];
var dirCurFile = -1;
var timeoutId=0;

if(directoryURL.substr(directoryURL.length-1,1)!='/'){
	if(isValidFile(directoryURL)){
		var dirparts=directoryURL.split('/');
		startFileName=dirparts[dirparts.length-1];
		dirparts.splice(dirparts.length-1,1);
		directoryURL=dirparts.join('/')+'/';
		isViewingImage_LoadDirectory();
	}
}else{
	isViewingDirectory_LoadThumbnails();
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
	var rows=resp.split('addRow("');
	for(var i=1,l=rows.length;i<l;i++){

		var st=rows[i].indexOf('","')+3;
		var f=rows[i].substr(st,rows[i].indexOf('"',st)-st);

		if(f != '..'){
			if(!isValidFile(f))continue;
			if(f==startFileName){
				dirCurFile=dirFiles.length;
			}
			dirFiles.push(f);
		}
	}

	if(dirCurFile > -1){
		createNextPrevArrows();
	}

//	console.log(dirFiles);
//	console.log(dirCurFile);
//	console.log(startFileName);
}

function dirLoaded(){
	if (http.readyState == 4) {
		http.onreadystatechange=null;
  	processFileRows(http.responseText);
	}
};

var zoomedToFit=false;
function zoom_in(ev){
	el=getEventTarget(ev);
	zoomedToFit = !zoomedToFit;
	el.src=chrome.extension.getURL('img/'+(zoomedToFit?'zoom_out.png':'zoom_in.png'));
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
function imageViewResizedHandler(){
	var im=document.body.getElementsByTagName('img')[0];
	if(im){
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
		}
		if(im.clientHeight < window.innerHeight){
			im.style.marginTop=Math.round((window.innerHeight - im.clientHeight) * 0.5)+'px';
		}else im.style.marginTop='0px';
	}
}

function createNextPrevArrows(){
	if(!bodyExists){
		setTimeout(createNextPrevArrows,10);
		return;
	}
	document.body.style.textAlign='center';
	determineIfZoomedToFit();
	imageViewResizedHandler();

	var showArrows = dirFiles.length > 1;
	var leftElm=[];
	if(showArrows){
		leftElm.push(
			Cr.elm('img',{'title':'Previous: '+getPrevName(dirCurFile),
											'src':chrome.extension.getURL('img/arrow_left.png'),
											width:'77',events:['click',nav_prev],
											style:'cursor:pointer;'
									 }
			)
		);
	}
	leftElm.push(
		Cr.elm('img',{'title':'View Parent Directory',
										'src':chrome.extension.getURL('img/arrow_up.png'),
										width:'77',events:['click',nav_up],
										style:'cursor:pointer;'
								 }
		)
	);
	if(!zoomedToFit){
		leftElm.push(
			Cr.elm('img',{'title':'Zoom',
											'src':chrome.extension.getURL('img/'+(zoomedToFit?'zoom_out.png':'zoom_in.png')),
											width:'77',events:['click',zoom_in],
											style:'cursor:pointer;'
									 }
			)
		);
	}

	Cr.elm('div',{style:'position:fixed;bottom:0px;left:0px;z-index:2147483600;'},leftElm,document.body);

	if(showArrows){
		Cr.elm('img',{'title':'Next: '+getNextName(dirCurFile),
										'src':chrome.extension.getURL('img/arrow_right.png'),
										width:'77',events:['click',nav_next],
										style:'position:fixed;bottom:0px;right:0px;z-index:2147483600;cursor:pointer;'
									},[],document.body);
	}
					
	window.addEventListener('resize', imageViewResized);
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
	Cr.elm('img',{loadevent:['load',anImageLoaded],id:dirId,src:directoryURL+dirFiles[dirId]});
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
		if(isValidFile(dirFiles[i])){
			var c=Cr.elm('canvas',{id:'cicn_'+i,title:dirFiles[i],'name':dirFiles[i],width:75,height:75,style:'display:inline-block;cursor:pointer;',events:['click',navToFileByElmName]},[],document.body);
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

function isViewingImage_LoadDirectory(){
	http = new XMLHttpRequest();
	http.open("GET",directoryURL);
	http.onreadystatechange=dirLoaded;
	http.send(null);
}

function isViewingDirectory_LoadThumbnails(){
	document.addEventListener('DOMContentLoaded', prepareThumbnailsBrowser);
}

function navToFileByElmName(ev){
	var im=getEventTarget(ev);
	window.location=directoryURL+im.getAttribute('name');
}

function navToFile(file){
	window.location=directoryURL+file;
	//document.getElementsByTagName('img')[0].src=directoryURL+file;
}

function isValidFile(f){
	return f.match(/(.JPG|.GIF|.PNG|.JPEG)$/gi);
}

function nav_up(){
	navToFile('');
}

function nav_prev(){
	dirCurFile--;
	if(dirCurFile < 0)dirCurFile=dirFiles.length-1;
	if(!isValidFile(dirFiles[dirCurFile]))nav_prev()
	else navToFile(dirFiles[dirCurFile]);
}

function nav_next(){
	dirCurFile++;
	if(dirCurFile > dirFiles.length-1)dirCurFile=0;
	if(!isValidFile(dirFiles[dirCurFile]))nav_next()
	else navToFile(dirFiles[dirCurFile]);
}

function getNextName(cf){
	var d=cf+1;
	if(d > dirFiles.length-1)d=0;
	if(!isValidFile(dirFiles[d]))return getNextName(d);
	else return dirFiles[d];
}
function getPrevName(cf){
	var d=cf-1;
	if(d < 0)d=dirFiles.length-1;
	if(!isValidFile(dirFiles[d]))return getPrevName(d);
	else return dirFiles[d];
}