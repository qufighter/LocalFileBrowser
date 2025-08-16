// This is part of the "Local Image File Viewer" extension
var directoryURL=currentDirectoryUrl();
var bodyExists=false;
var timeoutId=0;
var fileUrlInitComplete = false;
var errorImage = '';
var singleFileMode = directoryURL.substr(directoryURL.length-1,1)!='/';
var centerImage = true;
var thumbnailSize = 75;
var touchyMode = false; // default: mouse mode
// to toggle bg color:
// getComputedStyle(document.body).getPropertyValue('background-color')
// "rgb(255, 192, 203)"

var play_png = 'data:image/png;base64,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';
var pause_png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE8AAAA6CAYAAADx2wT0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA8hJREFUeNrsm8FS2zAQhiXFSYBpXgIuvfQhe+xb9DX6Ij20vbXXkJnMZIgdy2rMrIYfoSWptSBBpZkdGYg33k//ypZZaeecqm1aa879oNb6vwJzjqhM1c/0VuG9Rtqem91vISNLg6f/8XhqcHoiJAe9lgLZvAA0HZiKHJ8baMz3KZB4PpqKHOsUgJLKC82Q4c8hCMcE/Bw8DiQHbWB6nQqwEQZnApsFP+tn4HFKCaEZBiSeMwSwLNkQfCbbnBeOPAJroA8hImz3jA0nlK0ZXzFoPX13T5+1cP0u55yHqvPARpuThSA5eKgWDp4Jeg6eV1kP4A7kqwdgQ0rqSqWtV5UHtzjakuAt4PeoQBUBhwAtBGQi6W8YX6i2A5mJ3GVdJOWzKM+rbrTFfr//Zq01xyWOHobhvvdGSx9NSz4Hyz+3Xq9/3tzcfAHluO12+xXP4Xrvy/e3t7c/rq+vPx8PW2awsFe5bxg+NefL5fLTFEdt245q+YAT/Gq1+jjFV9/33bG7AnCobBtJeZU7bWcpPkeVUsDh3XEKvPFaLgFcD6lsIqmcNW0xdVPgXQI8m+jrgsAdaP7tYN7VOeFpBmAjEHCfCo/mwiX5mkduWDoVoOSLAR3c/abCW5APCeXhY5ORVJ30c14yPFLLPLKkS/HVMOB07jmPe1hOCXgGd79e4H2laKq+5MtQiQvDQGeJA8GtSFSJ8EoaBO611buH9yYGp/4Po8Kr8Cq8Cq+2Cq/Cq/AqvNoqvAqvwqvwKrzaKrwKr8IrvWGtyruDJxIc48OVqjyJoMNKqUmNCn7Cgh5XIjyuKHFKwFgiNggMhFVPa/9EADaC0LDOLgXeQQmUWwS+EKKTgtgIp2wSPGPMeG4nAY98YWVUDGA25YXF2B5cnxjwXglUSZHyWhoMVLNYCkulLRYN2t1u930stAHTWB3qqzl9kL6ac71e/zl2dwBu2Gw2v8bz778MqkHDylD0NdrxvN80EK16KK+1kurT524Zjex6DIu4F2QXZFdw7OuT5+pxwY2DYCxzrNRD3R/WncwYX5ZAdQRuTwNyBzDbYD58Ul57DpdGaK5z6nERtQ/QQSr7ci8fuIqodojMTUrx+zpivvA6OoDVBcCKSltLwXTwdx9Iq/JWw3cAz0YGJ9vd1gevg5sFqjH3PowDqK4PwGVVnmIejv3vDqqMHUA2mOOSAaY+qmgGHqZPaXvPxFYaUmmLyyF/wQbSucRdj9mXZ7H0xTQaTgQdG4DX3G9bxJynGQAl7vQWez0lrTwOYmnvClVJaVsyrBdrfwUYAD5Hj9EJ8jocAAAAAElFTkSuQmCC';

