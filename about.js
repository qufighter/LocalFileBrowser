/*<div id="options">
		fast mode
		let url bar and back buttons break (faster yet, less flicker)
		
		leturlbarbreak,fastmode,bodystyle
	</div>
*/

var _newline_='\u000A';

/* This is where we set the "first view prefs" defaults */
var _optionDefaults = {
	leturlbarbreak:'false',
	cachelisting:'true',
	fastmode:'false',
	bodystyle:'background-color: white;',
	thumbsize:75,
	sorttype:'filename',
	periodicallyRefresh:'false',
	alwaysAutoPlay:'false',
	matchfiles: defaultAllowedExt
};

function gel(l){
	return document.getElementById(l);
}

function parseElementValue(elm){
	//console.log(elm.id, elm.value, elm.getAttribute('valuebinding'), elm[elm.getAttribute('valuebinding')].toString());
	if( elm.getAttribute('valuebinding') ) return elm[elm.getAttribute('valuebinding')].toString().trim();
	if( elm.value ) return elm.value.trim();
}

function setElementValue(elm, value){
	if( elm.getAttribute('valuebinding') ) return elm[elm.getAttribute('valuebinding')] = (value == 'false' ? false : value);
	elm.value = value;
}

function saveSettings(){
	chrome.storage.local.set({
		//leturlbarbreak:parseElementValue(gel('leturlbarbreak')),
		fastmode:parseElementValue(gel('fastmode')),
		cachelisting:parseElementValue(gel('cachelisting')),
		matchfiles:parseElementValue(gel('matchfiles')),
		sorttype:parseElementValue(gel('sorttype')),
		bodystyle:parseElementValue(gel('bodystyle')),
		thumbsize:parseElementValue(gel('thumbsize')),
		periodicallyRefresh:parseElementValue(gel('periodicallyRefresh')),
		alwaysAutoPlay:parseElementValue(gel('alwaysAutoPlay')),
		fetching:'0'
	},function(){
		chrome.runtime.sendMessage({reloadPrefs:true}, function(response){});
	});
}

function applyDependsTrue(ev){
	var elm=ev.target;
	myVal=parseElementValue(elm);
	if(myVal=='true'){
		gel(elm.getAttribute('dependstrue')).style.display='block';
	}else{
		gel(elm.getAttribute('dependstrue')).style.display='none';
	}
}

function getSortTypeOptions(curVal){
	var sortTypes=[
		{type: "filename", name: "Filename A-Z (fastest, default)"},
		{type: "filename_reverse", name: "Filename Z-A"},
		{type: "date_desc", name: "Date Modified From Newest"},
		{type: "date_asc", name: "Date Modified From Oldest"},
		{type: "filename_numeric", name: "Filename First Number"},
		{type: "filename_numeric_reverse", name: "Filename First Number (Reverse)"},
		{type: "random", name: "Random order"},
	];
	var rsorts=[];
	for( var i=0,l=sortTypes.length; i<l; i++ ){
		rsorts.push(Cr.elm('option',{value: sortTypes[i].type, selected: curVal==sortTypes[i].type?'selected':''},[Cr.txt(sortTypes[i].name)]));
	}
	return rsorts;
}

function clickedLink(ev){
	var targ = ev.target;
	while( targ && targ.nodeName != 'A' ){
		targ=targ.parentNode;
	}
	if( targ ){
		chrome.tabs.create({
			url: targ.href,
			active: true
		}, function(t){})
	}
}

function showDefaults(){
	if( confirm("If you press OK Default options will be displayed.\n\nOnce viewing default options:\n - Save to restore defaults.\n - Reload the page to cancel.") ){
		var options = gel('options'), found, opt;
		for( opt in _optionDefaults ){
			found = options.querySelector('input#'+opt+',select#'+opt);
			if( found ) setElementValue(found, _optionDefaults[opt]);
		}
	}
}

function arrayEach(t, fn){
	for(i=0,il=t.length;i<t.length;i++){
		fn(t[i]);
	}
}

function hideElement(e){e.style.display='none';}

