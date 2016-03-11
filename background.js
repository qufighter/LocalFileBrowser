var reqInProg = 0, http, lsnaptabid = 0;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if( request.captureImageModification ){ // sounds ominous, used for save where canvas is "tained" by local file system after rotate, so we resort to chrome captureVisibleTab API to gain the rotated image piece by piece
    lsnaptabid=sender.tab.id;
    chrome.tabs.captureVisibleTab(null, {format:'png'}, function(a){
      chrome.tabs.sendMessage(lsnaptabid, {imageCaptured:true,imageDataUrl:a}, function(response) {});
    });
  }else if(request.respond || request.fetch && !reqInProg){
    var sentStartFileName = request.startFile;
    var sentDirectoryURL = request.fetch;
    chrome.storage.local.get({'fetching':'0'}, function(obja){
      if( obja.fetching == sentDirectoryURL ){
        // we really should not request again if we already are in progress with correct request, even after page refresh....
        // guess we wait, we are already (supposedly?  fetching that URL, sound like it might be suspect though...., may never complete)
        // generally so many requests can be sent they never complete and can "crash" the file browser if we don't block here though

        // when background "worker" restarts we do reset this, so its a need to rate limit, or simply assume the fetch never fails
        // as we do if we do nothing here
        console.log('received request for '+sentDirectoryURL+' believed to already be in progress, ignored.');
      }else{
        http = new XMLHttpRequest();
        http.open("GET", sentDirectoryURL);
        http.onreadystatechange=function(){
          if (http.readyState == 4) {
            http.onreadystatechange=null;
            reqInProg=0;
            chrome.storage.local.get({'fetching':'0'}, function(obj){
              if( obj.fetching == sentDirectoryURL ){
                chrome.storage.local.set({'fetching':'0'}, function(){});
                processFileRows(sentDirectoryURL, sentStartFileName, http.responseText, function(resultObj){
                  if( request.respond ){
                    chrome.tabs.sendMessage(sender.tab.id, resultObj, function(){});
                  }
                });
              }else{
                console.log('loaded a directory list that is not current, skipping.');
              }
            });
          }
        };
        http.send(null);
        reqInProg=1;
        chrome.storage.local.set({'fetching':sentDirectoryURL}, function(){});
      }
    });
  }else if(request.reloadPrefs){
    loadPrefs();
    chrome.storage.local.set({'dir_url':'','fetching':'0'}, function(){}); // Force Cache Refresh
  }
  sendResponse({}); // sent response cannot be very delayed, get it out of the way
});

// on boot in case we were mid load during shutdown, reset fetch state, and why not zero everything in case something went wrong
chrome.storage.local.set({'fetching':'0','dir_url':'','dir_cache':'[]','dir_current':'','dir_cur_name':''}, function(){
  loadPrefs(function(){
    // loadCache(); /* why load cache if we just cleared it? */
  });
});
