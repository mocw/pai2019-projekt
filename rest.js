/* external modules */
var mongodb = require('mongodb');

/* own modules */
var lib = require('./lib');
var common = require('./common');
var ObjectId = require('mongodb').ObjectID;

function generatePassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

module.exports = function(url, req, rep, query, payload, session) {

    console.log('REST handling ' + req.method + ' ' + url + ' query ' + JSON.stringify(query) + ' payload ' + JSON.stringify(payload) + ' session ' + session);
    switch(url) {

        case '/account':
            if(!common.sessions[session].accountNo) {
                lib.sendJSONWithError(rep, 401, 'You are not logged in'); return;
            }
            switch(req.method) {
                case 'GET':
                    common.accounts.findOne({_id: common.sessions[session].accountNo}, {}, function(err, account) {
                        if(err) {
                            lib.sendJSONWithError(rep, 400, 'No such object'); return;
                        }
                        delete account.password;                
                        lib.sendJSON(rep, account);
                    });
                    break;
                case 'POST':
                    common.accounts.findOne({_id: common.sessions[session].accountNo}, {}, function(err, account) {
                        if(err) {
                            lib.sendJSONWithError(rep, 400, 'No such object'); return;
                        }                
                        if(isNaN(payload.amount) || payload.amount <= 0) {
                            lib.sendJSONWithError(rep, 400, 'Invalid operation data');
                        } else if(account.balance - payload.amount < account.limit) {
                            lib.sendJSONWithError(rep, 400, 'Limit exceeded');
                        } else {
                            common.accounts.find({email: payload.recipient}).toArray(function(err, docs) {
                                if(err || docs.length != 1) {
                                    lib.sendJSONWithError(rep, 400, 'Recipient unknown or ambiguous');
                                    return;
                                }
                                var recipient_id = docs[0]._id;
                                if(recipient_id.equals(account._id)) {
                                    lib.sendJSONWithError(rep, 400, 'Sender and recipient are the same account');
                                    return;
                                }
                                common.accounts.findOneAndUpdate({_id: common.sessions[session].accountNo},
                                    {$set: {balance: account.balance - payload.amount, lastOperation: new Date().getTime()}},
                                    function(err, updated) {
                                    if(err) {
                                        lib.sendJSONWithError(rep, 400, err.message); return;
                                    }
                                    common.accounts.findOneAndUpdate({_id: recipient_id},
                                        {$inc: {balance: payload.amount, lastOperation: new Date().getTime()}},
                                        {returnOriginal: false}, function(err, updated_r) {
                                            if(err) {
                                                console.log('Recipient account balance is not updated');
                                                return;
                                            }
                                            common.history.insertOne({
                                                date: updated.value.lastOperation,
                                                account: common.sessions[session].accountNo,
                                                recipient_id: recipient_id,
                                                amount: payload.amount,
                                                balance: updated.value.balance,
                                                balance_r: updated_r.value.balance,
                                                description: payload.description
                                            });        
                                            // message to recipient
                                            var message = { transfer: {
                                                from: common.sessions[session].accountNo,
                                                amount: payload.amount,
                                                balance: updated_r.value.balance
                                            }};
                                            lib.sendDataToAccount(recipient_id, JSON.stringify(message));
                                        });
                                    delete updated.value.password;
                                    lib.sendJSON(rep, updated.value);    
                                });
                            });
                        }
                    });
                    break;
                default:
                    lib.sendJSONWithError(rep, 400, 'Invalid method ' + req.method + ' for ' + url);
            }
            break;
        case '/users':
                switch(req.method){
                    case 'GET':
                        if(!common.sessions[session].accountNo) {
                            lib.sendJSONWithError(rep, 401, 'You are not logged in'); return;
                        }
                        var cursor = common.accounts.find({});
                        cursor.project({
                            password: 0,
                            balance: 0,
                            limit: 0,
                            lastOperation:0
                        });

                        cursor.toArray(function(err, docs) {
                            if(err){
                                lib.sendJSONWithError(rep, 400, 'No such object'); return;
                             }
                             lib.sendJSON(rep, docs);
                        });
                        //     common.accounts.find({ },{ email:1 }).toArray(function(err, docs) {
                        //     if(err){
                        //         lib.sendJSONWithError(rep, 400, 'No such object'); return;
                        //     }
                        //     lib.sendJSON(rep, docs);
                        // });
                    break;
                    case 'POST': //!!!!!!!!!!!
                        common.workers.findOne({account_id: ObjectId(payload._id)}, {}, function (err,docs) {
                            if(err){
                                lib.sendJSONWithError(rep, 400, 'No such object'); return;
                            }
                            else {
                                lib.sendJSON(rep, docs);
                            }
                        });
                    break;
                }
                break;
        case '/workersAddDel':
            switch(req.method){
                case 'GET':
                    if(!common.sessions[session].accountNo) {
                        lib.sendJSONWithError(rep, 401, 'You are not logged in'); return;
                    } //!!!                    
                        common.accounts.aggregate([
                            {
                                $lookup:
                                {
                                    from: "workers",
                                    localField: "_id",
                                    foreignField: "account_id",
                                    as: "not_workers"
                                }
                            },
                            {
                                $match: {"not_workers": {$eq: [] } }
                            }
                        ]).toArray(function(err,docs){
                            if(err){
                                lib.sendJSONWithError(rep, 400, 'No such object');
                             } else {
                                 lib.sendJSON(rep, docs);
                             }                             
                        });
                    break; 
                case 'POST':
                    common.workers.findOne({account_id: ObjectId(payload._id)}, {}, function (err,docs) {
                        if(err){
                            lib.sendJSONWithError(rep, 400, 'No such object'); return;
                        }
                        common.workers.deleteOne(
                            {account_id: ObjectId(payload._id)}, function(result){
                                if(err){
                                    lib.sendJSONWithError(rep, 400, 'No such object'); return;
                                } else {
                                lib.sendJSON(rep,result);
                                }
                            });
                    });
                break;
            }   
            break;
        case '/workers':
                switch(req.method){
                    case 'GET':
                        var cursor = common.workers.find({});
                        cursor.project({
                            _id: 0
                        });

                        var result = common.workers.find({},{_id:0, account_id:1}).map(function(ele) {return ele.account_id} ).toArray(function(err,docs){
                            if(err){
                                lib.sendJSONWithError(rep, 400, 'No such object');
                             } else {   
                                 common.accounts.find({_id: {$in: docs}}).toArray(function(err,res){
                                     if(err){
                                        lib.sendJSONWithError(rep, 400, 'No such object');
                                        return;
                                     }
                                    lib.sendJSON(rep, res);
                                 });
                             }  
                        });
                    break;
                    case 'POST':
                        common.accounts.findOne({_id: common.sessions[session].accountNo}, {}, function(err, account) {
                            if(err) {
                                lib.sendJSONWithError(rep, 400, 'No such object'); return;
                            }
                                common.accounts.find({email: payload.email}).toArray(function(err, docs) {
                                    if(err || docs.length != 1) {
                                        lib.sendJSONWithError(rep, 400, 'User unknown or ambiguous');
                                        return;
                                    }
                                    var worker_id = docs[0]._id;
                                    common.workers.insertOne({
                                        account_id: worker_id
                                });  
                            lib.sendJSON(rep,account);                            
                            });
                        });        
                    break;
                }
                break;             
        case '/recipients':
            switch(req.method) {
                case 'GET':
                    common.history.aggregate([
                        {$match:{account: common.sessions[session].accountNo}},
                        {$group:{_id:'$recipient_id'}},
                        {$lookup:{from:'accounts','localField':'_id','foreignField':'_id','as':'recipient'}},
                        {$unwind:'$recipient'},
                        {$addFields:{email:'$recipient.email'}},
                        {$project:{_id:false,recipient:false}},
                        {$sort:{email:1}}
                    ]).toArray(function(err, docs) {
                        lib.sendJSON(rep, docs.map(function(el) { return el.email; }));
                    });
                    break;
                default: lib.sendJSONWithError(rep, 400, 'Invalid method ' + req.method + ' for ' + url);
            }
            break;

        case '/history': 
            switch(req.method) {
                case 'GET':
                    if(!common.sessions[session].accountNo) {
                        lib.sendJSONWithError(rep, 401, 'You are not logged in'); return;    
                    }
                    var skip = parseInt(query.skip);
                    var limit = parseInt(query.limit);
                    if(isNaN(skip) || isNaN(limit) || skip < 0 || limit <= 0) {
                        lib.sendJSONWithError(rep, 400, 'Skip/limit errornous'); return;    
                        return;
                    }
                    var q = {$or: [{account: common.sessions[session].accountNo},{recipient_id: common.sessions[session].accountNo}]};
                    if(query.filter) {
                        q.description = {$regex: new RegExp(query.filter), $options: 'si'};
                    }
                    common.history.aggregate([
                        {$match:q},
                        {$lookup:{from:'accounts',localField:'account',foreignField:'_id',as:'sender'}},
                        {$unwind:{path:'$sender'}},
                        {$addFields:{email:'$sender.email'}},
                        {$lookup:{from:'accounts',localField:'recipient_id',foreignField:'_id',as:'recipient'}},
                        {$unwind:{path:'$recipient'}},
                        {$addFields:{email_r:'$recipient.email'}},
                        {$addFields:{balance_after:{$cond:{if:{$eq:['$email',common.sessions[session].email]},then:'$balance',else:'$balance_r'}}}},
                        {$project:{account:false,sender:false,recipient:false,balance:false,balance_r:false}},
                        {$sort:{date:-1}},{$skip:skip},{$limit:limit}
                    ]).toArray(function(err, entries) {
                        if(err)
                            lib.sendJSONWithError(rep, 400, 'History retrieving failed');
                        else {
                            lib.sendJSON(rep, entries);
                        }
                    });
                    break;
                case 'DELETE':
                    if(!common.sessions[session].accountNo) {
                        lib.sendJSONWithError(rep, 401, 'You are not logged in'); return;    
                    }
                    common.history.aggregate([
                        {$match:{$or: [{account: common.sessions[session].accountNo},{recipient_id: common.sessions[session].accountNo}]}},
                        {$lookup:{from:'accounts',localField:'account',foreignField:'_id',as:'sender'}},
                        {$unwind:{path:'$sender'}},
                        {$lookup:{from:'accounts',localField:'recipient_id',foreignField:'_id',as:'recipient'}},
                        {$unwind:{path:'$recipient'}},
                        {$count:'count'}
                    ]).toArray(function(err, docs) {
                        if(err || docs.length != 1)
                            lib.sendJSONWithError(rep, 400, 'Cannot count objects in history'); 
                        else
                            lib.sendJSON(rep, docs[0]);
                    });
                    break;
            }
            break;

        case '/login':
            switch(req.method) {
                case 'GET':
                    var whoami = {
                        session: session,
                        accountNo: common.sessions[session].accountNo,
                        email: common.sessions[session].email
                    };
                    lib.sendJSON(rep, whoami);
                    break;
                case 'POST':
                    if(!payload || !payload.email || !payload.password) {
                        lib.sendJSONWithError(rep, 401, 'Invalid credentials');
                        return;
                    }
                    common.accounts.findOne(payload, {}, function(err, account) {
                        if(err || !account) {
                            lib.sendJSONWithError(rep, 401, 'Bad password');
                            return;
                        }
                        common.sessions[session].accountNo = account._id;
                        common.sessions[session].email = account.email;                        
                        delete account.password;
                        lib.sendJSON(rep, account);
                        // common.workers.findOne({account_id: ObjectId(account._id)}, {}, function (err,docs) {
                        //     if(err){
                        //         lib.sendJSONWithError(rep, 400, 'No such object'); return;
                        //     }
                        //     else {
                        //         lib.sendJSON(rep, docs);
                        //     }
                        // });
                    });
                    break;
                case 'DELETE':
                    delete common.sessions[session].accountNo;
                    delete common.sessions[session].email;
                    lib.sendJSON(rep, { session: session });
                    break;
                default:
                    lib.sendJSONWithError(rep, 400, 'Invalid method ' + req.method + ' for ' + url);
            }
            break;

        case '/applications': 
            switch(req.method){
                case 'GET':
                     var limit = parseInt(query.limit);
                     var order = parseInt(query.order);
                     var statusQr = query.status;
                     var skip = 0;
                     if(isNaN(limit)) {
                         lib.sendJSONWithError(rep, 400, 'Limit errornous'); return;    
                     }                
                     if(query.email){
                        var email = query.email;
                        common.applications.find({
                            $and: [
                            {email: {$regex : ".*"+email+".*"}},
                            {status: statusQr}                        
                            ]}).limit(limit).sort({date: order}).toArray(function(err, docs) {
                            if(err) {
                                lib.sendJSONWithError(rep, 400, 'Email not found');
                                return;
                            }
                            lib.sendJSON(rep, docs);
                         });
                    } else {                     
                    common.applications.find({status: statusQr}).limit(limit).sort({date: order}).toArray(function(err, docs) {
                        if(err) {
                            lib.sendJSONWithError(rep, 400, 'limit errornous');
                            return;
                        }
                        lib.sendJSON(rep, docs);
                     });
                    }
                break;
                case 'POST':
                console.log(payload._id + ' ' + payload.status + ' ' + payload.email);
                common.accounts.findOne({ email: payload.email}, {}, function(err, account) { 
                                if(account) {
                                    lib.sendJSONWithError(rep, 406, 'Account already exists!');
                                    return;
                                }
                common.applications.updateOne(
                    {_id: ObjectId(payload._id)},
                    {$set: {status: payload.status}}, function(err){
                        if(err){
                            lib.sendJSONWithError(rep, 400, 'Application doesn\'t exist'); return;
                        } else {
                            if(payload.status != 'accepted'){
                                lib.sendJSON(rep); return;
                            }
                            common.accounts.insertOne({
                                email: payload.email,
                                password: generatePassword(), //generowanie hasła
                                balance: 0,
                                limit: 1,
                                lastOperation: 0
                            },function(err,response){
                                if(err){
                                    lib.sendJSONWithError(rep, 400, err.message); return;
                                }
                                else{
                                    lib.sendJSON(rep, response);
                                }
                            }); 
                        }
                    });                                                 
                });
                break;
            }
            break;

        case '/application':
            switch(req.method){
                case 'POST':                    
                    common.accounts.findOne({email: payload.applicationEmail}, {}, function(err, account) {
                        if(err) {
                            lib.sendJSONWithError(rep, 400, 'Bad request!'); return;
                        }
                        if(account) {
                            lib.sendJSONWithError(rep, 400, 'Email already registered!'); return;
                        }
                        common.applications.findOne({email: payload.applicationEmail}, {}, function(err,account){
                            if(err) {
                                lib.sendJSONWithError(rep, 400, 'Bad request!'); return;
                            }
                            if(account) {
                                console.log("Wniosek już wysłany!"); 
                                lib.sendJSONWithError(rep, 400, 'Application already sent on that email!'); return;
                            }
                            common.applications.insertOne({
                                email: payload.applicationEmail,
                                date: new Date().getTime(),
                                status: 'pending'
                            },function(err,response){
                                if(err){
                                    console.log(err.message);
                                }
                                else{
                                    lib.sendJSON(rep, response);
                                }
                            }); 
                         });                                          
                    });                    
                break;
                default:
                lib.sendJSONWithError(rep, 400, 'Invalid method ' + req.method + ' for ' + url);
                break;
            }
        break;
        case '/password':
            switch(req.method)
            {
                case 'GET':
                    var passwordChk = query.password;
                    common.accounts.findOne( {password:passwordChk}, {}, function(err, account) {
                        if(err || !account) {
                            lib.sendJSONWithError(rep, 401, 'Bad password');
                            return;
                        }
                        lib.sendJSON(rep, account);
                    });
                break;

                case 'POST':
                    if(!common.sessions[session].accountNo) {
                        lib.sendJSONWithError(rep, 401, 'You are not logged in'); return;
                    }
                    common.accounts.findOneAndUpdate({_id: common.sessions[session].accountNo},
                        {$set: {password: payload.newPassword}},
                        function(err, updated) {
                        if(err) {
                            lib.sendJSONWithError(rep, 400, err.message); return;
                        }
                        lib.sendJSON(rep, updated);
                    });
                break;
            }
        break;
        default:
            lib.sendJSONWithError(rep, 400, 'Invalid rest endpoint ' + url);
    }
};