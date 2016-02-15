var directoryURL=window.location.protocol + '//' + window.location.pathname;
var bodyExists=false;
var timeoutId=0;
var fileUrlInitComplete = false;
var singleFileMode = false;

chrome.storage.local.get({matchfiles:false},function(obj){
  if( obj.matchfiles && obj.matchfiles.length ){
    allowedExt = obj.matchfiles;
    if( !fileUrlInitComplete ){
      initFileUrl();
    }
  }
});

if(directoryURL.substr(directoryURL.length-1,1)!='/'){
  chrome.storage.local.get({bodystyle:false},function(obj){
    if(obj.bodystyle && obj.bodystyle.length > 0){
      document.body.setAttribute('style',document.body.getAttribute('style')+obj.bodystyle);
    }
  });
  initFileUrl();
}else{
  isViewingDirectory_LoadThumbnails();
}

function initFileUrl(){
  singleFileMode=true;
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
          var marginTop = Math.round((window.innerHeight - im.clientHeight) * 0.5);
          im.style.marginTop=marginTop+'px';
          im.style.marginBottom=(window.innerHeight-im.clientHeight-marginTop)+'px';
        }else{
          im.style.marginTop='0px';
          im.style.marginBottom='0px';
        }
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

var extraControlsLeft=[],extraControlsRight=[];
function showExtraControlsLeft(){
  hideExtraControlsRight();
  for(var i in extraControlsLeft){
    extraControlsLeft[i].style.display="inline";
  }
}

function hideExtraControlsLeft(){
  for(var i in extraControlsLeft){
    extraControlsLeft[i].style.display="none";
  }
}

function showExtraControlsRight(){
  hideExtraControlsLeft();
  for(var i in extraControlsRight){
    extraControlsRight[i].style.display="inline";
  }
}

function hideExtraControlsRight(){
  for(var i in extraControlsRight){
    extraControlsRight[i].style.display="none";
  }
}

