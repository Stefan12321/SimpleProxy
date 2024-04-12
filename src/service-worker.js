const urlsCheckIp = ['https://api.seeip.org/jsonip?',
    'https://api.ipify.org?format=json',
    'https://api.my-ip.io/ip.json',
    'https://jsonip.com/'];
let lifeline;


function findObjectByName(array, targetName) {
    return array.find(obj => obj.name === targetName);
}

export async function lockIP(mode) {
    let config = {
        mode: "fixed_servers",
        rules: {
            singleProxy: {
                scheme: "http",
                host: "1.2.3.4"
            },
            bypassList: ["foobar.com"]
        }
    };
    chrome.proxy.settings.set(
        {value: config, scope: 'regular'},
        function () {
        }
    );
    await chrome.storage.local.get("simpleProxy", (result) => {
        result.simpleProxy.locker = true;
        chrome.storage.local.set(result);
    });

    if (typeof document !== 'undefined') {
        let button = document.querySelector(buttonsID[mode]);
        button.children[0].classList = "locked"
    }
    chrome.action.setIcon({path: '/img/icons/simpleProxy_lock_v2-128.png'})


}


function fetchWithTimeout(url, options, timeout = 5000) {
    // Create a promise that rejects after the specified timeout
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error('Request timed out'));
        }, timeout);
    });

    // Create a fetch request promise
    const fetchPromise = fetch(url, options);

    // Use Promise.race() to race between the fetch request and the timeout promise
    return Promise.race([fetchPromise, timeoutPromise]);
}


async function checkIpCycle(urls) {
    let currentIndex = 0;
    setInterval(async () => {
        currentIndex = await checkIp(urls, currentIndex);
    }, 500);

}

async function checkIp(urls, currentIndex) {

    try {
        const result = await chrome.storage.local.get(['simpleProxy']);
        const response = await fetchWithTimeout(urls[currentIndex], {method: 'GET'}, 5000);
        let selectedProxy = result.simpleProxy.selectedProxy;
        let proxy = findObjectByName(result.simpleProxy.proxy, selectedProxy);
        if (response.ok) {
            const data = await response.json();
            const oldIp = result.simpleProxy.ip;
            const ipControl = result.simpleProxy.ipControl;
            const ipAddress = data.ip;
            const mode = proxy.mode;

            if (ipControl && ipAddress !== oldIp) {
                lockIP(mode);
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '/img/icons/base_icon_lock.png',
                    title: `Proxy IP changed!`,
                    message: `Your proxy IP was changed. Proxy blocked.\nOld IP: ${oldIp}\nNew IP: ${ipAddress}`,
                    priority: 1
                });

            }
            result.simpleProxy.ip = ipAddress;
            result.simpleProxy.ipCheckTimestamp = Date.now();
            await chrome.storage.local.set(result);
        } else {
            currentIndex = (currentIndex + 1) % urls.length;
        }


    } catch (err) {

        currentIndex = (currentIndex + 1) % urls.length;
    }

    return currentIndex;
}


// Disconnect and reconnect
function keepAliveForced() {
    lifeline?.disconnect();
    lifeline = null;
    keepAlive();
}

async function keepAlive() {
    if (lifeline) {
        return;
    }
    // Locate any eligible tab and connect to it
    for (const tab of await chrome.tabs.query({})) {
        try {
            await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: () => chrome.runtime.connect({
                    name: "KEEPALIVE"
                }),
            });
            return;
        } catch (e) {
        }
    }
}

chrome.runtime.onConnect.addListener((port) => {
    if (port.name == "KEEPALIVE") {
        lifeline = port;
        // Refresh the connection after 1 minute
        setTimeout(keepAliveForced, 6e4);
        port.onDisconnect.addListener(keepAliveForced);
    }
});
// Any tab change means reconnecting may be required
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (info.url && /^(file|https?):/.test(info.url)) {
        keepAlive();
    }
});


function main() {

    keepAlive();
    checkIpCycle(urlsCheckIp);
    chrome.storage.local.get(["simpleProxy"], (result) => {
        let proxies = result.simpleProxy["proxy"];
        let locker = result.simpleProxy["locker"];
        let selectedProxy = result.simpleProxy.selectedProxy;
        let proxy = findObjectByName(result.simpleProxy.proxy, selectedProxy);
        if (locker) {
            lockIP(proxy.mode)
        } else {
            const foundProxy = proxies.find(obj => obj.name === result.simpleProxy["selectedProxy"])
            const login = foundProxy.login;
            const password = foundProxy.password;
            const pendingRequests = [];
            const provideCredentialsAsync = (requestDetails) => {
                console.log("Listener ADDED");
                if (pendingRequests.includes(requestDetails.requestId)) {
                    console.log(`bad credentials for: ${requestDetails.requestId}`);
                    return {cancel: true};
                } else {
                    pendingRequests.push(requestDetails.requestId);
                    console.log(`providing credentials for: ${requestDetails.requestId}`);
                    // we can return a promise that will be resolved
                    // with the stored credentials
                    return {
                        authCredentials: {
                            username: login,
                            password: password
                        }
                    }
                }
            }

            chrome.webRequest.onAuthRequired.addListener(
                provideCredentialsAsync,
                {urls: ["<all_urls>"]},
                ["blocking"],
            );
        }

    });
}

main();



