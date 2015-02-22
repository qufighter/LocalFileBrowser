/*<div id="options">
		fast mode
		let url bar and back buttons break (faster yet, less flicker)
		
		leturlbarbreak,fastmode,bodystyle
	</div>
*/
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
		bodystyle:parseElementValue(gel('bodystyle'))
	},function(){});
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

function begin(){
	chrome.storage.local.get({leturlbarbreak:'false',fastmode:'false',bodystyle:'',matchfiles:'.JPG|.GIF|.PNG|.JPEG'},function(stor){
		
		Cr.elm('div',{class:'label_rows'},[
			Cr.elm('label',{},[
				Cr.elm('input',{type:'checkbox',id:'fastmode',checked:(stor.fastmode=='true'?'checked':''),valuebinding:'checked',/*dependstrue:'opt_leturlbarbreak',event:['click',applyDependsTrue]*/}),
				Cr.txt(' "Fast" Mode (Less flicker, incorrect URL bar)')
			]),
//			Cr.elm('label',{id:'opt_leturlbarbreak',style:'margin-left:15px;display:'+(stor.fastmode=='true'?'block':'none')+';',title:'history.pushState does not work on file:// url because the function that determines the origin doesn\'t work on file URLs.'},[
//				Cr.elm('input',{type:'checkbox',id:'leturlbarbreak',checked:(stor.leturlbarbreak=='true'?'checked':''),valuebinding:'checked'}),
//				Cr.txt(' Let url bar and back buttons break (faster yet, less flicker, broken URL bar)')
//			]),
			Cr.elm('label',{},[
				Cr.txt('Body CSS '),
				Cr.elm('input',{type:'text',id:'bodystyle',value:stor.bodystyle,valuebinding:'value'}),
				Cr.elm('span',{class:'monohelp'},[Cr.txt(' background-color:white;')])
			]),
			Cr.elm('label',{},[
				Cr.txt('Match Files'),
				Cr.elm('a',{href:'#note1',class:'noline'},[Cr.txt(' ** ')]),
				Cr.elm('input',{type:'text',id:'matchfiles',value:stor.matchfiles,valuebinding:'value'}),
				Cr.elm('span',{class:'monohelp'},[Cr.txt(' .JPG|.GIF|.PNG|.JPEG')])
			]),
			Cr.elm('input',{type:'button',value:'Save',event:['click',saveSettings]})
		],gel('options'));
		
	});
}

document.addEventListener('DOMContentLoaded',begin);