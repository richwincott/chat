const app = angular.module("chat", ['ui.router', 'naif.base64']);

app.factory('config', () => {
    return {
        giphyApiKey: 'P6R7IJSx6B0NB5bnsMeJKRKXFqW2ENeP'
    }
})