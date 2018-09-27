app.controller("home.controller", ["$scope", "$state", "$stateParams", "$timeout", "userService", "socketService", function ($scope, $state, $stateParams, $timeout, userService, socketService) {
    let vm = this;

    socketService.socket().removeAllListeners();

    function ping() {
        $timeout(() => {
            socketService.socket().emit('ping');
            ping();
        }, 5000);
    }

    ping();

    vm.loggedIn = false;
    vm.me = userService.user;
    vm.uploadedAvatarObject = {};
    vm.rooms = [];
    vm.users = [];
    vm.roomName = $stateParams.roomName;
    vm.adminError = {
        success: true,
        message: ""
    };
    vm.showAdminLogin = true;
    vm.showOffline = false;
    vm.tabState = "rooms"

    $scope.$watch(() => {return userService.user}, function (newValue, oldValue) {
        vm.me = newValue;
    })

    socketService.socket().emit('fetch-rooms');
    socketService.socket().emit('fetch-users');

    socketService.socket().on('rooms', function(data) {
        vm.rooms = data;
        $scope.$apply();
    })

    socketService.socket().on('users', function(data) {
        vm.users = data;
        $scope.$apply();
    })

    if (localStorage.getItem('id') !== null) {
        socketService.socket().emit('login', { id: parseInt(localStorage.getItem('id')) });
        vm.loggedIn = true;
    }

    vm.login = function () {
        if (vm.userName && vm.userName.length > 0) {
            socketService.socket().emit('new-user', { username: vm.userName }, function(data) {
                if (data) {
                    vm.loggedIn = true;
                }
                else {
                    vm.error = "That username is already taken, please try again.";
                    vm.userName = "";
                }
                $scope.$apply();
            });
        }
    }

    socketService.socket().on('authenticated', (data) => {

        localStorage.setItem('id', data.id);

        userService.setUser(data);
        if (data.admin) { vm.showAdminLogin = false };
    
        socketService.socket().on('new-room', function(data) {
            vm.rooms.push(data);
            $scope.$apply();
        })
    
        vm.selectRoom = function (roomName) {
            vm.roomName = roomName;
            vm.me.currentRoom = roomName;
            $state.go('home.room', {roomName: roomName});
        }
    
        vm.createRoom = function () {
            if (vm.newRoomName.length > 0) {
                socketService.socket().emit('new-room', vm.newRoomName);
                vm.newRoomName = "";
            }
        }
    
        vm.setName = function () {
            if (vm.me.userName.length > 0) {
                socketService.socket().emit('set-name', vm.me.userName)
            }
        }

        vm.checkKey = function () {
            if (vm.adminKey && vm.adminKey.length > 0) {
                vm.adminError.message = "";
                socketService.socket().emit('check-key', vm.adminKey, function(result) {
                    if (result) {
                        vm.adminError.success = true;
                        vm.adminError.message = "Success: You are now an admin!"
                        vm.me.admin = true;
                        vm.adminKey = "";
                        $timeout(function () {
                            vm.showAdminLogin = false;
                        }, 4000);
                    }
                    else {
                        vm.adminError.success = false;
                        vm.adminError.message = "Wrong key entered.."
                    }
                })
            }
        }
        
        $scope.$watch('vm.uploadedAvatarObject', (newValue, oldValue) => {
            if (newValue != oldValue) {
                vm.me.avatar = 'data:image/png;base64,' + newValue.base64;
                socketService.socket().emit('set-avatar', vm.me.avatar);
            }
        })
    })
}])