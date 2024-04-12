# SimpleProxy Chrome extension

## Description

SipmpleProxy is a small Chrome extension for using proxy servers. 
The main task of this extension is to monitor the change of the IP on the proxy server and block the connection if the change has occurred.

<div align="center">

![photomaker_demo_fast](assets/asset1)

</div>

## Features
- IP monitoring
- Multi profiling
- Autoswitch mode
- One line proxy settings
## Future Features
- [x] http proxy support
- [ ] https proxy support
- [ ] socs5 proxy support
- [x] Import / export settings via json files

## Build

In the project directory, you can run to build the app inside docker and export binaries to the build folder:
```
docker build --output=build --target=app .
```
Or you can build manually:

```
npm install
npm run build
```

## Install

To install the build Chrome extension you need to follow the next steps:
1. Build an app
2. Open Chrome browser and go to [chrome://extensions/](chrome://extensions/)
3. Enable Developer mode ( look for a checkbox labeled `Developer mode` and ensure it's checked)
4. Click on `Load unpacked` button and select selfproxyReact folder from the build

## Usage
The extension has three modes:
- Direct mode (all sites work without proxy)
- Proxy mode (all sites work with proxy)
- Autoswitch (only sites from auto switch settings work with proxy)

#### IP monitoring
To enable IP monitoring, you need to ensure that the `IP control` checkbox in the popup is checked. When the IP changes,
the extension will lock the connection and show a Windows notification with information about the new IP. The SimpleProxy 
icon will change color to red, and a lock icon will appear in the selected mode button. To unlock the proxy, you need to 
click again on the mode button.

#### Multi profiling
The extension supports multi-profiling, the name of the current profile is shown in the popup `Proxy name:` row.
You can add a new profile in the `Global proxy` settings block on the app settings page 

#### Autoswitch
To set sites for the auto-switch mode, you need to go to the settings page and, inside the `Auto-switch settings` block, 
add or remove certain sites.
> [!WARNING]
> Don't remove sites `*api.seeip.org, *api.ipify.org, *api.my-ip.io, *jsonip.com` it uses for IP monitoring

#### One line proxy settings
On the settings page, in the `Proxy settings` block, you can select the format and paste a one-line proxy setting from your proxy distributor.