if( window.navigator.maxTouchPoints > 0 ){
	touchyMode = true; // primarily this no longer means move events will trigger the arrows, and hover events won't be held accountale either
}else{
	//touchyMode = true; // TESTING ONLY!!! // tbd could force this mode via options...
}

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

var dinObserver = null;

function dni(){
  if(document.body){
    bodyExists=true;
    setApplyStyles();
    //window.removeEventListener('DOMNodeInserted',dni);
    dinObserver.disconnect();
    clearTimeout(timeoutId);
  }
}
if(!document.body){
  //window.addEventListener('DOMNodeInserted',dni);
  dinObserver = new MutationObserver(dni);
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

function hideExtraControls(){
	showExtraControlsLeftTog({}, true);
	showExtraControlsRightTog({}, true);
}

function showExtraControlsLeftTog(ev, forceOff){
	var left_tog = gel('extraLeftToggle');
	if( left_tog.getAttribute('data-showing') || forceOff ){
		hideExtraControlsLeft();
		left_tog.removeAttribute('data-showing');
		Cr.empty(left_tog).appendChild(Cr.txt('more'))
	}else{
		showExtraControlsLeft();
		left_tog.setAttribute('data-showing', 1);
		Cr.empty(left_tog).appendChild(Cr.txt('less'))
	}
}

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

function showExtraControlsRightTog(ev, forceOff){
	var left_tog = gel('extraRightToggle');
	if( left_tog.getAttribute('data-showing') || forceOff ){
		hideExtraControlsRight();
		left_tog.removeAttribute('data-showing');
		Cr.empty(left_tog).appendChild(Cr.txt('more'))
	}else{
		showExtraControlsRight();
		left_tog.setAttribute('data-showing', 1);
		Cr.empty(left_tog).appendChild(Cr.txt('less'))
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
                      //'src':chrome.runtime.getURL('img/arrow_left.png'),
                      // documented trick: use base64 -i <filename>
                      // seriouslyd f*wits, this isnt' even "web" accessible resoruces... its on the local file system!
                      // needless to say I should be able to load an image in the web browser... but whatever... thanks for wasting my time.
                      src: 'data:image/png;base64,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',
                      width:'77',events:[['mouseup',nav_prev],['dragstart',cancelEvent]],
                      style:'float:left;position:relative;cursor:pointer;vertical-align: bottom;'
                   }
      )
    );
  }
  if(touchyMode){
	  leftElm.push(Cr.elm('a', {id:'extraLeftToggle', style:'cursor:pointer;vertical-align:top;color:white;font-family:sans-serif;text-shadow:2px 2px 8px black;position:absolute;bottom:0;left:77px;', events:['click',showExtraControlsLeftTog], childNodes:[Cr.txt('more')]}))
  }


  extraControlsLeft.push(
    Cr.elm('img',{'title':'View Parent Directory',
                    //'src':chrome.runtime.getURL('img/arrow_up.png'),
                    src: 'data:image/png;base64,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',
                    width:'77',events:[['click',nav_up]],
                    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('img',{'title':'Fullscreen',id:'fs_go',
                    //'src':chrome.runtime.getURL('img/fillscreen.png'),
                    src: 'data:image/png;base64,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',
                    width:'77',events:[['click',fs_go]],
                    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('img',{'title':'Toggle Thumbnails',
                    //'src':chrome.runtime.getURL('img/thumbs.png'),
                    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE8AAAA6CAYAAADx2wT0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABThJREFUeNrsW21u4zYQJWnZzroNkDMkKFCk6SH7s+i/ogfoAXqBXmQLtLvoj34AQaIYCOKuLUtkpe0weTsmbUccR9ytBQwoJ9ZYfHzDId9I2jmnjke/o3jOl7XW/xtg9iGVOfKn/3EE76XCdp/I/hgiMjfw9DPP+3ZO9wTJQaulgCwOAJpmpgLn+3Y05HsXkHg9mgqc6xQAJZnHzZDhZw6Ei3R4G3gxIGOg2UirUwEshIEzzEbss94CXowpHDQTARKvsQyshsyy7ww25/GRR8AKaDmICLbbYnYHs3XEVwi0mn67pu82cP9uyDkPWecB62xMxoGMgYdsiYFnWBsDz7OsBuDW5KsGwGxK6EqFrWeVB27S2pTAm8DfkYEqABwC2ECHTCD8TcQXsm1NZgJZ1gVCfhDmedZ1Nlkulz83TWPaLY621r5vvdHWR9N2z8HWz5Vl+dvFxcW3wBx3f3//I14Ta70v397d3f16fn7+TXu6igwWtmrohOFDczydTr/u42i1WnVs+Rwn+NPT0y/7+KrrumqbGQCHzG4CIa+GDttRis+OpdRhnh37gNfdyysAroZQNoFQHjRsMXRTwHsF4DWJvk4IuDXNvxXMu3pI8HQEwEKgw3UqeDQXTsnXOJCwdCqAksKAZtmvL3gT8iHBPFw2GUnWSa/zksEjtowDW7oUX0UEOD30nBdbLKd0eATZrxbQK0VDNXcxVHIgQn7ENMccwYvtb583Av8tlkN+XG7gSXYYt1epygfuc21AtRk0YbjI5j4FvLXEUoX5QhCdFIjFAcKtN3jGGCsMXg1mQWwQYV+RCJY6MPNSB6Jmvqwk+wpB1j0qFQ8PD790i9TOOnUlpqygEtLZzc3N37SFetzblmX5ll8XUla4r9vb279oIBoA0EnOffo5j1uwJwY0bMe8bndCe9Nuc/8Z2QnZlG2TVEB/a5h55o2YFewz+qppADopatnaP2QLapf0vwrA3ZCm9sGlEJzrQtL3mn5jDdKPpQ5rCKMQcAieDRiCh77WYDXzxcNW5ZYwHNPNarY1wqTiADzLJnZesHE7srtj4DVszgsliyyyrduyfOEdNdRqFS8Ncnbw69BCvlwkMTjJxfKhnhjYVcc1bKFuWes7iuXGUGkz5IsXi2JCgM4pbB9vcLFY/OSzrc+4PNvyJUpn19fXv19dXf2ArJrP599TLWQjw27z1Wbut5eXl9+x5BJ6kmFQ8DbKj7PZ7Ks+jtbtAdrbeyaenZ190cdXO2ArBlys+P7J6XkGwjjFl19GjQLsUznNeUZIRpqop0K1FRiIChioJXU9yRqGtJJslJwMHwvbrGoYScyjDo8FB6IAM5Gk8cnNeccaRs8OH2sYmQzEsYaRoA0eaxgJx7GGIeDro6hhJIFH0nklAR6T4dcRAAdjHq9hoLCZ0uGlEnhKipiHinEtHcJSYYviZ7NYLF6jqtIpIqiqoBriVZDuvCzLP9vmHYqh8/n8zTZFJeSrs/a6P9ST5I4CqRj7JGoYvqYwUU91jM5marN+MVabqnKjNtXjbTUM/iwg99UQUFjHeEfmwVyx+XDwGgbWLQyImj6U+TZJBVhrA3OTUvH3OkK+8D4qAKtigGUVtg11pkJZjW52pYZ9Gr5SH1bLghWzIbKt77xmyQLZOPR7GFhNqxlwgzJPRRbHWM3K4Q2ghs1xyQCmLlV0BDwMn9zePRPbaUiFLW6H/A3zUmFubz0Ovj0LhS+Gkd3R6dAAvOT7tlnMeToCQI5veu/7Wy/OvBiIuUleKqewzRmsgx3/CjAAitAps+1X054AAAAASUVORK5CYII=',
                    width:'77',events:[['click',initSingleImageThumbnails]],
                    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;'
                 }
    )
  );
  leftElm.push(extraControlsLeft[extraControlsLeft.length-1]);

  extraControlsLeft.push(
    Cr.elm('img',{'title':'Options',
                    //'src':chrome.runtime.getURL('img/gear.png'),
                    src: 'data:image/png;base64,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',
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
//                      'src':chrome.runtime.getURL('img/'+(zoomedToFit?'zoom_out.png':'zoom_in.png')),
//                      width:'77',events:['click',zoom_in],
//                      style:'cursor:pointer;display:none;'
//                   }
//    );
//    extraControlsLeft.push(localfile_zoombtn);
//    leftElm.push(localfile_zoombtn);
//  }

  var arrowHolder = document.body; //Cr.elm('div',{id:'arrowHolder',style:'position:relative;'},[],document.body);

  var leftEvents = [['mouseover',showExtraControlsLeft],['mouseout',hideExtraControlsLeft]];
  if(touchyMode){leftEvents = []};
  Cr.elm('div',{id:'arrowsleft',style:'position:fixed;opacity:0;transition: opacity 0.5s linear;bottom:0px;left:0px;z-index:2147483600;',class:'localfilesctrls printhidden',events:leftEvents},leftElm,arrowHolder);


  if(showArrows){
    tempElm = Cr.elm('img',{
      title: getNextName(dirCurFile),
      //src:chrome.runtime.getURL('img/arrow_right.png'),
      src: 'data:image/png;base64,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',
      width:'77',events:[['mouseup',nav_next],['dragstart',cancelEvent]],
      style:'float:right;position:relative;cursor:pointer;vertical-align: bottom;',
      class:'printhidden',
      id:'next_file'
    });
    rightElm.push(tempElm);
	  

    if(touchyMode){
      window.addEventListener('click', mmov_toggle);
    }else{
	  window.addEventListener('mousemove', mmov);
    }
  }

  var rightEvents =[['mouseover',showExtraControlsRight],['mouseout',hideExtraControlsRight]];
  if(touchyMode){rightEvents = [];}
  Cr.elm('div',{id:'arrowsright',style:'position:fixed;opacity:0;transition: opacity 0.5s linear;bottom:0px;right:0px;z-index:2147483600;',class:'localfilesctrls printhidden',events:rightEvents},rightElm,arrowHolder);

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
    //src:chrome.runtime.getURL('img/play.png'),
    src: play_png,
    width:'28',events:[['mouseup',auto_play],['dragstart',cancelEvent]],
    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;',
    class:'printhidden',
    id:'ffwd'
  },[],rightFrag);
  extraControlsRight.push(tempElm);

  tempElm = Cr.elm('img',{
    title:"Rotate Left",
    //src:chrome.runtime.getURL('img/r_left.png'),
    src: 'data:image/png;base64,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',
    width:'28',events:[['mouseup',rotate_left],['dragstart',cancelEvent]],
    style:'cursor:pointer;position:relative;display:none;vertical-align: bottom;',
    class:'printhidden',
    id:'edit_mode'
  },[],rightFrag);
  extraControlsRight.push(tempElm);

  tempElm = Cr.elm('img',{
    title:"Rotate Right",
    //src:chrome.runtime.getURL('img/r_right.png'),
    src: 'data:image/png;base64,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',
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
      // src:chrome.runtime.getURL('img/save.png'),
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE8AAAA6CAYAAADx2wT0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAACmNJREFUeNrcXGuIFMkd7+rumb1ZFlb09nQhmnjRL8tyAYUjKuonXygYORPzQt0P+iFLVBDkOCLGQBA8CHm4a471RNAoxAiKHomPi7hrggayEmbdO1YjG5Vz2VUn+5h3P1I1VA3/+VvV3dM9M+el4E/1znT3VP/q939W9RKtshFJD0UHx/C81625XMSxAz7D38G+qkYUwGExAHC65HvVPesNkBdwLgAOCvwcA11VMz1AhaDp/FydfyYDsVEAej2oA3oInM3FAb0OzidhADQVoEHgTH5sgmMdSCMBdD3+VrFNAGdxgUCTKGprKlgH2cYkxsUE4gcgqSGjVOe6CuBcCWjYTrthGefHPKGe5oEDB9qWL1/+zXQ6HctkMrFCoWBQMW3b1qG4rlsalOjxsdQ2EOL6fYbvIb5nva7rLv7bMAxHSF9f30gymZyhXxfRZAq1jQSgKVFXHYK3Y8eONR0dHb/TvoItlUr9kIL3GX8eTaHWWq2YpyHmMZYZ4gvKsBnavmBsEIyYNWvW23TWdc4SRxzXu718+XKU/p4t/masY31ra+s36HHpuXK5XJx2TQA4ocoG73Vg+9yaqy0Eb2JiYqi9vf3n9DDObSAD91QsFmtm3xeLxXw8Hk80Arxly5YdGRkZmUGOwaHm5aPm5uY2dg4dm7DVNrDVNgCO1IN5ZRCZPUP2JwYdiJ9d82v5fD597ty5i8xmcbtVVqUf0EZtV1wakzhOjE+iAIONw4bjsSzLAA7PQvFq5EDfVIBWZh8dJAEDJmAwJgafAlGolnnsmq6urrsoFiup0Pdoo+BpCvDE7yvDDTrxhjA/QJt0CYA1Z17pByB4fFbhQAzkGas2wOCemiR98rpOxJyuCgh+b10ipBbg6T4ZBpGEHnggkA1uDcYRFEDiBwIfL/FJK0Orr+5XGIDMQ4OWqmBI8PA9qwUv6Hm6Qm2J37NVwzy/mZA+GDXQdg0qIU6VybrrYxJ0hRgoVydBCBKkMKD5JN+4MlFqNAPJRATODQmc9BqgttBGGyBHh/GezGR4xn9VgYdSp1cGTJlnRWAeiaDuUqZQkyMDTYQtwlsLMliIDG49mBeGIUGBIyDnDOKldcQsDJ4BAIqBQoEA0EaaRFDa5pn7mloNG9XaXATwBABBwx0dXePi6IDHeTFUUVYVR0X6hmuDbi2ZV49mICbbAZhngPGXWYMyDJGFEB/76krsp2++GxU8N6q3TSQSzbdu3XpPpGYiTSshqkjNUJAMJ8BBGUaMFwYMSS7rShwgBjdQwUBE+eyHWqi8SWU+lcU3b9583+XtyZMn/6CfvUfl+1R+TGUHje0y4vv+/v6/uQ1qx48fvxTl+gsXLvySjv/bVL7FnpPK16iwgkIrlWbOWMMrnHtdHEbDGy9XJTjzLJBb26hcpWRgFPAcSYaRbdTDR63mFItFk2uaxSvNRY6HBeI/Uq9QxcGx39OnT8fu3LnDVJeldToTdtze3j6H2rY3wpbhY7S9RZvftVWCJ5xJkfcFLrLKiyur3oQJkivWPKenp1/Mnj27VAzduXPnjxrBupmZmenJyclclHvwMKaJgwdrlBZgn6N5LIzrIZknKrdWb2/vSTqQQgPV1aG/+UlU5tHIwESgyVYIDQkTy147bG5bzvsOHjw4ODAw8JM9e/YsX7BgwXyhalx1CU+RAtsovAon7sWEevvnJ06cGLp+/Xrq6NGjS2oEXhxIEaRpOMd1EBND27yKlflr1659QeVPiowBunsSMEeVVUAqBJbrQzJYB2wLAp6N07eqwOMrVA64ia1IdXA1Q1XiIZLqta6ogkBxo4LHNQKzT4QsGDiCACzdIoraOnymbDBbFjKsBICneQCoKh1BOxSD945q8xB4IhOxkWrKCsHiGd0ooYoNYiQLiA0ADrJeIF1sR5WPuOQcrYbgNaFxe5mYsvZFBU8AWACBpiUZhN8eFrg3xujo6Gi5dOlSN2VXgoUUbAlR9Oyh2XFbW9vcKOBt2bLl3RUrVrAFcrY1wzZN06JS7tlnhULhOT3n16lUCu+F0aMwT7YDqQhAdJBXJgHKUYJRseHhYfvhw4d3169f/6t6hTyLFy9+m4lXSEQ9+z4KnIlqgeVQJezWCDgLFgKPSR5JTiF5yd9MChs2bPjz/fv3e76s3PfGjRt9u3fv/heKGCpMUFXggQzDRR7W0Sq3cxURmEEFAl7o7Ow8/uzZs+uNBi6ZTP517dq1l1FwDNc03CjMw94Xhi02ciDYoVgSkFVSWLNmzc+mpqaGGwXc2NjYw9WrV3+MzI00RYsKntcmQ699wTKxkRkoeVqquunu7u4DuVzueQNy5v9u3LjxN9TOFRWkqNC2qsBDK/BEku95bfpWiSz7qAD9zJkzYzQd+6CeOTT15MW9e/f2Dg4OTiLtsSXJQAnAMMxTZQJmDcRQlcwPHTr0+dmzZz+sF3g9PT1/OHny5L9R1FBEZqditS0KeHgtNCZJtINIDPQx7dWN42UAt2/f3n/79u0/1sGzfrpv376/S6KEAgDSwqqrBwAKRuV4l5QMtCYub1Qh4hoIqIyF7sqVK88+ePDgbq2AGxkZ+XzTpk0XPEIqFYChmKcjNQ0LGJQEAlKACHfel6u6q1at6h0fHx+NCtyLFy/GaTzZx5cPBFhsy0gWxZ4Fidq+4m1lXlPGRqyucQReokqRMRECWKHCNJzIb9269bfpdHoqLHAUsFxXV9dHjx49SnGQshw4zLqixHH42jyXl35cD7tnIvCiAJhQMDAG1LiswgMDAy/379/fw7xkmGr0kSNHTl2+fPk/iG1ZwDqlugpSmR6pV0lg6aelpeWtixcvrhdVXriPmL33wBJqdgzfj4iyOsZsLOv5ux6lwgAXU8jo6OiDRYsWdVRz7/Pnz185fPjwIGAYZp1wGErgcGHAlSX/kHlsm/7mzZu7ta9wu3fv3j+3bdv2CQIti+yc0sNCrHQv1rELKZsc7f+k0Tz5ybp1604B4LIK4KQOApPM9Ck5OdPT0ylqmIfFGiwUReGgXqtmFbvyZQtEc+fO/brq+mw2O0OdzLGJiYkpCXg5FNt5qavnGgIMQYQjEIZc5gGJR14btRFFqV6XhEzmlStXvkNz0+9KqsYWTb0+PHbs2GcAuDRX2Qyyd0WPhSBXFQQTSRkce9ImSQZAJADWo8Hf0UHIVAFgMpn8aWdn52p44enTpz+m2cmngF1ZAJpgH2ad1M75gYdnFKdPquifqGxDDRnotWBUGu+cOXMSQ0NDv5g3b9477GSa6P9l6dKlfSBnzUvUNo9snS9wqkHpitzV1OQvLEd+GSQCC4kmWaJcsmRJa39//++prR5fuHDhB5lMBi4VQPblJMDZ2quv0Vc1o347yHVFlbUerFMtHKnYV+p37do1//Hjx7mrV69OgnpcEVWsCz7xnFuNOmiSWp3qva3X4T9dEDQ2E004fEXARgAWJCUnTwcRZDZVLNS11+9fhBDJBOPJ1jzWWSy/QDgMeF5Aapr/3pNGAQcLFURiUnTgyGTLpXZY4FQPHxTQL7vhdzeIAjhp8K/J99lUZa//J8AAmxPbm3DC1tYAAAAASUVORK5CYII=',
    })
  ],rightFrag);

  if(touchyMode){
  	Cr.elm('a', {id:'extraRightToggle', style:'cursor:pointer;vertical-align:top;color:white;font-family:sans-serif;text-shadow:2px 2px 8px black;position:absolute;bottom:0;right:77px;', events:['click',showExtraControlsRightTog], childNodes:[Cr.txt('more')]}, rightFrag)
  }

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
      
    window.scroll(0,0);

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
          }, 510); // MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND ??
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
function mmov_toggle(ev){
  // in touchy mode, one click MAY toggle arrows OFF depending on the event...
  clearTimeout(hidTimeout);
  var now_showing=gel('arrowsleft').style.opacity=='1';
  if( ev.target.nodeName==='BODY' ){
	 // !ev.target.closest('.localfilesctrls') ||
	  if(now_showing){
	    hidTimeout=setTimeout(hid,25);
	  }
  }else if(!ev.target.closest('.localfilesctrls')){
	  // clicked image maybe, maybe hide controls soon...
	  hidTimeout=setTimeout(hid,1000);
  }
  gel('arrowsleft').style.opacity="1",
  gel('arrowsright').style.opacity="1";
}
function mmov(){
  gel('arrowsleft').style.opacity="1",
  gel('arrowsright').style.opacity="1";
  clearTimeout(hidTimeout);
  hidTimeout=setTimeout(hid,1000);
}
var hidTimeout=0;
function hid(){
  gel('arrowsleft').style.opacity="0";
  gel('arrowsright').style.opacity="0";
  if(touchyMode){
    hideExtraControls();
  }
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
  chrome.storage.local.get({thumbsize:75},function(obj){
	thumbnailSize = obj.thumbsize || 75;
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
  });
}
var curThumb = 0;
function createSingleThumb(fileIndex,destination,clFn){
  var i = fileIndex;
  if(isValidFile(dirFiles[i].file_name)){
    var c=Cr.elm('canvas',{id:'cicn_'+i,title:dirFiles[i].file_name,'name':dirFiles[i].file_name,width:thumbnailSize,height:thumbnailSize,style:'display:inline-block;cursor:pointer;position:relative;',events:['click',clFn]},[],destination);//transition:box-shadow ease-out 0.1s;
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
    if(obj.forcetouch){
      touchyMode=true;
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
  console.log("localfilebrowser: background page went away!")
  //setTimeout(function(){
  //  window.location.reload();
  //}, 5000)
})


function isViewingDirectory_LoadThumbnails(){
  document.addEventListener('DOMContentLoaded', prepareThumbnailsBrowser);
}

function isViewingImage_LoadStylesheet(){
  document.addEventListener('DOMContentLoaded', injectStyleSheet);
}

function injectStyleSheet(){
  // base64 -i localfiles_print.css
  //Cr.elm('link',{href:chrome.runtime.getURL('localfiles_print.css'),rel:'stylesheet',type:'text/css',media:'print'},[],document.head);
  Cr.elm('link',{href:'data:text/css;base64,LnByaW50aGlkZGVuew0KCWRpc3BsYXk6bm9uZTsNCn0=',rel:'stylesheet',type:'text/css',media:'print'},[],document.head);
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
    ffwd.src=pause_png; //chrome.runtime.getURL("img/pause.png");
    autoplayInterval = setInterval(function(){ // todo: compare with setTimeout removeTimeout
      nav_next();
      pauseAutoPlay();
    },timeout);
    setTimeout(function(){
      window.addEventListener('click', stop_auto_play);
    },5);
    // especially for touchyMode we want the controls to hide soon...
    clearTimeout(hidTimeout);
    hidTimeout=setTimeout(hid,1000);
  }
}
function pause_auto_play(ev){
  if( autoplayInterval ){
    if(ev && ev.target.id == 'fs_go'){return;} // fullscreen button (at least when going fullscreen) should not stop autoplay
    var ffwd = gel("ffwd");
    clearInterval(autoplayInterval);
    autoplayInterval = 0;
    ffwd.src=play_png; //chrome.runtime.getURL("img/play.png");
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
