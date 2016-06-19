function popupCompletedCallback(w){
  window.close();
}

function goToOrOpenOptions(){
  var optionsUrl = "about.html"; // typically "options.html"
  chrome.tabs.query({
    url: chrome.extension.getURL(optionsUrl)
  }, function(tabs){
    if( tabs.length > 0 ){
      chrome.tabs.highlight({tabs:[tabs[0].index]}, popupCompletedCallback)
    }else{
      chrome.tabs.create({
        url: chrome.extension.getURL(optionsUrl),
        active: true
      }, function(t){
        chrome.tabs.highlight({tabs:[t.index]}, popupCompletedCallback)
      });
    }
  });
}

goToOrOpenOptions();
