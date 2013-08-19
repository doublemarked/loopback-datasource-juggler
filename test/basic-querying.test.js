// This test written in mocha+should.js
var should = require('./init.js');
var db, User;

describe('basic-querying', function() {

    before(function(done) {
        db = getSchema();

        User = db.define('User', {
            name: {type: String, sort: true},
            email: {type: String, index: true},
            role: {type: String, index: true},
            order: {type: Number, index: true, sort: true}
        });

        db.automigrate(done);

    });


    describe('findById', function() {

        before(function(done) {
            User.destroyAll(done);
        });

        it('should query by id: not found', function(done) {
            User.findById(1, function(err, u) {
                should.not.exist(u);
                should.not.exist(err);
                done();
            });
        });

        it('should query by id: found', function(done) {
            User.create(function(err, u) {
                should.not.exist(err);
                should.exist(u.id);
                User.findById(u.id, function(err, u) {
                    should.exist(u);
                    should.not.exist(err);
                    u.should.be.an.instanceOf(User);
                    done();
                });
            });
        });

    });

    describe('find', function() {

        before(seed);

        it('should query collection', function(done) {
            User.find(function(err, users) {
                should.exists(users);
                should.not.exists(err);
                users.should.have.lengthOf(6);
                done();
            });
        });
        
        it('should query limited collection', function(done) {
            User.find({limit: 3}, function(err, users) {
                should.exists(users);
                should.not.exists(err);
                users.should.have.lengthOf(3);
                done();
            });
        });
        
        it('should query offset collection with limit', function(done) {
            User.find({skip: 1, limit: 4}, function(err, users) {
                should.exists(users);
                should.not.exists(err);
                users.should.have.lengthOf(4);
                done();
            });
        });

        it('should query filtered collection', function(done) {
            User.find({where: {role: 'lead'}}, function(err, users) {
                should.exists(users);
                should.not.exists(err);
                users.should.have.lengthOf(2);
                done();
            });
        });

        it('should query collection sorted by numeric field', function(done) {
            User.find({order: 'order'}, function(err, users) {
                should.exists(users);
                should.not.exists(err);
                users.forEach(function(u, i) {
                    u.order.should.eql(i + 1);
                });
                done();
            });
        });

        it('should query collection desc sorted by numeric field', function(done) {
            User.find({order: 'order DESC'}, function(err, users) {
                should.exists(users);
                should.not.exists(err);
                users.forEach(function(u, i) {
                    u.order.should.eql(users.length - i);
                });
                done();
            });
        });

        it('should query collection sorted by string field', function(done) {
            User.find({order: 'name'}, function(err, users) {
                should.exists(users);
                should.not.exists(err);
                users.shift().name.should.equal('George Harrison');
                users.shift().name.should.equal('John Lennon');
                users.pop().name.should.equal('Stuart Sutcliffe');
                done();
            });
        });

        it('should query collection desc sorted by string field', function(done) {
            User.find({order: 'name DESC'}, function(err, users) {
                should.exists(users);
                should.not.exists(err);
                users.pop().name.should.equal('George Harrison');
                users.pop().name.should.equal('John Lennon');
                users.shift().name.should.equal('Stuart Sutcliffe');
                done();
            });
        });
        
        it('should only include fields as specified', function(done) {
            var remaining = 0;
          
            function sample(fields) {
              
              return {
                expect: function (arr) {
                  remaining++;
                  User.find({fields: fields}, function(err, users) {
                    
                      remaining--;
                      if(err) return done(err);
                  
                      should.exists(users);
                  
                      if(remaining === 0) {
                        done();
                      }
                
                      users.forEach(function (user) {
                        var obj = user.toObject();
                        
                        Object.keys(obj)
                          .forEach(function (key) {
                            // if the obj has an unexpected value
                            if(obj[key] !== undefined && arr.indexOf(key) === -1) {
                              console.log('Given fields:', fields);
                              console.log('Got:', key, obj[key]);
                              console.log('Expected:', arr);
                              throw new Error('should not include data for key: '+ key);
                            }
                          });                        
                      });
                  });
                }
              }
            }
            
            sample({name: true}).expect(['name']);
            sample({name: false}).expect(['id', 'email', 'role', 'order']);
            sample({name: false, id: true}).expect(['id']);
            sample({id: true}).expect(['id']);
            sample('id').expect(['id']);
            sample(['id']).expect(['id']);
            sample(['email']).expect(['email']);
        });

    });

    describe('count', function() {

        before(seed);

        it('should query total count', function(done) {
            User.count(function(err, n) {
                should.not.exist(err);
                should.exist(n);
                n.should.equal(6);
                done();
            });
        });

        it('should query filtered count', function(done) {
            User.count({role: 'lead'}, function(err, n) {
                should.not.exist(err);
                should.exist(n);
                n.should.equal(2);
                done();
            });
        });
    });

    describe('findOne', function() {

        before(seed);

        it('should find first record (default sort by id)', function(done) {
            User.all({order: 'id'}, function(err, users) {
                User.findOne(function(e, u) {
                    should.not.exist(e);
                    should.exist(u);
                    u.id.toString().should.equal(users[0].id.toString());
                    done();
                });
            });
        });

        it('should find first record', function(done) {
            User.findOne({order: 'order'}, function(e, u) {
                should.not.exist(e);
                should.exist(u);
                u.order.should.equal(1);
                u.name.should.equal('Paul McCartney');
                done();
            });
        });

        it('should find last record', function(done) {
            User.findOne({order: 'order DESC'}, function(e, u) {
                should.not.exist(e);
                should.exist(u);
                u.order.should.equal(6);
                u.name.should.equal('Ringo Starr');
                done();
            });
        });

        it('should find last record in filtered set', function(done) {
            User.findOne({
                where: {role: 'lead'},
                order: 'order DESC'
            }, function(e, u) {
                should.not.exist(e);
                should.exist(u);
                u.order.should.equal(2);
                u.name.should.equal('John Lennon');
                done();
            });
        });

        it('should work even when find by id', function(done) {
            User.findOne(function(e, u) {
                User.findOne({where: {id: u.id}}, function(err, user) {
                    should.not.exist(err);
                    should.exist(user);
                    done();
                });
            });
        });

    });

    describe('exists', function() {

        before(seed);

        it('should check whether record exist', function(done) {
            User.findOne(function(e, u) {
                User.exists(u.id, function(err, exists) {
                    should.not.exist(err);
                    should.exist(exists);
                    exists.should.be.ok;
                    done();
                });
            });
        });

        it('should check whether record not exist', function(done) {
            User.destroyAll(function() {
                User.exists(42, function(err, exists) {
                    should.not.exist(err);
                    exists.should.not.be.ok;
                    done();
                });
            });
        });

    });

    describe('destroyAll with where option', function() {

        before(seed);

        it('should only delete instances that satisfy the where condition', function(done) {
            User.destroyAll({name: 'John Lennon'}, function() {
                User.find({where: {name: 'John Lennon'}}, function(err, data) {
                    should.not.exist(err);
                    data.length.should.equal(0);
                    User.find({where: {name: 'Paul McCartney'}}, function(err, data) {
                        should.not.exist(err);
                        data.length.should.equal(1);
                        done();
                    });
                });
            });
        });

    });



});

function seed(done) {
    var count = 0;
    var beatles = [
        {
            name: 'John Lennon',
            mail: 'john@b3atl3s.co.uk',
            role: 'lead',
            order: 2
        }, {
            name: 'Paul McCartney',
            mail: 'paul@b3atl3s.co.uk',
            role: 'lead',
            order: 1
        },
        {name: 'George Harrison', order: 5},
        {name: 'Ringo Starr', order: 6},
        {name: 'Pete Best', order: 4},
        {name: 'Stuart Sutcliffe', order: 3}
    ];
    User.destroyAll(function() {
        beatles.forEach(function(beatle) {
            User.create(beatle, ok);
        });
    });

    function ok() {
        if (++count === beatles.length) {
            done();
        }
    }
}
