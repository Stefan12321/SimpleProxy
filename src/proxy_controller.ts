import Proxy from "./proxy";

export function proxyModeDirect(proxy: Proxy) {
    proxy.mode = "direct";
    clearProxy();
    updateProxyInStorage(proxy);
}

export function proxyModeProxy(proxy: Proxy) {
    proxy.mode = "proxy";
    setUpProxy(proxy, false);
    updateProxyInStorage(proxy);
}

export function proxyModeAutoswitch(proxy: Proxy) {
    proxy.mode = "autoswitch";
    setUpProxy(proxy, true);
    updateProxyInStorage(proxy);
}

function setUpProxy(proxy: Proxy, autoswitch: boolean) {

    const {login, password, server, port, scheme, urls} = proxy;

    // Check if all values exist
    if (login !== undefined &&
        password !== undefined &&
        server !== undefined &&
        port !== undefined &&
        scheme !== undefined) {

        let config: object;
        const pacScript = `function FindProxyForURL(url, host) {
    function match(first, second)
{
    if (first.length == 0 && second.length == 0)
        return true;

    if (first.length > 1 && first[0] == '*' &&
        second.length == 0)
        return false;

    if ((first.length > 1 && first[0] == '?') ||
        (first.length != 0 && second.length != 0 &&
        first[0] == second[0]))
        return match(first.substring(1),
                    second.substring(1));

    if (first.length > 0 && first[0] == '*')
        return match(first.substring(1), second) ||
            match(first, second.substring(1));

    return false;
}
    // Your proxy server name and port
    var proxyserver = "${server + ":" + port}";

    //
    //  Here's a list of hosts to connect via the PROXY server
    //
    var wildList = ${JSON.stringify(urls)};
    for (const wild of wildList) {
  if (match(wild, host)) {
    return "PROXY " +  proxyserver;
  } 
}
return "DIRECT";
}`;

        if (autoswitch) {
            config = {
                mode: "pac_script",
                pacScript: {
                    data: pacScript
                }
            };
        } else {
            config = {
                mode: 'fixed_servers',
                rules: {
                    singleProxy: {
                        scheme: scheme,
                        host: server,
                        port: port,
                    },
                    bypassList: ['localhost']
                }
            }
        }
        const target = "https://httpbin.org/basic-auth/*";

        const pendingRequests: any[] = [];

        const completed = (requestDetails: { requestId: any; }) => {
            console.log(`completed: ${requestDetails.requestId}`);
            let index = pendingRequests.indexOf(requestDetails.requestId);
            if (index > -1) {
                pendingRequests.splice(index, 1);
            }
        }

        const provideCredentialsAsync = (requestDetails: { requestId: any; }) => {
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

        /*
         * A request has completed. We can stop worrying about it.
         */


        chrome.webRequest.onAuthRequired.addListener(
            provideCredentialsAsync,
            {urls: ["<all_urls>"]},
            ["blocking"],
        );

        chrome.webRequest.onCompleted.addListener(completed, {urls: [target]});

        chrome.webRequest.onErrorOccurred.addListener(completed, {urls: [target]});


        chrome.proxy.settings.set({value: config, scope: 'regular'}, function () {
            console.log('Proxy is set!');
        });
    }
}


function clearProxy() {
    chrome.proxy.settings.clear({scope: 'regular'}, function () {
        console.log('Прокси-сервер удален');
    });
}

function updateProxyInStorage(proxy: Proxy) {
    chrome.storage.local.get((result) => {

        let proxies = result['proxy'];
        const proxyIndex = proxies.findIndex((obj: { name: string; }) => obj.name === proxy.name);
        proxies[proxyIndex] = proxy;
        chrome.storage.local.set({"proxy": proxies});
    })
}