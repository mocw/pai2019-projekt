app.controller("Messages", [ '$http', '$scope','globals', 'common', function($http, $scope, globals, common) {
    var ctrl = this;

    ctrl.login = function () {
       return (globals.email) ? true : false;
    };
    
    ctrl.clearMenu = function () {
        $("#SendMessage").hide();
        $("#Inbox").hide();
        $('.menu').each(function( index ) {
            $(".menu").css( "background-color", '');
          });
    };

    ctrl.showSendMessage = function () {
        ctrl.clearMenu()
        $("#SendMessage").show();
        $("#SendMSGMenu").css("background-color","#f0f0f0");
    };

    ctrl.showInbox = function () {
        ctrl.clearMenu();
        $("#Inbox").show();
        $("#InboxMenu").css("background-color","#f0f0f0");
    };

}]);



