app.controller("Worker", [ '$http', '$scope','globals', 'common', function($http, $scope, globals, common) {
    var ctrl = this;
    ctrl.tableContent = null;

    var initVars = function() {
        ctrl.limit = 5;
        ctrl.SearchTextEmail = '';
        ctrl.applicationsDate = '';
    };
    
    ctrl.applicationsOrder = -1;
    ctrl.ApplicationsCount = 0;

    initVars();

    ctrl.isWorker = function(){
        if(globals.isWorker === null) return false;
        return true;
    };

    ctrl.searchEmail = function(state) {
        var limit = ctrl.limit;
        var status = state;
        if(limit <= 0) limit = 1;
        $http.get('/applications?limit=' + limit + '&status=' + status + '&email=' + ctrl.SearchTextEmail +
        '&order=' + ctrl.applicationsOrder).then(
            function (rep) {
                ctrl.applications = rep.data;
            },
            function (err) {}
        );
    };

    ctrl.dateOrder = function(state) {
        if(ctrl.applicationsOrder == -1){
            ctrl.applicationsOrder = 1;
            $(".orderApplications").html('<b><i class="fa fa-angle-up"></i></b>');
            ctrl.displayApplications(state); 
            return;
        }
        ctrl.applicationsOrder = -1;
        $(".orderApplications").html('<b><i class="fa fa-angle-down"></i></b>'); 
        ctrl.displayApplications(state); 
    };
    
    ctrl.displayApplications = function(state) {
        var limit = ctrl.limit;
        var status = state;
        if(limit <= 0) limit = 1;
        
        $http.get('/applications?limit=' + limit + '&status=' + status + '&email=' + ctrl.SearchTextEmail+
         '&order=' + ctrl.applicationsOrder).then(
            function (rep) {
                ctrl.applications = rep.data;
            },
            function (err) {}
        );
    };

    ctrl.stamp2date = common.stamp2date;


    ctrl.showButtons = function(id) {
        var strID="#"+id;
        var strClass="."+id;

        if($(strID+'negative').is(":visible") || $(strID+'positive').is(":visible")){
           $(strID+'negative').hide();
           $(strID+'positive').hide();
           $(strClass).css("background-color","");
           $(strID+'arrow').html("▼"); 
        }
       else {
           $(strID+'arrow').html("▲");                   
           $(strID+'negative').show();
           $(strID+'positive').show();
           $(strClass).css("background-color","#f0f0f0");
       }
    };

    ctrl.showButtonRefused = function(id) {
        var strID="#"+id;
        var strClass="."+id;
        if($(strID+'pos').is(":visible")){
           $(strID+'pos').hide();
           $(strClass).css("background-color","");
           $(strID+'arrowR').html("▼"); 
        }
       else {
           $(strID+'arrowR').html("▲");                   
           $(strID+'pos').show();
           $(strClass).css("background-color","#f0f0f0");
       }
    };

    ctrl.refuseApplication = function(applications) { //REFUSE
        applications.status = 'refused';
        common.confirm({ title: 'Kontynuować?', body: 'Wniosek zostanie odrzucony'}, function(answer) {
            if(answer) { 
                $http.post('/applications',applications).then(
                    function(rep){      
                        ctrl.displayApplications();    
                        ctrl.displayApplications('pending');              
                        common.showMessage('Wniosek odrzucony!');
                        
                    },
                    function(err){}
                );
            }
        });  
      
    };

    ctrl.acceptApplication = function(applications) { //ACCEPT
        var temp_status = applications.status;
        applications.status = 'accepted';
        common.confirm({ title: 'Kontynuować?', body: 'Wniosek zostanie zaakceptowany'}, function(answer) {
            if(answer) { 
                $http.post('/applications',applications).then(
                    function(rep){
                        ctrl.generated = rep.data.ops[0];
                        $('#generatedPassword').show();
                        ctrl.displayApplications();    
                        if(temp_status == 'pending') ctrl.displayApplications('pending');
                        if(temp_status == 'refused') ctrl.displayApplications('refused');
                        common.showMessage('Wniosek zaakceptowany! Konto zostało utworzone');
                    },
                    function(err){}
                );
            }
        });  
    };

    ctrl.clear = function (){
        $( ".applications" ).each(function( index ) {
            $(".applications").hide();
          });

          $('.menu').each(function( index ) {
            $(".menu").css( "background-color", '');
          });
    };

    // ctrl.showAcceptedApplications = function (){
    //     ctrl.clear();
    //     $("#accepted").show();
    //     $("#acceptedMenu").css( "background-color", '#f0f0f0');
    // };

    ctrl.showRefusedApplications = function (){
        ctrl.clear();
        initVars();
        $("#refused").show();
        $("#refusedMenu").css( "background-color", '#f0f0f0');
    };

    ctrl.showApplications = function (){
        ctrl.clear();
        initVars();
        $("#all").show();
        $("#allMenu").css( "background-color", '#f0f0f0');
    };
}]);






// {"result":{"n":1,"opTime":{"ts":"6776355041759461377","t":1},"electionId":"7fffffff0000000000000001","ok":1,
// "operationTime":"6776355041759461377","$clusterTime":{"clusterTime":"6776355041759461377","signature":
// {"hash":"oAlH7GYI0iKhW2aHHyymwpPkpUQ=","keyId":"6769324953390022658"}}},"connection":
// {"id":2,"host":"cluster0-shard-00-00-x2piz.mongodb.net","port":27017},
// "ops":[{"email":"kazio@test.pl","password":"ZsX7DrDe","balance":2500,"limit":100000,"lastOperation":0,"_id":"5e0a730184b5c8206c9662f0"}],
// "insertedCount":1,"insertedId":"5e0a730184b5c8206c9662f0","n":1,"opTime":{"ts":"6776355041759461377","t":1},"electionId":"7fffffff0000000000000001","ok":1,"operationTime":"6776355041759461377","$clusterTime":
// {"clusterTime":"6776355041759461377","signature":{"hash":"oAlH7GYI0iKhW2aHHyymwpPkpUQ=","keyId":"6769324953390022658"}}}