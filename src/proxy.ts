const defaultAutoSwitchPattern = ["*api.seeip.org",
                                            "*api.ipify.org",
                                            "*api.my-ip.io",
                                            "*jsonip.com",
                                            "*whoer.net"]

class Proxy {
    name: string;
    password?: string;
    login?: string;
    server?: string;
    port?: number;
    scheme?: string;
    urls: string[];
    mode?: string;

    constructor(options: {
        name?: string;
        password?: string;
        login?: string;
        server?: string;
        port?: number;
        scheme?: string;
        urls?: string[];
        mode?: string;
    } = {}) {
        const {
            name = 'Base',
            password = "",
            login = "",
            server = "",
            port = 0,
            scheme = 'http',
            urls = defaultAutoSwitchPattern,
            mode = 'direct'
        } = options;

        this.name = name;
        this.password = password;
        this.login = login;
        this.server = server;
        this.port = port;
        this.scheme = scheme;
        this.urls = urls;
        this.mode = mode;
    }
}

export default Proxy