app.factory('userService', function () { 

    return {
        user: {},
        setUser: function (_user) {
            this.user = _user;
        }
    }

 });