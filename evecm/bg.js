var compteur =[];
var digit_del = ",";
var tabcouleurfind = new Array();
            var apiserver = "http://api.eve-online.com";

            var msPerDay = 24 * 60 * 60 * 1000;
            var msPerHour = 60 * 60 * 1000;
            var msPerMinutes =  60 * 1000;
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

            function init() {
                skillTreeRequest.open("GET","skillTree.xml",false);
                skillTreeRequest.send("");
                reqSkillInTraining.open(
                    "GET",
                    apiserver + "/char/SkillInTraining.xml.aspx?userID=" + userid + "&characterID=" + characterid + "&apiKey=" + apikey,
                true);
                reqSkillInTraining.onload = recupSkillInTraining;
                reqSkillInTraining.send(null);
                reqCharacterSheet.open(
                 "GET",
                    apiserver + "/char/CharacterSheet.xml.aspx?userID=" + userid + "&characterID=" + characterid + "&apiKey=" + apikey,
                true);
                reqCharacterSheet.onload = recupInfosPerso;
                reqCharacterSheet.send(null);


            }

            function refreshDateFin() {
                compteur = differenceDates(queue[queue.length-1][3]);
                if (differenceDates(dateFin)[3]<=0) {
                    var notification = webkitNotifications.createNotification(
                    'icon.png',  // icon url - can be relative
                    'Skill training complete',  // notification title
                    currSkill+' '+trLevel  // notification body text
                     );
                notification.show();
                location.reload();
                }
                chrome.browserAction.setBadgeText({text:compteur[0]});
                chrome.browserAction.setTitle({title:drawQueue()});
                chrome.browserAction.setBadgeBackgroundColor({color:compteur[2]});
                setTimeout("refreshDateFin()",1000)
            }

            function drawQueue() {
                var ret = '';
                for (var i=0; i<queue.length; i++) {
                    ret = ret+queue[i][0]+' '+queue[i][1]+': '+differenceDates(queue[i][3])[1]+'\n';
                }
                var ret2 = ret.slice(0,-1);
                return ret2;
            }

            function queueCalc() {
                var skills = skillQueue.responseXML.getElementsByTagName("row");
                for (var i=0; i<skills.length; i++) {
                    queue[i]=[];
                    queue[i][0] = getLibelleSkill(skills[i].getAttribute('typeID'))[0];
                    queue[i][1] = toRoman(skills[i].getAttribute('level')+' ');
                    queue[i][2] = Date.parse(skills[i].getAttribute('startTime'));
                    queue[i][2].addMinutes(new Date().getTimezoneOffset() * -1);
                    queue[i][3] = Date.parse(skills[i].getAttribute('endTime'));
                    queue[i][3].addMinutes(new Date().getTimezoneOffset() * -1);
                }
                refreshDateFin();

            }

            function recupSkillInTraining() {
                 var trainingTypeIDList = reqSkillInTraining.responseXML.getElementsByTagName("trainingTypeID");
                var trainingToLevelList = reqSkillInTraining.responseXML.getElementsByTagName("trainingToLevel");
                var trainingEndTimeList = reqSkillInTraining.responseXML.getElementsByTagName("trainingEndTime");
                 var trainingBool = reqSkillInTraining.responseXML.getElementsByTagName("skillInTraining")[0].textContent;
                 if (trainingBool==1) {
                    var trainingTypeIDElement = trainingTypeIDList[0];
                    var trainingToLevelElement = trainingToLevelList[0];
                    var trainingEndTimeElement = trainingEndTimeList[0];
                    trLevel = toRoman(trainingToLevelElement.textContent+" ");


                    currSkill = getLibelleSkill(trainingTypeIDElement.textContent)[0];
                    var trainingEndTime = trainingEndTimeElement.textContent;
                    dateFin = Date.parse(trainingEndTime);
                    dateFin.addMinutes(new Date().getTimezoneOffset() * -1);
                    skillQueue.open(
                        "GET",
                        apiserver + "/char/SkillQueue.xml.aspx?userID=" + userid + "&characterID=" + characterid + "&apiKey=" + apikey,
                    true);
                        skillQueue.onload = queueCalc;
                        skillQueue.send(null);
                 } else{
                     alert("Warning! No Skill in training!");
                     chrome.browserAction.setBadgeText({text:"warn"});
                     chrome.browserAction.setBadgeBackgroundColor({color:[255,0,0,255]});
                 }
           }



