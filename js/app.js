
var app = angular.module("app", ['ngSanitize', 'ngRoute', 'ngAnimate', 'ngWebSocket', 'ui.bootstrap', 'nvd3']);

// zmienne globalne
app.value('globals', {
    email: ' ',
    isWorker: null
});


// nowe podstrony i ich kontrolery
app.constant('routes', [
    { route: '/', templateUrl: '/html/home.html', controller: 'Home', controllerAs: 'ctrl', menu: '<i class="fa fa-lg fa-home"></i>', guest: true },
	{ route: '/transfer', templateUrl: '/html/transfer.html', controller: 'Transfer', controllerAs: 'ctrl', menu: 'Przelew' },
    { route: '/history', templateUrl: '/html/history.html', controller: 'History', controllerAs: 'ctrl', menu: 'Historia' },
    { route: '/trend', templateUrl: '/html/trend.html', controller: 'Trend', controllerAs: 'ctrl', menu: 'Trend' },
    { route: '/adminPanel', templateUrl: '/html/admin.html', controller: 'Admin', controllerAs: 'ctrl', menu: 'Panel Administracyjny'},
    { route: '/workerTools', templateUrl: '/html/workerTools.html', controller: 'Worker', controllerAs: 'ctrl', menu: 'Dla pracowników'},
    { route: '/messages', templateUrl: '/html/messages.html', controller: 'Messages', controllerAs: 'ctrl', skipMenu: true},
    { route: '/userConfig', templateUrl: '/html/userConfig.html', controller: 'UserConfig', controllerAs: 'ctrl', skipMenu: true}
]);


app.config(['$routeProvider', '$locationProvider', 'routes', function($routeProvider, $locationProvider, routes) {
    $locationProvider.hashPrefix('');
	for(var i in routes) {
		$routeProvider.when(routes[i].route, routes[i]);
	}
	$routeProvider.otherwise({ redirectTo: '/' });
}]);

app.controller("loginDialog", [ '$http', '$uibModalInstance', 'globals', function($http, $uibModalInstance,globals) {
    var ctrl = this;
    // devel: dla szybszego logowania
    ctrl.creds = { email: 'jim@beam.com', password: 'admin1' };
    ctrl.loginError = false;

    ctrl.tryLogin = function() {
        $http.post('/login', ctrl.creds).then(
            function(rep) {
                $uibModalInstance.close(rep.data); //!!!!!!!!!!!!!!!
            },
            function(err) {
                ctrl.loginError = true;
            }
        );
    };

    ctrl.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };

}]);

 app.controller("applicationDialog", [ '$http', '$uibModalInstance', function($http, $uibModalInstance){
    var ctrl = this;
    ctrl.creds = { applicationEmail: ''};

    ctrl.sendApplication = function() {
        ctrl.applicationError = false;
         if(!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ctrl.creds.applicationEmail))){
            ctrl.applicationAlert = function() {
                return '<span class="label label-danger">Nieprawidłowy email!</span>';
            }
         } else {       
            $http.post('/application',ctrl.creds).then(
                function(rep) {
                    ctrl.applicationAlert = function() {
                        return '<span class="label label-success">Pomyślnie przesłano wniosek!</span>';
                    }
                },
                function(err) {
                    ctrl.applicationError = true;
                    ctrl.applicationAlert = function() {
                        return '<span class="label label-danger">Email jest zarejestrowany lub wniosek został już wysłany!</span>';
                    }  
                }
            );             
         }     
    };

    ctrl.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };
}])

