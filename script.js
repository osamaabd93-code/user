import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAkQpzDCLuL_IXuyIqZrAl4B__BtvieGmI",
    authDomain: "iook-92aee.firebaseapp.com",
    projectId: "iook-92aee",
    storageBucket: "iook-92aee.firebasestorage.app",
    messagingSenderId: "92508471614",
    appId: "1:92508471614:web:3d2a192bc0182ff436ac6f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let appData = {
    drivers: [], mandoubs: [], buses: [], accountants: [], expenseTypes: [], busExpenseOptions: [],
    users: [], savedTrips: [], savedTripsInfo: [], tasks: [], returnInfos: [],
    busFunds: {}, userExpenses: [], userIncomes: [], userBusExpenses: [], finances: []
};

const $ = (id) => document.getElementById(id);

window.showCustomAlert = (message) => {
    const container = $("custom-alert-container");
    if (!container) return;
    const alertDiv = document.createElement("div");
    alertDiv.className = "custom-alert";
    alertDiv.textContent = message;
    container.appendChild(alertDiv);
    setTimeout(() => { if (container.contains(alertDiv)) container.removeChild(alertDiv); }, 3000);
};

async function compressImageAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) { resolve(""); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width, height = img.height;
                if (width > height) { if (width > 800) { height *= 800 / width; width = 800; } }
                else { if (height > 800) { width *= 800 / height; height = 800; } }
                canvas.width = width; canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.6));
            };
        };
        reader.onerror = reject;
    });
}

async function saveToDB() {
    try { await setDoc(doc(db, "system", "data"), appData); }
    catch (e) { console.error("خطأ في الحفظ:", e); }
}

function listenToDB() {
    onSnapshot(doc(db, "system", "data"), (docSnap) => {
        if (docSnap.exists()) {
            appData = {
                drivers: [], mandoubs: [], buses: [], accountants: [], expenseTypes: [], busExpenseOptions: [],
                users: [], savedTrips: [], savedTripsInfo: [], tasks: [], returnInfos: [],
                busFunds: {}, userExpenses: [], userIncomes: [], userBusExpenses: [], finances: [],
                ...docSnap.data()
            };
            refreshAllUI();
        } else {
            saveToDB();
        }
    });
}

function refreshAllUI() {
    populateUserSelectsForLogin();
    populateSelects();
    updateUserDashboard();
    renderUserExpensesList();
    renderTasksList();
}

function populateUserSelectsForLogin() {
    const userSelect = $("user-name-select");
    if (userSelect) {
        userSelect.innerHTML = '<option value="">اختر اسمك</option>';
        (appData.users || []).forEach(u => userSelect.innerHTML += `<option value="${u.name}">${u.name}</option>`);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupLoginSystem();
    setupNavigation();
    setupImageCompressors();
    setupImageModal();
    setupSaveButtons();
    listenToDB();
});

function setupImageCompressors() {
    const attachCompressor = (inputId, hiddenId) => {
        const input = $(inputId), hidden = $(hiddenId);
        if (input && hidden) input.addEventListener("change", async (e) => hidden.value = await compressImageAndConvertToBase64(e.target.files[0]));
    };
    attachCompressor("user-expense-file", "user-expense-file-base64");
    attachCompressor("user-bus-exp-file", "user-bus-exp-file-base64");
}

function setupImageModal() {
    const modal = $("image-modal");
    const modalImg = $("modal-img");
    window.openImage = (src) => { modal.style.display = "block"; modalImg.src = src; };
    document.getElementsByClassName("close-modal")[0].onclick = () => modal.style.display = "none";
    window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };
}

function setupLoginSystem() {
    $("btn-login-user").addEventListener("click", () => {
        const name = $("user-name-select").value;
        const pass = $("user-pass-input").value;
        const user = (appData.users || []).find(u => u.name === name && u.pass === pass);
        if (user) {
            window.loggedInUser = user.name;
            $("logged-in-user-name").textContent = user.name;
            $("tasks-person-name").textContent = user.name;
            $("login-screen").classList.add("hidden");
            $("user-app").classList.remove("hidden");
            $("user-pass-input").value = "";
            refreshAllUI();
        } else {
            showCustomAlert("اسم المستخدم أو كلمة المرور غير صحيحة");
        }
    });

    document.querySelectorAll(".btn-logout").forEach(btn => {
        btn.addEventListener("click", () => {
            $("user-app").classList.add("hidden");
            $("login-screen").classList.remove("hidden");
            window.loggedInUser = null;
        });
    });
}

