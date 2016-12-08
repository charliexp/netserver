module.exports = {
    appenders:
    [
        {
            type       : "console",
            category   : "console"
        },
        {
            category   : "log",
            type       : "file",
            filename   : "./logs/ledmq.log",
            maxLogSize : 104800,
            backups    : 100
        }
    ],
    levels :
    {
        log : "INFO"
        //log : "ALL"
    }
};