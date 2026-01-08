// 1. Глобальные переменные
let draggedItem = null;
let sourceContainer = null;

const slotIcons = {
    'Armor': 'https://i.ibb.co/Wv6zmFST/Armor-pixian-ai.png',
    'Arms': 'https://i.ibb.co/mrSzqfQv/Arms-pixian-ai.png',
    'Body': 'https://i.ibb.co/GQZgcfyW/Body-pixian-ai.png',
    'Face': 'https://i.ibb.co/8gDnTsfT/Face-pixian-ai.png',
    'Feet': 'https://i.ibb.co/nqDJxwZW/Feets-pixian-ai.png',
    'Hands': 'https://i.ibb.co/gb27yx9S/Hands-pixian-ai.png',
    'Head': 'https://i.ibb.co/b51WW4QR/Head-pixian-ai.png',
    'Misc': 'https://i.ibb.co/ks4jh5C9/Misc-pixian-ai.png',
    'Other': 'https://i.ibb.co/YBGy1bYC/Other-pixian-ai.png',
    'Ring': 'https://i.ibb.co/HLScw4bm/Ring-pixian-ai.png',
    'Shoulder': 'https://i.ibb.co/35DJcS2q/Cloak-pixian-ai.png',
    'Throat': 'https://i.ibb.co/KcpSR01R/Throat-pixian-ai.png',
    'Torso': 'https://i.ibb.co/HDtWYCHm/Torso-pixian-ai.png',
    'Tools': 'https://i.ibb.co/Rp826FvD/Tools-pixian-ai.png',
    'Waist': 'https://i.ibb.co/whxjqPLK/Waist-pixian-ai.png',
    'Weapon': 'https://i.ibb.co/FLyv7J4P/Weapons-pixian-ai.png'
};

const slotConfig = [
    { key: 'Head', name: 'Голова', icon: slotIcons.Head },
    { key: 'Face', name: 'Лицо', icon: slotIcons.Face },
    { key: 'Throat', name: 'Шея', icon: slotIcons.Throat },
    { key: 'Shoulder', name: 'Плечи', icon: slotIcons.Shoulder },
    { key: 'Armor', name: 'Доспех', icon: slotIcons.Armor },
    { key: 'Weapon', name: 'Оружие', icon: slotIcons.Weapon },
    { key: 'Body', name: 'Тело', icon: slotIcons.Body },
    { key: 'Torso', name: 'Торс', icon: slotIcons.Torso },
    { key: 'Arms', name: 'Руки', icon: slotIcons.Arms },
    { key: 'Hands', name: 'Перчатки', icon: slotIcons.Hands },
    { key: 'Feet', name: 'Ноги', icon: slotIcons.Feet },
    { key: 'Waist', name: 'Пояс', icon: slotIcons.Waist },
    { key: 'Ring', name: 'Кольцо', icon: slotIcons.Ring },
    { key: 'Tools', name: 'Инструменты', icon: slotIcons.Tools },
    { key: 'Other', name: 'Другое', icon: slotIcons.Other },
    { key: 'Misc', name: 'Разное', icon: slotIcons.Misc }
];

// 2. Инициализация и основные элементы
const charactersContainer = document.getElementById('charactersContainer');
const unassignedItemsContainer = document.getElementById('unassignedItems');
const refreshDataBtn = document.getElementById('refreshData');

document.addEventListener('DOMContentLoaded', async () => {
    // ВАЖНО: Проверьте, что firebaseConfig определен в firebase.js
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    setupEventListeners();
    await loadData();
    setupRealTimeUpdates();
});

// 3. Загрузка данных
async function loadData() {
    charactersContainer.innerHTML = '';
    unassignedItemsContainer.innerHTML = '';
    
    const charSnap = await db.collection("characters").orderBy("createdAt").get();
    charSnap.forEach(doc => renderCharacter(doc.data(), doc.id));
    
    const itemSnap = await db.collection("items").orderBy("createdAt").get();
    itemSnap.forEach(doc => addItemToContainer(doc.data(), doc.id));
    
    updateTotals();
}