function setupNavigation() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = item.getAttribute("data-target");
            document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
            document.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            $(targetId).classList.add("active");
        });
    });
}

function getRelatedTrips() {
    if (!window.loggedInUser) return [];
    return (appData.savedTrips || []).filter(trip =>
        trip.driver === window.loggedInUser ||
        trip.driver2 === window.loggedInUser ||
        trip.mandoub === window.loggedInUser
    );
}

function populateSelects() {
    const relatedTrips = getRelatedTrips();
    const tripOptions = relatedTrips.map(t => `<option value="${t.name}">${t.name}</option>`).join("");

    const busHtml = (appData.buses || []).map(n => `<option value="${n}">${n}</option>`).join("");
    $("user-car-type-select").innerHTML = `<option value="">اختر السيارة</option>${busHtml}`;
    $("user-bus-car-select").innerHTML = `<option value="">اختر السيارة</option>${busHtml}`;

    const driverHtml = (appData.drivers || []).map(n => `<option value="${n}">${n}</option>`).join("");
    $("user-bus-driver-select").innerHTML = `<option value="">اختر السائق</option>${driverHtml}`;

    $("user-expense-type-select").innerHTML = `<option value="">اختر النوع</option>` + (appData.expenseTypes || []).map(n => `<option>${n}</option>`).join("");
    $("user-bus-opts-select").innerHTML = `<option value="">بدون خيار</option>` + (appData.busExpenseOptions || []).map(n => `<option>${n}</option>`).join("");

    $("user-expense-trip-name").innerHTML = `<option value="">اختر الرحلة</option>${tripOptions}`;
    $("user-income-trip-name").innerHTML = `<option value="">اختر الرحلة</option>${tripOptions}`;
    $("user-bus-exp-trip-name").innerHTML = `<option value="">اختر الرحلة</option>${tripOptions}`;
    $("user-return-trip-name").innerHTML = `<option value="">اختر الرحلة</option>${tripOptions}`;
}

function getCurrentFinanceForUser() {
    if (!window.loggedInUser) return null;
    const userFinances = (appData.finances || []).filter(f => f.driverName === window.loggedInUser || f.mandoubName === window.loggedInUser);
    return userFinances.length ? userFinances[userFinances.length - 1] : null;
}

function updateAdvanceDisplay() {
    if (!window.loggedInUser) return;
    let currentAdvance = 0;
    const latestFinance = getCurrentFinanceForUser();
    if (latestFinance) {
        if (latestFinance.driverName === window.loggedInUser) currentAdvance = Number(latestFinance.driverAdvance) || 0;
        else if (latestFinance.mandoubName === window.loggedInUser) currentAdvance = Number(latestFinance.mandoubAdvance) || 0;
    }
    $("expenses-driver-name").textContent = window.loggedInUser;
    $("expenses-advance-amount").textContent = currentAdvance;
}

function renderTasksList() {
    const list = $("user-tasks-list");
    if (!list || !window.loggedInUser) return;
    const userTasks = (appData.tasks || []).filter(t => t.personName === window.loggedInUser);
    list.innerHTML = userTasks.map((t, i) => `
        <li style="justify-content: space-between; flex-wrap: wrap;">
            <span>${t.tripName || "-"} | ${t.task || "-"} | ${t.status || "-"}</span>
            <div>
                <button onclick="updateMyTaskStatus('${t.createdAt || i}')" class="glass-btn" style="padding:5px 10px; cursor:pointer;">تحديث الحالة</button>
            </div>
        </li>`).join("");
    if (!list.innerHTML) list.innerHTML = '<li>لا توجد مهمات حالياً</li>';
}

