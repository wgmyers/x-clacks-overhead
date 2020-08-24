let currentTab;
const pages = [];
const clacks = [];
let current_clacks;
let has_clacks;
let pos = 0;
let loop = 0;

function updateIcon() {
  browser.browserAction.setIcon({
    path: has_clacks ? {
			"16": "data/Clacks16/END.png",
			"32": "data/Clacks32/END.png",
			"64": "data/Clacks64/END.png"
    } : {
			"16": "data/Clacks16/BLANK.png",
			"32": "data/Clacks32/BLANK.png",
			"64": "data/Clacks64/BLANK.png"
    },
    tabId: currentTab.id
  });
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
		  browser.browserAction.setIcon({
			  path: {
					"16": "data/Clacks16/BLANK.png",
					"32": "data/Clacks32/BLANK.png",
					"64": "data/Clacks64/BLANK.png"
				},
				tabId: currentTab.id
			});
		  pos = pos + 1;
	  } else {
		  if (current_clacks.length-1 < pos) { pos = 0; };
		  if (current_clacks.charAt(pos) === " ") {
			  browser.browserAction.setIcon({
				  path: {
					  "16": "data/Clacks16/SPACE.png",
					  "32": "data/Clacks32/SPACE.png",
					  "64": "data/Clacks64/SPACE.png"
					},
				  tabId: currentTab.id
			  });
			} else {
			  if (current_clacks.charAt(pos) === "+") {
			    browser.browserAction.setIcon({
				    path: {
					    "16": "data/Clacks16/END.png",
					    "32": "data/Clacks32/END.png",
					    "64": "data/Clacks64/END.png"
				    },
				    tabId: currentTab.id
			    });
			  } else {
			    try {
				    browser.browserAction.setIcon({
					    path: {
						    "16": "data/Clacks16/"+current_clacks.charAt(pos).toUpperCase()+".png",
						    "32": "data/Clacks32/"+current_clacks.charAt(pos).toUpperCase()+".png",
						    "64": "data/Clacks64/"+current_clacks.charAt(pos).toUpperCase()+".png"
					    },
					    tabId: currentTab.id
				    });
			    } catch (ex4) {
				    browser.browserAction.setIcon({
					    path: {
						    "16": "data/Clacks16/SPACE.png",
						    "32": "data/Clacks32/SPACE.png",
						    "64": "data/Clacks64/SPACE.png"
						  },
					    tabId: currentTab.id
				    });
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
  }
  return {responseHeaders: e.responseHeaders};
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
