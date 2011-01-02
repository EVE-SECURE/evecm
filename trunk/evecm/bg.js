var compteur = [];
var digit_del = ",";
var tabcouleurfind = new Array();
var apiserver = "http://api.eve-online.com";

var msPerDay = 24 * 60 * 60 * 1000;
var msPerHour = 60 * 60 * 1000;
var msPerMinutes = 60 * 1000;
var msPerSeconds = 1000;
var dateFin;
var currSkill;
var queue = [];
var trLevel;
var divTimeLeft;

var reqCharacterSheet = new XMLHttpRequest();
var reqSkillInTraining = new XMLHttpRequest();
var skillTreeRequest = new XMLHttpRequest();
var skillQueue = new XMLHttpRequest();
var apikey = localStorage["apikey"];
var userid = localStorage["userid"];
var characterid = localStorage["characterid"];
var cycleWait = localStorage['seconds'];

function init() {
    skillTreeRequest.open("GET", "skillTree.xml", false);
    skillTreeRequest.send("");
    reqSkillInTraining.open("GET", apiserver + "/char/SkillInTraining.xml.aspx?userID=" + userid + "&characterID=" + characterid + "&apiKey=" + apikey, true);
    reqSkillInTraining.onload = recupSkillInTraining;
    reqSkillInTraining.send(null);
    reqCharacterSheet.open("GET", apiserver + "/char/CharacterSheet.xml.aspx?userID=" + userid + "&characterID=" + characterid + "&apiKey=" + apikey, true);
    reqCharacterSheet.onload = recupInfosPerso;
    reqCharacterSheet.send(null);
}

function refreshDateFin() {
    compteur = differenceDates(queue[queue.length - 1][3]);
    if (differenceDates(dateFin)[3] <= 0) {
        var notification = webkitNotifications.createNotification('icon.png', // icon url - can be relative
        'Skill training complete', // notification title
        currSkill + ' ' + trLevel // notification body text
        );
        notification.show();
        location.reload();
    }
    chrome.browserAction.setBadgeText({
        text: compteur[0]
    });
    chrome.browserAction.setTitle({
        title: drawToolTip()
    });
    chrome.browserAction.setBadgeBackgroundColor({
        color: compteur[2]
    });
    setTimeout("refreshDateFin()",cycleWait )
}

function drawToolTip() {
    var ret = '';
    for (var i = 0; i < queue.length; i++) {
        ret = ret + queue[i][0] + ' ' + queue[i][1] + ': ' + differenceDates(queue[i][3])[1] + '\n';
    }
    var ret2 = ret.slice(0, -1);
    return ret2;
}

function queueCalc() {
    var skills = skillQueue.responseXML.getElementsByTagName("row");
    var skillTable = document.createElement('table');
    for (var i = 0; i < skills.length; i++) {
        queue[i] = [];
        queue[i][0] = getLibelleSkill(skills[i].getAttribute('typeID'))[0];
        queue[i][1] = toRoman(skills[i].getAttribute('level') + ' ');
        queue[i][2] = Date.parse(skills[i].getAttribute('startTime'));
        queue[i][2].addMinutes(new Date().getTimezoneOffset() * -1);
        queue[i][3] = Date.parse(skills[i].getAttribute('endTime'));
        queue[i][3].addMinutes(new Date().getTimezoneOffset() * -1);
        var skillTr = document.createElement('tr');
        skillTr.setAttribute('skillId', skills[i].getAttribute('typeID'));
        skillTr.setAttribute('start', skills[i].getAttribute('startTime'));
        skillTr.setAttribute('end', skills[i].getAttribute('endTime'));

        var tdSkillName = document.createElement('td');
        tdSkillName.innerHTML = queue[i][0];
        skillTr.appendChild(tdSkillName);

        var tdSkillInfo = document.createElement('td');
        var skillImage = document.createElement('img');
        if (i==0) {
            var imgSrc = 'img/levelup'+skills[i].getAttribute('level')+'.gif';
        } else {
            var imgSrc = 'img/levelupf'+skills[i].getAttribute('level')+'.gif';
        }
        skillImage.setAttribute('src', imgSrc);
        tdSkillInfo.appendChild(skillImage);
        tdSkillInfo.appendChild(document.createElement('br'));
        var progressDiv = document.createElement('div');
        progressDiv.setAttribute('class', 'progress');
        var progImg = document.createElement('img');
        progImg.setAttribute('src', 'img/prog.gif');
        progImg.setAttribute('width', '31%');
        progImg.setAttribute('height', '2px');
        progressDiv.appendChild(progImg);
        skillTr.appendChild(tdSkillInfo);
        tdSkillInfo.appendChild(progressDiv);

        skillTable.appendChild(skillTr);
    }
    document.getElementById('idSkillInTraining').appendChild(skillTable);
    refreshDateFin();
}

