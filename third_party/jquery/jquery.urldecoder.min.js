/** --------------------------------------------------------------------------
 *	jQuery URL Decoder
 *	Version 1.0
 *	Parses URL and return its components. Can also build URL from components
 *	
 * ---------------------------------------------------------------------------
 *	HOW TO USE:
 *
 *	$.url.decode('http://username:password@hostname/path?arg1=value%40+1&arg2=touch%C3%A9#anchor')
 *	// returns
 *	// http://username:password@hostname/path?arg1=value@ 1&arg2=touché#anchor
 *	// Note: "%40" is replaced with "@", "+" is replaced with " " and "%C3%A9" is replaced with "é"
 *	
 *	$.url.encode('file.htm?arg1=value1 @#456&amp;arg2=value2 touché')
 *	// returns
 *	// file.htm%3Farg1%3Dvalue1%20%40%23456%26arg2%3Dvalue2%20touch%C3%A9
 *	// Note: "@" is replaced with "%40" and "é" is replaced with "%C3%A9"
 *	
 *	$.url.parse('http://username:password@hostname/path?arg1=value%40+1&arg2=touch%C3%A9#anchor')
 *	// returns
 *	{
 *		source: 'http://username:password@hostname/path?arg1=value%40+1&arg2=touch%C3%A9#anchor',
 *		protocol: 'http',
 *		authority: 'username:password@hostname',
 *		userInfo: 'username:password',
 *		user: 'username',
 *		password: 'password',
 *		host: 'hostname',
 *		port: '',
 *		path: '/path',
 *		directory: '/path',
 *		file: '',
 *		relative: '/path?arg1=value%40+1&arg2=touch%C3%A9#anchor',
 *		query: 'arg1=value%40+1&arg2=touch%C3%A9',
 *		anchor: 'anchor',
 *		params: {
 *			'arg1': 'value@ 1',
 *			'arg2': 'touché'
 *		}
 *	}
 *	
 *	$.url.build({
 *		protocol: 'http',
 *		username: 'username',
 *		password: 'password',
 *		host: 'hostname',
 *		path: '/path',
 *		query: 'arg1=value%40+1&arg2=touch%C3%A9',
 *		// or 
 *		//params: {
 *		//	'arg1': 'value@ 1',
 *		//	'arg2': 'touché'
 *		//}
 *		anchor: 'anchor',
 *	})
 *	// returns
 *	// http://username:password@hostname/path?arg1=value%40+1&arg2=touch%C3%A9#anchor	
 *	
 * ---------------------------------------------------------------------------
 * OTHER PARTIES' CODE:
 *
 * Parser based on the Regex-based URI parser by Steven Levithan.
 * For more information visit http://blog.stevenlevithan.com/archives/parseuri
 *
 * Deparam taken from jQuery BBQ by Ben Alman. Dual licensed under the MIT and GPL licenses (http://benalman.com/about/license/)
 * http://benalman.com/projects/jquery-bbq-plugin/
 *  
 * ---------------------------------------------------------------------------
	
*/
jQuery.url = function() { function l(a) { for(var b = "", c = 0, f = 0, d = 0;c < a.length;) { f = a.charCodeAt(c); if(f < 128) { b += String.fromCharCode(f); c++ }else if(f > 191 && f < 224) { d = a.charCodeAt(c + 1); b += String.fromCharCode((f & 31) << 6 | d & 63); c += 2 }else { d = a.charCodeAt(c + 1); c3 = a.charCodeAt(c + 2); b += String.fromCharCode((f & 15) << 12 | (d & 63) << 6 | c3 & 63); c += 3 } }return b } function m(a, b) { var c = {}, f = {"true":true, "false":false, "null":null}; $.each(a.replace(/\+/g, " ").split("&"), function(d, j) { var e = j.split("="); d = k(e[0]); j = c; var i = 0, g = d.split("]["), h = g.length - 1; if(/\[/.test(g[0]) && /\]$/.test(g[h])) { g[h] = g[h].replace(/\]$/, ""); g = g.shift().split("[").concat(g); h = g.length - 1 }else h = 0; if(e.length === 2) { e = k(e[1]); if(b)e = e && !isNaN(e) ? +e : e === "undefined" ? undefined : f[e] !== undefined ? f[e] : e; if(h)for(;i <= h;i++) { d = g[i] === "" ? j.length : g[i]; j = j[d] = i < h ? j[d] || (g[i + 1] && isNaN(g[i + 1]) ? {} : []) : e }else if($.isArray(c[d]))c[d].push(e); else c[d] = c[d] !== undefined ? [c[d], e] : e }else if(d)c[d] = b ? undefined : "" }); return c } function n(a) { a = a || window.location; var b = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"]; a = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/.exec(a); for(var c = {}, f = b.length;f--;)c[b[f]] = a[f] || ""; if(c.query)c.params = m(c.query, true); return c } function o(a) { if(a.source)return encodeURI(a.source); var b = []; if(a.protocol)if(a.protocol == "file")b.push("file:///"); else a.protocol == "mailto" ? b.push("mailto:") : b.push(a.protocol + "://"); if(a.authority)b.push(a.authority); else { if(a.userInfo)b.push(a.userInfo + "@"); else if(a.user) { b.push(a.user); a.password && b.push(":" + a.password); b.push("@") }if(a.host) { b.push(a.host); a.port && b.push(":" + a.port) } }if(a.path)b.push(a.path); else { a.directory && b.push(a.directory); a.file && b.push(a.file) }if(a.query)b.push("?" + a.query); else a.params && b.push("?" + $.param(a.params)); a.anchor && b.push("#" + a.anchor); return b.join("") } function p(a) { return encodeURIComponent(a) } function k(a) { a = a || window.location.toString(); return l(unescape(a.replace(/\+/g, " "))) } return{encode:p, decode:k, parse:n, build:o} }();