function begin(){

	if( isMac ){
		var cmdKeys = document.getElementsByClassName('sys-cmd-key');
		for( var i=0,l=cmdKeys.length; i<l; i++ ){
			cmdKeys[i].innerText='\u2318';
		}
	}

	chrome.storage.local.get(_optionDefaults,function(stor){
		stor.matchfiles = addSupportedExtensions(stor.matchfiles);

		Cr.elm('div',{class:'label_rows'},[
			Cr.elm('label',{title:'If we match any non image files, we drop out of fast mode, and any sideshow in progress is halted.'},[
				Cr.elm('input',{type:'checkbox',id:'fastmode',checked:(stor.fastmode=='true'?'checked':''),valuebinding:'checked',/*dependstrue:'opt_leturlbarbreak',event:['click',applyDependsTrue]*/}),
				Cr.txt(' "Fast" Mode'),
				Cr.elm('span',{class:'monohelp'},[Cr.txt(' (Less flicker, incorrect URL bar, images only)')])
			]),
			Cr.elm('label',{title:'Faster when not using fast mode, first navigating to an image from folder view, or large static folder selected.'+_newline_+'Change directory to update cache, restart chrome or reload extension to clear cache.'},[
				Cr.elm('input',{type:'checkbox',id:'cachelisting',checked:(stor.cachelisting=='true'?'checked':''),valuebinding:'checked'}),
				Cr.txt(' Cache current directory list'),
				Cr.elm('span',{class:'monohelp'},[
					Cr.txt(' (faster  / actually works'),
					Cr.elm('a',{href:'#note2',class:'noline'},[Cr.txt(' ***')]),
					Cr.txt(')')
				]),
			]),
//			Cr.elm('label',{id:'opt_leturlbarbreak',style:'margin-left:15px;display:'+(stor.fastmode=='true'?'block':'none')+';',title:'history.pushState does not work on file:// url because the function that determines the origin doesn\'t work on file URLs.'},[
//				Cr.elm('input',{type:'checkbox',id:'leturlbarbreak',checked:(stor.leturlbarbreak=='true'?'checked':''),valuebinding:'checked'}),
//				Cr.txt(' Let url bar and back buttons break (faster yet, less flicker, broken URL bar)')
//			]),
			Cr.elm('label',{},[
				Cr.elm('span',{class:'labeltxt'},[Cr.txt('Body CSS')]),
				Cr.elm('input',{type:'text',id:'bodystyle',value:stor.bodystyle,valuebinding:'value'}),
				Cr.elm('span',{class:'monohelp'},[
					Cr.txt(' '+ _optionDefaults.bodystyle+' or pick a different '),
					Cr.elm('a',{href:'https://developer.mozilla.org/en-US/docs/Web/CSS/color_value',target:'_blank'},[
						Cr.txt('css color value')
					])
				])
			]),
			Cr.elm('label',{},[
				Cr.elm('span',{class:'labeltxt'},[
					Cr.txt('Match Files'),
					Cr.elm('a',{href:'#note1',class:'noline'},[Cr.txt(' ** ')])
				]),
				Cr.elm('input',{type:'text',id:'matchfiles',value:stor.matchfiles,valuebinding:'value'}),
				Cr.elm('span',{class:'monohelp'},[Cr.txt(/*' '+ _optionDefaults.matchfiles + */' works like /('+ _optionDefaults.matchfiles +')$/i' )])
			]),
			Cr.elm('label',{},[
				Cr.elm('span',{class:'labeltxt'},[Cr.txt('Sort')]),
				Cr.elm('select',{type:'text',id:'sorttype',valuebinding:'value'},getSortTypeOptions(stor.sorttype)),
				Cr.elm('span',{class:'monohelp'},[Cr.txt(' save then refresh page or change directory')])
			]),
			Cr.elm('label',{},[
				Cr.elm('span',{class:'labeltxt'},[Cr.txt('Thumbnail Size')]),
				Cr.elm('input',{type:'number',step:5,min:10,max:500,id:'thumbsize',value:stor.thumbsize,valuebinding:'value'}),
				Cr.elm('span',{class:'monohelp'},[Cr.txt(' Enter an integer size value, default 75')])
			]),

			Cr.elm('strong',{
				childNodes:[
					Cr.txt('Kiosk Features'),
				]
			}),

			Cr.elm('label',{title:'Useful for Kiosk where files may be added any time, bad for large directories as this pauses the show temporarily.'},[
				Cr.elm('input',{type:'checkbox',id:'periodicallyRefresh',checked:(stor.periodicallyRefresh=='true'?'checked':''),valuebinding:'checked'}),
				Cr.txt(' Periodically Refresh Directory'),
				Cr.elm('span',{class:'monohelp'},[Cr.txt(' (every 2-3 times through slideshow)')])
			]),

			Cr.elm('label',{title:'Useful for Kiosk after extension updates, or in general if you alawys like a slideshow.  Should use your last manually triggered slideshow velocity setting (as long as it was not a super fast one).'},[
				Cr.elm('input',{type:'checkbox',id:'alwaysAutoPlay',checked:(stor.alwaysAutoPlay=='true'?'checked':''),valuebinding:'checked'}),
				Cr.txt(' Automatic Slideshow'),
				Cr.elm('span',{class:'monohelp'},[
					Cr.txt(' ('),
					Cr.elm('span',{class:'key'},[Cr.txt(' enter')]),
					Cr.txt(' slideshow always)')

				])
			]),

			Cr.elm('div',{style:'padding-top:10px;'},[
				Cr.elm('span',{class:'labeltxt'},[]),
				Cr.elm('input',{type:'button',value:'Save',event:['click',saveSettings]}),
				Cr.elm('input',{type:'button',value:'Reset',event:['click',showDefaults]}),
			]),
		],gel('options'));
		
	});

	document.getElementById('chrome-extensions').addEventListener('click', clickedLink);
	document.getElementById('setup_help').addEventListener('click', clickedLink);

	chrome.extension.isAllowedFileSchemeAccess(function(isAllowed){
		chrome.extension.isAllowedIncognitoAccess(function(isAllowedIncognito){
			var statusDest = document.getElementById('setup_status');
			if( isAllowed || isFirefox ){
				arrayEach(document.querySelectorAll('.setup_help'), hideElement);
				if( isAllowedIncognito  ){
					Cr.elm('div',{style:'color:green;'},[Cr.txt('\u2713 Setup Complete!')], statusDest);
				}else{
					Cr.elm('div',{},[
						Cr.elm('div',{style:'color:green;'},[Cr.txt('\u2713 File Access Setup Complete!.')]),
						//Cr.elm('div',{style:'color:green;'},[Cr.txt('\u2717 Not allowed incognito.')])
					], statusDest);
				}
			}else{
				Cr.elm('div',{style:'color:red;'},[Cr.txt('\u2717 Setup Incomplete!')], statusDest);
			}
			document.body.style.opacity="1";
		});
	});

	createAndAttachRatings(document.getElementById('ratings-container'));

	if(!isChrome)document.querySelectorAll('.chrome-only').forEach(function(e){e.style.display='none'});
}

document.addEventListener('DOMContentLoaded',begin);