window.updateMyTaskStatus = (taskId) => {
    const task = (appData.tasks || []).find(t => (t.createdAt || "") === taskId && t.personName === window.loggedInUser);
    if (!task) return;
    const status = prompt("أدخل الحالة الجديدة", task.status || "قيد التنفيذ");
    if (status) {
        task.status = status;
        const notes = prompt("الملاحظات", task.notes || "");
        if (notes !== null) task.notes = notes;
        saveToDB();
        showCustomAlert("تم تحديث حالة المهمة");
    }
};

function renderUserExpensesList() {
    const list = $("user-expenses-list");
    if (!list || !window.loggedInUser) return;
    let html = "";
    (appData.userExpenses || []).forEach((exp, i) => {
        if (exp.user === window.loggedInUser) {
            html += `
                <li style="justify-content: space-between; flex-wrap: wrap;">
                    <span>الرحلة: ${exp.tripName || "-"} | المبلغ: ${exp.amount} ${exp.currency} | النوع: ${exp.type} | التاريخ: ${(exp.date || "").split("T")[0] || ""}</span>
                    <div><button onclick="deleteUserExpense(${i})" class="glass-btn" style="background:rgba(255,0,0,0.5) !important; padding:5px 10px; cursor:pointer;">حذف</button></div>
                </li>`;
        }
    });
    list.innerHTML = html || '<li>لا توجد مصاريف مسجلة</li>';
}

window.deleteUserExpense = (i) => {
    if (prompt("أدخل رمز الحذف:") === "1001") {
        const exp = appData.userExpenses[i];
        const latestFinance = getCurrentFinanceForUser();
        if (latestFinance) {
            if (latestFinance.driverName === window.loggedInUser) latestFinance.driverAdvance = (Number(latestFinance.driverAdvance) || 0) + Number(exp.amount || 0);
            else if (latestFinance.mandoubName === window.loggedInUser) latestFinance.mandoubAdvance = (Number(latestFinance.mandoubAdvance) || 0) + Number(exp.amount || 0);
        }
        appData.userExpenses.splice(i, 1);
        saveToDB();
        showCustomAlert("تم حذف المصروف بنجاح!");
        refreshAllUI();
    } else {
        showCustomAlert("رمز الحذف غير صحيح!");
    }
};

function setupSaveButtons() {
    $("btn-save-user-expense").addEventListener("click", () => {
        const expAmount = $("user-expense-amount").value;
        const exp = {
            user: window.loggedInUser,
            tripName: $("user-expense-trip-name").value,
            currency: $("user-expense-currency").value,
            amount: expAmount,
            type: $("user-expense-type-select").value,
            liters: $("user-expense-liters").value,
            carType: $("user-car-type-select").value,
            kmAfter: $("user-expense-km-after").value,
            notes: $("user-expense-notes").value,
            imgBase64: $("user-expense-file-base64").value,
            date: new Date().toISOString()
        };
        if (!appData.userExpenses) appData.userExpenses = [];
        appData.userExpenses.push(exp);

        const latestFinance = getCurrentFinanceForUser();
        if (latestFinance) {
            if (latestFinance.driverName === window.loggedInUser) latestFinance.driverAdvance = (Number(latestFinance.driverAdvance) || 0) - Number(expAmount || 0);
            else if (latestFinance.mandoubName === window.loggedInUser) latestFinance.mandoubAdvance = (Number(latestFinance.mandoubAdvance) || 0) - Number(expAmount || 0);
        }

        $("user-expense-form").reset();
        $("user-expense-file-base64").value = "";
        saveToDB();
        refreshAllUI();
        showCustomAlert("تم تسجيل المصروف بنجاح");
    });

    $("btn-save-user-income").addEventListener("click", () => {
        const inc = {
            user: window.loggedInUser,
            tripName: $("user-income-trip-name").value,
            currency: $("user-income-currency").value,
            type: $("user-income-type").value,
            amount: $("user-income-amount").value,
            date: new Date().toISOString()
        };
        if (!appData.userIncomes) appData.userIncomes = [];
        appData.userIncomes.push(inc);
        $("user-income-form").reset();
        saveToDB();
        refreshAllUI();
        showCustomAlert("تم تسجيل الإيراد بنجاح");
    });

    $("btn-save-user-bus-exp").addEventListener("click", () => {
        const busExp = {
            user: window.loggedInUser,
            tripName: $("user-bus-exp-trip-name").value,
            currency: $("user-bus-exp-currency").value,
            amount: $("user-bus-exp-amount").value,
            date: $("user-bus-exp-date").value,
            opts: $("user-bus-opts-select").value,
            driver: $("user-bus-driver-select").value,
            car: $("user-bus-car-select").value,
            imgBase64: $("user-bus-exp-file-base64").value
        };
        if (!appData.userBusExpenses) appData.userBusExpenses = [];
        appData.userBusExpenses.push(busExp);
        $("user-bus-expense-form").reset();
        $("user-bus-exp-file-base64").value = "";
        saveToDB();
        showCustomAlert("تم حفظ مصاريف الباص بنجاح");
    });

    $("btn-save-user-return").addEventListener("click", () => {
        const userRole = (appData.drivers || []).includes(window.loggedInUser) ? "driver" : "mandoub";
        const record = {
            tripName: $("user-return-trip-name").value,
            currency: $("user-return-currency").value,
            userName: window.loggedInUser,
            userRole,
            bonus: $("user-return-bonus").value,
            discount: $("user-return-discount").value,
            netKm: $("user-return-net-km").value,
            date: new Date().toISOString()
        };
        if (!appData.returnInfos) appData.returnInfos = [];
        appData.returnInfos.push(record);
        $("user-return-form").reset();
        saveToDB();
        refreshAllUI();
        showCustomAlert("تم حفظ معلومات بعد العودة");
    });
}

