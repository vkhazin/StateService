exports.create =  function () {

    return (function () {

        return {
            trace: function (msg) {
                console.trace(msg);
            },            
            info: function (msg) {
                console.info(msg);
            },
            log: function (msg) {
                console.log(msg);
            },
            error: function (msg) {
                console.error(msg);
            }
        };
    }());
};