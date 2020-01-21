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
        // var isWorker = false;
        // $http.post('/users', common.sessions[session]).then( 
        //     function(rep){
        //         globals.isWorker = rep.data._id;
        //         if(globals.isWorker) isWorker = true;                                               
        //     },
        //     function(err){
                
        //     }                    
        // );
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
                    function(err){
                        ctrl.displayApplications('pending');
                        common.showError('Wniosek został już rozpatrzony!');
                    }
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
                    function(err){ 
                        if(temp_status == 'pending') ctrl.displayApplications('pending');
                        if(temp_status == 'refused') ctrl.displayApplications('refused');
                        common.showError('Konto zostało już utworzone lub wniosek nie istnieje!');
                }
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




