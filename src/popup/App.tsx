import 'bootstrap/dist/css/bootstrap.min.css';
// import {chrome} from 'jest-chrome'
import React, {SetStateAction, useEffect, useState} from "react";
import Proxy from "../proxy";
import {proxyModeAutoswitch, proxyModeDirect, proxyModeProxy} from "../proxy_controller";

function ModeButton({modeName, active, onClick, lock}: Readonly<{
    modeName: string;
    active: boolean;
    onClick: () => void;
    lock: boolean
}>) {

    return (
        <button
            type="button"
            className={`list-group-item list-group-item-action button-with-lock ${active ? 'active' : ''}`}
            onClick={onClick}
        >
            {modeName} <img src="../img/icons/lock.svg" alt="lock" className={lock && active ? "locked" : "unlocked"}/>
        </button>
    );
}

function IpChecker() {
    const [ip, setIp] = useState();
    const [ipTimestamp, setIpTimestamp] = useState<number>();

    useEffect(() => {
        const interval = setInterval(() => {
            chrome.storage.local.get(["simpleProxy"], (result) => {
                const ip = result.simpleProxy.ip;
                const ipTimestamp = parseInt(result.simpleProxy.ipCheckTimestamp, 10);
                const currentTimestamp: number = Date.now();
                const timeDifferent = (currentTimestamp - ipTimestamp) / 1000;
                setIpTimestamp(timeDifferent);
                setIp(ip);
            })
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const handleCopyButton = () => {
        if (ip !== undefined) {
            navigator.clipboard.writeText(ip);
        }

    }
    return (
        <div className="ip-container">
            <button id="copy-button" onClick={handleCopyButton}>
                <img src="../img/icons/copy_icon.svg" alt="Copy IP"/>
            </button>
            <div id="ipStr">IP: <span id="IP">{ip}</span> (last check: <span id="lastCheck">{ipTimestamp}</span> seconds
                ago)
            </div>
        </div>
    );
}

function IpControlSwitch({ipControl, setIpControl}: Readonly<{
    ipControl: boolean,
    setIpControl: React.Dispatch<SetStateAction<boolean>>
}>) {
    const handleIpControlTangle = () => {
        setIpControl(!ipControl);
        chrome.storage.local.get(["simpleProxy"], (result) => {
            result.simpleProxy.ipControl = !result.simpleProxy.ipControl;
            chrome.storage.local.set(result);
        })

    }

    return (
        <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" role="switch" id="ipControl"
                   onClick={handleIpControlTangle} checked={ipControl}/>
            <label className="form-check-label" htmlFor="ipControl">IP control</label>
        </div>
    );
}

function SettingsButton() {
    const handleSettingsClick = () => {
        chrome.tabs.create({url: 'js/settings.html'},);

    };
    return (
        <button className="btn btn-success" id="settingsButton" onClick={handleSettingsClick}>Open settings</button>);
}

function App() {
    const [proxies, setProxies] = useState<Proxy[]>([]);
    let [proxy, setProxy] = useState<Proxy>();
    const [ipControl, setIpControl] = useState(false);
    const [buttons, setButtons] = useState<{ modeName: string; active: boolean }[]>([]);
    const [lock, setLock] = useState(false);

    (window as any).modeDirect = proxyModeDirect;
    (window as any).modeProxy = proxyModeProxy;
    (window as any).modeAutoswitch = proxyModeAutoswitch;
    (window as any).proxy = proxy;

    useEffect(() => {
        // Fetch data from chrome.storage.local
        chrome.storage.local.get(["simpleProxy"], (result) => {
            if (chrome.runtime.lastError) {
                // Handle error if any
                console.error(chrome.runtime.lastError);
            } else {
                // Set the retrieved proxy value in state
                let proxies: Proxy[] = []
                let selectedProxy: Proxy;
                let locker: boolean = false;

                const changeObject: { [key: string]: string | boolean | Proxy[] } = {};
                if (!result.hasOwnProperty("simpleProxy")){
                    result.simpleProxy = {};
                }

                if (result.simpleProxy.hasOwnProperty('proxy')) {
                    for (const element of result.simpleProxy.proxy) {
                        proxies.push(
                            new Proxy(element)
                        );
                    }

                } else {
                    proxies.push(
                        new Proxy()
                    );
                    changeObject['proxy'] = proxies;
                }
                setProxies(proxies);


                if (result.simpleProxy.hasOwnProperty('selectedProxy')) {
                    const foundProxy = proxies.find(obj => obj.name === result.simpleProxy["selectedProxy"])
                    if (foundProxy !== undefined) {
                        selectedProxy = foundProxy;

                    } else {
                        selectedProxy = proxies[0];
                        changeObject['selectedProxy'] = selectedProxy.name;
                    }

                } else {
                    selectedProxy = proxies[0];
                    changeObject['selectedProxy'] = selectedProxy.name;
                }

                if (result.simpleProxy.hasOwnProperty('locker')) {
                    locker = result.simpleProxy['locker'];
                } else {
                    changeObject['locker'] = false;
                }
                if (result.simpleProxy.hasOwnProperty('ipControl')) {
                    if (result.simpleProxy["ipControl"]) {
                        setIpControl(true);
                    } else {
                        setIpControl(false);
                    }
                } else {
                    setIpControl(false);
                    changeObject['ipControl'] = false;
                }
                console.log("selected proxy");
                console.log(selectedProxy);
                setProxy(selectedProxy);
                if (selectedProxy.mode === "direct" && !locker) {
                    proxyModeDirect(selectedProxy);
                    console.log("DIRECT");
                } else if (selectedProxy.mode === "proxy" && !locker) {
                    proxyModeProxy(selectedProxy);
                    console.log("proxy");
                } else if (selectedProxy.mode === "autoswitch" && !locker) {
                    proxyModeAutoswitch(selectedProxy);
                    console.log(selectedProxy);
                    console.log("autoswitch");
                } else {
                    console.error("There is wrong proxy mode selected!")
                }
                result.simpleProxy = changeObject
                chrome.storage.local.set(result);
            }
        });
    }, []);

    useEffect(() => {
        if (proxy !== undefined) {
            const initialButtons = [
                {modeName: 'Direct', active: proxy.mode === 'direct'},
                {modeName: 'Proxy', active: proxy.mode === 'proxy'},
                {modeName: 'Autoswitch', active: proxy.mode === 'autoswitch'},
            ];
            setButtons(initialButtons);
        }
    }, [proxy]);
    // TODO  I think it would work with chrome.tabs.sendMessage and chrome.runtime.onMessage.addListener
    useEffect(() => {
        const interval = setInterval(() => {
            chrome.storage.local.get(["simpleProxy"], (result) => {
                if (result.simpleProxy.hasOwnProperty('locker')) {
                    const locker = result.simpleProxy['locker'];
                    setLock(locker);

                }
            })
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const handleButtonClick = (index: number) => {
        const updatedButtons = buttons.map((button, i) => {
            if (lock) {
                setLock(false);
                chrome.storage.local.get(["simpleProxy"], (result) => {
                    result.simpleProxy.locker = false;
                    chrome.storage.local.set(result);
                })

                chrome.action.setIcon({path: '/img/icons/simpleProxy-128.png'})
            }
            if (i === index) {
                if (button.modeName === "Direct" && proxy !== undefined) {
                    proxyModeDirect(proxy);
                } else if (button.modeName === "Proxy" && proxy !== undefined) {
                    proxyModeProxy(proxy);
                } else if (button.modeName === "Autoswitch" && proxy !== undefined) {
                    proxyModeAutoswitch(proxy);
                }
                return {...button, active: true};

            }
            return {...button, active: false}; // Deactivate other buttons
        });
        setButtons(updatedButtons);
    };

    return (
        <div className="App">
            <IpChecker/>
            <h1>Proxy name: {proxy?.name}</h1>
            <div>
                <ul className="list-group">
                    {buttons.map((button, index) => (
                        <ModeButton
                            key={index}
                            modeName={button.modeName}
                            active={button.active}
                            onClick={() => handleButtonClick(index)}
                            lock={lock}/>
                    ))}
                </ul>
            </div>

            <IpControlSwitch ipControl={ipControl} setIpControl={setIpControl}/>
            <SettingsButton/>
        </div>
    );
}

export default App;