function recupSkillInTraining() {
    var trainingTypeIDList = reqSkillInTraining.responseXML.getElementsByTagName("trainingTypeID");
    var trainingToLevelList = reqSkillInTraining.responseXML.getElementsByTagName("trainingToLevel");
    var trainingEndTimeList = reqSkillInTraining.responseXML.getElementsByTagName("trainingEndTime");
    var trainingBool = reqSkillInTraining.responseXML.getElementsByTagName("skillInTraining")[0].textContent;
    if (trainingBool == 1) {
        var trainingTypeIDElement = trainingTypeIDList[0];
        var trainingToLevelElement = trainingToLevelList[0];
        var trainingEndTimeElement = trainingEndTimeList[0];
        trLevel = toRoman(trainingToLevelElement.textContent + " ");


        currSkill = getLibelleSkill(trainingTypeIDElement.textContent)[0];
        var trainingEndTime = trainingEndTimeElement.textContent;
        dateFin = Date.parse(trainingEndTime);
        dateFin.addMinutes(new Date().getTimezoneOffset() * -1);
        skillQueue.open("GET", apiserver + "/char/SkillQueue.xml.aspx?userID=" + userid + "&characterID=" + characterid + "&apiKey=" + apikey, true);
        skillQueue.onload = queueCalc;
        skillQueue.send(null);
    } else {
        alert("Warning! No Skill in training!");
        chrome.browserAction.setBadgeText({
            text: "warn"
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: [255, 0, 0, 255]
        });
    }
}



function differenceDates(d) {
    var dateNow = new Date();
    var stop = 0;
    var ret = [];
    ret[1] = "";
    var timeBetween = d.valueOf() - dateNow.valueOf();
    ret[3] = timeBetween;
    var jours = Math.floor(timeBetween / msPerDay);
    if (jours > 0) {
        timeBetween = timeBetween - (jours * msPerDay);
        ret[0] = jours + "d";
        ret[1] = jours + " days,  ";
        ret[2] = [30, 60, 150, 230];
        stop = 1;
    }

    var heures = Math.floor(timeBetween / msPerHour);
    if (heures > 0) {
        timeBetween = timeBetween - (heures * msPerHour);
        ret[1] = ret[1] + heures + " hours,  ";
        if (stop == 0) {
            ret[0] = heures + "h";
            ret[2] = [255, 20, 20, 230];
            stop = 1;
        }
    }

    var minutes = Math.floor(timeBetween / msPerMinutes);
    if (minutes > 0) {
        timeBetween = timeBetween - (minutes * msPerMinutes);
        ret[1] = ret[1] + minutes + " mins "
        if (stop == 0) {
            ret[0] = minutes + "m";
            ret[2] = [255, 20, 20, 230];
            stop = 1;
        }
    }
    if (cycleWait==1000) {
        var secondes = Math.floor(timeBetween / msPerSeconds);
        if (secondes > 0) {
            timeBetween = timeBetween - (secondes * msPerSeconds);
            ret[1] = ret[1] + secondes + " sec"
            if (stop == 0) {
                ret[0] = secondes + "s";
                ret[2] = [255, 20, 20, 230];
            }
        }
    }

    return ret;
}

