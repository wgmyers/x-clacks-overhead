var i;
var metas = Document.getElementsByTagName('meta');
for (i=0; i<metas.length; i++) { 
	if (metas[i].getAttribute("http-equiv") == "X-Clacks-Overhead") { 				
		browser.runtime.sendMessage({"url": Document.URL, "value":metas[i].content}); 
	} 
}