function differenceDates(d) {
    var dateNow = new Date();
    var stop = 0;
    var ret = [];
    ret[1]="";
    var timeBetween = d.valueOf() - dateNow.valueOf();
    ret[3] = timeBetween;
    var jours = Math.floor(timeBetween / msPerDay);
    if (jours > 0){
        timeBetween = timeBetween - (jours * msPerDay);
        ret[0] = jours+"d";
        ret[1] = jours + " days, ";
        ret[2] = [30, 60, 150, 230];
        stop = 1;
    }

    var heures = Math.floor(timeBetween / msPerHour);
    if (heures > 0) {
        timeBetween = timeBetween - (heures * msPerHour);
        ret[1] = ret[1]+heures + " hours, ";
        if (stop == 0){
            ret[0] =  heures+"h";
            ret[2] = [255, 20, 20, 230];
            stop = 1;
        }
    }

    var minutes = Math.floor(timeBetween / msPerMinutes);
    if (minutes > 0){
        timeBetween = timeBetween - (minutes * msPerMinutes);
        ret[1] = ret[1]+minutes + " mins, "
        if (stop == 0) {
            ret[0] = minutes+"m";
            ret[2] = [255, 20, 20, 230];
            stop = 1;
        }
    }

    var secondes = Math.floor(timeBetween / msPerSeconds);
    if (secondes > 0) {
        timeBetween = timeBetween - (secondes * msPerSeconds);
        ret[1] = ret[1]+secondes + " sec"
        if (stop == 0) {
            ret[0] = secondes+"s";
            ret[2] = [255, 20, 20, 230];
        }
    }

    return ret;
}

function getLibelleSkill(idSkill) {
    var skillTreeDoc = skillTreeRequest.responseXML;
    var currentTypes = skillTreeDoc.getElementsByTagName("row");
    var ret=[];

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
                       case (d='1 '):
                           return 'I';
                       break
                       case (d='2 '):
                           return 'II';
                       break
                       case (d='3 '):
                           return 'III';
                       break
                       case (d='4 '):
                           return 'IV';
                       break
                       case (d='5 '):
                            return 'V';
                       break
                   }
}



function recupInfosPerso() {
    var nameList = reqCharacterSheet.responseXML.getElementsByTagName("name");
    var balanceList = reqCharacterSheet.responseXML.getElementsByTagName("balance");
    var rowsetList = reqCharacterSheet.responseXML.getElementsByTagName("rowset");

    var nameElement = nameList[0];
    var balanceElement = balanceList[0];
    var rowsetSkillsElement = rowsetList[0];

    var name = nameElement.textContent;
    var balance = delim(balanceElement.textContent);


    // Groups
    var listGroup = new Array();
    var skillTreeDoc = skillTreeRequest.responseXML;
    var groups = skillTreeDoc.getElementsByTagName("row");

    for (var i = 0, row; row = groups[i]; i++) {
        if (row.getAttribute("groupName") != null && row.getAttribute("groupID")!= null) {
            var tableGroup = document.createElement("table");
            tableGroup.setAttribute("idGroup",row.getAttribute("groupID"));
            var trHeaderGroup = document.createElement("tr");
            var thHeaderGroup = document.createElement("th");
            thHeaderGroup.setAttribute("colspan",2);
            thHeaderGroup.className ="header";
            thHeaderGroup.innerText = row.getAttribute("groupName");
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
        skillArr[i]=[];
        skillArr[i][1]=row.getAttribute("typeID");
        skillArr[i][0]=getLibelleSkill(row.getAttribute("typeID"))[0];
        skillArr[i][3]=getLibelleSkill(row.getAttribute("typeID"))[1];
        skillArr[i][2]=row.getAttribute("level");
        skillArr[i][4]=row.getAttribute("skillpoints");
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
        trSkill.setAttribute("idSkill",row[1]);
        if (row[2]==5) {
            skillName.innerHTML += row[0]+'('+row[3]+'x)<br>SP: '+delim(row[4]);
        } else {
            skillName.innerHTML += row[0]+'('+row[3]+'x)<br>SP: '+delim(row[4])+'/'+delim(getMaxSP(row[2],row[3]));
        }
        tdSkill.appendChild(skillName);
        lvImg.setAttribute('src', 'img/level'+row[2]+'.gif');
        trSkill.appendChild(tdSkill);
        trSkill.appendChild(tdLevel);
        tdLevel.appendChild(lvImg);

        placeSkillInTableGroup(trSkill,listGroup);
        //tableSkills.appendChild(trSkill);
    }


    document.getElementById("idName").innerText = name;
    document.getElementById("idBalance").innerHTML = balance;

    for (var i = 0, row; row = listGroup[i]; i++) {
        if (row.childNodes.length > 1) {
            document.getElementById("idListeSkillsConnus").appendChild(row);
        }
    }


}


function placeSkillInTableGroup(trSkill,listGroup) {
    var idGroup = getGroupIDBySkillID(trSkill.getAttribute("idSkill"));
    for (var i = 0, row; row = listGroup[i]; i++) {
        if (row.getAttribute("idGroup") == idGroup) {
            row.appendChild(trSkill);
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
    var trSt = st+'';
    return trSt.replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1'+digit_del);
}

function getMaxSP(lv,rank) {
   return  Math.ceil(Math.pow(2,((2.5*(parseInt(lv)+1))-2.5))*250*rank);
}