function getLibelleSkill(idSkill) {
    var skillTreeDoc = skillTreeRequest.responseXML;
    var currentTypes = skillTreeDoc.getElementsByTagName("row");
    var ret = [];

    for (var i = 0, row; row = currentTypes[i]; i++) {
        if (row.getAttribute("typeID") == idSkill && row.getAttribute("typeName") != null) {
            ret[0] = row.getAttribute("typeName");
            ret[1] = row.getElementsByTagName('rank')[0].textContent;
            return ret;
        }
    }
}

function toRoman(d) {
    switch (d) {
    case (d = '1 '):
        return 'I';
        break
    case (d = '2 '):
        return 'II';
        break
    case (d = '3 '):
        return 'III';
        break
    case (d = '4 '):
        return 'IV';
        break
    case (d = '5 '):
        return 'V';
        break
    }
}



function recupInfosPerso() {
    var name = reqCharacterSheet.responseXML.getElementsByTagName("name")[0].textContent;
    var balance = reqCharacterSheet.responseXML.getElementsByTagName("balance")[0].textContent;
    var corpName = reqCharacterSheet.responseXML.getElementsByTagName("corporationName")[0].textContent;
    var allyName = reqCharacterSheet.responseXML.getElementsByTagName("allianceName")[0].textContent;
    var rowsetList = reqCharacterSheet.responseXML.getElementsByTagName("rowset");

    var portrait = document.createElement('img');
    portrait.setAttribute('src', 'http://image.eveonline.com/Character/'+characterid+'_64.jpg');


    var rowsetSkillsElement = rowsetList[0];



    // Groups
    var listGroup = new Array();
    var skillTreeDoc = skillTreeRequest.responseXML;
    var groups = skillTreeDoc.getElementsByTagName("row");

    for (var i = 0, row; row = groups[i]; i++) {
        if (row.getAttribute("groupName") != null && row.getAttribute("groupID") != null) {
            var tableGroup = document.createElement("table");
            tableGroup.setAttribute("idGroup", row.getAttribute("groupID"));
            var trHeaderGroup = document.createElement("tr");
            var thHeaderGroup = document.createElement("th");
            thHeaderGroup.setAttribute("colspan", 2);
            thHeaderGroup.className = "header";
            thHeaderGroup.innerText = row.getAttribute("groupName");
            tableGroup.setAttribute('spcount',0);
            tableGroup.setAttribute('skillcount',0);
            trHeaderGroup.appendChild(thHeaderGroup);
            tableGroup.appendChild(trHeaderGroup);
            listGroup.push(tableGroup);
        }
    }



    var tableSkills = document.createElement("table");
    var trHeader = document.createElement("tr");
    var thHeaderSkill = document.createElement("th");
    thHeaderSkill.innerText = "Skill";
    var thHeaderLevel = document.createElement("th");
    thHeaderLevel.innerText = "Level";

    trHeader.appendChild(thHeaderSkill);
    trHeader.appendChild(thHeaderLevel);

    //tableSkills.appendChild(trHeader);
    var skillList = rowsetSkillsElement.getElementsByTagName("row");
    var skillArr = [];
    for (var i = 0, row; row = skillList[i]; i++) {
        skillArr[i] = [];
        skillArr[i][1] = row.getAttribute("typeID");
        skillArr[i][0] = getLibelleSkill(row.getAttribute("typeID"))[0];
        skillArr[i][3] = getLibelleSkill(row.getAttribute("typeID"))[1];
        skillArr[i][2] = row.getAttribute("level");
        skillArr[i][4] = row.getAttribute("skillpoints");
    }
    skillArr.sort();
    for (var i = 0, row; row = skillArr[i]; i++) {

        var trSkill = document.createElement("tr");
        var lvImg = document.createElement('img');
        var tdSkill = document.createElement("td");
        var tdLevel = document.createElement("td");
        var skillName = document.createElement('span');
        if (row[2] == 5) {
            tdSkill.style.background = 'url(img/skillBookComplete.png) no-repeat';
        } else {
            tdSkill.style.background = 'url(img/skillBookPartial.png) no-repeat';
        }
        trSkill.className = 'skill nd';
        tdSkill.className = 'skillName';
        tdLevel.className = 'skillLv';
        trSkill.setAttribute("idSkill", row[1]);
        trSkill.setAttribute("spCount", row[4]);
        if (row[2] == 5) {
            skillName.innerHTML += row[0] + '(' + row[3] + 'x)<br>SP: ' + delim(row[4]);
        } else {
            skillName.innerHTML += row[0] + '(' + row[3] + 'x)<br><span id="sp'+row[1]+'">SP: ' + delim(row[4]) + '/' + delim(getMaxSP(row[2], row[3]));
        }
        tdSkill.appendChild(skillName);
        lvImg.setAttribute('src', 'img/level' + row[2] + '.gif');
        trSkill.appendChild(tdSkill);
        trSkill.appendChild(tdLevel);
        tdLevel.appendChild(lvImg);
        placeSkillInTableGroup(trSkill, listGroup);
        
    }
    for (var i = 0, row; row = listGroup[i]; i++) {
        var sp = row.getAttribute('spCount');
        var skills = row.getAttribute('skillCount');
        var thSpan = document.createElement('span');
        thSpan.innerHTML = ' skills: '+delim(skills)+' SP: '+delim(sp);
        thSpan.className = 'spsumm';
        row.getElementsByTagName('th')[0].appendChild(thSpan);
    }

    document.getElementById("idName").innerText = name;
    document.getElementById("idCorp").innerText = corpName;
    document.getElementById("idAlly").innerText = allyName;
    document.getElementById("idBalance").innerText = delim(balance)+" ISK";
    document.getElementById('portrait').appendChild(portrait);


    for (var i = 0, row; row = listGroup[i]; i++) {
        if (row.childNodes.length > 1) {
            document.getElementById("idListeSkillsConnus").appendChild(row);
        }
    }
}


