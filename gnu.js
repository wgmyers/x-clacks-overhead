var i;
var metas = document.getElementsByTagName('meta');
for (i=0; i<metas.length; i++) { 
	if (metas[i].getAttribute("http-equiv") == "X-Clacks-Overhead") { 				
		browser.runtime.sendMessage({"url": document.URL, "value":metas[i].content}); 
	} 
}