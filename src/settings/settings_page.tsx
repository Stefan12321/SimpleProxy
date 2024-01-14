import 'bootstrap/dist/css/bootstrap.min.css';
import React, {ReactNode, useEffect, useState} from "react";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
// import {chrome} from 'jest-chrome'
import Proxy from "../proxy";

const patterns: { [key: string]: RegExp } = {
    "{hostname}:{port}:{username}:{password}": /^([a-zA-Z0-9.-]+):(\d+)+:([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)$/,
    "{hostname}:{port}@{username}:{password}": /^([a-zA-Z0-9.-]+):(\d+)+@([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)$/,
    "{username}:{password}:{hostname}:{port}": /^([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+):([a-zA-Z0-9.-]+):(\d+)$/,
    "{username}:{password}@{hostname}:{port}": /^([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)@([a-zA-Z0-9.-]+):(\d+)$/,
}

function SettingsContainer({blockName, children}: { blockName: string, children?: ReactNode }) {
    return (<div className="p-5 mb-4 bg-body-tertiary rounded-3 selfproxy-container">
        <div className="container-fluid py-5">
            <h2>{blockName}</h2>
            {children}
        </div>
    </div>);
}

function Select({itemsArr, selectId, onChange}: {
    itemsArr: string[],
    selectId: string,
    onChange?: ((e: React.ChangeEvent<HTMLSelectElement>) => void) | undefined,
}) {
    // Handle default selected element

    // Generate option components
    const itemComponents = itemsArr.map((element) => (
        <option value={element} key={element}>
            {element}
        </option>
    ));

    return (
        <select
            className="form-select"
            name={selectId}
            id={selectId}
            onChange={onChange}
        >
            {itemComponents}
        </select>
    );
}


function SelectProfile({proxies, setProxy}: {
    proxies: Proxy[],
    setProxy: React.Dispatch<React.SetStateAction<Proxy | undefined>>
}) {
    // const namesArray: string[] = proxies.map(obj => obj.name);
    const [namesArray, setNamesArray] = useState<string[]>([]);
    const [show, setShow] = useState(false);
    const [newAccountName, setNewAccountName] = useState<string>('');
    const [selectedProfile, setSelectedProfile] = useState<string>('');

    useEffect(() => {
        chrome.storage.local.get(["selectedProxy", "proxy"], (result) => {
            setSelectedProfile(result["selectedProxy"] || '');
            setNamesArray(result["proxy"].map((obj: { name: any; }) => obj.name));
        });
    }, []);

    const handleAddProfile = () => {
        setShow(true);
    }

    const handleClose = () => {
        setShow(false);
    }

    const handleSave = () => {
        chrome.storage.local.get(["proxy"], (result) => {
            const existingProxies = result["proxy"] || [];
            const names = existingProxies.map((obj: Proxy) => obj.name);

            if (!names.includes(newAccountName)) {
                const newProxy = new Proxy({name: newAccountName});
                existingProxies.push(newProxy);
                const updatedNamesArray = [...namesArray, newAccountName];
                setNamesArray(updatedNamesArray);
                setSelectedProfile(newProxy.name);
                setProxy(newProxy);
                chrome.storage.local.set({"proxy": existingProxies, "selectedProxy": newProxy.name}, () => {
                    setShow(false);

                });
            }
        });
    }

    const handleOnSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProfileName = e.target.value;
        setSelectedProfile(newProfileName);

        chrome.storage.local.get(["proxy"], (result) => {
            const selectedProxy = result.proxy.find((obj: Proxy) => obj.name === newProfileName);
            setProxy(selectedProxy);
            chrome.storage.local.set({"selectedProxy": newProfileName});
        });
    }

    const handleDeleteProfile = () => {
        chrome.storage.local.get(["proxy"], (result) => {
            const updatedProxies = (result["proxy"] || []).filter((obj: Proxy) => obj.name !== selectedProfile);
            const updatedNamesArray = namesArray.filter((obj: string) => obj !== selectedProfile);
            if (updatedNamesArray.length > 0) {
                setNamesArray(updatedNamesArray);
                chrome.storage.local.set({"proxy": updatedProxies, "selectedProxy": updatedNamesArray[0]}, () => {
                    setShow(false);
                    const selectedProxy = result.proxy.find((obj: Proxy) => obj.name === updatedNamesArray[0]);
                    setProxy(selectedProxy);
                });
            }

        });
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewAccountName(e.target.value);
    }

    return (
        <>
            <div className="row">
                <div className="col-6">
                    <select className="form-select" name="selectProfile" id="selectProfile" onChange={handleOnSelect}
                            value={selectedProfile}>
                        {namesArray.map(name => (
                            <option value={name} key={name}>{name}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2 col-3">
                    <Button variant="primary" onClick={handleAddProfile}>
                        Create profile
                    </Button>
                </div>
                <div className="col-md-2 col-3">
                    <Button variant="danger" onClick={handleDeleteProfile}>
                        Delete profile
                    </Button>
                </div>
            </div>
            <Modal show={show} onHide={handleClose} size="sm">
                <Modal.Header closeButton>
                    <Modal.Title>Create profile</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input className="form-control" type="text" id="newProfileInput" placeholder="profile name"
                           onChange={handleInputChange}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Create
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}


function ProxySettingsTable({proxy, setProxy}: { proxy: Proxy, setProxy: React.Dispatch<any> }) {
    const [show, setShow] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const handleClose = () => setShow(false);
    const handleSave = () => {
        setShow(false);
    }
    const handleShow = () => setShow(true);
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };
    const handleServerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newServer = e.target.value;
        setProxy({...proxy, server: newServer});
    };

    const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPort = e.target.value;
        setProxy({...proxy, port: parseInt(newPort, 10)});
    };
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setProxy({...proxy, password: newPassword});
    };
    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLogin = e.target.value;
        setProxy({...proxy, login: newLogin});
    };

    return (
        <div>
            <table className="table table-bordered" aria-describedby="proxySettings" id="proxyTable">
                <thead>
                <tr>
                    <th scope="col">№</th>
                    <th scope="col">Protocol</th>
                    <th scope="col">Server</th>
                    <th scope="col">Port</th>
                    <th scope="col">Auth</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <th scope="row">1</th>
                    <td>
                        <Select itemsArr={["http", "https", "socks5"]} selectId={"protocols"}/>
                    </td>
                    <td>
                        <input className="form-control" type="text" id="serverInput" placeholder="Server"
                               value={proxy.server} onChange={handleServerChange}/>
                    </td>
                    <td>
                        <input className="form-control" type="text" id="portInput" placeholder="Port"
                               value={proxy.port} onChange={handlePortChange}/>
                    </td>
                    <td>
                        <button type="button" className="btn btn-primary" onClick={handleShow}>
                            Set authentication
                        </button>
                    </td>
                </tr>
                </tbody>
            </table>
            <Modal show={show} onHide={handleClose} size="sm">
                <Modal.Header closeButton>
                    <Modal.Title>Authentication</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input className="form-control" type="text" id="loginInput" placeholder="login"
                           value={proxy.login} onChange={handleLoginChange}/>
                    <div className="input-group">
                        <input className="form-control" type={showPassword ? 'text' : 'password'} id="passwordInput"
                               placeholder="password" value={proxy.password} onChange={handlePasswordChange}/>
                        <button className="btn btn-outline-secondary" type="button" id="togglePassword"
                                onClick={togglePasswordVisibility}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                 className="bi bi-eye-fill" viewBox="0 0 16 16">
                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                                <path
                                    d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                            </svg>
                        </button>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>

    )
}

function AutoSwitchTable({
                             proxy
                         }: {
    proxy: Proxy
}) {
    const [urls, setUrls] = useState<string[]>([]);
    useEffect(() => {
        if (proxy) {
            // Update urls when proxy changes
            setUrls(proxy.urls || []);
        }
    }, [proxy]);

    const handleDelete = (index: number) => {
        setUrls((prevUrls) => {
            const updatedUrls = [...prevUrls];
            updatedUrls.splice(index, 1);
            return updatedUrls;
        });
    };

    const handleAddRow = () => {
        setUrls((prevUrls) => [...prevUrls, ""]);
    };

    const handleInputChange = (index: number, value: string) => {
        setUrls((prevUrls) => {
            const updatedUrls = [...prevUrls];
            updatedUrls[index] = value;
            return updatedUrls;
        });
    };

    const handleSave = async () => {
        try {
            const result = await chrome.storage.local.get(["proxy"]);
            const updatedProxy = {...result.proxy[0], urls};
            await chrome.storage.local.set({"proxy": [updatedProxy]});
        } catch (error) {
            console.error(error);
        }
    };

    const elements = urls.map((site, index) => (
        <tr key={index}>
            <th scope="row">{index + 1}</th>
            <td>
                <input
                    className="form-control"
                    type="text"
                    placeholder="URL"
                    value={site}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                />
            </td>
            <td className="text-end">
                <button
                    className="btn btn-danger deleteBtn"
                    onClick={() => handleDelete(index)}
                >
                    Delete
                </button>
            </td>
        </tr>
    ));

    console.log(elements);

    return (
        <div>
            <table className="table table-bordered" id="urlTable">
                <caption>Add here sites for autoproxy example: *google.com</caption>
                <thead>
                <tr>
                    <th scope="col">№</th>
                    <th scope="col">URL</th>
                    <th scope="col">Delete</th>
                </tr>
                </thead>
                <tbody>{elements}</tbody>
            </table>
            <div className="buttons-container">
                <button
                    id="addRowBtn"
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddRow}
                >
                    ➕ Add row
                </button>
                <button
                    id="saveUrls"
                    type="button"
                    className="btn btn-success"
                    onClick={handleSave}
                >
                    Save
                </button>
            </div>
        </div>
    );
}

function ImportExportSettings() {
    return (
        <div>
            <button id="downloadSettings" type="button" className="btn btn-dark import-export-button">Download
                settings
            </button>
            <button id="uploadSettings" type="button" className="btn btn-dark import-export-button">Upload settings
            </button>
        </div>

    );
}

function OneRowProxyInput() {
    const inputValidator = () => {

    }
    return (<>
        <label htmlFor="oneLineInput">Place here one line proxy from gonzoproxy</label>
        <input
            className="form-control" type="text" id="oneLineInput"
            placeholder="{username}:{password}@{hostname}:{port}" onChange={inputValidator}/>
    </>);
}

function SettingsPage() {

    const [proxies, setProxies] = useState<Proxy[]>([]);
    const [proxy, setProxy] = useState<Proxy>();

    useEffect(() => {
        // Fetch data from chrome.storage.local
        chrome.storage.local.get(['proxy', 'selectedProxy'], (result) => {
            if (chrome.runtime.lastError) {
                // Handle error if any
                console.error(chrome.runtime.lastError);
            } else {
                // Set the retrieved proxy value in state
                let proxies: Proxy[] = []
                for (const element of result.proxy) {
                    proxies.push(
                        new Proxy(element)
                    );
                }
                setProxies(proxies);
                const selectedProxy = proxies.find((obj: { name: string; }) => obj.name === result["selectedProxy"]);
                setProxy(selectedProxy);

            }
        });
    }, []);
    const useHandleApply = () => {
        const oneLineInput = document.getElementById('oneLineInput') as HTMLInputElement;
        const selectedOption = document.getElementById("lineFormat") as HTMLSelectElement;
        let pattern = patterns[selectedOption.value];
        let result = pattern.exec(oneLineInput.value);

        if (result) {
            oneLineInput.classList.remove("is-invalid");
            oneLineInput.classList.add("is-valid");
            let login = result[1];
            let password = result[2];
            let server = result[3];
            let port = parseInt(result[4], 10);
            if (proxy !== undefined) {
                proxy.login = login;
                proxy.password = password;
                proxy.server = server;
                proxy.port = port;
                setProxy({...proxy, login: login, password: password, server: server, port: port});
            }
        } else if (oneLineInput.value !== "") {
            oneLineInput.classList.remove("is-valid");
            oneLineInput.classList.add("is-invalid");
        } else {
            console.log("oneLineInput is empty");
        }
        if (proxy !== undefined) {
            chrome.storage.local.get(["proxy"], (result) => {

                let proxies = result["proxy"];
                const updatedArray = proxies.map((obj: { name: string; }) => {
                    if (obj.name === proxy.name) {
                        return proxy;
                    }
                    return obj;
                });
                chrome.storage.local.set({"proxy": updatedArray});
            })
        }


    }

    if (proxies.length !== 0 && proxy !== undefined) {
        return (
            <div className="container py-4">
                <SettingsContainer blockName={"Global proxy settings"}>
                    <SelectProfile proxies={proxies} setProxy={setProxy}/>

                </SettingsContainer>
                <SettingsContainer blockName={"Proxy settings"}>
                    <ProxySettingsTable proxy={proxy} setProxy={setProxy}/>
                    <div className="py-2">
                        <label htmlFor="lineFormat">One line proxy format</label>
                        <Select itemsArr={["{hostname}:{port}:{username}:{password}",
                            "{hostname}:{port}@{username}:{password}",
                            "{username}:{password}:{hostname}:{port}",
                            "{username}:{password}@{hostname}:{port}"]} selectId={"lineFormat"}/>
                    </div>
                    <div className="py-2">
                        <OneRowProxyInput/>
                    </div>
                    <Button variant={"success"} onClick={useHandleApply}>Apply</Button>
                </SettingsContainer>
                <SettingsContainer blockName={"Auto switch settings"}>
                    <AutoSwitchTable proxy={proxy}/>
                </SettingsContainer>
                <SettingsContainer blockName={"Import / Export settings"}>
                    <ImportExportSettings/>
                </SettingsContainer>
                <footer className="pt-3 mt-4 text-body-secondary border-top">
                    © 2023
                </footer>
            </div>

        );
    } else {
        return (<p>Loading..</p>)
    }
}

export default SettingsPage;
