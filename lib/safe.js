
module.exports = function safe(str, replace) {
    return str.replace(/\W+/gi, replace||'_');
};
