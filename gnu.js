let i;
const metas = document.getElementsByTagName('meta');
for (i=0; i < metas.length; i++) {
	if (metas[i].getAttribute("http-equiv").toLowerCase() === "x-clacks-overhead") {
		browser.runtime.sendMessage({"url": document.URL, "value": metas[i].content});
		break; // only allow one X-Clacks-Overhead per site
	}
}
