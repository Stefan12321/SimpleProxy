import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import App from './App';
import {chrome} from 'jest-chrome'
import * as chromeMock from 'jest-chrome';


describe('Popup', () => {

    test('renders mode buttons', () => {
        render(<App/>);
        const linkElement = screen.getByText(/Proxy/i);
        const linkElement1 = screen.getByText(/Direct/i);
        const linkElement2 = screen.getByText(/AutoSwitch/i);
        expect(linkElement).toBeInTheDocument();
        expect(linkElement1).toBeInTheDocument();
        expect(linkElement2).toBeInTheDocument();

    });
    test('renders open settings buttons', () => {
        render(<App/>);
        const linkElement = screen.getByText(/Open settings/i);
        expect(linkElement).toBeInTheDocument();


    });
    test('opens settings in a new tab when clicked', () => {
        render(<App/>);
        const button = screen.getByText('Open settings');
        fireEvent.click(button);
        // Check if chrome.tabs.create was called with the correct arguments
        expect(chrome.tabs.create).toHaveBeenCalledWith({url: 'js/settings.html'});
    });

});
