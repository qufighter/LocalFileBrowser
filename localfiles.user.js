var directoryURL=currentDirectoryUrl();
var bodyExists=false;
var timeoutId=0;
var fileUrlInitComplete = false;
var errorImage = '';
var singleFileMode = directoryURL.substr(directoryURL.length-1,1)!='/';
var centerImage = true;
// to toggle bg color:
// getComputedStyle(document.body).getPropertyValue('background-color')
// "rgb(255, 192, 203)"
// for the reverse, there are some ways
// http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes

chrome.storage.local.get({matchfiles:false},function(obj){
  if( obj.matchfiles && obj.matchfiles.length ){
    allowedExt = obj.matchfiles;
    updateMatchfileRegex();
    if( !fileUrlInitComplete && singleFileMode ){
      initFileUrl();
    }
  }
});

if(singleFileMode){
  getAndSetBodyStyle();
  initFileUrl();
}else{
  isViewingDirectory_LoadThumbnails();
}

function getAndSetBodyStyle(){
  chrome.storage.local.get({bodystyle:false, matchfiles: false},function(obj){
    if( obj.matchfiles && obj.matchfiles.length ){
      allowedExt = obj.matchfiles;
      updateMatchfileRegex();
    }
    if( isValidFile(currentDirectoryUrl()) && obj.bodystyle && obj.bodystyle.length > 0){
      var defaultAlignment = ''; // 'text-align:center;';
      document.body.setAttribute('style',defaultAlignment+(document.body.getAttribute('style')||'')+obj.bodystyle);
      if( obj.bodystyle.indexOf('text-align') > 0 ){
        centerImage = false; // user defined centering applied, we will not attempt centering again
      }
    }
  });
}

function currentDirectoryUrl(){
  return window.location.protocol + '//' + window.location.host + window.location.pathname;
}

