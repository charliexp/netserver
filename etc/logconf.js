module.exports = {
    appenders:
    [
        {
            type       : "console",
            category   : "console"
        },
        //{
        //   category :"log_date",
        //   type     : "dateFile",
        //   filename : "./logs/date",
        //   alwaysIncludePattern : true,
        //   pattern  : "-yyyy-MM-dd-hh.log"
        //},
        {
            category   : "log",
            type       : "file",
            filename   : "./logs/ledmq.log",
            maxLogSize : 104800,
            backups    : 100
        }
    ],
    //replaceConsole: true,
    levels :
    {
        log      : "INFO",
      //log      : "ALL",
      //log_date : "ALL",
        console  : "ALL",
    }
};