var arrowsCreated=false;
var attemptsBeforeCreateArrowAnyway = 0; // with full/default directory filters? matching current file ext?  Match * ?
function attemptCreateNextPrevArrows(){
  if(arrowsCreated)return;
  if(!bodyExists){
    setTimeout(attemptCreateNextPrevArrows,10);
    return;
  }
  if( dirCurFile < 0 && attemptsBeforeCreateArrowAnyway < 10 ){
    console.log('Local Image Viewer ERROR: not found current filepath in valid files: '+startFileName+' - Please update Match Files from preferences to include this file.');
    attemptsBeforeCreateArrowAnyway++;
    if( !wasCanceled )
      fetchNewDirectoryListing(false); // in this case, cache is NOT current , retry attempts
    return;
  }
  arrowsCreated=true;

  document.body.style.textAlign='center';
  determineIfZoomedToFit();
  imageViewResizedHandler();

  var showArrows = dirFiles.length > 1;
  var leftElm=[],rightElm=[],tempElm;
  if(showArrows){
    leftElm.push(
      Cr.elm('img',{'title':getPrevName(dirCurFile),
                        id :'previous_file',
                      'src':chrome.extension.getURL('img/arrow_left.png'),
                      width:'77',events:[['mouseup',nav_prev],['dragstart',cancelEvent]],
                      style:'float:left;cursor:pointer;vertical-align: bottom;'
                   }
      )
    );
  }
  extraControlsLeft.push(
    Cr.elm('img',{'title':'View Parent Directory',
                    'src':chrome.extension.getURL('img/arrow_up.png'),
                    width:'77',events:[['click',nav_up]],
                    style:'cursor:pointer;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('img',{'title':'Fullscreen',
                    'src':chrome.extension.getURL('img/fillscreen.png'),
                    width:'77',events:[['click',fs_go]],
                    style:'cursor:pointer;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('img',{'title':'Toggle Thumbnails',
                    'src':chrome.extension.getURL('img/thumbs.png'),
                    width:'77',events:[['click',initSingleImageThumbnails]],
                    style:'cursor:pointer;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('img',{'title':'Options',
                    'src':chrome.extension.getURL('img/gear.png'),
                    width:'77',events:[['click',visitOptions]],
                    style:'cursor:pointer;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
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
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('input',{'type':'button',
                    value:'Go',
                    title:'Navigate URL bar to current path',
                    events:['click',winLocGoCurrent,true],
                    style:'position:relative;left:-100px;display:none;'
                   }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

//  if(!zoomedToFit){
//    localfile_zoombtn = Cr.elm('img',{'title':'Zoom',
//                      'src':chrome.extension.getURL('img/'+(zoomedToFit?'zoom_out.png':'zoom_in.png')),
//                      width:'77',events:['click',zoom_in],
//                      style:'cursor:pointer;display:none;'
//                   }
//    );
//    extraControlsLeft.push(localfile_zoombtn);
//    leftElm.push(localfile_zoombtn);
//  }

  var arrowHolder = document.body; //Cr.elm('div',{id:'arrowHolder',style:'position:relative;'},[],document.body);

  Cr.elm('div',{id:'arrowsleft',style:'position:fixed;opacity:0;-webkit-transition: opacity 0.5s linear;bottom:0px;left:0px;z-index:2147483600;',class:'printhidden',events:[['mouseover',showExtraControlsLeft],['mouseout',hideExtraControlsLeft]]},leftElm,arrowHolder);


  if(showArrows){
    tempElm = Cr.elm('img',{
      title: getNextName(dirCurFile),
      src:chrome.extension.getURL('img/arrow_right.png'),
      width:'77',events:[['mouseup',nav_next],['dragstart',cancelEvent]],
      style:'float:right;cursor:pointer;vertical-align: bottom;',
      class:'printhidden',
      id:'next_file'
    });
    rightElm.push(tempElm);
    window.addEventListener('mousemove', mmov);
  }

  Cr.elm('div',{id:'arrowsright',style:'position:fixed;opacity:0;-webkit-transition: opacity 0.5s linear;bottom:0px;right:0px;z-index:2147483600;',class:'printhidden',events:[['mouseover',showExtraControlsRight],['mouseout',hideExtraControlsRight]]},rightElm,arrowHolder);

  window.addEventListener('resize', imageViewResized);
  window.addEventListener('keyup',wk);
  window.addEventListener('popstate',navigationStatePop);
  window.addEventListener('hashchange',navigationStateHashChange);
  //preLoadFile(getNextFile(dirCurFile));

  if( showArrows ) setTimeout(createExtraControls, 5);
}

function createExtraControls(){
  var rightFrag = Cr.frag();
  var rightDest = gel('arrowsright'), tempElm;
  tempElm = Cr.elm('select',{
    title:"Autoplay FPS",
    value:24,
    id:'fps',
    width:23,
    style:"display:none;vertical-align: bottom;",
    class:'printhidden'
  },[
    Cr.elm('option',{value:0.10},[Cr.txt("each frame 10 seconds")]),
    Cr.elm('option',{value:0.20},[Cr.txt("1 frame 5 seconds")]),
    Cr.elm('option',{value:0.25},[Cr.txt("1 frame 4 seconds")]),
    Cr.elm('option',{value:0.33},[Cr.txt("1 frame 3 seconds")]),
    Cr.elm('option',{value:0.5,selected:1},[Cr.txt("1 frame 2 seconds")]),
    Cr.elm('option',{value:1},[Cr.txt("1 Frame-Per-Second")]),
    Cr.elm('option',{value:2},[Cr.txt("2 FPS")]),
    Cr.elm('option',{value:3},[Cr.txt("3 FPS")]),
    Cr.elm('option',{value:5},[Cr.txt("5 FPS")]),
    Cr.elm('option',{value:10},[Cr.txt("10 FPS")]),
    Cr.elm('option',{value:12},[Cr.txt("12 FPS")]),
    Cr.elm('option',{value:15},[Cr.txt("15 FPS")]),
    Cr.elm('option',{value:24},[Cr.txt("24 FPS")]),
    Cr.elm('option',{value:30},[Cr.txt("30 FPS")]),
    Cr.elm('option',{value:60},[Cr.txt("60 FPS")]),
  ],rightFrag);
  //tempElm.childNodes[3].selected=true;
  extraControlsRight.push(tempElm);

  tempElm = Cr.elm('img',{
    title:"Autoplay",
    src:chrome.extension.getURL('img/play.png'),
    width:'28',events:[['mouseup',auto_play],['dragstart',cancelEvent]],
    style:'cursor:pointer;display:none;vertical-align: bottom;',
    class:'printhidden',
    id:'ffwd'
  },[],rightFrag);
  extraControlsRight.push(tempElm);
  rightDest.appendChild(rightFrag);
}

function visitOptions(){
  window.open(chrome.extension.getURL("about.html"));
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
    stop_auto_play();
    zoom_in();
  }
}
function osFormatPath(path){
  if(navigator.platform.substr(0,3)=='Win')
    return decodeURIComponent(path.substr(8).split('/').join('\\'));
  else return decodeURIComponent(path.substr(7));
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
var currentlyLoadingImgs=0;
var maxLoadingImgs=4;

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
  currentlyLoadingImgs--;
  if(unloadedImages.length){
    pageScrolled();
  }
//drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) //CANVAS
}

function loadDirFileIdToCvs(dirId){
  Cr.elm('img',{event:['load',anImageLoaded],id:dirId,src:directoryURL+encodeURIComponent(dirFiles[dirId].file_name)});
}

var pageScrTimeout=0;
function pageScrolled(){
  clearTimeout(pageScrTimeout);
  pageScrTimeout=setTimeout(pageScrolledHandler,500);
}

function pageScrolledHandler(){
  for(var i=0;i<unloadedImages.length;i++){
    if(isElementInView(gel('cicn_'+unloadedImages[i]))){
      loadDirFileIdToCvs(unloadedImages[i]);
      unloadedImages.splice(i--,1);
      if( ++currentlyLoadingImgs >= maxLoadingImgs ){
        break; // exit loop and load the rest later, in batch
      }
    }
  }
}
function initDirectoryThumbnails(){
  gel('loadThumbsBtn').parentNode.removeChild(gel('loadThumbsBtn'));
  window.addEventListener('scroll', pageScrolled);
  window.addEventListener('resize', pageScrolled);
  createThumbnailsBrowser(document.body,navToFileByElmName);
  pageScrolled();
}
function initSingleImageThumbnails(){
  var thmhld=document.getElementById('thmhld');
  if( thmhld ){
    if( thmhld.style.display=='none' ){
      thmhld.style.display='block';
    }else{
      thmhld.style.display='none';
    }
  }else{
    thmhld=Cr.elm('div',{id:'thmhld',style:"margin:20px 18% 75px 18%;"},[],document.body);
    createThumbnailsBrowser(thmhld,navToFileByElmName);
    window.addEventListener('scroll', pageScrolled);
    window.addEventListener('resize', pageScrolled);
  }
  window.scrollBy(0,95);
}
function createThumbnailsBrowser(destination,clFn){
  var start = dirCurFile - 5;
  if( start < 0 ) start = 0;
  for(var i=start,l=dirFiles.length;i<l;i++){
      createSingleThumb(i,destination,clFn);
  }
  if( start > 0 ){
    for(i=0,l=start;i<l;i++){
      createSingleThumb(i,destination,clFn);
    }
  }
}
var SELECTED_THUMBNAIL_BORDER='1px solid red';
var curThumb = 0;
function createSingleThumb(fileIndex,destination,clFn){
  var i = fileIndex;
  if(isValidFile(dirFiles[i].file_name)){
    var c=Cr.elm('canvas',{id:'cicn_'+i,title:dirFiles[i].file_name,'name':dirFiles[i].file_name,width:75,height:75,style:'display:inline-block;cursor:pointer;',events:['click',clFn]},[],destination);
    unloadedImages.push(fileIndex);
  }
  updateThumbnail();
}
function updateThumbnail(){
  if( curThumb ) curThumb.style.border='';
  curThumb=document.getElementById('cicn_'+dirCurFile);
  if( curThumb ) curThumb.style.border=SELECTED_THUMBNAIL_BORDER;
}


function prepareThumbnailsBrowser(){
  loadPrefs(function(){
    processFileRows(directoryURL, startFileName, document.body.innerHTML, function(){/* saved to chrome storage, if directory didn't change*/});
  });
  Cr.elm('button',{id:'loadThumbsBtn',events:['click',initDirectoryThumbnails]},[Cr.txt('Show Thumbnails...')],document.body)
}

var fastmode=false;
function isViewingImage_LoadDirectory(){
  //we could first just get dir_url and determine if cacheIsCurrent...
  chrome.storage.local.get(null,function(obj){
    var cacheIsCurrent=false;

    // not really used on frontend anymore
    if( obj.sorttype && sorts[obj.sorttype] ){
      directorySortType = obj.sorttype;
    }

    if(obj.fastmode && obj.fastmode=='true')fastmode=true;

    //console.log('comparing current dir:', obj.dir_url, directoryURL)
    cacheIsCurrent = obj.dir_url == directoryURL;

    if(cacheIsCurrent){
      var dirCachedFiles=JSON.parse(obj.dir_cache);
      if( dirCachedFiles.length > 0 ){
        dirFiles=dirCachedFiles;
        seekCurIndex();
        attemptCreateNextPrevArrows();
      }else{
        cacheIsCurrent=false;
      }
    }
    if( obj.fetching!=directoryURL || !cacheIsCurrent ) fetchNewDirectoryListing(cacheIsCurrent);
  });
}

var wasCanceled = false;
function cancelLoad(){
  doneLoading();
  wasCanceled = true;
}

function doneLoading(){
  var m = document.getElementById('loading-message');
  if( m ) document.body.removeChild(m);
}

var awaitingDirectoryResponse=false;
function fetchNewDirectoryListing(cacheIsCurrent){
  if( cacheIsCurrent ){
    //console.log('considering transmitting casual directory list request');
    // this should only happen rarely, once per 30 seconds or greater, maybe several minutes
    //chrome.runtime.sendMessage({fetch:directoryURL,startFile:startFileName}, null);

    // when settings are changed the cache is invalidated
    //console.log('new directory listing requested but cacheIsCurrent, skipping...')
  }else if(!awaitingDirectoryResponse){
    console.log('transmitting directory list request for Match Files configuration');
    chrome.runtime.sendMessage({fetch:directoryURL,startFile:startFileName,respond:true}, null);
    Cr.elm('div',{id:'loading-message',title:'Local Image Viewer Chrome Extension. Filter May Not Match File. Configure from options.',style:'text-align:center;color:white;position:absolute;z-index:100;top:0px;padding-top:40px;width:100%;text-shadow:1px 1px 1px black;'},[Cr.txt('LOADING DIRECTORY '),Cr.elm('span',{event:['click',cancelLoad]},[Cr.txt('Cancel')])],document.body);
  }
}

function recievedDirectoryData(dataObj){
  awaitingDirectoryResponse=false;
  console.log('loaded initial cache from background page...'); // from common.js
  if( !dataObj || !dataObj.dir_cache ){
    document.getElementById('loading-message').innerHTML="Sorry - error occured please try refreshing the page.";
  }else{
    // CAREFUL ! - we can get a response for a directory that is not the current directory
    if( dataObj.dir_url == directoryURL ){
      dirFiles = JSON.parse( dataObj.dir_cache );
      dirCurFile = dataObj.dir_current - 0;
      doneLoading();
      attemptCreateNextPrevArrows();
    }else{
      console.log('We got a directory cache back that is not current... ignoring...' + dataObj.dir_url +' != '+ directoryURL);
    }
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
  if (request.dir_cache){
    recievedDirectoryData(request)
  }
  sendResponse({});
});

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
  if( singleFileMode ){
    dirCurFile = im.id.replace('cicn_','')-0;
    navToFile(im.getAttribute('name'), false);
  }else window.location=directoryURL+im.getAttribute('name');
}

function winLocGoCurrent(){
  window.location=directoryURL+startFileName;
}

function navToFile(file,suppressPushState){
  if(!fastmode && !isorwas_full_screen){
    window.location=directoryURL+encodeURIComponent(file);
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
  updateThumbnail();
  newimg.onerror=function(ev){
    // console.log("Loading Error", ev);
    //fetchNewDirectoryListing(false); // possible that the file was deleted or directory does not match, but since it also might just be an alias, it won't disapear on refresh
    // certain image just will not load, not that the file doesn't exist (it was an alias to an image, not an actual image)

    // if( file == dirFiles[dirCurFile].file_name ){
    //   console.log('removing');
    //   dirFiles.splice(dirCurFile, 1);
    //   navToFile(dirFiles[dirCurFile].file_name); // if going fwd, this will be the right file
    // }
    var cvs = Cr.elm('canvas',{width:400,height:400});
    var ctx = cvs.getContext('2d');
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Error Loading", 200, 175);
    ctx.fillText('"'+file+'"', 200, 225);
    newimg.src = cvs.toDataURL();
  };
  newimg.onload=function(ev){
    if(!origImg || !origImg.parentNode )return;
    origImg.parentNode.removeChild(origImg);//breaks here sometimes, but its good execution stops here too, this is when going fast and an image takes too long to load but they click next, the next image loads faster, eventually the orig image loads, it tries to remove the previous image but that one no longer exists (since the smaller image already removed it)
    origImg = null;
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
    gel('next_file').title = getNextName(dirCurFile);
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
        window.location.hash = encodeURIComponent(startFileName);
      }
    }
    newimg.addEventListener('click',zoom_in);
    //now refrsh our copy of the directory listing....
    fetchNewDirectoryListing(true);
    //don't do this every time! slows things down!
  }
  newimg.src=directoryURL+encodeURIComponent(file);
}

function navigationStatePop(ev){//NOT implemented (cannot trigger, cannot replace state)
  if(ev && ev.type && ev.type == 'popstate'){
    if(ev.state && ev.state.filename){
      navToFile(ev.state.filename,true);
    }
  }
}
function navigationStateHashChange(ev){
  var fname = decodeURIComponent(window.location.hash.replace('#',''));
  if( startFileName != fname){
    navToFile(fname,true);
  }
}

function preLoadFile(file){
  var im=new Image();
  im.onload=function(){console.log('preloaded_next'+directoryURL+file)}
  im.src=directoryURL+encodeURIComponent(file);
}

function nav_up(){
  window.location=directoryURL;
}

var isorwas_full_screen=false;
function fs_go(){
  if( !isFullScreen() ){
    var el = document.documentElement, rfs =
        el.requestFullScreen
     || el.webkitRequestFullScreen
     || el.mozRequestFullScreen;
    rfs.call(el);
    isorwas_full_screen=true;
  }else{
     var el = document, rfs =
        el.exitFullscreen
     || el.webkitExitFullscreen
     || el.mozCancelFullScreen;
    rfs.call(el);
    isorwas_full_screen=false;
  }
}

function isFullScreen()
{
    return (document.fullScreenElement && document.fullScreenElement !== null)
         || document.mozFullScreen
         || document.webkitIsFullScreen;
}

var autoplayInterval = 0;
function auto_play(ev){
  if(ev && ev.which && ev.which == 3)return;
  if( autoplayInterval ){
    stop_auto_play();
  }else{
    var fps = gel('fps');
    var ffwd = gel("ffwd");
    var timeout = Math.round(1000 / (fps.value - 0));
    fps.style.display="none";
    ffwd.src=chrome.extension.getURL("img/pause.png");
    autoplayInterval = setInterval(function(){nav_next()},timeout);
    setTimeout(function(){
      window.addEventListener('click', stop_auto_play);
    },5);
  }
}
function stop_auto_play(){
  if( autoplayInterval ){
    window.removeEventListener('click', stop_auto_play);
    var fps = gel('fps');
    var ffwd = gel("ffwd");
    clearInterval(autoplayInterval);
    autoplayInterval = 0;
    fps.style.display="inline";
    ffwd.src=chrome.extension.getURL("img/play.png");
  }
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

function getNextFile(cf){
  var d=cf+1;
  if(d > dirFiles.length-1)d=0;
  if(!isValidFile(dirFiles[d].file_name))return getNextName(d);
  else return dirFiles[d].file_name;
}
function getPrevFile(cf){
  var d=cf-1;
  if(d < 0)d=dirFiles.length-1;
  if(!isValidFile(dirFiles[d].file_name))return getPrevName(d);
  else return dirFiles[d].file_name;
}

function getNextName(cf){
  return 'Next: '+getNextFile(cf);
}
function getPrevName(cf){
  return 'Previous: '+getPrevFile(cf);
}
