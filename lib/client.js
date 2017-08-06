/* eslint-disable strict, no-continue, object-shorthand, prefer-template, prefer-arrow-callback, no-var */

window.main = function () {
    const btn = document.querySelectorAll('a');// , button
    
    const list = [];
    console.dir({ btn: btn });
    for (var i = 0; i < btn.length; i++) {
        var e = btn[i];
        
        const text = e.innerText;
        if (
            !text || 
            !text.length || 
            (text + '') === 'undefined'
        ) continue;

        const url = e.href;
        if (!url || !url.length) continue;

        const pos = e.getBoundingClientRect();

        list.push({
            url: url,
            text: text,
            safe_text: safe(text),
            x: ~~(pos.left + (pos.width / 2)),
            y: ~~(pos.top + (pos.height / 2))
        });

        if (list.length > 10) break;
    }
    var title = document.title;
    var url = document.location.href;
    var host = window.location.hostname;

    return {
        y: document.body.offsetHeight,
        x: document.body.offsetWidth,
        vh: window.innerHeight,
        vw: window.innerWidth,

        safe_title: safe(title),
        safe_host: safe(host),
        safe_url: safe(url),
        title: title,
        host: host,
        url: url,

        list: list
    };
};


function safe(str) {
    return str.replace(/\W+/gi, '_');
}
