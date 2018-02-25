var reqInProg = 0, http, lsnaptabid = 0;

chrome.extension.isAllowedFileSchemeAccess(function(wasAllowedAtBoot){
  if( !wasAllowedAtBoot ){
    // until extension is allowed, navigating to image files will open options to indicate how to enable file browser
    chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
      if (details.frameId === 0) { /*.tabId .url*/
        chrome.extension.isAllowedFileSchemeAccess(function(hasAccess){
          if( !hasAccess && !isFirefox ) goToOrOpenOptions(function(){});
        });
      }
    },{
      url: [
        {urlPrefix: 'file://', pathSuffix: '.png'},
        {urlPrefix: 'file://', pathSuffix: '.jpg'},
        {urlPrefix: 'file://', pathSuffix: '.gif'},
        {urlPrefix: 'file://', pathSuffix: '.PNG'},
        {urlPrefix: 'file://', pathSuffix: '.JPG'},
        {urlPrefix: 'file://', pathSuffix: '.GIF'}
      ]
    });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(request.respond || request.fetch && !reqInProg){
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
          if (http.readyState == 4 ) {
            console.log('http status', http.status);
            http.onreadystatechange=null;
            reqInProg=0;
            chrome.storage.local.get({'fetching':'0'}, function(obj){
              if( obj.fetching == sentDirectoryURL ){
                chrome.storage.local.set({'fetching':'0'}, function(){});
                processFileRows(sentDirectoryURL, sentStartFileName, http.responseText, true, function(resultObj){
                  if( request.respond ){
                    chrome.tabs.sendMessage(sender.tab.id, resultObj, function(){
                      if( resultObj.dir_current > -1 ){
                        chrome.pageAction.setIcon({
                          tabId: sender.tab.id,
                          path: {"19": "img/icon19.png", "38": "img/icon38.png"}
                        });
                      }
                      chrome.pageAction.show(sender.tab.id);
                    });
                  }
                });
              }else{
                // this is not workign well for multiple simultaneous requests since one arbatrary one of them is always prioritized
                // processFileRows(sentDirectoryURL, sentStartFileName, http.responseText, false, function(resultObj){
                //   if( request.respond ){
                //     chrome.tabs.sendMessage(sender.tab.id, resultObj, function(){});
                //   }
                // });
                // some observed issues:
                //   1) 2 windows open looking at files, one looking at directory, somehow reloadPrefs is triggered and a LOT more requests created (possibly resolved)
                //   2) one of the direcotries will stop owrking, and start browing the other one, need to inspect further what gets returned
                console.log('loaded a directory list that is not current');//, we processed teh rows and returned them but did not store them.');
              }
            });
          }
        };
        http.send(null);
        reqInProg=1;
        chrome.storage.local.set({'fetching':sentDirectoryURL}, function(){});
      }
    });
  }else if(request.goToOrOpenOptions){
    goToOrOpenOptions(function(){});
  }else if(request.reloadPrefs){
    loadPrefs(function(){
      chrome.storage.local.set({'dir_url':'','fetching':'0'}, function(){ // Force Cache Refresh
        chrome.tabs.query({}, function(tabs) {
            var message = {reloadPrefs: 1};
            for (var i=0,l=tabs.length; i<l; i++) {
              chrome.tabs.sendMessage(tabs[i].id, message);
            }
        });
      });
    });
  }
  sendResponse({}); // sent response cannot be very delayed, get it out of the way
});

// on boot in case we were mid load during shutdown, reset fetch state, and why not zero everything in case something went wrong
chrome.storage.local.set({'fetching':'0','dir_url':'','dir_cache':'[]','dir_current':'','dir_cur_name':''}, function(){
  loadPrefs(function(){
    // loadCache(); /* why load cache if we just cleared it? */
  });
});
