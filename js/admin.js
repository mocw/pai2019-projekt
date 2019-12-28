app.controller("Admin", [ '$http', '$scope','globals', 'common', function($http, $scope, globals, common) {
    var ctrl = this;
    ctrl.email = globals.email;

    ctrl.Root = function(){
         return ctrl.email=='root@gmail.com' ? true: false;
     }

     ctrl.displayWorkers = function() {
        $http.get('/workers').then(
            function (rep) {ctrl.workers = rep.data;},
            function (err) {}
        );
     };

     ctrl.showOrHideButton = function(id){
         var str="#"+id;
         var strClass="."+id;


         if($(str).is(":visible")){
            $(str).hide();
            $(strClass).css("background-color","");
            $(str+'arrow').html("▼"); 
         }
        else {                    
            $(str).show();
            $(strClass).css("background-color","#f0f0f0");
            $(str+'arrow').html("▲"); 
        }
     };

     ctrl.deleteWorker = function(worker){
        common.confirm({ title: 'Czy jesteś pewien?', body: 'Chcesz usunąć tego użytkownika?'}, function(answer) {
            if(answer) { 
                $http.post('/workersAddDel',worker).then(
                    function(rep) {
                        ctrl.displayWorkers();
                        common.showMessage('Usunięto!');
                    },
                    function(err) {}
                );
            }
        });  
     };

     ctrl.displayUsers = function(){
        $http.get('/workersAddDel').then(
            function (rep) {ctrl.accounts = rep.data;},
            function (err) {}
        );
     };

     ctrl.addWorker = function(user){
        if(ctrl.email==user.email){
                common.showError("Nie możesz dodać samego siebie!");
            return;
        }
         $http.post('/workers', user).then(
            function (rep){
                ctrl.displayUsers();
                common.showMessage('Dodano!');
            },
            function (err) {}
         );   
     };

     ctrl.clear = function (){
        $( ".workers" ).each(function( index ) {
            $(".workers").hide();
          });

          $('.menu').each(function( index ) {
            $(".menu").css( "background-color", '');
          });
    };

    ctrl.showAllUsers = function (){
        ctrl.clear();
        $("#add-worker").show();
        $("#addWorkerMenu").css( "background-color", '#f0f0f0');
    };

    ctrl.showWorkerOperations = function (){
        ctrl.clear();
        $("#workerop").show();
        $("#workerOpMenu").css( "background-color", '#f0f0f0');
    };

}]);



