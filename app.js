// --- Firebase 核心與 Firestore 引入 ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 你的 Firebase 專案設定
const firebaseConfig = {
    apiKey: "AIzaSyAeNmWRMXBeFBstWuyGJxlUxiHOkehuY6Y",
    authDomain: "dgi-web-1e4dc.firebaseapp.com",
    projectId: "dgi-web-1e4dc",
    storageBucket: "dgi-web-1e4dc.firebasestorage.app",
    messagingSenderId: "555924211050",
    appId: "1:555924211050:web:e72ea80b83631f9078d113"
};

// 初始化 Firebase 與 Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 全域儲存變數
let globalFilesMap = {};

// ==========================================
// 🔐 權限控制設定：預設當前使用者帳號
// ==========================================
let currentUser = "Lyon"; 

// 檢查是否為管理者的函式
function checkIsAdmin() {
    return currentUser.toLowerCase() === "lyon";
}

// 點擊右上角隨時切換身份測試的互動函式
window.toggleUserRole = function() {
    if (currentUser.toLowerCase() === "lyon") {
        currentUser = "User";
        document.getElementById('userNameDisplay').innerText = "同仁 - User";
        document.getElementById('userRoleDisplay').innerText = "一般員工";
        document.getElementById('userAvatarIcon').innerText = "US";
        showModal('身份切換成功', '目前已切換為【一般同仁】身份（管理員上傳與發布區塊已自動隱藏）。');
    } else {
        currentUser = "Lyon";
        document.getElementById('userNameDisplay').innerText = "IT -Lyon";
        document.getElementById('userRoleDisplay').innerText = "資訊部-系統管理員";
        document.getElementById('userAvatarIcon').innerText = "IT";
        showModal('身份切換成功', '目前已切換為【系統管理員 (Lyon)】身份（已解鎖所有管理權限）。');
    }
    applyRolePermissions();
}

