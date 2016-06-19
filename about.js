/*<div id="options">
		fast mode
		let url bar and back buttons break (faster yet, less flicker)
		
		leturlbarbreak,fastmode,bodystyle
	</div>
*/

/* This is where we set the "first view prefs" defaults */
var _optionDefaults = {
	leturlbarbreak:'false',
	fastmode:'false',
	bodystyle:'background-color: white;',
	sorttype:'filename',
	matchfiles:'.JPG|.GIF|.PNG|.JPEG'
};

function gel(l){
	return document.getElementById(l);
}

function parseElementValue(elm){
	//console.log(elm.id, elm.value, elm.getAttribute('valuebinding'), elm[elm.getAttribute('valuebinding')].toString());
	if( elm.getAttribute('valuebinding') ) return elm[elm.getAttribute('valuebinding')].toString().trim();
	if( elm.value ) return elm.value.trim();
}

function saveSettings(){
	chrome.storage.local.set({
		//leturlbarbreak:parseElementValue(gel('leturlbarbreak')),
		fastmode:parseElementValue(gel('fastmode')),
		matchfiles:parseElementValue(gel('matchfiles')),
		sorttype:parseElementValue(gel('sorttype')),
		bodystyle:parseElementValue(gel('bodystyle')),
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
		{type: "random", name: "Random order"},
	];
	var sorts=[];
	for( var i=0,l=sortTypes.length; i<l; i++ ){
		sorts.push(Cr.elm('option',{value: sortTypes[i].type, selected: curVal==sortTypes[i].type?'selected':''},[Cr.txt(sortTypes[i].name)]));
	}
	return sorts;
}

function clickedLink(ev){
	chrome.tabs.create({
		url: ev.target.href,
		active: true
	}, function(t){})
}

function showDefaults(){
	var options = gel('options'), found, opt;
	for( opt in _optionDefaults ){
		found = options.querySelector('input#'+opt+',select#'+opt);
		if( found ) found.value = _optionDefaults[opt];
	}
}

function begin(){
	chrome.storage.local.get(_optionDefaults,function(stor){

		Cr.elm('div',{class:'label_rows'},[
			Cr.elm('label',{},[
				Cr.elm('input',{type:'checkbox',id:'fastmode',checked:(stor.fastmode=='true'?'checked':''),valuebinding:'checked',/*dependstrue:'opt_leturlbarbreak',event:['click',applyDependsTrue]*/}),
				Cr.txt(' "Fast" Mode (Less flicker, incorrect URL bar, images only)')
			]),
//			Cr.elm('label',{id:'opt_leturlbarbreak',style:'margin-left:15px;display:'+(stor.fastmode=='true'?'block':'none')+';',title:'history.pushState does not work on file:// url because the function that determines the origin doesn\'t work on file URLs.'},[
//				Cr.elm('input',{type:'checkbox',id:'leturlbarbreak',checked:(stor.leturlbarbreak=='true'?'checked':''),valuebinding:'checked'}),
//				Cr.txt(' Let url bar and back buttons break (faster yet, less flicker, broken URL bar)')
//			]),
			Cr.elm('label',{},[
				Cr.elm('span',{class:'labeltxt'},[Cr.txt('Body CSS')]),
				Cr.elm('input',{type:'text',id:'bodystyle',value:stor.bodystyle,valuebinding:'value'}),
				Cr.elm('span',{class:'monohelp'},[Cr.txt(' '+ _optionDefaults.bodystyle+' or pick a different css color value')])
			]),
			Cr.elm('label',{},[
				Cr.elm('span',{class:'labeltxt'},[
					Cr.txt('Match Files'),
					Cr.elm('a',{href:'#note1',class:'noline'},[Cr.txt(' ** ')])
				]),
				Cr.elm('input',{type:'text',id:'matchfiles',value:stor.matchfiles,valuebinding:'value'}),
				Cr.elm('span',{class:'monohelp'},[Cr.txt(' '+ _optionDefaults.matchfiles)])
			]),
			Cr.elm('label',{},[
				Cr.elm('span',{class:'labeltxt'},[Cr.txt('Sort')]),
				Cr.elm('select',{type:'text',id:'sorttype',valuebinding:'value'},getSortTypeOptions(stor.sorttype)),
				Cr.elm('span',{class:'monohelp'},[Cr.txt(' save then refresh page or change directory')])
			]),
			Cr.elm('input',{type:'button',value:'\uD83D\uDCBE Save',event:['click',saveSettings]}),
			Cr.elm('input',{type:'button',value:'Show Defaults',event:['click',showDefaults]}),
		],gel('options'));
		
	});

	document.getElementById('chrome-extensions').addEventListener('click', clickedLink);
}

document.addEventListener('DOMContentLoaded',begin);