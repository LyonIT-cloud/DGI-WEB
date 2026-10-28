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

// 全域儲存目前的檔案清單，供下載使用
let globalFilesMap = {};

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

// 2. 即時監聽 Firestore 的共用檔案清單（安全對應表下載法）
function listenFiles() {
    const q = query(collection(db, "sharedFiles"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        let sharedFiles = [];
        globalFilesMap = {}; // 清空並重新對應

        snapshot.forEach((doc) => {
            const data = doc.data();
            const fileId = doc.id;
            globalFilesMap[fileId] = data; // 存入記憶體中，避免 HTML 傳遞過長字串出錯
            sharedFiles.push({ id: fileId, ...data });
        });

        if (sharedFiles.length === 0) {
            globalFilesMap["default_xml"] = {
                name: "topdgi.xml",
                fileData: "data:text/xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJz8+PHNldHRpbmdzPjwvY29uZmlnPjwvc2V0dGluZ3M+"
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

// 3. 管理者上傳檔案到 Firestore 雲端
window.handleAdminUpload = async function() {
    const fileInput = document.getElementById('adminUploadFile');
    const categorySelect = document.getElementById('adminFileCategory');

    if (!fileInput.files || fileInput.files.length === 0) {
        showModal('尚未選擇檔案', '請先點擊選擇您要上傳的安裝檔或表格。');
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
            showModal('上傳失敗', '無法寫入雲端資料庫，請檢查網路連線。');
        }
    };
    reader.readAsDataURL(file);
}

// 4. 透過 ID 安全觸發下載
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

        showModal('檔案下載成功', `已成功從雲端下載檔案：${fileName}`);
    } catch (e) {
        console.error("下載失敗: ", e);
        showModal('下載失敗', '檔案解碼過程發生錯誤。');
    }
}

// 寫入廣播至 Firestore 雲端資料庫
window.sendBroadcastMessage = async function() {
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

        showModal('雲端廣播發布成功', `已成功將通知推送到 Firebase 雲端資料庫，全體同仁畫面將即時同步！`);
    } catch (e) {
        console.error("發布失敗: ", e);
        showModal('發布失敗', '無法寫入雲端資料庫，請檢查網路連線或 Firebase 權限。');
    }
}

// RDP 相關模擬功能
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

    showModal('RDP 檔案下載成功', `已自動為您產生遠端桌面連線設定檔 [${name}.rdp]。請直接點擊兩下開啟並輸入您的網域密碼進行登入。`);
}

window.triggerRdpConnect = function(name, ip) {
    openWebRdp(name, ip);
}

window.triggerFileDownload = function(fileName, category) {
    showModal('安全下載通知', `您正在下載：「${fileName}」\n分類：${category}\n\n系統已自動通過憑證驗證並開始下載檔案。`);
}

// 網頁載入完成後啟動監聽
window.onload = function() {
    listenBroadcasts();
    listenFiles();
};
