const config = {
    serverAddr: 'http://localhost:3000'
  }
  
let page = 1;
let pageCount = 0;
let params = '';
let isLogin = localStorage.getItem('employeeToken') != null;

const Mode = {EDIT: 0, ADD: 1};
let mode = Mode.EDIT;
let id = -1;

function setIsLogin() {
    if (localStorage.getItem('employeeToken') == null) {
        isLogin = false;
        fillEditButtons();
        return;
    }

    const prevDate = localStorage.getItem('employeeDate');
    const curDate = (new Date()).getTime();
    isLogin = (curDate - prevDate < 300 * 1000);
    fillEditButtons();
}


function loginSubmit() {
    if (!isLogin) {
        const username = document.getElementById("inputLogin").value;
        const passwd = document.getElementById("inputPassword").value;

        let xhr = new XMLHttpRequest();
        xhr.open('POST', `${config.serverAddr}/users/Login`);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        xhr.send(JSON.stringify({username: username, passwd: passwd}));

        xhr.onload = () => {
        if (xhr.status != 200) {
            alert('Wrong username/passwd pair');
        } else {
            const token = JSON.parse(xhr.response).token;
            const date = new Date();
            const time = date.getTime();
            localStorage.setItem('employeeToken', token);
            localStorage.setItem('employeeDate', time);
            isLogin = true;
            fillEditButtons();
        }
        }
        xhr.onerror = () => { alert('Connection error'); }
    }
    else {
        localStorage.removeItem('employeeToken');
        localStorage.removeItem('employeeDate');
        isLogin = false;
        alert('Successfully log out');
        fillEditButtons();
    }

    return true;
}


function getEmployees(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${config.serverAddr}/employees?pageNumber=${page}&${params}`);
    xhr.responseType = 'json';

    xhr.onerror = () => { alert(`Connection error: ${xhr.status}`); }
    xhr.onload = () => {
        if (xhr.status == 200) {
            callback(xhr.response);
        }
        else
            alert('Request failed');
    }

    xhr.send();
}


function getEmployeeById(id, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${config.serverAddr}/employees/${id}`);
    xhr.responseType = 'json';

    xhr.onerror = () => { alert(`Connection error: ${xhr.status}`); }
    xhr.onload = () => {
        if (xhr.status == 200) {
        callback(xhr.response);
        }
        else
        alert('Request failed');
    }
    xhr.send();
}


function fillEmployeeByParam() {
    let savedParams = params;

    if (document.getElementById('ascSortButton').checked)
        params += '&sortedBy=salary&sortOrder=ASC';
    else if (document.getElementById('descSortButton').checked)
        params += '&sortedBy=salary&sortOrder=DESC';

    const returnEmployees = function (ans) { 
        const templateStr = document.getElementById('employeeTemplate').innerHTML;
        let employeeTemplate = _.template(templateStr);
        let table = document.getElementById("employeeTableBody");
        table.innerHTML = employeeTemplate({employees: ans.employees});
        pageCount = ans.pageCount;

        fillEditButtons();
        setIsLogin();

        /* setup paging */
        const prevPageElement = document.getElementById('prevPage');
        const nextPageElement = document.getElementById('nextPage');

        if (page < pageCount)
            nextPageElement.setAttribute('style', 'visibility: visible;');
        else
            nextPageElement.setAttribute('style', 'visibility: hidden;');

        if (page > 1)
            prevPageElement.setAttribute('style', 'visibility: visible;');
        else
            prevPageElement.setAttribute('style', 'visibility: hidden;');
    };

    getEmployees(returnEmployees);
    document.getElementById('curPage').innerHTML = `${page}`;
        

    params = savedParams;
}


function setButtonVisibility(button) {
    if (!isLogin)
        button.setAttribute('style', 'visibility: hidden;');
    else
        button.setAttribute('style', 'visibility: visible;');
}


function fillEditButtons() {
    controlButton = document.getElementById('controlButtons');
    setButtonVisibility(controlButton);

    addUserButton = document.getElementById('addUserButton');
    setButtonVisibility(addUserButton);

    loginButton = document.getElementById('loginButton');
    loginButton.innerHTML = isLogin ? "Logout" : "Login";

    if (isLogin) {
        loginButton.removeAttribute('data-bs-toggle');
        loginButton.removeAttribute('data-bs-target');
        loginButton.setAttribute('onclick', 'loginSubmit();');
    }
    else {
        loginButton.removeAttribute('onclick');
        loginButton.setAttribute('data-bs-toggle', 'modal');
        loginButton.setAttribute('data-bs-target', '#loginModal');
    }

    buttons = document.getElementsByClassName('btn btn-primary editButtons');
    if (buttons.length != 0)
        for (let idx = 0; idx < buttons.length; idx++) {
        button = buttons[idx];
        setButtonVisibility(button);
        }

    buttons = document.getElementsByClassName('btn btn-primary rmUserButtons');
    if (buttons.length != 0)
        for (let idx = 0; idx < buttons.length; idx++) {
        button = buttons[idx];
        setButtonVisibility(button);
        }
}

