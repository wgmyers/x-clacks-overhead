let currentTab;
const pages = [];
const clacks = [];
let current_clacks;
let has_clacks;
let pos = 0;
let loop = 0;

function drySetIcon(icon) {
  let img = icon + ".png";
  browser.browserAction.setIcon({
    path: {
      "16": "data/Clacks16/" + img,
      "32": "data/Clacks32/" + img,
      "64": "data/Clacks64/" + img
    },
    tabId: currentTab.id
  });
}

function updateIcon() {
  has_clacks ? drySetIcon("END") : drySetIcon("BLANK");
  browser.browserAction.setTitle({
    // Screen readers can see the title
    title: has_clacks ? current_clacks : "Nothing in the overhead" ,
    tabId: currentTab.id
  });
}

function checkTime() {
  if (has_clacks === true) {
	  loop = loop + 1;
	  if (loop > 4) { loop = 0; }
	  if (loop < 1) {
      drySetIcon("BLANK");
		  pos = pos + 1;
	  } else {
		  if (current_clacks.length-1 < pos) { pos = 0; };
		  if (current_clacks.charAt(pos) === " ") {
        drySetIcon("SPACE");
			} else {
			  if (current_clacks.charAt(pos) === "+") {
          drySetIcon("END");
			  } else {
			    try {
            drySetIcon(current_clacks.charAt(pos).toUpperCase());
			    } catch (err) {
            drySetIcon("SPACE");
			    }
			  }
		  }
	  }
  }
}

function updateActiveTab(tabs) {

  function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
	    const l = pages.indexOf(currentTab.url);
      if (l === -1) {
	      current_clacks = "Nothing in the overhead";
		    has_clacks = false;
      } else {
        current_clacks = clacks[l];
		    has_clacks = true;
	    }
	    updateIcon();
    }
  }

  const gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then(updateTab);
}

function setGNU(e) {
  for (let header of e.responseHeaders) {
    if (header.name.toLowerCase() === "x-clacks-overhead") {
	    if (pages.indexOf(e.url) === -1) {
		    pages.push(e.url);
		    clacks.push("+" + header.value);
	    }
    }
    break; // Only allow one X-Clacks-Overhead msg per site
  }
  return { responseHeaders: e.responseHeaders };
}

// Listen for onHeaderReceived for the target page.
// Set "blocking" and "responseHeaders".
browser.webRequest.onHeadersReceived.addListener(
  setGNU,
  {urls: ["<all_urls>"]},
  ["responseHeaders"]
);

function openPage() {
  browser.tabs.create({
    url: "http://www.gnuterrypratchett.com/"
  });
}
function notify(message) {
  if (pages.indexOf(message.url) === -1) {
		pages.push(message.url);
		clacks.push("+" + message.value);
	}
	updateActiveTab();
}

browser.runtime.onMessage.addListener(notify);

browser.browserAction.onClicked.addListener(openPage);

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

browser.alarms.onAlarm.addListener(checkTime);
browser.alarms.create('checkTime', {periodInMinutes: 0.02});

// update when the extension loads initially
updateActiveTab();
