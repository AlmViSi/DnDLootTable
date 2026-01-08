// Глобальные переменные
let draggedItem = null;
let sourceContainer = null;

// Конфигурация слотов
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

// Элементы DOM
const charactersContainer = document.getElementById('charactersContainer');
const unassignedItemsContainer = document.getElementById('unassignedItems');
const addCharacterBtn = document.getElementById('addCharacterBtn');
const addItemBtn = document.getElementById('addItemBtn');
const characterModal = document.getElementById('characterModal');
const itemsModal = document.getElementById('itemsModal');
const saveCharacterBtn = document.getElementById('saveCharacter');
const saveItemsBtn = document.getElementById('saveItems');
const itemsTextarea = document.getElementById('itemsTextarea');
const refreshDataBtn = document.getElementById('refreshData');

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        setupEventListeners();
        await loadData();
        setupRealTimeUpdates();
        setupUnassignedDropTarget(unassignedItemsContainer);
    } catch (error) {
        console.error("Ошибка инициализации:", error);
    }
});

function setupEventListeners() {
    addCharacterBtn.addEventListener('click', () => characterModal.style.display = 'block');
    addItemBtn.addEventListener('click', () => itemsModal.style.display = 'block');
    refreshDataBtn.addEventListener('click', refreshData);
    saveCharacterBtn.addEventListener('click', saveCharacter);
    saveItemsBtn.addEventListener('click', saveItems);

    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) e.target.style.display = 'none';
    });
}

// Real-time обновления
function setupRealTimeUpdates() {
    db.collection("characters").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            const data = change.doc.data();
            const id = change.doc.id;
            const el = document.getElementById(`character-${id}`);

            if (change.type === "added" && !el) {
                renderCharacter(data, id);
            } else if (change.type === "modified" && el) {
                const input = el.querySelector('.wallet-input');
                if (input && document.activeElement !== input) {
                    input.value = data.walletGold || 0;
                }
                updateTotals();
            } else if (change.type === "removed" && el) {
                el.remove();
            }
        });
    });

    db.collection("items").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            const data = change.doc.data();
            const id = change.doc.id;
            const el = document.getElementById(`item-${id}`);

            if (change.type === "added" && !el) {
                addItemToContainer(data, id);
            } else if (change.type === "modified" && el) {
                updateItemPosition(el, data);
            } else if (change.type === "removed" && el) {
                el.remove();
            }
        });
        updateTotals();
    });
}

// Отрисовка персонажа
function renderCharacter(data, id) {
    const characterId = `character-${id}`;
    const character = document.createElement('div');
    character.className = 'character';
    character.id = characterId;

    if (data.imageUrl) {
        const bg = document.createElement('div');
        bg.className = 'character-background';
        bg.style.backgroundImage = `url('${data.imageUrl}')`;
        character.appendChild(bg);
    }

    let slotsHTML = slotConfig.map(slot => `
        <div class="slot-group">
            <div class="slot-label"><img src="${slot.icon}" onerror="this.style.display='none'"> ${slot.name}</div>
            <div class="slot" data-slot="${slot.key}" id="${characterId}-${slot.key}"></div>
        </div>
    `).join('');

    character.innerHTML += `
        <div class="character-content">
            <div class="character-header">
                <div class="character-title-row">
                    <div class="character-title">${data.name}</div>
                    <div class="delete-character">✕</div>
                </div>
                <div class="character-nickname">${data.nickname || ''}</div>
                <div class="character-gold-wallet">
                    <span>Кошелек (зол.):</span>
                    <input type="number" class="wallet-input" value="${data.walletGold || 0}" step="10">
                </div>
                <div class="character-total-header">Итого: <span class="total-span">0 зол.</span></div>
            </div>
            <div class="character-slots">${slotsHTML}</div>
        </div>
    `;

    charactersContainer.appendChild(character);

    // Логика кошелька
    const input = character.querySelector('.wallet-input');
    input.addEventListener('change', () => {
        db.collection("characters").doc(id).update({ walletGold: parseFloat(input.value) || 0 });
    });

    character.querySelector('.delete-character').addEventListener('click', () => {
        if (confirm(`Удалить ${data.name}?`)) db.collection("characters").doc(id).delete();
    });

    character.querySelectorAll('.slot').forEach(setupDropTarget);
    setupCharacterDropTarget(character);
}