// 4. Отрисовка персонажа
function renderCharacter(data, id) {
    const charId = `character-${id}`;
    let charEl = document.getElementById(charId);
    
    if (!charEl) {
        charEl = document.createElement('div');
        charEl.className = 'character';
        charEl.id = charId;
        charactersContainer.appendChild(charEl);
    }

    let slotsHTML = slotConfig.map(s => `
        <div class="slot-group">
            <div class="slot-label"><img src="${s.icon}" onerror="this.style.display='none'"> ${s.name}</div>
            <div class="slot" data-slot="${s.key}" id="${charId}-${s.key}"></div>
        </div>
    `).join('');

    charEl.innerHTML = `
        <div class="character-content">
            <div class="character-header">
                <div class="character-title-row">
                    <div class="character-title">${data.name}</div>
                    <div class="delete-character" onclick="deleteChar('${id}')">✕</div>
                </div>
                <div class="character-nickname">${data.nickname || ''}</div>
                <div class="character-gold-wallet">
                    <span>Золото (кошель):</span>
                    <input type="number" class="wallet-input" value="${data.walletGold || 0}" onchange="updateWallet('${id}', this.value)">
                </div>
                <div class="character-total-header">Итого: <span class="total-span">0 зол.</span></div>
            </div>
            <div class="character-slots">${slotsHTML}</div>
        </div>
    `;
    
    charEl.querySelectorAll('.slot').forEach(setupDropTarget);
}

// 5. Добавление предмета
function addItemToContainer(data, id) {
    const itemId = `item-${id}`;
    if (document.getElementById(itemId)) return;

    const itemEl = document.createElement('div');
    itemEl.className = 'item';
    itemEl.id = itemId;
    itemEl.draggable = true;
    itemEl.dataset.value = data.value || 0;
    itemEl.dataset.slot = data.slot || 'Other';

    const target = data.characterId 
        ? document.querySelector(`#character-${data.characterId} .slot[data-slot="${data.slot}"]`)
        : unassignedItemsContainer;

    if (!target) return;

    const icon = target === unassignedItemsContainer ? `<img src="${slotIcons[data.slot] || slotIcons.Other}" class="item-icon">` : '';

    itemEl.innerHTML = `
        <div class="item-content">${icon}<div class="item-text"><div class="item-name">${data.name}</div><div class="item-details"><span>${data.value} зол.</span></div></div></div>
        <div class="item-actions">
            <div class="edit-item" onclick="editItem('${id}', '${data.name}', ${data.value})">✎</div>
            <div class="delete-item" onclick="deleteItem('${id}')">✕</div>
        </div>
    `;

    target.appendChild(itemEl);
    itemEl.ondragstart = (e) => { draggedItem = itemEl; e.dataTransfer.setData('text/plain', itemId); };
}

// 6. Обновление позиции при перемещении
function updateItemPosition(el, data) {
    const newTarget = data.characterId 
        ? document.querySelector(`#character-${data.characterId} .slot[data-slot="${data.slot}"]`)
        : unassignedItemsContainer;

    if (newTarget && el.parentNode !== newTarget) {
        newTarget.appendChild(el);
        // Обновляем иконку (показываем только в общем списке)
        const icon = el.querySelector('.item-icon');
        if (newTarget === unassignedItemsContainer && !icon) {
            const newIcon = document.createElement('img');
            newIcon.className = 'item-icon';
            newIcon.src = slotIcons[data.slot] || slotIcons.Other;
            el.querySelector('.item-content').prepend(newIcon);
        } else if (newTarget !== unassignedItemsContainer && icon) {
            icon.remove();
        }
    }
    updateTotals();
}

// 7. Итоги
function updateTotals() {
    let gGold = 0, gItems = 0;

    document.querySelectorAll('.character').forEach(char => {
        let sum = 0;
        char.querySelectorAll('.item').forEach(i => {
            const v = parseFloat(i.dataset.value) || 0;
            sum += v; gGold += v; gItems++;
        });
        const w = parseFloat(char.querySelector('.wallet-input')?.value) || 0;
        sum += w; gGold += w;
        const span = char.querySelector('.total-span');
        if (span) span.textContent = `${sum.toFixed(2)} зол.`;
    });

    let uSum = 0;
    unassignedItemsContainer.querySelectorAll('.item').forEach(i => {
        const v = parseFloat(i.dataset.value) || 0;
        uSum += v; gGold += v; gItems++;
    });

    if (document.getElementById('unassignedTotal')) document.getElementById('unassignedTotal').textContent = `${uSum.toFixed(2)} зол.`;
    if (document.getElementById('globalGoldTotal')) document.getElementById('globalGoldTotal').textContent = `${gGold.toFixed(2)} зол.`;
    if (document.getElementById('globalItemsTotal')) document.getElementById('globalItemsTotal').textContent = gItems;
}

