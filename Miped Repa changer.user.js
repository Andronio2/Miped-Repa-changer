// ==UserScript==
// @name         Miped Repa changer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Andronio
// @homepage     https://github.com/Andronio2/Miped-Repa-changer
// @supportURL   https://github.com/Andronio2/Miped-Repa-changer/issues
// @updateURL    https://github.com/Andronio2/Miped-Repa-changer/raw/main/Miped%20Repa%20changer.user.js
// @downloadURL  https://github.com/Andronio2/Miped-Repa-changer/raw/main/Miped%20Repa%20changer.user.js
// @match        https://miped.ru/f/threads/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    let mess = document.querySelectorAll('.uix_messagePostBitWrapper');
    if (mess.length == 0) return;
    for (let m of mess) {
        let div = document.createElement('div');
        div.className = 'miped-repa-box';
        div.innerHTML = '<button class="miped-repa-btn miped-repa-minus" data-action="minus">-</button> repa <button class="miped-repa-btn miped-repa-plus" data-action="plus">+</button>';
        m.append(div);
    };
    let style = document.createElement('style');
    style.type = "text/css";
    let stylesCSS = `
.miped-repa-box {
margin: 0;
padding: 0;
height: 15px;
line-height: 50%;
text-align: center;
}

.miped-repa-btn {
height: 15px;
width: 15px;
border: 3px outset;
color: white;
text-align: center;
padding: 0;
line-height: 50%;
}

.miped-repa-minus {
border-color: green;
background: green;
}

.miped-repa-plus {
border-color: red;
background: red;
}

.miped-repa-minus:active, .miped-repa-plus:active {
border-style: inset;
}
`;
    style.innerText = stylesCSS;
    document.head.append(style);
    document.querySelector('.js-replyNewMessageContainer').addEventListener('click', btnHandler);

    async function btnHandler(event) {
        if (!event.target.classList.contains('miped-repa-btn')) return false;

        const getUserPage = async name => {
            let resp = await fetch(`https://miped.ru/user/${name}`);
            if (resp.ok) {
                let text = await resp.text();
                return text;
            } else {
                return null;
            }
        };

        const parseUserPage = page => {
            let num = page.match(/(?<=repa_global\('form',\s'0',\s')\d+(?=')/g);
            if (num) {
                let rep = page.match(/(?<=class="profile-body__reputation[\w\s]*">\n<span>)\d+(?=\s*<\/span>)/g);
                if (rep) {
                    return [num[0], rep[0]];
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }

        const actionDo = async (userID, name, action) => {
            console.log(userID, name, action);
            let resp = await fetch("https://miped.ru/engine/ajax/repa.php", {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrer": `https://miped.ru/user/${name}/`,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": `action=${action}&user_id=${userID}&dorepa=2&post_id=1&act=0&skin=miped2&description=script`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            });
            if (resp.ok) {
                resp = await resp.text();
                console.log(resp);
            } else {
                console.log("Не смог отправить запрос репы");
            }
        }

        let action = event.target.dataset.action;
        let target = event.target.parentElement.parentElement;
        let name = target.firstElementChild.firstElementChild.firstElementChild.textContent;
        let oldRepa = target.children[1].children[1].children[1].textContent;
        console.log("Пользователь " + name + "; Репа была " + oldRepa);
        let resp = await getUserPage(name);
        if (resp) {
            let userMass = parseUserPage(resp);
            if (userMass) {
                if (+userMass[0] < +oldRepa) {
                    console.log("Невозможно поменять репу, репа уменьшится");
                    return alert("Этому пользователю не получится изменить репу, репа уменьшится");
                }
                resp = await actionDo(userMass[0], name, action);
                console.log(resp);
            } else {
                console.log("Не смог разобрать ID пользователя");
                return alert("Этому пользователю не получится изменить репу");
            }
        } else {
            console.log("Не смог скачать страницу пользователя");
            return alert("Этому пользователю не получится изменить репу");
        }
    };
})();
