// This is part of the "Local Image File Viewer" extension
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

chrome.storage.local.get({matchfiles:false},function(obj){
  if( obj.matchfiles && obj.matchfiles.length ){
    allowedExt = obj.matchfiles;
    updateMatchfileRegex(true);
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
      updateMatchfileRegex(true);
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
    var hash = window.location.hash.replace('#','');
    if( hash.length ){
      navigationStateHashChange();
      startFileName = decodeURIComponent(hash); // see fetch:directoryURL,startFile:startFileName - we want to match the correct file in the list ( dir_current )
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
                    title:'Current Image Path - if you can\'t copy it here you\'ll have to concatenate it yourself from the URL bar - the # indicates the start of the current file name, the previous string is the launched file name.  Replace the launched file name with the current file name to complete the full URL.  Or you could just click "Go" to the right to fix the URL. Thanks for your patience!',
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

  var fps = tempElm;
  chrome.storage.local.get({slideshow_fps: 0.5},function(obj){
    fps.value = obj.slideshow_fps;
  });

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

  if( isTringToResumeAutoPlay ){
    isTringToResumeAutoPlay=false;
    auto_play();
  }
}

function rotate_right(){
  editMode.rotateRight();
}
function rotate_left(){
  editMode.rotateLeft();
}

var editMode = { // not really edit mode yet
  snapDest: {x:0,y:0},
  snapSize: {w:0,h:0},
  imgSize: {w:0,h:0},
  attempts: 0,
  origImg: null,
  tempCvs: null,
  capCvs: null,
  editCvs: null,
  snapCvs: null,
  snapCtx: null,
  created: false,
  lastBgColor: {r:0,g:0,b:0},
  imgToTake: [],
  imgToTakeIdx: 0,

  random255: function(){
    return Math.round(Math.random()*255);
  },

  randomBgColor: function(){
    this.lastBgColor.r = this.random255();
    this.lastBgColor.g = this.random255();
    this.lastBgColor.b = this.random255();
    return "rgb("+this.lastBgColor.r+","+this.lastBgColor.g+","+this.lastBgColor.b+")";
  },

  getSnapCtx: function(img){
    var snapw=img.naturalWidth,snaph=img.naturalHeight;
    if( !this.tempCvs ){
      this.tempCvs = Cr.elm('canvas',{id:'cap-canvas',width:snapw,height:snaph});
    }else{
      this.tempCvs.width=snapw;
      this.tempCvs.height=snaph;
    }
    var ctx = this.tempCvs.getContext('2d');
    ctx.drawImage(img,0,0);
    return ctx;
  },

  generateImagesToTakeGiven: function(width,height){ // current window size!!!
    var availh=document.body.clientHeight-25
    var availw=document.body.clientWidth-25  // TODO  -this MUST be width of scroll bars plus whatever border width we choose (1 or 2 px);
    var hr = Math.ceil(height / availh);
    var wr = Math.ceil(width / availw);
    this.imgToTake=[];
    this.imgToTakeIdx=0;
    var hRemaining = height;
    for(var sy=0; sy<hr; sy++){
      var wRemaining = width;
      for(var sx=0; sx<wr; sx++){
        this.imgToTake.push({
          x:sx*availw,
          y:sy*availh,
          w:(wRemaining>availw?availw:wRemaining),
          h:(hRemaining>availh?availh:hRemaining),
        })
        wRemaining-=availw;
      }
      hRemaining-=availh;
    }
  },

  create: function(){ // aka startRotation
    this.attempts=0;

    gel('arrowsleft').style.display="none",
    gel('arrowsright').style.display="none";

    var img = document.getElementsByTagName('img')[0];
    var ow=img.naturalWidth,oh=img.naturalHeight;

    this.imgSize.w=ow, this.imgSize.h=oh; // imgSize is new size

//TODO perist these and just resize as needed: see getSnapCtx
// TODO for one thing, these are already sized in anticipation of a rotaton occuring.... should happen dynamically
    this.capCvs = Cr.elm('canvas',{id:'cap-canvas',width:this.imgSize.h,height:this.imgSize.w});
    this.editCvs = Cr.elm('canvas',{id:'src-canvas',width:this.imgSize.h,height:this.imgSize.w}); // important - if we reuse this, to reset the transform!!!
    this.snapCvs = Cr.elm('canvas',{id:'edit-mode-canvas',width:document.body.clientWidth,height:document.body.clientHeight,style:'position:absolute;top:0px;left:0px;cursor:wait;',title:'Sorry: you must wait for the operation to be captured.  Feel free to look away.  Click to cancel.',event:['click',this.cancel.bind(this)]}); // could make it position absolute only before capture
// TODO - do not create until needed and size then, so size can be applied more logically as w,h
// this.tempCvs - take an arbitrary image and store it in memory for pixel analysis
// this.capCvs - the final capture to be rendered/saved - accumulated over several snaps
// this.editCvs - original source image - rotated / edited as needed (already) -  we page through this during stageImageToTake
// this.snapCvs - this is the visible image we snap pictures of during export

    this.origImg = img;
    this.created = true;
    console.log('create conflict?')
    this.origImg.style.visibility='hidden';

  },

  exportResult: function(){
    this.snapCtx = this.snapCvs.getContext('2d');
    this.origImg.parentNode.insertBefore(this.snapCvs,this.origImg);

    // normally, we might just grab the canvas here
    // Uncaught SecurityError: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.
    //var datUrl = this.editCvs.toDataURL();
    //navToSrc(datUrl , true, startFileName); // finally render the result
    // TODO ^ try catch this - since if it works, its truly the best to just export the rotated canvas right away! (preserves transparency, etc) and might work sometimes :D
    // TODO ^ navToSrc should be performed by a function that can be shared

    this.generateImagesToTakeGiven(this.imgSize.w,this.imgSize.h);
    this.stageImageToTake();

    chrome.runtime.sendMessage({captureImageModification:1}, null);
  },

  rotateRight: function(){
    this.create();
    var source_img_ctx=this.editCvs.getContext('2d');
    this.rotate(source_img_ctx, this.origImg, 90, this.imgSize.w ,this.imgSize.h);
    this.exportResult();
  },

  rotateLeft: function(){
    this.create();
    var source_img_ctx=this.editCvs.getContext('2d');
    this.rotate(source_img_ctx, this.origImg, -90, this.imgSize.w ,this.imgSize.h);
    this.exportResult();
  },

  rotate: function(ctx, img, deg, startW, startH){
    deg == 90 && ctx.translate(startH,0);
    deg == -90 && ctx.translate(0,startW);
    this.imgSize.w = startH;
    this.imgSize.h = startW;
    ctx.rotate(deg * Math.PI / 180);
    ctx.drawImage(img,0,0);
  },

  stageImageToTake: function(){
    var snapProps = this.imgToTake[this.imgToTakeIdx];
    if( !snapProps ) return true; // done
    this.snapCtx.fillStyle = this.randomBgColor(); // TODO: we will probably clear to transparent color here (the entire cvs)
    // TODO we will probably store the expected TLC of the image (top left corner) instead of simply expecting !bg color
    // though it will be quite tricky to preserve transparency in this stage/snap/collect mode - unless we can access transparency data from original image directly
    this.snapCtx.fillRect(0, 0, this.imgSize.w+2, this.imgSize.h+2);  // TODO: this +2+2 and 1,1 are really this.border(padding) or something like it, also used below
    this.snapCtx.drawImage(this.editCvs,snapProps.x,snapProps.y,snapProps.w,snapProps.h, 1,1, snapProps.w,snapProps.h);
    return false; // not done
  },

  captureSnappedImage: function(ctx, img){
    var snapProps = this.imgToTake[this.imgToTakeIdx], border = 1;
    ctx.drawImage(img, border, border, snapProps.w, snapProps.h, snapProps.x, snapProps.y, snapProps.w, snapProps.h );
  },

  colorAtPosition: function(ctx, x, y){
    var data = ctx.getImageData(x, y, 1, 1).data;
    return {r:data[0],g:data[1],b:data[2]};
  },

  confirmExpectedSnap: function(img){ // return true to always capture even if unexpected
    var snapCtx = this.getSnapCtx(img);
    var c = this.colorAtPosition(snapCtx, 0, 0);
    var cx = this.colorAtPosition(snapCtx, 1, 0);
    var cy = this.colorAtPosition(snapCtx, 0, 1);
    var c1 = this.colorAtPosition(snapCtx, 1, 1); // if image is transparent in corner... this will mean it cannot be rotated, which is ok for now
    return c.r == this.lastBgColor.r && c.g == this.lastBgColor.g && c.b == this.lastBgColor.b
        && cx.r == this.lastBgColor.r && cx.g == this.lastBgColor.g && cx.b == this.lastBgColor.b
        && cy.r == this.lastBgColor.r && cy.g == this.lastBgColor.g && cy.b == this.lastBgColor.b
        && c1.r != this.lastBgColor.r && c1.g != this.lastBgColor.g && c1.b != this.lastBgColor.b; // transparent images, if rotated in this mode, loose transparency
  },

  snapLoaded: function(dataUrl){
    if( !this.created ) return;
    var ctx = this.capCvs.getContext('2d');
    var img = Cr.elm('img',{src:dataUrl, event:['load', function(){
      var done = false;

      if( this.confirmExpectedSnap(img) ){ // looks good
        this.captureSnappedImage(ctx,img);
        this.imgToTakeIdx++;
        done = this.stageImageToTake();
      }else{
        ++this.attempts; // failed attempt
        done = this.stageImageToTake();
        console.log('retrying...')
      }

      if(!done){
        if( this.attempts < 20 ){
          console.log('capturing tab to reconstruct image...');
          window.scrollTo(0, 0);
          setTimeout(function(){
            chrome.runtime.sendMessage({captureImageModification:1}, null);
          }, 220);
        }else{
          console.warn('giving up on capturing result.... unexpected format encountered.');
          this.exitEditor();
        }

      }else{
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
        var datUrl = this.capCvs.toDataURL(type, 1.0); // TODO: support jpg quality other than 100?
        // TODO: check this is the requested type, otherwise add the proper extension
        // If the requested type is not image/png, but the returned value starts with data:image/png, then the requested type is not supported.
        navToSrc(datUrl , true, startFileName); // finally render the result
        var saveBtn = gel('save');
        saveBtn.style.display="inline";
        saveBtn.download=unescape(saveFileName);
        var fileBlob = this.dataUrlToFile(datUrl, type, saveFileName);
        saveBtn.href = URL.createObjectURL(fileBlob);
        this.exitEditor();
      }

    }.bind(this)]});
  },

  dataUrlToBlob: function(dataUrl, type){
    var binary = atob(dataUrl.split(',')[1]);
    var array = [];
    for(var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: type});
  },
  dataUrlToFile: function(dataUrl, type, saveFileName){
    var binary = atob(dataUrl.split(',')[1]);
    var array = [];
    for(var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new File([new Uint8Array(array)], saveFileName, {type: type});
  },
  cancel:function(){
    this.exitEditor();
  },
  exitEditor: function(){
    getCurrentImage().style.visibility='visible';
    setTimeout(function(){
      getCurrentImage().style.visibility='visible';
    },100)
    this.snapCvs.parentNode.removeChild(this.snapCvs);
    gel('arrowsleft').style.display="block";
    gel('arrowsright').style.display="block";
    this.created=false;
  },

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
    stop_auto_play();
  }else if(ev.keyCode==39){//right
    if(zoomdIsZoomedIn || imageIsNarrow || zoomedToFit) nav_next();
    stop_auto_play();
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
var maxLoadingImgs=16;

function anImageLoaded(ev){
  var im=getEventTarget(ev);
  var cvs=gel('cicn_'+im.id);
  var ctx=cvs.getContext('2d');
  var ow=im.naturalWidth,oh=im.naturalHeight;
  //var asp=ow/oh;
  var srcd=oh;
  if(ow < oh){
    //var nw=75;
    //var nh=(75/ow)*oh;
    srcd=ow;
  }else{//width is greater, use height
    //var nh=75;
    //var nw=(75/oh)*ow;
  }
  var tw = cvs.width - 0;
  var htw = tw * 0.5;
  if( ev.type!='error' ){
    ctx.drawImage(im,0,0,srcd,srcd,0,0,tw,tw);
  }else{
    // error loading image>!?
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, tw, tw);
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("( ? )", htw, htw+5);
    if( im && im.src ){
      var m = im.src.match(/.(\w+)$/i);
      if( m && m[1] ){
        ctx.font = "10px sans-serif";
        ctx.fillText(m[1].toUpperCase(), htw, htw+20);
      }
    }
  }
  currentlyLoadingImgs--;
  if(unloadedImages.length){
    pageScrolled();
  }
}

function loadDirFileIdToCvs(dirId){
  Cr.elm('img',{
    events:[['load',anImageLoaded],['error',anImageLoaded]],
    id:dirId,
    src:directoryURL+encodeURIComponent(dirFiles[dirId].file_name)
  });
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
var thumhldBotMargin = 110;
function createThumbHld(styles){
  return Cr.elm('div',{
    id:'thmhld',
    style:Cr.css(Object.assign({
      transition:'0s linear',
      margin:"20px 5% "+thumhldBotMargin+"px 5%",
      position:'absolute',
      padding: '4px 0'
    }, styles)),
    curheight:defaultThumhldHeight
  },[],document.body);
}
function initDirectoryThumbnails(){
  gel('loadThumbsBtn').parentNode.removeChild(gel('loadThumbsBtn'));
  window.addEventListener('scroll', pageScrolled);
  window.addEventListener('resize', pageScrolled);
  createThumbnailsBrowser(createThumbHld({}),navToFileByElmName);
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
    thmhld=createThumbHld({
      height:defaultThumhldHeight+'px',
      bottom:(-(defaultThumhldHeight+thumhldBotMargin))+'px',
      'overflow-y':'auto'
    });
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
    var curHeight = thmhld.getAttribute('curheight') - 0;
    thmhld.style.height = curHeight+'px';
    thmhld.style.bottom = '-'+(curHeight+thumhldBotMargin)+'px';
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
var curThumb = 0;
function createSingleThumb(fileIndex,destination,clFn){
  var i = fileIndex;
  if(isValidFile(dirFiles[i].file_name)){
    var c=Cr.elm('canvas',{id:'cicn_'+i,title:dirFiles[i].file_name,'name':dirFiles[i].file_name,width:75,height:75,style:'display:inline-block;cursor:pointer;position:relative;',events:['click',clFn]},[],destination);//transition:box-shadow ease-out 0.1s;
    unloadedImages.push(fileIndex);
  }
  updateThumbnail();
}
function updateThumbnail(){
  if( curThumb ){
    curThumb.style.boxShadow='';
    curThumb.style.zIndex='';
  }
  curThumb=gel('cicn_'+dirCurFile);
  if( curThumb ){
    var thmhld=gel('thmhld');
    curThumb.style.boxShadow='0px 0px 3px 3px red';
    curThumb.style.zIndex=1;
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

var isTringToResumeAutoPlay=false;
var periodicRefreshDesired=false;
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

    if( obj.alwaysAutoPlay == 'true' ){
      isTringToResumeAutoPlay = true;
    }
    if( obj.periodicallyRefresh == 'true' ){
      periodicRefreshDesired = true;
    }

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

chrome.runtime.connect().onDisconnect.addListener(function() {
  console.log("background page went away! Going to need a page refresh... in 5....")
  setTimeout(function(){
    window.location.reload();
  }, 5000)
})

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

function getCurrentImage(){
  return document.getElementsByTagName('img')[0];
}

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
    if( periodicRefreshDesired ){
      fetchNewDirectoryListing(true); // this will potentially pause auto play again!
    }


    document.title=loadedFileName;
    clearTimeout(shortcutTimeout);
    shortcutTimeout = setTimeout(function(){
      var shortcut = gel('shortcutIcon');
      if(shortcut) shortcut.href=src;
    },100);

  }
  newimg.src=src;
  newimg.style.transition="0s linear";
}

// curated based on https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Supported_image_formats
// TODO: watch for https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format https://caniuse.com/#feat=heif
function isFileImage(file){
  return file.match(/\.(jpg|jpeg|gif|png|bmp|webp|apng|svg|tif|tiff)$/i) ? true : false;
}

function navFileWhenReady(fname){
  if( arrowsCreated ){
    navToFile(fname,true);
  }else{
    setTimeout(function(){
      navFileWhenReady(fname)
    }, 123);
  }
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
    navFileWhenReady(fname);
  }
}

function preLoadFile(file){
  var im=new Image();
  im.onload=function(){console.log('preloaded_next'+directoryURL+file)}
  im.src=directoryURL+encodeURIComponent(file);
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
  if( autoplayInterval || (ev && was_auto_playing_before_paused) ){
    stop_auto_play();
  }else if( !fastmode ){
    alert('fast mode not enabled, cannot autoplay');
  }else{
    var fps = gel('fps');
    var ffwd = gel("ffwd");
    var ifps = fps.value - 0;
    if( ifps < 3 ){
      // will not save super fast FPS values...
      chrome.storage.local.set({slideshow_fps: ifps}, function(){});
    }
    var timeout = Math.round(1000 / ifps);
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
    var ffwd = gel("ffwd");
    clearInterval(autoplayInterval);
    autoplayInterval = 0;
    ffwd.src=chrome.extension.getURL("img/play.png");
  }
}
function stop_auto_play(ev){
  pause_auto_play(ev);
  window.removeEventListener('click', stop_auto_play);
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