// Добавление предмета
function addItemToContainer(itemData, itemId) {
    const target = itemData.characterId 
        ? document.querySelector(`#character-${itemData.characterId} .slot[data-slot="${itemData.slot}"]`)
        : unassignedItemsContainer;

    if (!target) return;

    const itemEl = document.createElement('div');
    itemEl.className = 'item';
    itemEl.id = `item-${itemId}`;
    itemEl.draggable = true;
    itemEl.dataset.value = itemData.value || 0;
    itemEl.dataset.slot = itemData.slot;

    const icon = target === unassignedItemsContainer 
        ? `<img src="${slotIcons[itemData.slot] || slotIcons.Other}" class="item-icon">` 
        : '';

    itemEl.innerHTML = `
        <div class="item-content">
            ${icon}
            <div class="item-text">
                <div class="item-name">${itemData.name}</div>
                <div class="item-details"><span>${itemData.value} зол.</span></div>
            </div>
        </div>
        <div class="item-actions">
            <div class="edit-item">✎</div>
            <div class="delete-item">✕</div>
        </div>
    `;

    target.appendChild(itemEl);
    setupDraggableItem(itemEl);
    
    itemEl.querySelector('.delete-item').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Удалить предмет?')) db.collection("items").doc(itemId).delete();
    });

    itemEl.querySelector('.edit-item').addEventListener('click', (e) => {
        e.stopPropagation();
        const n = prompt("Название:", itemData.name);
        const v = parseFloat(prompt("Цена:", itemData.value));
        if (n && !isNaN(v)) db.collection("items").doc(itemId).update({ name: n, value: v });
    });
}

// Система Drag & Drop
function setupDraggableItem(el) {
    el.addEventListener('dragstart', (e) => {
        draggedItem = el;
        e.dataTransfer.setData('text/plain', el.id);
        el.classList.add('item-dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('item-dragging'));
}

function setupDropTarget(target) {
    target.addEventListener('dragover', e => e.preventDefault());
    target.addEventListener('drop', async (e) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain').replace('item-', '');
        const charId = target.closest('.character')?.id.replace('character-', '') || null;
        db.collection("items").doc(itemId).update({ characterId: charId, slot: target.dataset.slot || 'Other' });
    });
}

function setupCharacterDropTarget(charEl) {
    charEl.addEventListener('dragover', e => e.preventDefault());
    charEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const itemEl = document.getElementById(e.dataTransfer.getData('text/plain'));
        if (itemEl) {
            const slot = charEl.querySelector(`.slot[data-slot="${itemEl.dataset.slot}"]`) || charEl.querySelector('.slot[data-slot="Other"]');
            if (slot) slot.dispatchEvent(new Event('drop', { bubbles: true }));
        }
    });
}

function setupUnassignedDropTarget(target) {
    target.addEventListener('dragover', e => e.preventDefault());
    target.addEventListener('drop', (e) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain').replace('item-', '');
        db.collection("items").doc(itemId).update({ characterId: null, slot: 'Other' });
    });
}

// Итоги
function updateTotals() {
    let gGold = 0;
    let gItems = 0;

    document.querySelectorAll('.character').forEach(char => {
        let sum = 0;
        char.querySelectorAll('.item').forEach(i => {
            const v = parseFloat(i.dataset.value) || 0;
            sum += v; gGold += v; gItems++;
        });
        const w = parseFloat(char.querySelector('.wallet-input').value) || 0;
        sum += w; gGold += w;
        char.querySelector('.total-span').textContent = `${sum.toFixed(2)} зол.`;
    });

    let uSum = 0;
    unassignedItemsContainer.querySelectorAll('.item').forEach(i => {
        const v = parseFloat(i.dataset.value) || 0;
        uSum += v; gGold += v; gItems++;
    });

    document.getElementById('unassignedTotal').textContent = `${uSum.toFixed(2)} зол.`;
    document.getElementById('globalGoldTotal').textContent = `${gGold.toFixed(2)} зол.`;
    document.getElementById('globalItemsTotal').textContent = gItems;
}

// Вспомогательные функции
async function loadData() {
    charactersContainer.innerHTML = '';
    unassignedItemsContainer.innerHTML = '';
    const cSnap = await db.collection("characters").orderBy("createdAt").get();
    cSnap.forEach(doc => renderCharacter(doc.data(), doc.id));
    const iSnap = await db.collection("items").orderBy("createdAt").get();
    iSnap.forEach(doc => addItemToContainer(doc.data(), doc.id));
    updateTotals();
}

async function saveCharacter() {
    const name = document.getElementById('characterName').value;
    if (!name) return alert('Имя обязательно');
    await db.collection("characters").add({
        name,
        nickname: document.getElementById('characterNickname').value,
        imageUrl: document.getElementById('characterImage').value,
        walletGold: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    characterModal.style.display = 'none';
}

async function saveItems() {
    const lines = itemsTextarea.value.split('\n').filter(l => l.trim());
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
    itemsModal.style.display = 'none';
    itemsTextarea.value = '';
}

async function refreshData() {
    refreshDataBtn.textContent = '...';
    await loadData();
    refreshDataBtn.textContent = '↻';
}