// Add Ctrl+Y handler for focusing search input
document.addEventListener('keyup', event => {
    const element = document.getElementById('employeeSearch');
    if (event.ctrlKey && event.code == 'KeyY') {
        element.focus();
    }
    if (event.keyCode == 13) {
        const text = element.value;
        if (text != '') {
        page = 1;
        params = `name=${text}`;
        }
        fillEmployeeByParam();
    }
});

document.getElementById('prevPage').addEventListener('click', () => {
    page -= 1;
    fillEmployeeByParam();
});

document.getElementById('nextPage').addEventListener('click', () => {
    page += 1;
    fillEmployeeByParam();
});

document.getElementById('addUserButton').addEventListener('click', () => {
    mode = Mode.ADD;
    document.getElementById('addUserModalTitle').innerHTML = 'Add user';
});

function processUserData(request, address, message) {
    const name = document.getElementById('addUserName').value;
    const surname = document.getElementById('addUserSurname').value;
    const position = document.getElementById('addUserPosition').value;
    const salary = document.getElementById('addUserSalary').value;
    const birthday = document.getElementById('addUserBirthday').value;

    let xhr = new XMLHttpRequest();
    xhr.open(request, address);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('employeeToken'));
    xhr.send(JSON.stringify({
        'name': name,
        'surname': surname,
        'birthday': birthday,
        'position': position,
        'salary': salary
}));

xhr.onload = () => {
    if (xhr.status == 403) {
        localStorage.removeItem('employeeToken');
        localStorage.removeItem('employeeDate');
        isLogin = false;
        fillEditButtons();
    } else if (xhr.status == 200) {
        fillEmployeeByParam();
        alert(message);
    }

    if (xhr.status != 200)
        alert(xhr.response);
}
xhr.onerror = () => { alert('Connection error'); }
}

document.getElementById('addUserSubmitButton').addEventListener('click', () => {
if (mode == Mode.EDIT) {
    processUserData('PUT', `${config.serverAddr}/employees/${id}`, 'Successfully edited employee');
} else if (mode === Mode.DELETE) {
	processUserData('DELETE', `${config.serverAddr}/employees/${id}`, 'Successfully deleted employee');
}
else // if mode === Mode.ADD
    processUserData('POST', `${config.serverAddr}/employees`, 'Successfully added employee');
});

document.getElementById('sortButtons').addEventListener('click', (event) => {
    if (event.target.htmlFor) {
        document.getElementById(event.target.htmlFor).checked = true;
        fillEmployeeByParam();
    }
});

function processEditUserButtons(event) {
    if (event.target.id.includes('editButton')) {
        mode = Mode.EDIT;
        document.getElementById('addUserModalTitle').innerHTML = 'Edit user';
        id = event.target.id.split('editButton')[1];

        getEmployeeById(id, (ans) => { 
            document.getElementById('addUserName').value = ans.name;
            document.getElementById('addUserSurname').value = ans.surname;
            document.getElementById(ans.position).selected = true;
            document.getElementById('addUserSalary').value = ans.salary;
            document.getElementById('addUserBirthday').value = ans.birthday;
        });
    }
}

function processRmUserButtons(event) {
    if (event.target.id.includes('rmUserButton')) {
//		document.getElementById('rmUserModalTitle').innerHTML = 'Remove user';
        const id = event.target.id.split('rmUserButton')[1]

        let xhr = new XMLHttpRequest();
        xhr.open('DELETE', `${config.serverAddr}/employees/${id}`);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('employeeToken'));
        xhr.send();

        xhr.onload = () => {
        if (xhr.status == 403) {
            localStorage.removeItem('employeeToken');
            localStorage.removeItem('employeeDate');
            isLogin = false;
            fillEditButtons();
        } else {
            alert('Successfully removed employee');
            fillEmployeeByParam();
        }

        if (xhr.status != 200)
            alert(JSON.parse(xhr.response).message);
        }
        xhr.onerror = () => { alert('Connection error'); }
    }
}

document.getElementById('employeeTableBody').addEventListener('click', (event) => {
    processEditUserButtons(event);
    processRmUserButtons(event);
});

fillEmployeeByParam();
