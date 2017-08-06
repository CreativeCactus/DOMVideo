
module.exports = function safe(str) {
    return str.replace(/\W+/gi, '_');
};
