import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import SettingsPage from "./settings_page";
import {chrome} from 'jest-chrome'

describe('SettingsPage', () => {

    beforeEach(() => {

        // Mock chrome.storage.local.get to return a sample proxy object
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            const result = {
                proxy: [
                    {
                        name: 'Sample Proxy',
                        password: 'password123',
                        login: 'username',
                        server: 'proxy.example.com',
                        port: 8080,
                        scheme: 'http',
                        urls: ['example.com', 'google.com'],
                        mode: 'direct',
                    },
                ],
            };

            callback(result);
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    test('render containers', async () => {
        render(<SettingsPage/>);
        await waitFor(() => {
            expect(screen.getByText('Global proxy settings')).toBeInTheDocument();
        });
        const linkElement = screen.getByText(/Global proxy settings/i);
        const linkElement1 = screen.getByText('Proxy settings');
        const linkElement2 = screen.getByText(/Auto switch settings/i);
        const linkElement3 = screen.getByText('Import / Export settings');
        expect(linkElement).toBeInTheDocument();
        expect(linkElement1).toBeInTheDocument();
        expect(linkElement2).toBeInTheDocument();
        expect(linkElement3).toBeInTheDocument();

    });
    test('renders loading message while fetching data', async () => {
        render(<SettingsPage/>);

        await waitFor(() => {
            const loadingText = screen.queryByText('Loading..');
            expect(loadingText).not.toBeInTheDocument();
        });
    });

    test('renders settings page with proxy data', async () => {
        render(<SettingsPage/>);
        await waitFor(() => {
            expect(screen.getByText('Global proxy settings')).toBeInTheDocument();
        });

        // Check if the proxy data is rendered correctly
        const proxyName = screen.getByText('Sample Proxy');
        expect(proxyName).toBeInTheDocument();

        const serverInput = screen.getByPlaceholderText('Server') as HTMLInputElement;
        expect(serverInput.value).toBe('proxy.example.com');

        const portInput = screen.getByPlaceholderText('Port') as HTMLInputElement;
        expect(portInput.value).toBe('8080');

    });

    test('updates proxy server value on input change', async () => {
        render(<SettingsPage/>);
        await waitFor(() => {
            expect(screen.getByText('Global proxy settings')).toBeInTheDocument();
        });

        const serverInput = screen.getByPlaceholderText('Server') as HTMLInputElement;
        fireEvent.change(serverInput, {target: {value: 'newproxy.example.com'}});

        expect(serverInput.value).toBe('newproxy.example.com');
    });

    test('modal window', async () => {
        render(<SettingsPage/>);
        await waitFor(() => {
            expect(screen.getByText('Global proxy settings')).toBeInTheDocument();
        });

        expect(document.body.classList.contains('modal-open')).toBe(false);
        const button = screen.getByText('Set authentication');
        fireEvent.click(button);
        expect(document.body.classList.contains('modal-open')).toBe(true);
    });
    // test('Apply', async () => {
    //
    //
    //     render(<SettingsPage/>);
    //     await waitFor(() => {
    //         expect(screen.getByText('Global proxy settings')).toBeInTheDocument();
    //     });
    //
    //     const inputServer = screen.getByPlaceholderText('Server') as HTMLInputElement;
    //     const inputPort = screen.getByPlaceholderText('Port') as HTMLInputElement;
    //     fireEvent.change(inputServer, {target: {value: 'Hello'}});
    //     fireEvent.change(inputPort, {target: {value: 'World'}});
    //
    //     const button = screen.getByText('Apply');
    //     fireEvent.click(button);
    //     expect()
    //
    //
    // });
});