// 8. Вспомогательные функции (Drag&Drop / Actions)
function setupDropTarget(target) {
    target.ondragover = e => e.preventDefault();
    target.ondrop = (e) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain').replace('item-', '');
        const charId = target.closest('.character')?.id.replace('character-', '') || null;
        db.collection("items").doc(itemId).update({ characterId: charId, slot: target.dataset.slot || 'Other' });
    };
}

function setupUnassignedDropTarget(target) {
    target.ondragover = e => e.preventDefault();
    target.ondrop = (e) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain').replace('item-', '');
        db.collection("items").doc(itemId).update({ characterId: null, slot: 'Other' });
    };
}

window.updateWallet = (id, val) => db.collection("characters").doc(id).update({ walletGold: parseFloat(val) || 0 });
window.deleteItem = (id) => confirm('Удалить?') && db.collection("items").doc(id).delete();
window.deleteChar = (id) => confirm('Удалить персонажа?') && db.collection("characters").doc(id).delete();
window.editItem = (id, oldN, oldV) => {
    const n = prompt("Имя:", oldN);
    const v = parseFloat(prompt("Цена:", oldV));
    if (n && !isNaN(v)) db.collection("items").doc(id).update({ name: n, value: v });
};

// 9. Real-time (Snapshot)
function setupRealTimeUpdates() {
    db.collection("characters").onSnapshot(snap => {
        snap.docChanges().forEach(change => {
            if (change.type === "added" && !document.getElementById(`character-${change.doc.id}`)) {
                renderCharacter(change.doc.data(), change.doc.id);
            }
            if (change.type === "modified") {
                const input = document.querySelector(`#character-${change.doc.id} .wallet-input`);
                if (input && document.activeElement !== input) input.value = change.doc.data().walletGold || 0;
                updateTotals();
            }
            if (change.type === "removed") document.getElementById(`character-${change.doc.id}`)?.remove();
        });
    });

    db.collection("items").onSnapshot(snap => {
        snap.docChanges().forEach(change => {
            const id = change.doc.id;
            const data = change.doc.data();
            const el = document.getElementById(`item-${id}`);
            if (change.type === "added" && !el) addItemToContainer(data, id);
            if (change.type === "modified" && el) updateItemPosition(el, data);
            if (change.type === "removed" && el) el.remove();
        });
        updateTotals();
    });
}

function setupEventListeners() {
    document.getElementById('addCharacterBtn').onclick = () => document.getElementById('characterModal').style.display = 'block';
    document.getElementById('addItemBtn').onclick = () => document.getElementById('itemsModal').style.display = 'block';
    refreshDataBtn.onclick = loadData;
    document.getElementById('saveCharacter').onclick = async () => {
        const name = document.getElementById('characterName').value;
        if (!name) return;
        await db.collection("characters").add({
            name, 
            nickname: document.getElementById('characterNickname').value,
            imageUrl: document.getElementById('characterImage').value,
            walletGold: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('characterModal').style.display = 'none';
    };
    document.getElementById('saveItems').onclick = async () => {
        const lines = document.getElementById('itemsTextarea').value.split('\n').filter(l => l.trim());
        const batch = db.batch();
        lines.forEach(l => {
            const p = l.split('|').map(s => s.trim());
            if (p.length >= 2) {
                batch.set(db.collection("items").doc(), {
                    name: p[0], value: parseFloat(p[1]) || 0,
                    slot: p[2] || 'Other', characterId: null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });
        await batch.commit();
        document.getElementById('itemsModal').style.display = 'none';
        document.getElementById('itemsTextarea').value = '';
    };
}
