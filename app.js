// In-memory data store for broadcast messages
let broadcasts = [
    {
        id: 1,
        title: "[緊急維護] 核心機房不斷電系統測試",
        target: "全體同仁",
        level: "danger",
        content: "今日中午 12:30 進行不斷電系統例行檢測，部分伺服器將短暫切換至備用電力，請同仁提前儲存手邊文件。",
        time: "10:30",
        date: "2026-03-22"
    },
    {
        id: 2,
        title: "【公告】全新遠端桌面與自動化安裝上線",
        target: "全體同仁",
        level: "info",
        content: "即日起同仁可至遠端資料下載區取得 topdgi.xml 設定檔與自動安裝包，提升作業流暢度。",
        time: "09:00",
        date: "2026-03-22"
    }
];

// Shared File Repository Data (including your topdgi.xml)
let sharedFiles = [
    { id: 1, name: "topdgi.xml", category: "系統部署", size: "45 KB", date: "2026-03-22", icon: "fa-file-code text-indigo-600" },
    { id: 2, name: "install.bat", category: "系統部署", size: "2 KB", date: "2026-03-22", icon: "fa-file-lines text-amber-600" },
    { id: 3, name: "2026年度出差費用請款單.xlsx", category: "財務部表單", size: "1.2 MB", date: "2026-03-20", icon: "fa-file-excel text-emerald-600" },
    { id: 4, name: "資訊安全政策規範與切結書_v4.pdf", category: "人事行政", size: "3.8 MB", date: "2026-03-15", icon: "fa-file-pdf text-rose-600" },
    { id: 5, name: "公司標準VPN連線憑證與設定包.zip", category: "資訊室工具", size: "15.4 MB", date: "2026-03-10", icon: "fa-file-zipper text-amber-600" },
    { id: 6, name: "專案開發需求規格書範本.docx", category: "研發部範本", size: "850 KB", date: "2026-02-28", icon: "fa-file-word text-blue-600" }
];

// Tab Switching Logic
function switchTab(tabId) {
    const tabs = ['dashboard', 'broadcast', 'rdp', 'files'];
    tabs.forEach(t => {
        const contentEl = document.getElementById(`content-${t}`);
        const tabBtn = document.getElementById(`tab-${t}`);
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
function showModal(title, body) {
    document.getElementById('modalTitle').innerHTML = `<i class="fa-solid fa-circle-info"></i> ${title}`;
    document.getElementById('modalBody').innerText = body;
    document.getElementById('customModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('customModal').classList.add('hidden');
}

// Render Broadcast Lists
function renderBroadcasts() {
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
                    <span>${latest.time}</span>
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
                        <div>${b.date} ${b.time}</div>
                        <span class="text-emerald-600 font-medium">SignalR 已推播</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    const countEl = document.getElementById('broadcastCount');
    if (countEl) countEl.innerText = broadcasts.length;
}

// Render File Repository Table
function renderFiles() {
    const tableBody = document.getElementById('fileTableBody');
    if (tableBody) {
        tableBody.innerHTML = sharedFiles.map(f => `
            <tr class="hover:bg-slate-50/80 transition">
                <td class="py-3.5 px-6 font-medium text-slate-800 flex items-center gap-3">
                    <i class="fa-solid ${f.icon} text-lg"></i>
                    ${f.name}
                </td>
                <td class="py-3.5 px-6 text-slate-600 text-xs">${f.category}</td>
                <td class="py-3.5 px-6 text-slate-500 text-xs">${f.size}</td>
                <td class="py-3.5 px-6 text-slate-500 text-xs">${f.date}</td>
                <td class="py-3.5 px-6 text-right">
                    <button onclick="triggerFileDownload('${f.name}', '${f.category}')" class="px-3 py-1.5 bg-corporate-600 hover:bg-corporate-700 text-white rounded-lg text-xs font-medium transition shadow-sm">
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
}

// Admin Upload Function
function handleAdminUpload() {
    const fileInput = document.getElementById('adminUploadFile');
    const categorySelect = document.getElementById('adminFileCategory');

    if (!fileInput.files || fileInput.files.length === 0) {
        showModal('尚未選擇檔案', '請先點擊選擇您要上傳的安裝檔或設定檔。');
        return;
    }

    const file = fileInput.files[0];
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + (now.getMonth()+1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0');
    
    let iconClass = 'fa-file text-slate-600';
    if (file.name.endsWith('.xml')) iconClass = 'fa-file-code text-indigo-600';
    else if (file.name.endsWith('.bat')) iconClass = 'fa-file-lines text-amber-600';
    else if (file.name.endsWith('.zip')) iconClass = 'fa-file-zipper text-amber-600';

    const newFile = {
        id: sharedFiles.length + 1,
        name: file.name,
        category: categorySelect.value,
        size: (file.size / 1024).toFixed(1) + ' KB',
        date: dateStr,
        icon: iconClass
    };

    sharedFiles.unshift(newFile);
    renderFiles();
    fileInput.value = '';

    showModal('檔案上傳成功', `已成功將「${newFile.name}」上傳至伺服器共用儲存庫,全體同仁現已可同步下載。`);
}

// Send Broadcast Simulation via SignalR
function sendBroadcastMessage() {
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

    const newMsg = {
        id: broadcasts.length + 1,
        title: titleInput.value,
        target: targetSelect.value,
        level: levelSelect.value,
        content: contentInput.value,
        time: timeStr,
        date: dateStr
    };

    broadcasts.unshift(newMsg);
    renderBroadcasts();

    titleInput.value = '';
    contentInput.value = '';

    showModal('SignalR 廣播推播成功', `已成功透過伺服器通道向「${newMsg.target}」背景常駐程式及瀏覽器推播強制彈跳通知！`);
}

// RDP Trigger Functions
function openWebRdp(name, ip) {
    showModal(`啟動網頁遠端桌面: ${name}`, `正在透過 HTML5 Gateway 建立與主機 ${ip} 的加密連線工作階段...\n\n(模擬畫面：已成功掛載遠端桌面串流到瀏覽器視窗)`);
}

function downloadRdpFile(name, ip) {
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

function triggerRdpConnect(name, ip) {
    openWebRdp(name, ip);
}

// File Download Trigger Functions
function triggerFileDownload(fileName, category) {
    showModal('安全下載通知', `您正在下載：「${fileName}」\n分類：${category}\n\n系統已自動通過憑證驗證並開始下載檔案。`);

    const now = new Date();
    const timeLog = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const logContainer = document.getElementById('auditLogContainer');
    if (logContainer) {
        const newLog = document.createElement('div');
        newLog.innerHTML = `[${timeLog}] User: 張資訊 - Downloaded file: ${fileName} (IP: 192.168.1.105)`;
        logContainer.insertBefore(newLog, logContainer.firstChild);
    }
}

// Initialize on window load
window.onload = function() {
    renderBroadcasts();
    renderFiles();
};