function placeSkillInTableGroup(trSkill, listGroup) {
    var idGroup = getGroupIDBySkillID(trSkill.getAttribute("idSkill"));
    var sp = parseInt(trSkill.getAttribute("spCount"));
    for (var i = 0, row; row = listGroup[i]; i++) {
        if (row.getAttribute("idGroup") == idGroup) {
            row.appendChild(trSkill);
            var lastSp = parseInt(row.getAttribute('spCount'));
            var currSp = lastSp+sp;
            row.setAttribute('spCount',currSp.toString());
            var lastSkills = parseInt(row.getAttribute('skillCount'));
            var currSkills = lastSkills+1;
            row.setAttribute('skillCount',currSkills.toString());
        }
    }
}

function getGroupIDBySkillID(idSkill) {
    var skillTreeDoc = skillTreeRequest.responseXML;
    var currentTypes = skillTreeDoc.getElementsByTagName("row");
    for (var i = 0, row; row = currentTypes[i]; i++) {
        if (row.getAttribute("typeID") == idSkill && row.getAttribute("typeName") != null) {
            return row.getAttribute("groupID");
        }
    }
}

function delim(st) {
    var trSt = st + '';
    return trSt.replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1' + digit_del);
}

function getMaxSP(lv, rank) {
    return Math.ceil(Math.pow(2, ((2.5 * (parseInt(lv) + 1)) - 2.5)) * 250 * rank);

}




function getLearnSpeed(start,end,from,to) {
    return (Date.parse(end) - Date.parse(start))/(to-from);
}

