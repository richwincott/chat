app.controller("room.controller", ["$scope", "$http", "$state", "$stateParams", "$timeout", "userService", "socketService", "config", function ($scope, $http, $state, $stateParams, $timeout, userService, socketService, config) {
    let vm = this;

    let notifyMe = false;
    vm.editingMessage = -1;
    vm.me = userService.user;
    vm.showDeleted = false;
    vm.defaultAvatar = userService.defaultAvatar;

    $scope.$watch(() => {return userService.user}, function (newValue, oldValue) {
        vm.me = newValue;
    })

    $scope.$watch('vm.uploadedPictureObject', (newValue, oldValue) => {
        if (newValue != oldValue) {
            vm.message = 'data:image/png;base64,' + newValue.base64;
            vm.send();
        }
    })

    socketService.socket().removeListener('messages');
    socketService.socket().removeListener('new-message');
    socketService.socket().removeListener('edited-message');
    socketService.socket().removeListener('removed-message');
    socketService.socket().removeListener('username-change');
    socketService.socket().removeListener('avatar-change');

    vm.messages = [];
    vm.dates = [];
    vm.users = [];

    vm.gif;
    vm.gif_query = "";
    vm.giphy_offset = 0;

    socketService.socket().on('users', function(data) {
        vm.users = data;
        $scope.$apply();
    })

    socketService.socket().on('messages', function(data) {
        vm.messages = data;
        formatMessages();
        $scope.$apply();
        scrollToBottom();
    })

    socketService.socket().on('new-message', function(data) {
        vm.messages.push(data);
        formatMessages();
        $scope.$apply();
        scrollToBottom();
    })

    socketService.socket().on('edited-message', function(data) {
        vm.messages[data.index].message = data.newMessage;
        vm.messages[data.index].edited = true;
        formatMessages();
        $scope.$apply();
    })

    socketService.socket().on('removed-message', function(data) {
        vm.messages[data].deleted = true;
        formatMessages();
        $scope.$apply();
    })

    socketService.socket().on('username-change', function(data) {
        for (let key in vm.users) {
            if (key == data.userId) {
                vm.users[key].userName = data.newName;
            }
        };
        $scope.$apply();
    })

    socketService.socket().on('avatar-change', function(data) {
        for (let key in vm.users) {
            if (key == data.userId) {
                vm.users[key].avatar = data.newAvatar;
            }
        };
        $scope.$apply();
    })

    socketService.socket().emit('join', $stateParams.roomName);
    socketService.socket().emit('fetch-messages');
    socketService.socket().emit('fetch-users');

    vm.fetchGif = function () {
        vm.gif = undefined;
        vm.giphy_offset++;
        $http.get('http://api.giphy.com/v1/gifs/search?q=' + vm.giphy_query + '&api_key=' + config.giphyApiKey + '&limit=1&offset=' + (vm.giphy_offset - 1))
            .then((response) => {
                vm.gif = response.data.data[0];
            })
    }

    vm.sendGif = function () {
        vm.message = vm.gif.images.downsized.url;
        vm.send();
        vm.gif = undefined;
        vm.gif_query = "";
    }

    vm.cancelGif = function () {
        vm.gif = undefined;
        vm.gif_query = "";
        vm.message = "";
    }

    vm.send = function () {
        vm.gif = undefined;
        if (vm.message.indexOf('/giphy ') > -1) {
            vm.giphy_query = vm.message.split('/giphy ')[1];
            vm.giphy_offset = 0;
            vm.fetchGif();
            return;
        }
        if (vm.message.length > 0) {
            if (vm.editingMessage > -1) {
                socketService.socket().emit('edit-message', {
                    newMessage: vm.message,
                    index: vm.editingMessage
                });
                vm.message = "";
            }
            else {
                socketService.socket().emit('new-message', vm.message);
                vm.message = "";
            }
        }
        vm.editingMessage = -1;
    }

    vm.editMessage = function (message) {
        vm.editingMessage = vm.messages.indexOf(message);
        vm.message = vm.messages[vm.editingMessage].message;
    }

    vm.removeMessage = function (message) {
        socketService.socket().emit("remove-message", vm.messages.indexOf(message));
    }

    vm.toggleDeleted = function () {
        vm.showDeleted = !vm.showDeleted
        formatMessages(true);
    }

    vm.openUploadDialog = function () {
        angular.element(".pictureUpload")[0].click();
    }

    function formatMessages(clear) {
        if (clear) {
            vm.dates = [];
        }
        vm.messages.forEach((message) => {
            if ((!message.deleted || (vm.me.admin && vm.showDeleted)) && vm.dates.indexOf(message.dateTime.split('T')[0]) == -1) {
                vm.dates.push(message.dateTime.split('T')[0]);
            }
        })
    }

    function scrollToBottom() {
        $timeout(() => {
            angular.element(".messages")[0].scrollTo(0, angular.element(".messages")[0].scrollHeight);
        }, 100);
    }
}])