// 根據權限動態隱藏/顯示管理者專區介面
function applyRolePermissions() {
    const isAdmin = checkIsAdmin();
    
    // 1. 廣播發布表單區塊
    const broadcastForm = document.getElementById('adminBroadcastSection');
    if (broadcastForm) {
        broadcastForm.style.display = isAdmin ? 'block' : 'none';
    }

    // 2. 遠端主機「新增終端設備」按鈕
    const addRdpBtn = document.getElementById('addWorkstationBtn');
    if (addRdpBtn) {
        addRdpBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    // 3. 檔案上傳專區
    const uploadSection = document.getElementById('adminUploadSection');
    if (uploadSection) {
        uploadSection.style.display = isAdmin ? 'block' : 'none';
    }
}

// Tab Switching Logic
window.switchTab = function(tabId) {
    const tabs = ['dashboard', 'broadcast', 'rdp', 'files'];
    tabs.forEach(t => {
        const contentEl = document.getElementById(`content-${t}`);
        const tabBtn = document.getElementById(`tab-${t}`);
        if (!contentEl || !tabBtn) return;
        if (t === tabId) {
            contentEl.classList.remove('hidden');
            tabBtn.className = "px-4 py-2 rounded-lg font-medium text-sm transition bg-corporate-600 text-white shadow-sm flex items-center gap-2";
        } else {
            contentEl.classList.add('hidden');
            tabBtn.className = "px-4 py-2 rounded-lg font-medium text-sm transition text-slate-600 hover:bg-slate-200/60 flex items-center gap-2";
        }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Custom Modal Functions
window.showModal = function(title, body) {
    document.getElementById('modalTitle').innerHTML = `<i class="fa-solid fa-circle-info"></i> ${title}`;
    document.getElementById('modalBody').innerText = body;
    document.getElementById('customModal').classList.remove('hidden');
}

window.closeModal = function() {
    document.getElementById('customModal').classList.add('hidden');
}

// 1. 即時監聽 Firestore 的廣播資料
function listenBroadcasts() {
    const q = query(collection(db, "broadcasts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        let broadcasts = [];
        snapshot.forEach((doc) => {
            broadcasts.push(doc.data());
        });

        if (broadcasts.length === 0) {
            broadcasts.push({
                title: "[系統就緒] 雲端廣播中心已啟動",
                target: "全體同仁",
                level: "info",
                content: "即日起廣播通知已串接 Firebase 雲端資料庫，將即時同步至全體同仁。",
                time: "剛剛",
                date: "2026-10-28"
            });
        }

        const dashList = document.getElementById('dashboardBroadcastList');
        if (dashList && broadcasts.length > 0) {
            const latest = broadcasts[0];
            let borderClass = 'border-blue-500 bg-blue-50 text-blue-700';
            if (latest.level === 'danger') borderClass = 'border-rose-500 bg-rose-50 text-rose-700';
            if (latest.level === 'warning') borderClass = 'border-amber-500 bg-amber-50 text-amber-700';

            dashList.innerHTML = `
                <div class="p-3 border-l-4 ${borderClass} rounded-r-xl">
                    <div class="flex justify-between text-xs font-semibold mb-1">
                        <span>[${latest.target}] ${latest.title}</span>
                        <span>${latest.time || '剛剛'}</span>
                    </div>
                    <p class="text-xs text-slate-600 line-clamp-2">${latest.content}</p>
                </div>
            `;
        }

        const historyList = document.getElementById('broadcastHistoryList');
        if (historyList) {
            historyList.innerHTML = broadcasts.map(b => {
                let badgeBg = 'bg-blue-100 text-blue-800';
                let icon = 'fa-circle-info text-blue-600';
                if (b.level === 'danger') { badgeBg = 'bg-rose-100 text-rose-800'; icon = 'fa-triangle-exclamation text-rose-600'; }
                if (b.level === 'warning') { badgeBg = 'bg-amber-100 text-amber-800'; icon = 'fa-circle-exclamation text-amber-600'; }

                return `
                    <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid ${icon}"></i>
                                <h4 class="font-bold text-slate-800 text-sm">${b.title}</h4>
                                <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeBg}">${b.target}</span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed pl-5">${b.content}</p>
                        </div>
                        <div class="text-right text-xs text-slate-400 flex-shrink-0 pl-5">
                            <div>${b.date || ''} ${b.time || ''}</div>
                            <span class="text-emerald-600 font-medium">雲端同步已就緒</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        const countEl = document.getElementById('broadcastCount');
        if (countEl) countEl.innerText = broadcasts.length;
    });
}

// 2. 即時監聽 Firestore 的共用檔案清單
function listenFiles() {
    const q = query(collection(db, "sharedFiles"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        let sharedFiles = [];
        globalFilesMap = {};

        snapshot.forEach((doc) => {
            const data = doc.data();
            globalFilesMap[doc.id] = data;
            sharedFiles.push({ id: doc.id, ...data });
        });

        if (sharedFiles.length === 0) {
            globalFilesMap["default_xml"] = {
                name: "topdgi.xml",
                fileData: "data:text/xml;base64,PD94bWwgdmVyc2lvbj0nMSw0Jz8+PHNldHRpbmdzPjwvY29uZmlnPjwvc2V0dGluZ3M="
            };
            sharedFiles.push({
                id: "default_xml",
                name: "topdgi.xml",
                category: "系統部署",
                size: "4.2 KB",
                date: "2026-10-28",
                icon: "fa-file-code text-indigo-600"
            });
        }

        const tableBody = document.getElementById('fileTableBody');
        if (tableBody) {
            tableBody.innerHTML = sharedFiles.map(f => `
                <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-3.5 px-6 font-medium text-slate-800 flex items-center gap-3">
                        <i class="fa-solid ${f.icon || 'fa-file'} text-lg"></i>
                        ${f.name}
                    </td>
                    <td class="py-3.5 px-6 text-slate-600 text-xs">${f.category}</td>
                    <td class="py-3.5 px-6 text-slate-500 text-xs">${f.size}</td>
                    <td class="py-3.5 px-6 text-slate-500 text-xs">${f.date}</td>
                    <td class="py-3.5 px-6 text-right">
                        <button onclick="downloadCloudFile('${f.id}')" class="px-3 py-1.5 bg-corporate-600 hover:bg-corporate-700 text-white rounded-lg text-xs font-medium transition shadow-sm">
                            <i class="fa-solid fa-download mr-1"></i> 下載
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        const fileCountEl = document.getElementById('fileCountBadge');
        if (fileCountEl) fileCountEl.innerText = `共 ${sharedFiles.length} 個項目`;
        const fileCountDisplay = document.getElementById('fileCountDisplay');
        if (fileCountDisplay) fileCountDisplay.innerText = `${sharedFiles.length} 個`;
    });
}

// 3. 即時監聽 Firestore 的遠端桌面主機清單
function listenWorkstations() {
    const q = query(collection(db, "workstations"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        let stations = [];
        snapshot.forEach((doc) => {
            stations.push(doc.data());
        });

        if (stations.length === 0) {
            stations.push(
                { name: "RD-Gateway-01 (財務專用)", idCode: "RDP-01", spec: "8 vCPU / 32GB RAM / Windows Server 2022", ip: "192.168.10.50", status: "運行中", statusColor: "emerald" },
                { name: "RD-Gateway-02 (研發測試)", idCode: "RDP-02", spec: "16 vCPU / 64GB RAM / Ubuntu 22.04 LTS", ip: "192.168.10.51", status: "運行中", statusColor: "emerald" },
                { name: "RD-Gateway-03 (公用行政)", idCode: "RDP-03", spec: "4 vCPU / 16GB RAM / Windows 11 Enterprise", ip: "192.168.10.52", status: "維護中", statusColor: "amber" }
            );
        }

        const grid = document.getElementById('workstationGrid');
        if (grid) {
            grid.innerHTML = stations.map(s => `
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-4">
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <span class="px-2.5 py-1 bg-${s.statusColor || 'emerald'}-50 text-${s.statusColor || 'emerald'}-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                <span class="w-2 h-2 rounded-full bg-${s.statusColor || 'emerald'}-500"></span> ${s.status || '運行中'}
                            </span>
                            <span class="text-xs text-slate-400 font-mono">ID: ${s.idCode || 'RDP-X'}</span>
                        </div>
                        <h3 class="font-bold text-slate-800 text-base">${s.name}</h3>
                        <p class="text-xs text-slate-500 mt-1">配置：${s.spec}</p>
                        <div class="mt-4 p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-600 space-y-1 border border-slate-100">
                            <div>IP 位址: <span class="text-slate-900 font-semibold">${s.ip}</span></div>
                            <div>連接埠: <span class="text-slate-900 font-semibold">3389</span></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button onclick="openWebRdp('${s.name}', '${s.ip}')" class="py-2 px-3 bg-corporate-600 hover:bg-corporate-700 text-white rounded-xl text-xs font-medium transition text-center shadow-sm">
                            <i class="fa-solid fa-globe mr-1"></i> 網頁直接連線
                        </button>
                        <button onclick="downloadRdpFile('${s.name}', '${s.ip}')" class="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition text-center border border-slate-200">
                            <i class="fa-solid fa-file-arrow-down mr-1"></i> 下載.rdp檔
                        </button>
                    </div>
                </div>
            `).join('');
        }
    });
}

// 4. 管理者動態新增遠端桌面主機
window.handleAddWorkstation = async function() {
    if (!checkIsAdmin()) {
        showModal('權限不足', '您目前為一般同仁身份，無權新增終端設備。');
        return;
    }

    const name = prompt("請輸入遠端主機名稱與部門（例如：RD-Gateway-04 (品管專用)）：");
    if (!name) return;
    const ip = prompt("請輸入主機 IP 位址（例如：192.168.10.53）：");
    if (!ip) return;
    const spec = prompt("請輸入主機硬體與系統規格：", "4 vCPU / 16GB RAM / Windows 11");

    try {
        await addDoc(collection(db, "workstations"), {
            name: name,
            idCode: "RDP-" + Math.floor(Math.random() * 900 + 100),
            spec: spec,
            ip: ip,
            status: "運行中",
            statusColor: "emerald",
            timestamp: serverTimestamp()
        });

        showModal('新增成功', `已成功將主機「${name} (${ip})」新增至雲端！`);
    } catch (err) {
        console.error("新增主機失敗: ", err);
        showModal('新增失敗', '無法寫入雲端資料庫。');
    }
}

// 5. 管理者上傳檔案
window.handleAdminUpload = async function() {
    if (!checkIsAdmin()) {
        showModal('權限不足', '您目前為一般同仁身份，無權上傳檔案。');
        return;
    }

    const fileInput = document.getElementById('adminUploadFile');
    const categorySelect = document.getElementById('adminFileCategory');

    if (!fileInput.files || fileInput.files.length === 0) {
        showModal('尚未選擇檔案', '請先點擊選擇您要上傳的檔案。');
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 1024 * 1024) {
        showModal('檔案過大', '此上傳通道專為 1MB 以下的輕量檔案設計。');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64String = e.target.result;
        const now = new Date();
        const dateStr = now.getFullYear() + '-' + (now.getMonth()+1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0');
        
        let iconClass = 'fa-file text-slate-600';
        if (file.name.endsWith('.xml')) iconClass = 'fa-file-code text-indigo-600';
        else if (file.name.endsWith('.bat')) iconClass = 'fa-file-lines text-amber-600';
        else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) iconClass = 'fa-file-excel text-emerald-600';
        else if (file.name.endsWith('.zip')) iconClass = 'fa-file-zipper text-amber-600';

        try {
            await addDoc(collection(db, "sharedFiles"), {
                name: file.name,
                category: categorySelect.value,
                size: (file.size / 1024).toFixed(1) + ' KB',
                date: dateStr,
                icon: iconClass,
                fileData: base64String,
                timestamp: serverTimestamp()
            });

            fileInput.value = '';
            showModal('雲端上傳成功', `已成功將「${file.name}」上傳至 Firebase 雲端資料庫！`);
        } catch (err) {
            console.error("檔案上傳失敗: ", err);
            showModal('上傳失敗', '無法寫入雲端資料庫。');
        }
    };
    reader.readAsDataURL(file);
}

// 6. 下載檔案（全體同仁皆可使用）
window.downloadCloudFile = function(fileId) {
    const fileRecord = globalFilesMap[fileId];
    if (!fileRecord || !fileRecord.fileData) {
        showModal('下載失敗', '找不到該檔案的雲端資料內容。');
        return;
    }

    try {
        const base64Data = fileRecord.fileData;
        const fileName = fileRecord.name;

        const arr = base64Data.split(',');
        const mime = arr[0].match(/:(.*?);/)[1] || 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showModal('檔案下載成功', `已成功下載檔案：${fileName}`);
    } catch (e) {
        console.error("下載失敗: ", e);
        showModal('下載失敗', '檔案解碼過程發生錯誤。');
    }
}

// 發布廣播（僅限管理者 Lyon）
window.sendBroadcastMessage = async function() {
    if (!checkIsAdmin()) {
        showModal('權限不足', '您目前為一般同仁身份，無權發布廣播。');
        return;
    }

    const titleInput = document.getElementById('broadcastTitleInput');
    const targetSelect = document.getElementById('broadcastTargetSelect');
    const levelSelect = document.getElementById('broadcastLevelSelect');
    const contentInput = document.getElementById('broadcastContentInput');

    if (!titleInput.value.trim() || !contentInput.value.trim()) {
        showModal('填寫不完整', '請填寫廣播通知的標題與詳細內容。');
        return;
    }

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const dateStr = now.getFullYear() + '-' + (now.getMonth()+1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0');

    try {
        await addDoc(collection(db, "broadcasts"), {
            title: titleInput.value,
            target: targetSelect.value,
            level: levelSelect.value,
            content: contentInput.value,
            time: timeStr,
            date: dateStr,
            timestamp: serverTimestamp()
        });

        titleInput.value = '';
        contentInput.value = '';

        showModal('雲端廣播發布成功', `已成功將通知推送到 Firebase 雲端資料庫！`);
    } catch (e) {
        console.error("發布失敗: ", e);
        showModal('發布失敗', '無法寫入雲端資料庫。');
    }
}

// RDP 相關功能（全體同仁皆可連線與下載 rdp 檔）
window.openWebRdp = function(name, ip) {
    showModal(`啟動網頁遠端桌面: ${name}`, `正在透過 HTML5 Gateway 建立與主機 ${ip} 的加密連線工作階段...\n\n(模擬畫面：已成功掛載遠端桌面串流到瀏覽器視窗)`);
}

window.downloadRdpFile = function(name, ip) {
    const rdpContent = `full address:s:${ip}:3389\nscreen mode id:i:2\ndesktopwidth:i:1920\ndesktopheight:i:1080\nsession bpp:i:32\nusername:s:Corp\\\\User`;
    const blob = new Blob([rdpContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_${ip}.rdp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showModal('RDP 檔案下載成功', `已自動為您產生遠端桌面連線設定檔 [${name}.rdp]。`);
}

window.triggerRdpConnect = function(name, ip) {
    openWebRdp(name, ip);
}

window.triggerFileDownload = function(fileName, category) {
    showModal('安全下載通知', `您正在下載：「${fileName}」\n分類：${category}`);
}

// 網頁載入完成後啟動所有監聽與權限套用
window.onload = function() {
    listenBroadcasts();
    listenFiles();
    listenWorkstations();
    applyRolePermissions(); // 套用權限：預設以 Lyon 身分載入
};
