/*! highlight.js v9.18.0 | BSD3 License | git.io/hljslicense */
!function(e){var n="object"==typeof window&&window||"object"==typeof self&&self;"undefined"==typeof exports||exports.nodeType?n&&(n.hljs=e({}),"function"==typeof define&&define.amd&&define([],function(){return n.hljs})):e(exports)}(function(a){var f=[],o=Object.keys,_={},g={},C=!0,n=/^(no-?highlight|plain|text)$/i,E=/\blang(?:uage)?-([\w-]+)\b/i,t=/((^(<[^>]+>|\t|)+|(?:\n)))/gm,r={case_insensitive:"cI",lexemes:"l",contains:"c",keywords:"k",subLanguage:"sL",className:"cN",begin:"b",beginKeywords:"bK",end:"e",endsWithParent:"eW",illegal:"i",excludeBegin:"eB",excludeEnd:"eE",returnBegin:"rB",returnEnd:"rE",variants:"v",IDENT_RE:"IR",UNDERSCORE_IDENT_RE:"UIR",NUMBER_RE:"NR",C_NUMBER_RE:"CNR",BINARY_NUMBER_RE:"BNR",RE_STARTERS_RE:"RSR",BACKSLASH_ESCAPE:"BE",APOS_STRING_MODE:"ASM",QUOTE_STRING_MODE:"QSM",PHRASAL_WORDS_MODE:"PWM",C_LINE_COMMENT_MODE:"CLCM",C_BLOCK_COMMENT_MODE:"CBCM",HASH_COMMENT_MODE:"HCM",NUMBER_MODE:"NM",C_NUMBER_MODE:"CNM",BINARY_NUMBER_MODE:"BNM",CSS_NUMBER_MODE:"CSSNM",REGEXP_MODE:"RM",TITLE_MODE:"TM",UNDERSCORE_TITLE_MODE:"UTM",COMMENT:"C",beginRe:"bR",endRe:"eR",illegalRe:"iR",lexemesRe:"lR",terminators:"t",terminator_end:"tE"},m="</span>",O="Could not find the language '{}', did you forget to load/include a language module?",B={classPrefix:"hljs-",tabReplace:null,useBR:!1,languages:void 0},c="of and for in not or if then".split(" ");function x(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function d(e){return e.nodeName.toLowerCase()}function R(e){return n.test(e)}function i(e){var n,t={},r=Array.prototype.slice.call(arguments,1);for(n in e)t[n]=e[n];return r.forEach(function(e){for(n in e)t[n]=e[n]}),t}function p(e){var a=[];return function e(n,t){for(var r=n.firstChild;r;r=r.nextSibling)3===r.nodeType?t+=r.nodeValue.length:1===r.nodeType&&(a.push({event:"start",offset:t,node:r}),t=e(r,t),d(r).match(/br|hr|img|input/)||a.push({event:"stop",offset:t,node:r}));return t}(e,0),a}function v(e,n,t){var r=0,a="",i=[];function o(){return e.length&&n.length?e[0].offset!==n[0].offset?e[0].offset<n[0].offset?e:n:"start"===n[0].event?e:n:e.length?e:n}function c(e){a+="<"+d(e)+f.map.call(e.attributes,function(e){return" "+e.nodeName+'="'+x(e.value).replace(/"/g,"&quot;")+'"'}).join("")+">"}function l(e){a+="</"+d(e)+">"}function u(e){("start"===e.event?c:l)(e.node)}for(;e.length||n.length;){var s=o();if(a+=x(t.substring(r,s[0].offset)),r=s[0].offset,s===e){for(i.reverse().forEach(l);u(s.splice(0,1)[0]),(s=o())===e&&s.length&&s[0].offset===r;);i.reverse().forEach(c)}else"start"===s[0].event?i.push(s[0].node):i.pop(),u(s.splice(0,1)[0])}return a+x(t.substr(r))}function l(n){return n.v&&!n.cached_variants&&(n.cached_variants=n.v.map(function(e){return i(n,{v:null},e)})),n.cached_variants?n.cached_variants:function e(n){return!!n&&(n.eW||e(n.starts))}(n)?[i(n,{starts:n.starts?i(n.starts):null})]:Object.isFrozen(n)?[i(n)]:[n]}function u(e){if(r&&!e.langApiRestored){for(var n in e.langApiRestored=!0,r)e[n]&&(e[r[n]]=e[n]);(e.c||[]).concat(e.v||[]).forEach(u)}}function M(n,t){var i={};return"string"==typeof n?r("keyword",n):o(n).forEach(function(e){r(e,n[e])}),i;function r(a,e){t&&(e=e.toLowerCase()),e.split(" ").forEach(function(e){var n,t,r=e.split("|");i[r[0]]=[a,(n=r[0],(t=r[1])?Number(t):function(e){return-1!=c.indexOf(e.toLowerCase())}(n)?0:1)]})}}function S(r){function s(e){return e&&e.source||e}function f(e,n){return new RegExp(s(e),"m"+(r.cI?"i":"")+(n?"g":""))}function a(a){var i,e,o={},c=[],l={},t=1;function n(e,n){o[t]=e,c.push([e,n]),t+=new RegExp(n.toString()+"|").exec("").length-1+1}for(var r=0;r<a.c.length;r++){n(e=a.c[r],e.bK?"\\.?(?:"+e.b+")\\.?":e.b)}a.tE&&n("end",a.tE),a.i&&n("illegal",a.i);var u=c.map(function(e){return e[1]});return i=f(function(e,n){for(var t=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./,r=0,a="",i=0;i<e.length;i++){var o=r+=1,c=s(e[i]);for(0<i&&(a+=n),a+="(";0<c.length;){var l=t.exec(c);if(null==l){a+=c;break}a+=c.substring(0,l.index),c=c.substring(l.index+l[0].length),"\\"==l[0][0]&&l[1]?a+="\\"+String(Number(l[1])+o):(a+=l[0],"("==l[0]&&r++)}a+=")"}return a}(u,"|"),!0),l.lastIndex=0,l.exec=function(e){var n;if(0===c.length)return null;i.lastIndex=l.lastIndex;var t=i.exec(e);if(!t)return null;for(var r=0;r<t.length;r++)if(null!=t[r]&&null!=o[""+r]){n=o[""+r];break}return"string"==typeof n?(t.type=n,t.extra=[a.i,a.tE]):(t.type="begin",t.rule=n),t},l}if(r.c&&-1!=r.c.indexOf("self")){if(!C)throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");r.c=r.c.filter(function(e){return"self"!=e})}!function n(t,e){t.compiled||(t.compiled=!0,t.k=t.k||t.bK,t.k&&(t.k=M(t.k,r.cI)),t.lR=f(t.l||/\w+/,!0),e&&(t.bK&&(t.b="\\b("+t.bK.split(" ").join("|")+")\\b"),t.b||(t.b=/\B|\b/),t.bR=f(t.b),t.endSameAsBegin&&(t.e=t.b),t.e||t.eW||(t.e=/\B|\b/),t.e&&(t.eR=f(t.e)),t.tE=s(t.e)||"",t.eW&&e.tE&&(t.tE+=(t.e?"|":"")+e.tE)),t.i&&(t.iR=f(t.i)),null==t.relevance&&(t.relevance=1),t.c||(t.c=[]),t.c=Array.prototype.concat.apply([],t.c.map(function(e){return l("self"===e?t:e)})),t.c.forEach(function(e){n(e,t)}),t.starts&&n(t.starts,e),t.t=a(t))}(r)}function T(n,e,a,t){var i=e;function c(e,n,t,r){if(!t&&""===n)return"";if(!e)return n;var a='<span class="'+(r?"":B.classPrefix);return(a+=e+'">')+n+(t?"":m)}function o(){p+=(null!=d.sL?function(){var e="string"==typeof d.sL;if(e&&!_[d.sL])return x(v);var n=e?T(d.sL,v,!0,R[d.sL]):w(v,d.sL.length?d.sL:void 0);return 0<d.relevance&&(M+=n.relevance),e&&(R[d.sL]=n.top),c(n.language,n.value,!1,!0)}:function(){var e,n,t,r,a,i,o;if(!d.k)return x(v);for(r="",n=0,d.lR.lastIndex=0,t=d.lR.exec(v);t;)r+=x(v.substring(n,t.index)),a=d,i=t,o=g.cI?i[0].toLowerCase():i[0],(e=a.k.hasOwnProperty(o)&&a.k[o])?(M+=e[1],r+=c(e[0],x(t[0]))):r+=x(t[0]),n=d.lR.lastIndex,t=d.lR.exec(v);return r+x(v.substr(n))})(),v=""}function l(e){p+=e.cN?c(e.cN,"",!0):"",d=Object.create(e,{parent:{value:d}})}function u(e){var n=e[0],t=e.rule;return t&&t.endSameAsBegin&&(t.eR=new RegExp(n.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&"),"m")),t.skip?v+=n:(t.eB&&(v+=n),o(),t.rB||t.eB||(v=n)),l(t),t.rB?0:n.length}function s(e){var n=e[0],t=i.substr(e.index),r=function e(n,t){if(r=n.eR,a=t,(i=r&&r.exec(a))&&0===i.index){for(;n.endsParent&&n.parent;)n=n.parent;return n}var r,a,i;if(n.eW)return e(n.parent,t)}(d,t);if(r){var a=d;for(a.skip?v+=n:(a.rE||a.eE||(v+=n),o(),a.eE&&(v=n));d.cN&&(p+=m),d.skip||d.sL||(M+=d.relevance),(d=d.parent)!==r.parent;);return r.starts&&(r.endSameAsBegin&&(r.starts.eR=r.eR),l(r.starts)),a.rE?0:n.length}}var f={};function r(e,n){var t=n&&n[0];if(v+=e,null==t)return o(),0;if("begin"==f.type&&"end"==n.type&&f.index==n.index&&""===t)return v+=i.slice(n.index,n.index+1),1;if("begin"===(f=n).type)return u(n);if("illegal"===n.type&&!a)throw new Error('Illegal lexeme "'+t+'" for mode "'+(d.cN||"<unnamed>")+'"');if("end"===n.type){var r=s(n);if(null!=r)return r}return v+=t,t.length}var g=D(n);if(!g)throw console.error(O.replace("{}",n)),new Error('Unknown language: "'+n+'"');S(g);var E,d=t||g,R={},p="";for(E=d;E!==g;E=E.parent)E.cN&&(p=c(E.cN,"",!0)+p);var v="",M=0;try{for(var b,h,N=0;d.t.lastIndex=N,b=d.t.exec(i);)h=r(i.substring(N,b.index),b),N=b.index+h;for(r(i.substr(N)),E=d;E.parent;E=E.parent)E.cN&&(p+=m);return{relevance:M,value:p,i:!1,language:n,top:d}}catch(e){if(e.message&&-1!==e.message.indexOf("Illegal"))return{i:!0,relevance:0,value:x(i)};if(C)return{relevance:0,value:x(i),language:n,top:d,errorRaised:e};throw e}}function w(t,e){e=e||B.languages||o(_);var r={relevance:0,value:x(t)},a=r;return e.filter(D).filter(L).forEach(function(e){var n=T(e,t,!1);n.language=e,n.relevance>a.relevance&&(a=n),n.relevance>r.relevance&&(a=r,r=n)}),a.language&&(r.second_best=a),r}function b(e){return B.tabReplace||B.useBR?e.replace(t,function(e,n){return B.useBR&&"\n"===e?"<br>":B.tabReplace?n.replace(/\t/g,B.tabReplace):""}):e}function s(e){var n,t,r,a,i,o,c,l,u,s,f=function(e){var n,t,r,a,i=e.className+" ";if(i+=e.parentNode?e.parentNode.className:"",t=E.exec(i)){var o=D(t[1]);return o||(console.warn(O.replace("{}",t[1])),console.warn("Falling back to no-highlight mode for this block.",e)),o?t[1]:"no-highlight"}for(n=0,r=(i=i.split(/\s+/)).length;n<r;n++)if(R(a=i[n])||D(a))return a}(e);R(f)||(B.useBR?(n=document.createElement("div")).innerHTML=e.innerHTML.replace(/\n/g,"").replace(/<br[ \/]*>/g,"\n"):n=e,i=n.textContent,r=f?T(f,i,!0):w(i),(t=p(n)).length&&((a=document.createElement("div")).innerHTML=r.value,r.value=v(t,p(a),i)),r.value=b(r.value),e.innerHTML=r.value,e.className=(o=e.className,c=f,l=r.language,u=c?g[c]:l,s=[o.trim()],o.match(/\bhljs\b/)||s.push("hljs"),-1===o.indexOf(u)&&s.push(u),s.join(" ").trim()),e.result={language:r.language,re:r.relevance},r.second_best&&(e.second_best={language:r.second_best.language,re:r.second_best.relevance}))}function h(){if(!h.called){h.called=!0;var e=document.querySelectorAll("pre code");f.forEach.call(e,s)}}var N={disableAutodetect:!0};function D(e){return e=(e||"").toLowerCase(),_[e]||_[g[e]]}function L(e){var n=D(e);return n&&!n.disableAutodetect}return a.highlight=T,a.highlightAuto=w,a.fixMarkup=b,a.highlightBlock=s,a.configure=function(e){B=i(B,e)},a.initHighlighting=h,a.initHighlightingOnLoad=function(){window.addEventListener("DOMContentLoaded",h,!1),window.addEventListener("load",h,!1)},a.registerLanguage=function(n,e){var t;try{t=e(a)}catch(e){if(console.error("Language definition for '{}' could not be registered.".replace("{}",n)),!C)throw e;console.error(e),t=N}u(_[n]=t),t.rawDefinition=e.bind(null,a),t.aliases&&t.aliases.forEach(function(e){g[e]=n})},a.listLanguages=function(){return o(_)},a.getLanguage=D,a.requireLanguage=function(e){var n=D(e);if(n)return n;throw new Error("The '{}' language is required, but not loaded.".replace("{}",e))},a.autoDetection=L,a.inherit=i,a.debugMode=function(){C=!1},a.IR=a.IDENT_RE="[a-zA-Z]\\w*",a.UIR=a.UNDERSCORE_IDENT_RE="[a-zA-Z_]\\w*",a.NR=a.NUMBER_RE="\\b\\d+(\\.\\d+)?",a.CNR=a.C_NUMBER_RE="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",a.BNR=a.BINARY_NUMBER_RE="\\b(0b[01]+)",a.RSR=a.RE_STARTERS_RE="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",a.BE=a.BACKSLASH_ESCAPE={b:"\\\\[\\s\\S]",relevance:0},a.ASM=a.APOS_STRING_MODE={cN:"string",b:"'",e:"'",i:"\\n",c:[a.BE]},a.QSM=a.QUOTE_STRING_MODE={cN:"string",b:'"',e:'"',i:"\\n",c:[a.BE]},a.PWM=a.PHRASAL_WORDS_MODE={b:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/},a.C=a.COMMENT=function(e,n,t){var r=a.inherit({cN:"comment",b:e,e:n,c:[]},t||{});return r.c.push(a.PWM),r.c.push({cN:"doctag",b:"(?:TODO|FIXME|NOTE|BUG|XXX):",relevance:0}),r},a.CLCM=a.C_LINE_COMMENT_MODE=a.C("//","$"),a.CBCM=a.C_BLOCK_COMMENT_MODE=a.C("/\\*","\\*/"),a.HCM=a.HASH_COMMENT_MODE=a.C("#","$"),a.NM=a.NUMBER_MODE={cN:"number",b:a.NR,relevance:0},a.CNM=a.C_NUMBER_MODE={cN:"number",b:a.CNR,relevance:0},a.BNM=a.BINARY_NUMBER_MODE={cN:"number",b:a.BNR,relevance:0},a.CSSNM=a.CSS_NUMBER_MODE={cN:"number",b:a.NR+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},a.RM=a.REGEXP_MODE={cN:"regexp",b:/\//,e:/\/[gimuy]*/,i:/\n/,c:[a.BE,{b:/\[/,e:/\]/,relevance:0,c:[a.BE]}]},a.TM=a.TITLE_MODE={cN:"title",b:a.IR,relevance:0},a.UTM=a.UNDERSCORE_TITLE_MODE={cN:"title",b:a.UIR,relevance:0},a.METHOD_GUARD={b:"\\.\\s*"+a.UIR,relevance:0},[a.BE,a.ASM,a.QSM,a.PWM,a.C,a.CLCM,a.CBCM,a.HCM,a.NM,a.CNM,a.BNM,a.CSSNM,a.RM,a.TM,a.UTM,a.METHOD_GUARD].forEach(function(e){!function n(t){Object.freeze(t);var r="function"==typeof t;Object.getOwnPropertyNames(t).forEach(function(e){!t.hasOwnProperty(e)||null===t[e]||"object"!=typeof t[e]&&"function"!=typeof t[e]||r&&("caller"===e||"callee"===e||"arguments"===e)||Object.isFrozen(t[e])||n(t[e])});return t}(e)}),a});hljs.registerLanguage("swift",function(e){var i={keyword:"#available #colorLiteral #column #else #elseif #endif #file #fileLiteral #function #if #imageLiteral #line #selector #sourceLocation _ __COLUMN__ __FILE__ __FUNCTION__ __LINE__ Any as as! as? associatedtype associativity break case catch class continue convenience default defer deinit didSet do dynamic dynamicType else enum extension fallthrough false fileprivate final for func get guard if import in indirect infix init inout internal is lazy left let mutating nil none nonmutating open operator optional override postfix precedence prefix private protocol Protocol public repeat required rethrows return right self Self set static struct subscript super switch throw throws true try try! try? Type typealias unowned var weak where while willSet",literal:"true false nil",built_in:"abs advance alignof alignofValue anyGenerator assert assertionFailure bridgeFromObjectiveC bridgeFromObjectiveCUnconditional bridgeToObjectiveC bridgeToObjectiveCUnconditional c contains count countElements countLeadingZeros debugPrint debugPrintln distance dropFirst dropLast dump encodeBitsAsWords enumerate equal fatalError filter find getBridgedObjectiveCType getVaList indices insertionSort isBridgedToObjectiveC isBridgedVerbatimToObjectiveC isUniquelyReferenced isUniquelyReferencedNonObjC join lazy lexicographicalCompare map max maxElement min minElement numericCast overlaps partition posix precondition preconditionFailure print println quickSort readLine reduce reflect reinterpretCast reverse roundUpToAlignment sizeof sizeofValue sort split startsWith stride strideof strideofValue swap toString transcode underestimateCount unsafeAddressOf unsafeBitCast unsafeDowncast unsafeUnwrap unsafeReflect withExtendedLifetime withObjectAtPlusZero withUnsafePointer withUnsafePointerToObject withUnsafeMutablePointer withUnsafeMutablePointers withUnsafePointer withUnsafePointers withVaList zip"},t=e.C("/\\*","\\*/",{c:["self"]}),n={cN:"subst",b:/\\\(/,e:"\\)",k:i,c:[]},r={cN:"string",c:[e.BE,n],v:[{b:/"""/,e:/"""/},{b:/"/,e:/"/}]},a={cN:"number",b:"\\b([\\d_]+(\\.[\\deE_]+)?|0x[a-fA-F0-9_]+(\\.[a-fA-F0-9p_]+)?|0b[01_]+|0o[0-7_]+)\\b",relevance:0};return n.c=[a],{k:i,c:[r,e.CLCM,t,{cN:"type",b:"\\b[A-Z][\\wÀ-ʸ']*[!?]"},{cN:"type",b:"\\b[A-Z][\\wÀ-ʸ']*",relevance:0},a,{cN:"function",bK:"func",e:"{",eE:!0,c:[e.inherit(e.TM,{b:/[A-Za-z$_][0-9A-Za-z$_]*/}),{b:/</,e:/>/},{cN:"params",b:/\(/,e:/\)/,endsParent:!0,k:i,c:["self",a,r,e.CBCM,{b:":"}],i:/["']/}],i:/\[|%/},{cN:"class",bK:"struct protocol class extension enum",k:i,e:"\\{",eE:!0,c:[e.inherit(e.TM,{b:/[A-Za-z$_][\u00C0-\u02B80-9A-Za-z$_]*/})]},{cN:"meta",b:"(@discardableResult|@warn_unused_result|@exported|@lazy|@noescape|@NSCopying|@NSManaged|@objc|@objcMembers|@convention|@required|@noreturn|@IBAction|@IBDesignable|@IBInspectable|@IBOutlet|@infix|@prefix|@postfix|@autoclosure|@testable|@available|@nonobjc|@NSApplicationMain|@UIApplicationMain|@dynamicMemberLookup|@propertyWrapper)"},{bK:"import",e:/$/,c:[e.CLCM,t]}]}});hljs.registerLanguage("go",function(e){var n={keyword:"break default func interface select case map struct chan else goto package switch const fallthrough if range type continue for import return var go defer bool byte complex64 complex128 float32 float64 int8 int16 int32 int64 string uint8 uint16 uint32 uint64 int uint uintptr rune",literal:"true false iota nil",built_in:"append cap close complex copy imag len make new panic print println real recover delete"};return{aliases:["golang"],k:n,i:"</",c:[e.CLCM,e.CBCM,{cN:"string",v:[e.QSM,e.ASM,{b:"`",e:"`"}]},{cN:"number",v:[{b:e.CNR+"[i]",relevance:1},e.CNM]},{b:/:=/},{cN:"function",bK:"func",e:"\\s*(\\{|$)",eE:!0,c:[e.TM,{cN:"params",b:/\(/,e:/\)/,k:n,i:/["']/}]}]}});hljs.registerLanguage("kotlin",function(e){var t={keyword:"abstract as val var vararg get set class object open private protected public noinline crossinline dynamic final enum if else do while for when throw try catch finally import package is in fun override companion reified inline lateinit init interface annotation data sealed internal infix operator out by constructor super tailrec where const inner suspend typealias external expect actual trait volatile transient native default",built_in:"Byte Short Char Int Long Boolean Float Double Void Unit Nothing",literal:"true false null"},a={cN:"symbol",b:e.UIR+"@"},n={cN:"subst",b:"\\${",e:"}",c:[e.CNM]},c={cN:"variable",b:"\\$"+e.UIR},r={cN:"string",v:[{b:'"""',e:'"""(?=[^"])',c:[c,n]},{b:"'",e:"'",i:/\n/,c:[e.BE]},{b:'"',e:'"',i:/\n/,c:[e.BE,c,n]}]};n.c.push(r);var i={cN:"meta",b:"@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*"+e.UIR+")?"},l={cN:"meta",b:"@"+e.UIR,c:[{b:/\(/,e:/\)/,c:[e.inherit(r,{cN:"meta-string"})]}]},s={cN:"number",b:"\\b(0[bB]([01]+[01_]+[01]+|[01]+)|0[xX]([a-fA-F0-9]+[a-fA-F0-9_]+[a-fA-F0-9]+|[a-fA-F0-9]+)|(([\\d]+[\\d_]+[\\d]+|[\\d]+)(\\.([\\d]+[\\d_]+[\\d]+|[\\d]+))?|\\.([\\d]+[\\d_]+[\\d]+|[\\d]+))([eE][-+]?\\d+)?)[lLfF]?",relevance:0},b=e.C("/\\*","\\*/",{c:[e.CBCM]}),o={v:[{cN:"type",b:e.UIR},{b:/\(/,e:/\)/,c:[]}]},d=o;return d.v[1].c=[o],o.v[1].c=[d],{aliases:["kt"],k:t,c:[e.C("/\\*\\*","\\*/",{relevance:0,c:[{cN:"doctag",b:"@[A-Za-z]+"}]}),e.CLCM,b,{cN:"keyword",b:/\b(break|continue|return|this)\b/,starts:{c:[{cN:"symbol",b:/@\w+/}]}},a,i,l,{cN:"function",bK:"fun",e:"[(]|$",rB:!0,eE:!0,k:t,i:/fun\s+(<.*>)?[^\s\(]+(\s+[^\s\(]+)\s*=/,relevance:5,c:[{b:e.UIR+"\\s*\\(",rB:!0,relevance:0,c:[e.UTM]},{cN:"type",b:/</,e:/>/,k:"reified",relevance:0},{cN:"params",b:/\(/,e:/\)/,endsParent:!0,k:t,relevance:0,c:[{b:/:/,e:/[=,\/]/,eW:!0,c:[o,e.CLCM,b],relevance:0},e.CLCM,b,i,l,r,e.CNM]},b]},{cN:"class",bK:"class interface trait",e:/[:\{(]|$/,eE:!0,i:"extends implements",c:[{bK:"public protected internal private constructor"},e.UTM,{cN:"type",b:/</,e:/>/,eB:!0,eE:!0,relevance:0},{cN:"type",b:/[,:]\s*/,e:/[<\(,]|$/,eB:!0,rE:!0},i,l]},r,{cN:"meta",b:"^#!/usr/bin/env",e:"$",i:"\n"},s]}});hljs.registerLanguage("xml",function(e){var c={cN:"symbol",b:"&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;"},s={b:"\\s",c:[{cN:"meta-keyword",b:"#?[a-z_][a-z1-9_-]+",i:"\\n"}]},a=e.inherit(s,{b:"\\(",e:"\\)"}),t=e.inherit(e.ASM,{cN:"meta-string"}),l=e.inherit(e.QSM,{cN:"meta-string"}),r={eW:!0,i:/</,relevance:0,c:[{cN:"attr",b:"[A-Za-z0-9\\._:-]+",relevance:0},{b:/=\s*/,relevance:0,c:[{cN:"string",endsParent:!0,v:[{b:/"/,e:/"/,c:[c]},{b:/'/,e:/'/,c:[c]},{b:/[^\s"'=<>`]+/}]}]}]};return{aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],cI:!0,c:[{cN:"meta",b:"<![a-z]",e:">",relevance:10,c:[s,l,t,a,{b:"\\[",e:"\\]",c:[{cN:"meta",b:"<![a-z]",e:">",c:[s,a,l,t]}]}]},e.C("\x3c!--","--\x3e",{relevance:10}),{b:"<\\!\\[CDATA\\[",e:"\\]\\]>",relevance:10},c,{cN:"meta",b:/<\?xml/,e:/\?>/,relevance:10},{b:/<\?(php)?/,e:/\?>/,sL:"php",c:[{b:"/\\*",e:"\\*/",skip:!0},{b:'b"',e:'"',skip:!0},{b:"b'",e:"'",skip:!0},e.inherit(e.ASM,{i:null,cN:null,c:null,skip:!0}),e.inherit(e.QSM,{i:null,cN:null,c:null,skip:!0})]},{cN:"tag",b:"<style(?=\\s|>)",e:">",k:{name:"style"},c:[r],starts:{e:"</style>",rE:!0,sL:["css","xml"]}},{cN:"tag",b:"<script(?=\\s|>)",e:">",k:{name:"script"},c:[r],starts:{e:"<\/script>",rE:!0,sL:["actionscript","javascript","handlebars","xml"]}},{cN:"tag",b:"</?",e:"/?>",c:[{cN:"name",b:/[^\/><\s]+/,relevance:0},r]}]}});hljs.registerLanguage("r",function(e){var r="([a-zA-Z]|\\.[a-zA-Z.])[a-zA-Z0-9._]*";return{c:[e.HCM,{b:r,l:r,k:{keyword:"function if in break next repeat else for return switch while try tryCatch stop warning require library attach detach source setMethod setGeneric setGroupGeneric setClass ...",literal:"NULL NA TRUE FALSE T F Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 NA_complex_|10"},relevance:0},{cN:"number",b:"0[xX][0-9a-fA-F]+[Li]?\\b",relevance:0},{cN:"number",b:"\\d+(?:[eE][+\\-]?\\d*)?L\\b",relevance:0},{cN:"number",b:"\\d+\\.(?!\\d)(?:i\\b)?",relevance:0},{cN:"number",b:"\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d*)?i?\\b",relevance:0},{cN:"number",b:"\\.\\d+(?:[eE][+\\-]?\\d*)?i?\\b",relevance:0},{b:"`",e:"`",relevance:0},{cN:"string",c:[e.BE],v:[{b:'"',e:'"'},{b:"'",e:"'"}]}]}});hljs.registerLanguage("python",function(e){var r={keyword:"and elif is global as in if from raise for except finally print import pass return exec else break not with class assert yield try while continue del or def lambda async await nonlocal|10",built_in:"Ellipsis NotImplemented",literal:"False None True"},b={cN:"meta",b:/^(>>>|\.\.\.) /},c={cN:"subst",b:/\{/,e:/\}/,k:r,i:/#/},a={b:/\{\{/,relevance:0},l={cN:"string",c:[e.BE],v:[{b:/(u|b)?r?'''/,e:/'''/,c:[e.BE,b],relevance:10},{b:/(u|b)?r?"""/,e:/"""/,c:[e.BE,b],relevance:10},{b:/(fr|rf|f)'''/,e:/'''/,c:[e.BE,b,a,c]},{b:/(fr|rf|f)"""/,e:/"""/,c:[e.BE,b,a,c]},{b:/(u|r|ur)'/,e:/'/,relevance:10},{b:/(u|r|ur)"/,e:/"/,relevance:10},{b:/(b|br)'/,e:/'/},{b:/(b|br)"/,e:/"/},{b:/(fr|rf|f)'/,e:/'/,c:[e.BE,a,c]},{b:/(fr|rf|f)"/,e:/"/,c:[e.BE,a,c]},e.ASM,e.QSM]},n={cN:"number",relevance:0,v:[{b:e.BNR+"[lLjJ]?"},{b:"\\b(0o[0-7]+)[lLjJ]?"},{b:e.CNR+"[lLjJ]?"}]},i={cN:"params",b:/\(/,e:/\)/,c:["self",b,n,l,e.HCM]};return c.c=[l,n,b],{aliases:["py","gyp","ipython"],k:r,i:/(<\/|->|\?)|=>/,c:[b,n,{bK:"if",relevance:0},l,e.HCM,{v:[{cN:"function",bK:"def"},{cN:"class",bK:"class"}],e:/:/,i:/[${=;\n,]/,c:[e.UTM,i,{b:/->/,eW:!0,k:"None"}]},{cN:"meta",b:/^[\t ]*@/,e:/$/},{b:/\b(print|exec)\(/}]}});hljs.registerLanguage("java",function(e){var a="false synchronized int abstract float private char boolean var static null if const for true while long strictfp finally protected import native final void enum else break transient catch instanceof byte super volatile case assert short package default double public try this switch continue throws protected public private module requires exports do",t={cN:"number",b:"\\b(0[bB]([01]+[01_]+[01]+|[01]+)|0[xX]([a-fA-F0-9]+[a-fA-F0-9_]+[a-fA-F0-9]+|[a-fA-F0-9]+)|(([\\d]+[\\d_]+[\\d]+|[\\d]+)(\\.([\\d]+[\\d_]+[\\d]+|[\\d]+))?|\\.([\\d]+[\\d_]+[\\d]+|[\\d]+))([eE][-+]?\\d+)?)[lLfF]?",relevance:0};return{aliases:["jsp"],k:a,i:/<\/|#/,c:[e.C("/\\*\\*","\\*/",{relevance:0,c:[{b:/\w+@/,relevance:0},{cN:"doctag",b:"@[A-Za-z]+"}]}),e.CLCM,e.CBCM,e.ASM,e.QSM,{cN:"class",bK:"class interface",e:/[{;=]/,eE:!0,k:"class interface",i:/[:"\[\]]/,c:[{bK:"extends implements"},e.UTM]},{bK:"new throw return else",relevance:0},{cN:"function",b:"([À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*(<[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*(\\s*,\\s*[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*)*>)?\\s+)+"+e.UIR+"\\s*\\(",rB:!0,e:/[{;=]/,eE:!0,k:a,c:[{b:e.UIR+"\\s*\\(",rB:!0,relevance:0,c:[e.UTM]},{cN:"params",b:/\(/,e:/\)/,k:a,relevance:0,c:[e.ASM,e.QSM,e.CNM,e.CBCM]},e.CLCM,e.CBCM]},t,{cN:"meta",b:"@[A-Za-z]+"}]}});hljs.registerLanguage("cpp",function(e){function t(e){return"(?:"+e+")?"}var r="decltype\\(auto\\)",a="[a-zA-Z_]\\w*::",i=(t(a),t("<.*?>"),{cN:"keyword",b:"\\b[a-z\\d_]*_t\\b"}),c={cN:"string",v:[{b:'(u8?|U|L)?"',e:'"',i:"\\n",c:[e.BE]},{b:"(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",e:"'",i:"."},{b:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\((?:.|\n)*?\)\1"/}]},s={cN:"number",v:[{b:"\\b(0b[01']+)"},{b:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)(u|U|l|L|ul|UL|f|F|b|B)"},{b:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"}],relevance:0},n={cN:"meta",b:/#\s*[a-z]+\b/,e:/$/,k:{"meta-keyword":"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"},c:[{b:/\\\n/,relevance:0},e.inherit(c,{cN:"meta-string"}),{cN:"meta-string",b:/<.*?>/,e:/$/,i:"\\n"},e.CLCM,e.CBCM]},o={cN:"title",b:t(a)+e.IR,relevance:0},l=t(a)+e.IR+"\\s*\\(",u={keyword:"int float while private char char8_t char16_t char32_t catch import module export virtual operator sizeof dynamic_cast|10 typedef const_cast|10 const for static_cast|10 union namespace unsigned long volatile static protected bool template mutable if public friend do goto auto void enum else break extern using asm case typeid wchar_tshort reinterpret_cast|10 default double register explicit signed typename try this switch continue inline delete alignas alignof constexpr consteval constinit decltype concept co_await co_return co_yield requires noexcept static_assert thread_local restrict final override atomic_bool atomic_char atomic_schar atomic_uchar atomic_short atomic_ushort atomic_int atomic_uint atomic_long atomic_ulong atomic_llong atomic_ullong new throw return and and_eq bitand bitor compl not not_eq or or_eq xor xor_eq",built_in:"std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr _Bool complex _Complex imaginary _Imaginary",literal:"true false nullptr NULL"},p=[i,e.CLCM,e.CBCM,s,c],m={v:[{b:/=/,e:/;/},{b:/\(/,e:/\)/},{bK:"new throw return else",e:/;/}],k:u,c:p.concat([{b:/\(/,e:/\)/,k:u,c:p.concat(["self"]),relevance:0}]),relevance:0},d={cN:"function",b:"((decltype\\(auto\\)|(?:[a-zA-Z_]\\w*::)?[a-zA-Z_]\\w*(?:<.*?>)?)[\\*&\\s]+)+"+l,rB:!0,e:/[{;=]/,eE:!0,k:u,i:/[^\w\s\*&:<>]/,c:[{b:r,k:u,relevance:0},{b:l,rB:!0,c:[o],relevance:0},{cN:"params",b:/\(/,e:/\)/,k:u,relevance:0,c:[e.CLCM,e.CBCM,c,s,i,{b:/\(/,e:/\)/,k:u,relevance:0,c:["self",e.CLCM,e.CBCM,c,s,i]}]},i,e.CLCM,e.CBCM,n]};return{aliases:["c","cc","h","c++","h++","hpp","hh","hxx","cxx"],k:u,i:"</",c:[].concat(m,d,p,[n,{b:"\\b(deque|list|queue|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array)\\s*<",e:">",k:u,c:["self",i]},{b:e.IR+"::",k:u},{cN:"class",bK:"class struct",e:/[{;:]/,c:[{b:/</,e:/>/,c:["self"]},e.TM]}]),exports:{preprocessor:n,strings:c,k:u}}});hljs.registerLanguage("cs",function(e){var a={keyword:"abstract as base bool break byte case catch char checked const continue decimal default delegate do double enum event explicit extern finally fixed float for foreach goto if implicit in int interface internal is lock long object operator out override params private protected public readonly ref sbyte sealed short sizeof stackalloc static string struct switch this try typeof uint ulong unchecked unsafe ushort using virtual void volatile while add alias ascending async await by descending dynamic equals from get global group into join let nameof on orderby partial remove select set value var when where yield",literal:"null false true"},i={cN:"number",v:[{b:"\\b(0b[01']+)"},{b:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)(u|U|l|L|ul|UL|f|F|b|B)"},{b:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"}],relevance:0},c={cN:"string",b:'@"',e:'"',c:[{b:'""'}]},r=e.inherit(c,{i:/\n/}),n={cN:"subst",b:"{",e:"}",k:a},t=e.inherit(n,{i:/\n/}),s={cN:"string",b:/\$"/,e:'"',i:/\n/,c:[{b:"{{"},{b:"}}"},e.BE,t]},l={cN:"string",b:/\$@"/,e:'"',c:[{b:"{{"},{b:"}}"},{b:'""'},n]},b=e.inherit(l,{i:/\n/,c:[{b:"{{"},{b:"}}"},{b:'""'},t]});n.c=[l,s,c,e.ASM,e.QSM,i,e.CBCM],t.c=[b,s,r,e.ASM,e.QSM,i,e.inherit(e.CBCM,{i:/\n/})];var o={v:[l,s,c,e.ASM,e.QSM]},d=e.IR+"(<"+e.IR+"(\\s*,\\s*"+e.IR+")*>)?(\\[\\])?";return{aliases:["csharp","c#"],k:a,i:/::/,c:[e.C("///","$",{rB:!0,c:[{cN:"doctag",v:[{b:"///",relevance:0},{b:"\x3c!--|--\x3e"},{b:"</?",e:">"}]}]}),e.CLCM,e.CBCM,{cN:"meta",b:"#",e:"$",k:{"meta-keyword":"if else elif endif define undef warning error line region endregion pragma checksum"}},o,i,{bK:"class interface",e:/[{;=]/,i:/[^\s:,]/,c:[e.TM,e.CLCM,e.CBCM]},{bK:"namespace",e:/[{;=]/,i:/[^\s:]/,c:[e.inherit(e.TM,{b:"[a-zA-Z](\\.?\\w)*"}),e.CLCM,e.CBCM]},{cN:"meta",b:"^\\s*\\[",eB:!0,e:"\\]",eE:!0,c:[{cN:"meta-string",b:/"/,e:/"/}]},{bK:"new return throw await else",relevance:0},{cN:"function",b:"("+d+"\\s+)+"+e.IR+"\\s*\\(",rB:!0,e:/\s*[{;=]/,eE:!0,k:a,c:[{b:e.IR+"\\s*\\(",rB:!0,c:[e.TM],relevance:0},{cN:"params",b:/\(/,e:/\)/,eB:!0,eE:!0,k:a,relevance:0,c:[o,i,e.CBCM]},e.CLCM,e.CBCM]}]}});hljs.registerLanguage("css",function(e){var c={b:/(?:[A-Z\_\.\-]+|--[a-zA-Z0-9_-]+)\s*:/,rB:!0,e:";",eW:!0,c:[{cN:"attribute",b:/\S/,e:":",eE:!0,starts:{eW:!0,eE:!0,c:[{b:/[\w-]+\(/,rB:!0,c:[{cN:"built_in",b:/[\w-]+/},{b:/\(/,e:/\)/,c:[e.ASM,e.QSM,e.CSSNM]}]},e.CSSNM,e.QSM,e.ASM,e.CBCM,{cN:"number",b:"#[0-9A-Fa-f]+"},{cN:"meta",b:"!important"}]}}]};return{cI:!0,i:/[=\/|'\$]/,c:[e.CBCM,{cN:"selector-id",b:/#[A-Za-z0-9_-]+/},{cN:"selector-class",b:/\.[A-Za-z0-9_-]+/},{cN:"selector-attr",b:/\[/,e:/\]/,i:"$",c:[e.ASM,e.QSM]},{cN:"selector-pseudo",b:/:(:)?[a-zA-Z0-9\_\-\+\(\)"'.]+/},{b:"@(page|font-face)",l:"@[a-z-]+",k:"@page @font-face"},{b:"@",e:"[{;]",i:/:/,rB:!0,c:[{cN:"keyword",b:/@\-?\w[\w]*(\-\w+)*/},{b:/\s/,eW:!0,eE:!0,relevance:0,k:"and or not only",c:[{b:/[a-z-]+:/,cN:"attribute"},e.ASM,e.QSM,e.CSSNM]}]},{cN:"selector-tag",b:"[a-zA-Z-][a-zA-Z0-9_-]*",relevance:0},{b:"{",e:"}",i:/\S/,c:[e.CBCM,c]}]}});hljs.registerLanguage("javascript",function(e){var r="<>",a="</>",t={b:/<[A-Za-z0-9\\._:-]+/,e:/\/[A-Za-z0-9\\._:-]+>|\/>/},c="[A-Za-z$_][0-9A-Za-z$_]*",n={keyword:"in of if for while finally var new function do return void else break catch instanceof with throw case default try this switch continue typeof delete let yield const export super debugger as async await static import from as",literal:"true false null undefined NaN Infinity",built_in:"eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Error EvalError InternalError RangeError ReferenceError StopIteration SyntaxError TypeError URIError Number Math Date String RegExp Array Float32Array Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require module console window document Symbol Set Map WeakSet WeakMap Proxy Reflect Promise"},s={cN:"number",v:[{b:"\\b(0[bB][01]+)n?"},{b:"\\b(0[oO][0-7]+)n?"},{b:e.CNR+"n?"}],relevance:0},o={cN:"subst",b:"\\$\\{",e:"\\}",k:n,c:[]},i={b:"html`",e:"",starts:{e:"`",rE:!1,c:[e.BE,o],sL:"xml"}},b={b:"css`",e:"",starts:{e:"`",rE:!1,c:[e.BE,o],sL:"css"}},l={cN:"string",b:"`",e:"`",c:[e.BE,o]};o.c=[e.ASM,e.QSM,i,b,l,s,e.RM];var u=o.c.concat([e.CBCM,e.CLCM]);return{aliases:["js","jsx","mjs","cjs"],k:n,c:[{cN:"meta",relevance:10,b:/^\s*['"]use (strict|asm)['"]/},{cN:"meta",b:/^#!/,e:/$/},e.ASM,e.QSM,i,b,l,e.CLCM,e.C("/\\*\\*","\\*/",{relevance:0,c:[{cN:"doctag",b:"@[A-Za-z]+",c:[{cN:"type",b:"\\{",e:"\\}",relevance:0},{cN:"variable",b:c+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{b:/(?=[^\n])\s/,relevance:0}]}]}),e.CBCM,s,{b:/[{,\n]\s*/,relevance:0,c:[{b:c+"\\s*:",rB:!0,relevance:0,c:[{cN:"attr",b:c,relevance:0}]}]},{b:"("+e.RSR+"|\\b(case|return|throw)\\b)\\s*",k:"return throw case",c:[e.CLCM,e.CBCM,e.RM,{cN:"function",b:"(\\(.*?\\)|"+c+")\\s*=>",rB:!0,e:"\\s*=>",c:[{cN:"params",v:[{b:c},{b:/\(\s*\)/},{b:/\(/,e:/\)/,eB:!0,eE:!0,k:n,c:u}]}]},{cN:"",b:/\s/,e:/\s*/,skip:!0},{v:[{b:r,e:a},{b:t.b,e:t.e}],sL:"xml",c:[{b:t.b,e:t.e,skip:!0,c:["self"]}]}],relevance:0},{cN:"function",bK:"function",e:/\{/,eE:!0,c:[e.inherit(e.TM,{b:c}),{cN:"params",b:/\(/,e:/\)/,eB:!0,eE:!0,c:u}],i:/\[|%/},{b:/\$[(.]/},e.METHOD_GUARD,{cN:"class",bK:"class",e:/[{;=]/,eE:!0,i:/[:"\[\]]/,c:[{bK:"extends"},e.UTM]},{bK:"constructor get set",e:/\{/,eE:!0}],i:/#(?!!)/}});