const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(html, {
    url: 'file://' + __dirname + '/index.html',
    runScripts: 'dangerously',
    resources: 'usable'
});

dom.window.console.log = (...args) => console.log('LOG:', ...args);
dom.window.console.error = (...args) => console.error('ERR:', ...args);
dom.window.console.warn = (...args) => console.warn('WARN:', ...args);

dom.window.addEventListener('error', (event) => {
    console.error('Uncaught exception:', event.error);
});
dom.window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

setTimeout(() => {
    console.log("JSDOM execution finished.");
}, 5000);