function updateUserDashboard() {
    if (!window.loggedInUser) return;

    const trips = getRelatedTrips();
    const pendingTrips = trips.filter(t => t.status !== "مكتملة").length;
    const totalTrips = trips.length;
    const totalDays = trips.reduce((sum, t) => sum + (Number(t.days) || 0), 0);

    const myReturnRows = (appData.returnInfos || []).filter(r =>
        r.userName === window.loggedInUser ||
        (trips.some(t => t.name === r.tripName) && (
            (r.userRole === "driver" && ((appData.drivers || []).includes(window.loggedInUser))) ||
            (r.userRole === "mandoub" && ((appData.mandoubs || []).includes(window.loggedInUser)))
        ))
    );

    let totalBonus = 0, totalDiscount = 0;
    myReturnRows.forEach(r => {
        if (r.userName === window.loggedInUser) {
            totalBonus += Number(r.bonus) || 0;
            totalDiscount += Number(r.discount) || 0;
        } else {
            const isDriver = (appData.drivers || []).includes(window.loggedInUser);
            totalBonus += Number(isDriver ? r.driverBonus : r.mandoubBonus) || 0;
            totalDiscount += Number(isDriver ? r.driverDiscount : r.mandoubDiscount) || 0;
        }
    });

    const totalIncome = (appData.userIncomes || []).filter(i => i.user === window.loggedInUser).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    $("user-stat-pending").textContent = pendingTrips;
    $("user-stat-total").textContent = totalTrips;
    $("user-stat-days").textContent = totalDays;
    $("user-stat-bonus").textContent = totalBonus;
    $("user-stat-discount").textContent = totalDiscount;
    $("user-stat-income").textContent = totalIncome;

    updateAdvanceDisplay();

    let currentTripHtml = '<p>لا توجد رحلة حالية معلقة.</p>';
    const currentTrip = trips.find(t => t.status !== "مكتملة");
    if (currentTrip) {
        currentTripHtml = `
            <h3 style="color: #6ee7b7; margin-bottom: 10px;">${currentTrip.name}</h3>
            <p><strong>رقم الرحلة:</strong> ${currentTrip.tripNumber || "-"}</p>
            <p><strong>التاريخ:</strong> ${currentTrip.date || "-"} | <strong>عدد الأيام:</strong> ${currentTrip.days || 0}</p>
            <p><strong>المندوب:</strong> ${currentTrip.mandoub || "-"} | <strong>السائق الأول:</strong> ${currentTrip.driver || "-"} | <strong>السائق الثاني:</strong> ${currentTrip.driver2 || "-"}</p>
            <p><strong>الباص المستخدم:</strong> ${currentTrip.bus || "-"} | <strong>عدد الباصات:</strong> ${currentTrip.busCount || 0}</p>
            <p><strong>عدد الكيلومترات قبل الرحلة:</strong> ${currentTrip.kmBefore || 0}</p>
            <p><strong>الملاحظات:</strong> ${currentTrip.notes || "-"}</p>
            <p><strong>حالة الرحلة:</strong> <span style="font-weight: bold; color: #fca5a5;">${currentTrip.status || "-"}</span></p>
        `;
    }

    let financialHtml = "";
    const latestFinance = getCurrentFinanceForUser();
    if (latestFinance) {
        const isDriver = latestFinance.driverName === window.loggedInUser;
        const isMandoub = latestFinance.mandoubName === window.loggedInUser;
        financialHtml = `<h4 style="margin-top: 15px; margin-bottom: 10px; color: #93c5fd;">التفاصيل المالية (من الإدارة):</h4>`;
        if (isDriver) financialHtml += `
            <p><strong>الأجرة الكلية:</strong> ${latestFinance.driverTotal || 0}</p>
            <p><strong>المبلغ الواصل:</strong> ${latestFinance.driverPaid || 0}</p>
            <p><strong>المبلغ المتبقي:</strong> <span style="color: #fca5a5; font-weight:bold;">${latestFinance.driverRem || 0}</span></p>
            <p><strong>الدين السابق:</strong> ${latestFinance.driverDebt || 0}</p>
            <p><strong>سلفة إضافية عاجلة:</strong> ${latestFinance.driverAdvance || 0}</p>
            <p><strong>خصم السائق:</strong> ${latestFinance.driverDiscount || 0}</p>
            <p><strong>تقييم السائق:</strong> ${latestFinance.driverEval || "-"}</p>`;
        if (isMandoub) financialHtml += `
            <p><strong>الأجرة الكلية:</strong> ${latestFinance.manTotal || 0}</p>
            <p><strong>المبلغ الواصل:</strong> ${latestFinance.manPaid || 0}</p>
            <p><strong>المبلغ المتبقي:</strong> <span style="color: #fca5a5; font-weight:bold;">${latestFinance.manRem || 0}</span></p>
            <p><strong>سلفة إضافية عاجلة:</strong> ${latestFinance.mandoubAdvance || 0}</p>
            <p><strong>حوافز وإكراميات:</strong> ${latestFinance.mandoubBonus || 0}</p>
            <p><strong>خصم المندوب:</strong> ${latestFinance.mandoubDiscount || 0}</p>
            <p><strong>تقييم المندوب:</strong> ${latestFinance.mandoubEval || "-"}</p>
            <p><strong>السبب:</strong> ${latestFinance.mandoubEvalReason || "-"}</p>`;
    }

    $("user-current-trip-info").innerHTML = currentTripHtml + (financialHtml ? '<hr style="margin: 15px 0; border-color: rgba(255,255,255,0.2);">' + financialHtml : "");
}


// === NEW SYSTEM: AUTO USER + WALLET ===
let wallet = {iqd:0,usd:0,sar:0};
let spent = {iqd:0,usd:0,sar:0};

function initWalletUI(){
  const container = document.createElement("div");
  container.innerHTML = `
  <div class="glass-panel" style="padding:10px;margin-bottom:10px">
  <h4>السلف</h4>
  <p>دينار: <span id="w-iqd">0</span></p>
  <p>دولار: <span id="w-usd">0</span></p>
  <p>ريال: <span id="w-sar">0</span></p>
  </div>`;
  document.body.prepend(container);
}

function updateWalletUI(){
  if(document.getElementById("w-iqd")){
    document.getElementById("w-iqd").innerText = wallet.iqd - spent.iqd;
    document.getElementById("w-usd").innerText = wallet.usd - spent.usd;
    document.getElementById("w-sar").innerText = wallet.sar - spent.sar;
  }
}

function autoUser(){
  if(window.loggedInUser){
    let selects = document.querySelectorAll("select");
    selects.forEach(s=>{
      if(s.id.includes("driver") || s.id.includes("mandoub")){
        s.value = window.loggedInUser;
        s.disabled = true;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  initWalletUI();
  autoUser();
  updateWalletUI();
});
