// background-script.js
// Main part of x-clacks-overhead extension

const max_msg_length = 1024; // Cannot find info on max clacks length in TP
const pages = [];
const clacks = [];
let current_clacks;
let currentTab;
let has_clacks;
let pos = 0;
let loop = 0;


// sanitiseMsg
// Escape naughty HTML
// Truncate message to max_msg_length
function sanitiseMsg(msg) {
  let goodMsg;
  const element = document.createElement('div');
  element.innerText = msg;
  goodMsg = element.innerHTML;
  if (goodMsg.length > max_msg_length) {
    goodMsg = goodMsg.substring(max_msg_length - 1);
  }
  return goodMsg;
}

// drySetIcon
// Take an icon name, set that icon
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

// updateIcon
// On new tab, set icon title and initial clacks message char, if any
function updateIcon() {
  has_clacks ? drySetIcon("END") : drySetIcon("BLANK");
  browser.browserAction.setTitle({
    // Screen readers can see the title
    title: has_clacks ? current_clacks : "Nothing in the overhead" ,
    tabId: currentTab.id
  });
}

// checkTime
// Update clacks message char on loop, if we have any
function checkTime() {
  if (has_clacks === true) {
	  loop = loop + 1;
	  if (loop > 1) { loop = 0; }
	  if (loop < 1) {
      drySetIcon("BLANK");
		  pos = pos + 1;
	  } else {
		  if ((current_clacks.length - 1) < pos) { pos = 0; };
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

// updateActiveTab
// Handle new tabs to see if we have clacks to deal with or not
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
        pos = 0;
        loop = 0;
	    }
	    updateIcon();
    }
  }

  const gettingActiveTab = browser.tabs.query({ active: true, currentWindow: true });
  gettingActiveTab.then(updateTab);
}

// setGNU
// Find and handle X-Clacks-Overhead headers
function setGNU(e) {
  for (let header of e.responseHeaders) {
    if (header.name.toLowerCase() === "x-clacks-overhead") {
	    if (pages.indexOf(e.url) === -1) {
		    pages.push(e.url);
		    clacks.push(sanitiseMsg(header.value) + "+");
	    }
      break; // Only allow one X-Clacks-Overhead msg per site
    }

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

// Open link to explanatory web page
function openPage() {
  browser.tabs.create({
    url: "http://www.gnuterrypratchett.com/"
  });
}

// Collect messages from gnu.js
function notify(message) {
  if (pages.indexOf(message.url) === -1) {
		pages.push(message.url);
		clacks.push(sanitiseMsg(message.value) + "+");
	}
	updateActiveTab();
}

// Message handler for gnu.js
browser.runtime.onMessage.addListener(notify);

// Click handler for explanatory web page
browser.browserAction.onClicked.addListener(openPage);

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

browser.alarms.onAlarm.addListener(checkTime);
browser.alarms.create('checkTime', {periodInMinutes: 0.01});

// update when the extension loads initially
updateActiveTab();
