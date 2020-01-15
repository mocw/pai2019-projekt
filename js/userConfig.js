app.controller("UserConfig", [ '$http', '$scope','globals', 'common', function($http, $scope, globals, common) {
    var ctrl = this;

    ctrl.login = function () {
        return (globals.email) ? true : false;
     };

     var initVars = function() {
        ctrl.changePassword = {oldPassword: "", newPassword: "", newPasswordRpt: ""};
    };

    initVars();

     ctrl.clearMenu = function () {
        $("#changePassword").hide();
        $('.menu').each(function( index ) {
            $(".menu").css( "background-color", '');
          });
    };

    ctrl.changePassword = function () {
        ctrl.clearMenu();
        $("#changePassword").show(); 
        $("#changePasswordMenu").css("background-color","#f0f0f0");
    };
    
    ctrl.changePasswordForm = function () {
        if(ctrl.changePassword.newPassword != ctrl.changePassword.newPasswordRpt){
            common.showError( "Hasła nie są zgodne!" );
            return;
        }
        $http.get('/password?password=' + ctrl.changePassword.oldPassword).then(
            function(rep) {             
                $http.post('/password', {"newPassword":ctrl.changePassword.newPassword}).then(
                    function(rep) {
                        common.showMessage( "Hasło zmienione!" );
                        initVars();
                    },
                    function(err) {
                        common.showError( "Błąd!" );
                    }
                );
            },
            function(err) {
                common.showError( "Hasło nieprawidłowe!" );
            }
        );
    };
    

    ctrl.formInvalid = function () {
        return !ctrl.changePassword.oldPassword || !ctrl.changePassword.newPassword 
        || !ctrl.changePassword.newPasswordRpt;
    };

}]);