app.controller('Menu', ['$http', '$rootScope', '$scope', '$location', '$uibModal', '$websocket', 'routes', 'globals', 'common',
	function($http, $rootScope, $scope, $location, $uibModal, $websocket, routes, globals, common) {
        var ctrl = this;

        ctrl.alert = common.alert;
        ctrl.menu = [];

        var refreshMenu = function() {
            ctrl.menu = [];
            for (var i in routes) {
                if(routes[i].controller=='Admin' && globals.email!='root@gmail.com') continue;
                if(routes[i].controller=='Worker'  && globals.isWorker === null) continue; 
                if(routes[i].skipMenu) continue; 
                if(routes[i].guest || globals.email) {
                    ctrl.menu.push({route: routes[i].route, title: routes[i].menu});
                }
            }
        };

        $http.get('/login',globals).then(
            function(rep) { 
                globals.email = rep.data.email;
                globals.isWorker = localStorage.getItem("isWorker");
                
                
                refreshMenu();

                try {
                    var dataStream = $websocket('ws://' + window.location.host);
                    dataStream.onMessage(function(rep) {
                        try {
                            var message = JSON.parse(rep.data);
                            for(var topic in message) {
                                $rootScope.$broadcast(topic, message[topic]);
                            }
                        } catch(ex) {
                            console.error('Data from websocket cannot be parsed: ' + rep.data);
                        }
                    });
                    dataStream.send(JSON.stringify({action: 'init', session: rep.data.session}));
                } catch(ex) {
                    console.error('Initialization of websocket communication failed');
                }
            },
            function(err) { globals.email = null; }
        );

        ctrl.isCollapsed = true;

        $scope.$on('$routeChangeSuccess', function () {
            ctrl.isCollapsed = true;
        });

		ctrl.navClass = function(page) {
			return page === $location.path() ? 'active' : '';
        }
        
        ctrl.MessageIcon = function () {
            if(globals.email) {
                $('#Messages').show();
                return '<span class="fa fa-envelope" aria-hidden="true"></span>';
            } else {
                $('#Messages').hide();
            }
        }

        ctrl.userConfigIcon = function () {
            if(globals.email) {
                $('#userConfig').show();
                return '<span class="fa fa-user" aria-hidden="true"></span>';
            } else {
                $('#userConfig').hide();
            }
        };
        
        ctrl.userConfig = function () {
            $location.path('/userConfig');
        };

        ctrl.testmsg = function () {
            $location.path('/messages');
        };

        
		ctrl.loginIcon = function() {
			return globals.email ? globals.email + '&nbsp;<span class="fa fa-lg fa-sign-out"></span>' : '<span class="fa fa-lg fa-sign-in"></span>';
        }

        ctrl.Application = function(){
            // return globals.email ? '' : '<span class="fa fa-user-plus" aria-hidden="true"></span>';
            if(globals.email){
                $('#Application').hide();
            } else {
                $('#Application').show();
                return '<span class="fa fa-user-plus" aria-hidden="true"></span>';
            }
        }
        
        ctrl.application = function() {
            if (globals.email) return;
                var modalInstance = $uibModal.open({
                    animation: true,
                    ariaLabelledBy: 'modal-title-top',
                    ariaDescribedBy: 'modal-body-top',
                    templateUrl: '/html/applicationDialog.html',
                    controller: 'applicationDialog',
                    controllerAs: 'ctrl'
                });
                modalInstance.result.then(
                    function(data) {

                        refreshMenu();
                        $location.path('/');
                    });
        };
        

        ctrl.login = function() { 
            if(globals.email) {
                common.confirm({ title: 'Koniec pracy?', body: 'Chcesz wylogować ' + globals.email + '?' }, function(answer) {
                    if(answer) {    
                        $http.delete('/login').then(
                            function(rep) {
                                globals.email = null;
                                globals.isWorker = null;
                                localStorage.removeItem("isWorker", null);
                                refreshMenu();
                                $location.path('/');
                            },
                            function(err) {}
                        );
                    }
                });    
            } else {
                var modalInstance = $uibModal.open({
                    animation: true,
                    ariaLabelledBy: 'modal-title-top',
                    ariaDescribedBy: 'modal-body-top',
                    templateUrl: '/html/loginDialog.html',
                    controller: 'loginDialog',
                    controllerAs: 'ctrl'
                });
                modalInstance.result.then(
                    function(data) {
                        var isWorker=false;
                        globals.email = data.email;
                        $http.post('/users', data).then( 
                            function(rep){
                                globals.isWorker = rep.data._id;
                                localStorage.setItem("isWorker", globals.isWorker);
                                refreshMenu();
                                $location.path('/');
                                isWorker=true;                                                  
                            },
                            function(err){
                                alert("Problem z logowaniem!");
                            }                    
                        );
                        if (isWorker) return;
                        globals.isWorker = null;
                        refreshMenu();
                        $location.path('/'); 
                    });
            }};

        ctrl.closeAlert = function() { ctrl.alert.text = ""; };
}]);
/*
    common.confirm( { title: title, body: body, noOk: false, noCancel: false } , function(answer) { ... } )
    common.showMessage( message )
    common.showError( message )
*/
app.service('common', [ '$uibModal', 'globals', function($uibModal, globals) {

    this.confirm = function(confirmOptions, callback) {

        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title-top',
            ariaDescribedBy: 'modal-body-top',
            templateUrl: '/html/confirm.html',
            controller: 'Confirm',
            controllerAs: 'ctrl',
            resolve: {
                confirmOptions: function () {
                    return confirmOptions;
                }
            }
        });

        modalInstance.result.then(
            function () { callback(true); },
            function (ret) { callback(false); }
        );
    };

    this.alert = { text: '', type: '' };
    
    this.showMessage = function(msg) {
        this.alert.type = 'alert-success';
        this.alert.text = msg;
    };

    this.showError = function(msg) {
        this.alert.type = 'alert-danger';
        this.alert.text = msg;
    };

    this.stamp2date = function(stamp) {
        return new Date(stamp).toLocaleString();
    };
    
}]);