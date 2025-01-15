const http              = require('http');
const express           = require('express');
const cors              = require('cors');
const app               = express();
const SchoolManager = require('../schools/SchoolManager');
const UserManager = require('../users/UserManager')
const ClassroomManager = require('../classrooms/ClassroomManager')
// const StudentManager = require('../classrooms/StudentManager')

module.exports = class UserServer {
    constructor({config, managers}){
        this.config        = config;
        this.userApi       = managers.userApi;
    }
    
    /** for injecting middlewares */
    use(args){
        app.use(args);
    }

    /** server configs */
    run(){
        app.use(cors({origin: '*'}));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true}));
        app.use('/static', express.static('public'));
        app.use('/api/v1/school', new SchoolManager().router());
        app.use('/api/v1/user', new UserManager().router());
        app.use('/api/v1/classroom', new ClassroomManager().router());

        /** an error handler */
        app.use((err, req, res, next) => {
            console.error(err.stack)
            res.status(500).send('Something broke!')
        });
        
        /** a single middleware to handle all */
        app.all('/api/:moduleName/:fnName', this.userApi.mw);

        let server = http.createServer(app);
        server.listen(this.config.dotEnv.USER_PORT, () => {
            console.log(`${(this.config.dotEnv.SERVICE_NAME).toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`);
        });
    }
}