function currentStartFileName(){
  var dirparts=currentDirectoryUrl().split('/');
  return dirparts[dirparts.length-1];
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
    if( centerImage ) document.body.style.textAlign='center';
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
var enlargeSmallImagesToViewportSize = false;
function zoom_in(ev){
  if( !zoomedToFit && !imageIsShrunken() ){
    enlargeSmallImagesToViewportSize = true;
  }else{
    enlargeSmallImagesToViewportSize = false;
  }
  zoomedToFit = !zoomedToFit;
  imageViewResizedHandler(ev);
}
function handleImageJustLoaded(ev, zoomedToFitJustSet){
  if( !zoomedToFitJustSet ) determineIfZoomedToFit();

  if( enlargeSmallImagesToViewportSize && !zoomedToFit && !imageIsShrunken() ){
    zoomedToFit = !zoomedToFit;
  }

  imageViewResizedHandler();
}
function imageIsShrunken(){
  var im=getCurrentImage();
  if(im){
    return im.naturalWidth > im.clientWidth;
  }
  return false;
}
function determineIfZoomedToFit(){
  var im=getCurrentImage();
  if(im)zoomedToFit=im.naturalWidth != im.clientWidth;
}
var imgViewResizedTimeout=0;
function imageViewResized(){
  clearTimeout(imgViewResizedTimeout);
  imgViewResizedTimeout=setTimeout(imageViewResizedHandler,250);
}
function imageViewResizedAgainHandler(winWidth, winClientWidth){
  setTimeout(function(){
    if( ( winWidth > winClientWidth && document.body.scrollHeight > document.body.clientHeight ) ){
      //console.log('resizing a second time')
      imageViewResizedHandler({}, true);
    }
  }, 0);
}
function imageViewResizedHandler(ev, useClientWidth){
  var im=getCurrentImage();
  if(im){
    var winHeight = window.innerHeight;
    var winWidth = window.innerWidth;
    var winClientWidth = document.body.clientWidth; // overflowY scrollbars
    if( useClientWidth ){
      winWidth = winClientWidth;
    }
    if(im.complete && im.naturalWidth && im.clientHeight){
      imageIsNarrow = im.naturalWidth < winWidth;
      zoomdIsZoomedIn = imageIsNarrow && im.naturalHeight < winHeight;
      if(zoomedToFit){
        var im_ratio=im.naturalWidth/im.naturalHeight;
        var wn_ratio=winWidth/winHeight;
        if(wn_ratio > im_ratio){
          im.height = winHeight;
          im.width = winHeight * im_ratio;
        }else{
          im.width = winWidth;
          im.height = winWidth / im_ratio;
        }
        document.body.style.overflowX = 'hidden';
        imageViewResizedAgainHandler(winWidth, winClientWidth);
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
        document.body.style.overflowX = 'auto';
      }
      if(!hasSizedOnce){
        hasSizedOnce=true;
        im.addEventListener('click',zoom_in);
        im.style.cursor='zoom-'+(zoomedToFit?'out':'in');
      }
      im.style.marginTop='0px';
      im.style.marginBottom='0px';
      if(im.clientHeight){
        if(im.clientHeight < window.innerHeight){
          var marginTop = Math.round((window.innerHeight - im.clientHeight) * 0.5);
          im.style.marginTop=marginTop+'px';
          im.style.marginBottom=(window.innerHeight-im.clientHeight-marginTop)+'px';
          im.style.position = 'relative'; // in case image is absolute position
        }
      }
      if( zoomdIsZoomedIn )
        im.style.cursor=(zoomedToFit?'zoom-out':'zoom-in');
      else
        im.style.cursor=(zoomedToFit?'zoom-in':'zoom-out');
    }else{
      im.onload=handleImageJustLoaded;
    }
  }
}

function rotate_right(){
  performRotation(90);
}

function rotate_left(){
  performRotation(-90);
}

function getCurrentImage(){
  return document.querySelector('img,video,audio');
}

function getCurrentRotation(img){
  return (img.getAttribute('file-rotation') || 0) - 0;
}

function incrementRotation(deg, amount){
  return ((deg + amount) + 360 ) % 360;
}

function performRotation(degrees){
  var saveBtn = gel('save');
  saveBtn.href='#';
  var img = getCurrentImage();
  // if image changed reset properties (cached image, CurrentRotation
  var rot = incrementRotation(getCurrentRotation(img), degrees);
  img.setAttribute('file-rotation', rot);
  prepareRotationSave(rot);
}

function prepareRotationSave(degrees){
  var http = new XMLHttpRequest();
  http.responseType = 'blob';
  http.open("GET", directoryURL+encodeURIComponent(currentFile()));
  http.onreadystatechange=function(){
    if (http.readyState == 4) {
      var objUr = URL.createObjectURL(http.response);
      loadImage(objUr, rotatingImageLoaded, degrees);
    }
  }
  http.send(null);
}

function rotatingImageLoaded(img, degrees){
  var ow=img.naturalWidth,oh=img.naturalHeight;
  var nw=ow, nh=oh;
  if( degrees % 180 != 0 ) nw=oh, nh=ow;
  var capCvs = Cr.elm('canvas',{id:'cap-canvas',width:nw,height:nh});
  var cap_img_ctx=capCvs.getContext('2d');
  imageRotate(cap_img_ctx, img, degrees, ow, oh);
  doneCapturingStageForSave(capCvs);
}

function imageRotate(ctx, img, deg, startW, startH){
  deg == 90 && ctx.translate(startH,0);
  deg == 270 && ctx.translate(0,startW);
  deg == 180 && ctx.translate(startW, startH);
  ctx.rotate(deg * Math.PI / 180);
  ctx.drawImage(img,0,0);
}

function doneCapturingStageForSave(capCvs){
  var type = null;
  // working types: http://kangax.github.io/jstests/toDataUrl_mime_type_test/
  var types = {
    'png':"image/png",
    'jpg':"image/jpeg",
    'jpeg':"image/jpeg"
  }
  var saveFileName = startFileName;
  var ext=saveFileName.match(/\.([A-z]+)$/);
  if( ext.length == 2 ){
    ext = ext[1].toLowerCase();
  }
  type = types[ext];
  if( !type ){
    type = types['png'];
    saveFileName+='.png';
  }
  var datUrl = capCvs.toDataURL(type, 1.0);
  // check this is the requested type, otherwise add the proper extension
  // If the requested type is not image/png, but the returned value starts with data:image/png, then the requested type is not supported.
  var datatype = datUrl.substr(0,6+type.length);
  if( datatype != 'data:'+type+';'  ){
    type = types['png'];
    saveFileName+='.png';
    if( datatype != 'data:'+type+';' ){
      datUrl = capCvs.toDataURL(type, 1.0);
    }
  }

  navToSrc(datUrl , true, startFileName); // finally render the result - we skip this if CSS is used to insta-preview rotation anyway

  var saveBtn = gel('save');
  // following 2-3 lines preview what will be saved on the save button (for testing only)
  // var btnimg = gel('save').querySelector('img');
  // btnimg.src = datUrl;
  // btnimg.style.border="1px solid red";

  saveBtn.style.display="inline";
  saveBtn.download=unescape(saveFileName);
  var fileBlob = dataUrlToFile(datUrl, type, saveFileName);
  saveBtn.href = URL.createObjectURL(fileBlob);
}

function dataUrlToFile(dataUrl, type, saveFileName){
  var binary = atob(dataUrl.split(',')[1]);
  var array = [];
  for(var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
  }
  return new File([new Uint8Array(array)], saveFileName, {type: type});
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
    if( !fastmode && (extraControlsRight[i].id == 'fps'/* || extraControlsRight[i].id == 'ffwd'*/) ) continue; // these controls only work in fast mode
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

  if( centerImage ) document.body.style.textAlign='center';
  determineIfZoomedToFit();
  imageViewResizedHandler();

  var showArrows = dirFiles.length > 0;
  var leftElm=[],rightElm=[],tempElm;
  if(showArrows){
    leftElm.push(
      Cr.elm('img',{'title':getPrevName(dirCurFile),
                        id :'previous_file',
                      'src':chrome.extension.getURL('img/arrow_left.png'),
                      width:'77',events:[['mouseup',nav_prev],['dragstart',cancelEvent]],
                      style:'float:left;position:relative;cursor:pointer;vertical-align: bottom;'
                   }
      )
    );
  }
  extraControlsLeft.push(
    Cr.elm('img',{'title':'View Parent Directory',
                    'src':chrome.extension.getURL('img/arrow_up.png'),
                    width:'77',events:[['click',nav_up]],
                    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('img',{'title':'Fullscreen',id:'fs_go',
                    'src':chrome.extension.getURL('img/fillscreen.png'),
                    width:'77',events:[['click',fs_go]],
                    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('img',{'title':'Toggle Thumbnails',
                    'src':chrome.extension.getURL('img/thumbs.png'),
                    width:'77',events:[['click',initSingleImageThumbnails]],
                    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('img',{'title':'Options',
                    'src':chrome.extension.getURL('img/gear.png'),
                    width:'77',events:[['click',visitOptions]],
                    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('input',{'type':'text',
                    id:'os_path',
                    readonly:'readonly',
                    title:'Current Image Path - if you can\'t copy it here you\'ll have to concatenate it yourself from the URL bar - the # indicates the start of the current file name, the previous string is the launched file name.  Replace the launched file name with the current file name to complete the full URL.  Or you could just click "Go" to the right to fix the URL.  history.pushState({},\'hi\',window.location.href + \'#huh\'); works though so we\'ll fix this really soon (oops was wrong... the "origin" is treated like the full file, not the directory.  I guess you may also have to unescape spaces and () before using the URL too.  Whelp moving on...  Thanks for your patience!',
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
                    style:'left:-100px;display:none;'
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

  Cr.elm('div',{id:'arrowsleft',style:'position:fixed;opacity:0;transition: opacity 0.5s linear;bottom:0px;left:0px;z-index:2147483600;',class:'printhidden',events:[['mouseover',showExtraControlsLeft],['mouseout',hideExtraControlsLeft]]},leftElm,arrowHolder);


  if(showArrows){
    tempElm = Cr.elm('img',{
      title: getNextName(dirCurFile),
      src:chrome.extension.getURL('img/arrow_right.png'),
      width:'77',events:[['mouseup',nav_next],['dragstart',cancelEvent]],
      style:'float:right;position:relative;cursor:pointer;vertical-align: bottom;',
      class:'printhidden',
      id:'next_file'
    });
    rightElm.push(tempElm);
    window.addEventListener('mousemove', mmov);
  }

  Cr.elm('div',{id:'arrowsright',style:'position:fixed;opacity:0;transition: opacity 0.5s linear;bottom:0px;right:0px;z-index:2147483600;',class:'printhidden',events:[['mouseover',showExtraControlsRight],['mouseout',hideExtraControlsRight]]},rightElm,arrowHolder);

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
    Cr.elm('option',{value:1/3600},[Cr.txt("each frame 60 minutes")]),
    Cr.elm('option',{value:1/1800},[Cr.txt("each frame 30 minutes")]),
    Cr.elm('option',{value:1/600},[Cr.txt("each frame 10 minutes")]),
    Cr.elm('option',{value:1/300},[Cr.txt("each frame 5 minutes")]),
    Cr.elm('option',{value:1/180},[Cr.txt("each frame 3 minute")]),
    Cr.elm('option',{value:1/150},[Cr.txt("each frame 2.5 minute")]),
    Cr.elm('option',{value:1/120},[Cr.txt("each frame 2 minute")]),
    Cr.elm('option',{value:1/60},[Cr.txt("each frame 1 minute")]),
    Cr.elm('option',{value:1/45},[Cr.txt("each frame 45 seconds")]),
    Cr.elm('option',{value:1/30},[Cr.txt("each frame 30 seconds")]),
    Cr.elm('option',{value:0.04},[Cr.txt("each frame 25 seconds")]),
    Cr.elm('option',{value:0.05},[Cr.txt("each frame 20 seconds")]),
    Cr.elm('option',{value:1/15},[Cr.txt("each frame 15 seconds")]),
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
    title:"Autoplay Slideshow",
    src:chrome.extension.getURL('img/play.png'),
    width:'28',events:[['mouseup',auto_play],['dragstart',cancelEvent]],
    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;',
    class:'printhidden',
    id:'ffwd'
  },[],rightFrag);
  extraControlsRight.push(tempElm);

  tempElm = Cr.elm('img',{
    title:"Rotate Left",
    src:chrome.extension.getURL('img/r_left.png'),
    width:'28',events:[['mouseup',rotate_left],['dragstart',cancelEvent]],
    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;',
    class:'printhidden',
    id:'edit_mode'
  },[],rightFrag);
  extraControlsRight.push(tempElm);

  tempElm = Cr.elm('img',{
    title:"Rotate Right",
    src:chrome.extension.getURL('img/r_right.png'),
    width:'28',events:[['mouseup',rotate_right],['dragstart',cancelEvent]],
    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;',
    class:'printhidden',
    id:'edit_mode'
  },[],rightFrag);
  extraControlsRight.push(tempElm);

  tempElm = Cr.elm('a',{style:'display:none;cursor:pointer;vertical-align: bottom;',class:'printhidden',id:'save'},[
    Cr.elm('img',{
      title:"Save Changes",
      style:'position:relative;',
      height:'37',
      src:chrome.extension.getURL('img/save.png'),
    })
  ],rightFrag);

  rightDest.appendChild(rightFrag);
}

function visitOptions(){
  chrome.runtime.sendMessage({goToOrOpenOptions:true}, function(){});
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
  }else if(ev.keyCode==13){//enter
    auto_play();
    mmov();
    showExtraControlsRight();
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
function isElementInView(elm, thmhld){
  var scry=window.pageYOffset;
  var maxy=scry + window.innerHeight;
  var thmoffset = getOffset(thmhld);
  var hldScry = thmhld.scrollTop;
  var hldMaxy = hldScry + thmhld.offsetHeight;
  if(thmoffset.y < maxy && thmoffset.y + thmhld.offsetHeight > scry){
    if(elm.offsetTop <= hldMaxy && elm.offsetTop + elm.offsetHeight >= hldScry){
       return true;
    }
  }
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
  var thmhld=gel('thmhld');
  if(thmhld)thmhld.style.left=window.scrollX+"px";
}

function pageScrolledHandler(){
  var thmhld=document.getElementById('thmhld');
  for(var i=0;i<unloadedImages.length;i++){
    if(isElementInView(gel('cicn_'+unloadedImages[i]), thmhld)){
      loadDirFileIdToCvs(unloadedImages[i]);
      unloadedImages.splice(i--,1);
      if( ++currentlyLoadingImgs >= maxLoadingImgs ){
        break; // exit loop and load the rest later, in batch
      }
    }
  }
}
function navToFileIfFastMode(ev){
  if( !fastmode && !confirm('fast mode not enabled, you will loose thumbnails, are you sure?') ){
    return;
  }
  navToFileByElmName(ev, true);
}
var defaultThumhldHeight = 250;
function createThumbHld(styles){
  return Cr.elm('div',{id:'thmhld',style:"transition:0s linear;margin:20px 5% 110px 5%;position:relative;"+styles,curheight:defaultThumhldHeight},[],document.body);
}
function initDirectoryThumbnails(){
  gel('loadThumbsBtn').parentNode.removeChild(gel('loadThumbsBtn'));
  window.addEventListener('scroll', pageScrolled);
  window.addEventListener('resize', pageScrolled);
  createThumbnailsBrowser(createThumbHld(''),navToFileByElmName);
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
    thmhld=createThumbHld('height:'+defaultThumhldHeight+'px;overflow-y:auto;');
    createThumbnailsBrowser(thmhld,navToFileIfFastMode);
    window.addEventListener('scroll', pageScrolled);
    window.addEventListener('resize', pageScrolled);
    thmhld.addEventListener('scroll', pageScrolled);
    window.addEventListener('mousewheel', mwheelf);
  }
  imageViewResizedHandler();
  window.scrollBy(0,95);
  thmhld.style.left=window.scrollX+"px";
}
function mwheelf(ev){
  if( ev.target.nodeName == 'CANVAS' ) return;
  var thmhld=gel('thmhld');
  if( ev.target == thmhld ) return;
  if( thmhld ){
    if( ev.wheelDeltaY < 0 ){
      if( thmhld.clientHeight < thmhld.scrollHeight && isWindowScrollYMaxed() ){
        thmhld.setAttribute('curheight', (thmhld.getAttribute('curheight') - 0) + 200);
      }
    }else{
      if( window.scrollY == 0){
        thmhld.setAttribute('curheight', defaultThumhldHeight);
        updateThumbnail();
      }
    }
    thmhld.style.height = thmhld.getAttribute('curheight')+'px';
  }
}
function isWindowScrollYMaxed(){
  return window.innerHeight + window.scrollY + 1 >= document.body.scrollHeight;
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
  curThumb=gel('cicn_'+dirCurFile);
  if( curThumb ){
    var thmhld=gel('thmhld');
    curThumb.style.border=SELECTED_THUMBNAIL_BORDER;
    if( !isElementInView(curThumb, thmhld) ){
      thmhld.scrollTop=curThumb.offsetTop;
    }
  }
}

function prepareThumbnailsBrowser(){
  loadPrefs(function(){
    //console.log('sending all the row data now');

    var retryTimeout = setTimeout(function(){
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange=function(){if(xhr.readyState == 4 && xhr.status == 200){
        processFileRows(directoryURL, startFileName, xhr.responseText, true, function(){});
      }};
      xhr.open('GET', window.location.href, true);
      xhr.send();
    }, 0);

    processFileRows(directoryURL, startFileName, document.body.innerHTML, true, function(){clearTimeout(retryTimeout);});


  });
  Cr.elm('button',{id:'loadThumbsBtn',events:['click',initDirectoryThumbnails]},[Cr.txt('Show Thumbnails...')],document.body)
}

function isViewingImage_LoadDirectory(){
  //we could first just get dir_url and determine if cacheIsCurrent...
  chrome.storage.local.get(null,function(obj){
    var cacheIsCurrent=false;

    // not really used on frontend anymore
    if( obj.sorttype && sorts[obj.sorttype] ){
      directorySortType = obj.sorttype;
    }

    if(obj.fastmode && obj.fastmode=='true')fastmode=true;

    //console.log('comparing current dir:', obj.dir_url, directoryURL, 'all settings', obj);
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

function visitDir(){
  window.location=directoryURL;
}

function doneLoading(){
  var m = document.getElementById('loading-message');
  if( m ) document.body.removeChild(m);
}

var awaitingDirectoryResponse=false, cacheRequestCounter=0;
function fetchNewDirectoryListing(cacheIsCurrent){
  if( cacheIsCurrent ){
    if( ++cacheRequestCounter < ((dirFiles.length*2) || 3) ){
      return;
    }else{
      pauseAutoPlay(); // until directory loads
    }
  }
  if(!awaitingDirectoryResponse){
    console.log('transmitting directory list request for Match Files configuration');
    chrome.runtime.sendMessage({fetch:directoryURL,startFile:startFileName,respond:true}, function(){});
    Cr.elm('div',{id:'loading-message',title:'Local Image Viewer Chrome Extension. Filter May Not Match File. Configure from options.',style:'text-align:center;color:white;position:absolute;z-index:100;top:0px;padding-top:40px;width:100%;text-shadow:1px 1px 1px black;'},[
      Cr.txt('LOADING DIRECTORY - '),
      Cr.elm('span',{style:'cursor:pointer',event:['click',cancelLoad]},[Cr.txt('Cancel')]),
      Cr.txt(' • '),
      Cr.elm('span',{style:'cursor:pointer',event:['click',visitDir]},[Cr.txt('Visit Directory (alternate load method (requires option for cache directory to be enabled), then click back and refresh the page)')])
    ],document.body);
    cacheRequestCounter=0;
  }
}

function recievedDirectoryData(dataObj){
  awaitingDirectoryResponse=false;
  console.log('loaded initial cache from background page...'); // from common.js
  if( !dataObj || !dataObj.dir_cache ){
    Cr.empty(document.getElementById('loading-message')).appendChild(Cr.txt("Sorry - error occured please try refreshing the page."));
  }else{
    // CAREFUL ! - we can get a response for a directory that is not the current directory
    if( dataObj.dir_url == directoryURL ){
      dirFiles = JSON.parse( dataObj.dir_cache );
      dirCurFile = dataObj.dir_current - 0;
      doneLoading();
      attemptCreateNextPrevArrows();
      resumeAutoPlay();
    }else{
      console.log('We got a directory cache back that is not current... ignoring...' + dataObj.dir_url +' != '+ directoryURL);
    }
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
  if (request.dir_cache){
    recievedDirectoryData(request)
  }else if(request.imageCaptured){
    editMode.snapLoaded(request.imageDataUrl);
  }else if(request.reloadPrefs){
    if(singleFileMode){
      getAndSetBodyStyle();
      loadPrefs(function(){
        // 1) need to know what mode we are running here (singleFileMode)
        // 2) we can re-sort without scanning again
        //fetchNewDirectoryListing(false); // while this could work good, fails for multiple tabs, only one will load
        /// - can't we just call the sort function directly (common.js determineSort)
      });
    }
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
  Cr.elm('link', {id:'shortcutIcon', rel:"shortcut icon", href:directoryURL+startFileName, type:"image/x-icon"}, [], document.head);
}

function navToFileByElmName(ev, warnIfNonImage){
  var im=getEventTarget(ev);
  if( singleFileMode ){
    dirCurFile = im.id.replace('cicn_','')-0;
    var filesName = im.getAttribute('name');
    var viewingImageFile = errorImage==startFileName || isFileImage(startFileName);
    var navigatingToImageFile = isFileImage(filesName);
    if( !warnIfNonImage || (viewingImageFile && navigatingToImageFile) || !fastmode || (fastmode && confirm('must leave fast mode to change between non-image content types, you will loose thumbnails, are you sure?')) )
      navToFile(filesName, false);
  }else window.location=directoryURL+im.getAttribute('name');
}

function winLocGoCurrent(){
  window.location=directoryURL+startFileName;
}

function currentFile(){
  return dirFiles[dirCurFile].file_name;
}

// function isNotImg(file){
//   return !file.match(/\.(jpg|jpeg|png|gif|bmp)$/i)
// }

// function navToVideoSrc(){

// }

var shortcutTimeout = 0;
function navToSrc(src,suppressPushState,loadedFileName){

  //this would be WAY better!  unfortunately:
  //"A history state object with URL 'http://webifire/' cannot be created in a document with origin 'null'."
  // - we can load the next image without reloading the page - we CANNOT update the URL :/...

  //getCurrentImage().src=directoryURL+file;
  if(typeof(suppressPushState)=='undefined')suppressPushState=false;

  // detect non image
  // to test if video tag worked
  // 3 just navToSrc img if video fails to load
  // img tag may not exist on page - may start on video page?
  // video.addEventListener('loadeddata', function() {
  //    // Video is loaded and can be played
  // }, false);
  // if( isNotImg(loadedFileName) ){
  //   navToVideoSrc()
  // }

  var origImg = getCurrentImage();
  var origNextSibl = origImg.nextSibling;
  var newimg = origImg.cloneNode();
  newimg.setAttribute('name',loadedFileName);
  newimg.removeAttribute('width');
  newimg.removeAttribute('height');
  updateThumbnail();
  newimg.onerror=function(ev){
    errorImage=loadedFileName;

    // console.log("Loading Error", ev);
    //fetchNewDirectoryListing(false); // possible that the file was deleted or directory does not match, but since it also might just be an alias, it won't disapear on refresh
    // certain image just will not load, not that the file doesn't exist (it was an alias to an image, not an actual image)

    // if( file == currentFile() ){
    //   console.log('removing');
    //   dirFiles.splice(dirCurFile, 1);
    //   navToFile(currentFile()); // if going fwd, this will be the right file
    // }
    var props = {width:600,height:400};
    var cvs = Cr.elm('canvas',props);
    var ctx = cvs.getContext('2d');
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, props.width, props.height);
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Error Loading", 300, 175);
    ctx.fillText('"'+loadedFileName+'"', 300, 225);
    if( isorwas_full_screen ){
      ctx.font = "12px sans-serif";
      ctx.fillText("Cannot change to non image without leaving fast mode.", 300, 300);
      ctx.fillText("Cannot leave fast mode when using fullScreenElement.", 300, 320);
      ctx.fillText("Exit fullscreen and use browser native (f11) fullscreen instead.", 300, 340);
    }
    newimg.src = cvs.toDataURL();
    resumeAutoPlay();
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
    handleImageJustLoaded({}, true);

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
    resumeAutoPlay();
    //fetchNewDirectoryListing(true); // this will potentially pause auto play again!
    //don't do this every time! slows things down!

    document.title=loadedFileName;
    clearTimeout(shortcutTimeout);
    shortcutTimeout = setTimeout(function(){
      gel('shortcutIcon').href=src;
    },100);

  }
  newimg.src=src;
  newimg.style.transition="0s linear";
}

function isFileImage(file){
  return file.match(/\.(jpg|jpeg|gif|png|bmp|webp|apng|svg|tif|tiff)$/i) ? true : false;
}

function navToFile(file,suppressPushState){

  var fastmodeAllowed = fastmode;
  var viewingImageFile = errorImage==startFileName || isFileImage(startFileName);
  var navigatingToImageFile = isFileImage(file);
  if( fastmodeAllowed ){
    fastmodeAllowed = viewingImageFile && navigatingToImageFile;
  }

  if(!fastmodeAllowed && (!isorwas_full_screen || !viewingImageFile)){
    window.location=directoryURL+encodeURIComponent(file);
    return;
  }
  if( singleFileMode ){
    var savebtn = gel('save');
    if(savebtn)savebtn.style.display="none";
    getCurrentImage().removeAttribute('file-rotation');
  }
  navToSrc(directoryURL+encodeURIComponent(file),suppressPushState,file);
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
  if( !fname ){
    navToFile(currentStartFileName(),true);
  }else if( startFileName != fname){
    // note: this timeout avoids a tab crash on reload in fast mode... at a guess native code is trying to interact with the image in a low level way, while we swap the image out from script, crashing the tab... script should be paused/blocked maybe... however presumably this issue never occurs except when non-chrome script (such as this one) is running....
    // by the way, timeout zero works too, however it does not prevent flicker... don't hate the flicker since its more transparent about what is going on... this may never be reached if pushState starts to work.
    setTimeout(function(){
      navToFile(fname,true);
    }, 123);
  }
}

function preLoadFile(file){
  loadImage(directoryURL+encodeURIComponent(file), function(){console.log('preloaded_next'+directoryURL+file)});
}

function loadImage(url, cbf){
  var extraArgs = arguments.length > 2 ? Array.prototype.slice.call(arguments).slice(2) : [];
  var im=new Image();
  im.onload=function(){
    cbf.apply(this, [im].concat(extraArgs))
  }
  im.src=url;
}

function nav_up(){
  // TODO: support open in a new tab
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
  }else if( !fastmode ){
    alert('fast mode not enabled, cannot autoplay');
  }else{
    var fps = gel('fps');
    var ffwd = gel("ffwd");
    var timeout = Math.round(1000 / (fps.value - 0));
    ffwd.src=chrome.extension.getURL("img/pause.png");
    autoplayInterval = setInterval(function(){ // todo: compare with setTimeout removeTimeout
      nav_next();
      pauseAutoPlay();
    },timeout);
    setTimeout(function(){
      window.addEventListener('click', stop_auto_play);
    },5);
  }
}
function pause_auto_play(ev){
  if( autoplayInterval ){
    if(ev && ev.target.id == 'fs_go'){return;} // fullscreen button (at least when going fullscreen) should not stop autoplay
    window.removeEventListener('click', stop_auto_play);
    var ffwd = gel("ffwd");
    clearInterval(autoplayInterval);
    autoplayInterval = 0;
    ffwd.src=chrome.extension.getURL("img/play.png");
  }
}
function stop_auto_play(ev){
  pause_auto_play(ev);
  was_auto_playing_before_paused=false;
}

var was_auto_playing_before_paused=false;
function pauseAutoPlay(){
  was_auto_playing_before_paused = autoplayInterval || false;
  if( was_auto_playing_before_paused ){
    pause_auto_play(); // this will prevent lag, we can resume at a later time
  }
}

function resumeAutoPlay(){
  if( was_auto_playing_before_paused ){
    auto_play();
    was_auto_playing_before_paused=false;
  }
}

function nav_prev(ev){
  if(ev && ev.which && ev.which == 3)return;
  dirCurFile--;
  if(dirCurFile < 0)dirCurFile=dirFiles.length-1;
  if(!isValidFile(currentFile()))nav_prev()
  else navToFile(currentFile());
}

function nav_next(ev){
  if(ev && ev.which && ev.which == 3)return;
  dirCurFile++;
  if(dirCurFile > dirFiles.length-1)dirCurFile=0;
  if(!isValidFile(currentFile()))nav_next()
  else navToFile(currentFile());
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
