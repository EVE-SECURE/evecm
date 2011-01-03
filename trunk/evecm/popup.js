var queueTrList = [];

function init() {
    var res = chrome.extension.getBackgroundPage().document.getElementById('main');
    document.getElementById('i').innerHTML = res.innerHTML;
    $("th.header").live('click', function(){
           $(this).parent().parent().find('tr.skill').toggleClass("nd");
    });
    var queueDiv = document.getElementById('idSkillInTraining');
    queueTrList = queueDiv.getElementsByTagName('tr');
    updateCounters();
}

function updateCounters() {
    for (var i=0,row; row = queueTrList[i]; i++) {
        var start = Date.parse(row.getAttribute('start'));
        var end = Date.parse(row.getAttribute('end'));
        start.addMinutes(new Date().getTimezoneOffset() * -1);
        end.addMinutes(new Date().getTimezoneOffset() * -1);
        row.getElementsByTagName('td')[2].innerHTML = differenceDates(end,1000)[4];
        var spPrec = getCurrPrec(start,end,parseInt(row.getAttribute('from')),parseInt(row.getAttribute('to')),parseInt(row.getAttribute('level')),parseInt(row.getAttribute('rank')));
        row.getElementsByTagName('img')[1].setAttribute('width', spPrec[0]+'%');
        var listSpItem = document.getElementById('sp'+row.getAttribute('skillId')).innerHTML;
        document.getElementById('sp'+row.getAttribute('skillId')).innerHTML = replaceSP(listSpItem,delim(spPrec[1]));
        document.getElementById('img'+row.getAttribute('skillId')).setAttribute('src',row.getElementsByTagName('img')[0].getAttribute('src'));
        document.getElementById('prog'+row.getAttribute('skillId')).setAttribute('width',spPrec[0]+'%');

    }
    setTimeout("updateCounters()",1000);
}

function replaceSP(st,rp) {
    return st.replace(/(SP:\s)([\d|,]+)(.+)/g,'$1'+rp+'$3');
}