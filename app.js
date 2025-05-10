// Конфигурация слотов и элементов интерфейса
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

// DOM элементы
const charactersContainer = document.getElementById('charactersContainer');
const unassignedItemsContainer = document.getElementById('unassignedItems');
const addCharacterBtn = document.getElementById('addCharacterBtn');
const addItemBtn = document.getElementById('addItemBtn');
const characterModal = document.getElementById('characterModal');
const itemsModal = document.getElementById('itemsModal');
const saveCharacterBtn = document.getElementById('saveCharacter');
const saveItemsBtn = document.getElementById('saveItems');
const itemsTextarea = document.getElementById('itemsTextarea');
const closeButtons = document.querySelectorAll('.close');
const refreshDataBtn = document.getElementById('refreshData');
const scrollToTopBtn = document.getElementById('scrollToTop');

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadData();
    setupRealTimeUpdates();
});

// Настройка обработчиков событий
function setupEventListeners() {
    addCharacterBtn.addEventListener('click', () => characterModal.style.display = 'block');
    addItemBtn.addEventListener('click', () => itemsModal.style.display = 'block');
    refreshDataBtn.addEventListener('click', refreshData);
    scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    saveCharacterBtn.addEventListener('click', saveCharacter);
    saveItemsBtn.addEventListener('click', saveItems);

    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Загрузка данных из Firestore
async function loadData() {
    try {
        // Загрузка персонажей
        const charactersSnapshot = await db.collection("characters").get();
        charactersSnapshot.forEach(doc => {
            const char = doc.data();
            addCharacter(char.name, char.nickname, char.imageUrl, doc.id);
        });

        // Загрузка предметов
        const itemsSnapshot = await db.collection("items").get();
        itemsSnapshot.forEach(doc => {
            const item = doc.data();
            addItemToContainer(item, doc.id);
        });
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
    }
}

// Реал-тайм обновления
function setupRealTimeUpdates() {
    db.collection("items").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
                addItemToContainer(change.doc.data(), change.doc.id);
            }
            if (change.type === "removed") {
                const itemElement = document.getElementById(`item-${change.doc.id}`);
                if (itemElement) itemElement.remove();
                updateTotals();
            }
        });
    });

    db.collection("characters").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
                const char = change.doc.data();
                addCharacter(char.name, char.nickname, char.imageUrl, change.doc.id);
            }
            if (change.type === "removed") {
                const charElement = document.getElementById(`character-${change.doc.id}`);
                if (charElement) charElement.remove();
            }
        });
    });
}

// Добавление персонажа в DOM и Firestore
async function addCharacter(name, nickname = '', imageUrl = '', id = '') {
    if (!id) {
        // Если ID нет - создаем новый документ в Firestore
        const docRef = await db.collection("characters").add({
            name: name,
            nickname: nickname,
            imageUrl: imageUrl
        });
        id = docRef.id;
    }
    
    const characterId = 'character-' + id;
    const character = document.createElement('div');
    character.className = 'character';
    character.id = characterId;
    
    if (imageUrl) {
        const bg = document.createElement('div');
        bg.className = 'character-background';
        bg.style.backgroundImage = `url('${imageUrl}')`;
        character.appendChild(bg);
    }
    
    const content = document.createElement('div');
    content.className = 'character-content';
    
    let slotsHTML = '';
    slotConfig.forEach(slot => {
        const iconHTML = slot.icon ? `<img src="${slot.icon}" alt="${slot.name}" onerror="this.style.display='none'">` : '';
        slotsHTML += `
            <div class="slot-group">
                <div class="slot-label">${iconHTML}${slot.name}</div>
                <div class="slot" data-slot="${slot.key}" id="${characterId}-${slot.key}"></div>
            </div>
        `;
    });
    
    content.innerHTML = `
        <div class="character-header">
            <div class="character-title-row">
                <div class="character-title">${name}</div>
                <div class="delete-character" data-character="${characterId}">✕</div>
            </div>
            <div class="character-nickname" contenteditable="true">${nickname}</div>
            <div class="character-total-header">Всего: <span id="${characterId}-total-header">0 зол.</span></div>
        </div>
        <div class="character-slots">
            ${slotsHTML}
        </div>
    `;
    
    character.appendChild(content);
    charactersContainer.appendChild(character);
    
    // Обработчик удаления персонажа
    character.querySelector('.delete-character').addEventListener('click', async function() {
        if (confirm(`Удалить персонажа ${name}?`)) {
            // Переносим предметы обратно в "Не распределено"
            character.querySelectorAll('.item').forEach(item => {
                unassignedItemsContainer.appendChild(item);
            });
            
            // Удаляем персонажа из Firestore
            await db.collection("characters").doc(id).delete();
        }
    });
    
    // Настройка drag and drop для слотов
    character.querySelectorAll('.slot').forEach(slot => {
        setupDropTarget(slot);
    });
    
    setupCharacterDropTarget(character);
}

// Добавление предмета в DOM
function addItemToContainer(itemData, itemId = '') {
    const isCharacterSlot = this instanceof HTMLElement && this.classList.contains('slot');
    const container = isCharacterSlot ? this : unassignedItemsContainer;
    
    const itemElement = document.createElement('div');
    itemElement.className = 'item';
    itemElement.id = 'item-' + (itemId || Date.now());
    itemElement.draggable = true;
    itemElement.dataset.value = itemData.value;
    itemElement.dataset.isGold = itemData.isGold || false;
    itemElement.dataset.slot = itemData.slot;
    itemElement.dataset.description = itemData.description || '';
    
    const iconHTML = !isCharacterSlot ? 
        `<img src="${slotIcons[itemData.slot] || slotIcons.Other}" class="item-icon" alt="${itemData.slot}" onerror="this.style.display='none'">` : 
        '';
    
    let descriptionHTML = '';
    if (itemData.description) {
        descriptionHTML = `<div class="item-description">${itemData.description}</div>`;
    }
    
    itemElement.innerHTML = `
        <div class="item-content">
            ${iconHTML}
            <div class="item-text">
                <div class="item-name">${itemData.name}</div>
                <div class="item-details">
                    <span>${itemData.value} зол.</span>
                    ${itemData.isGold ? '<span>💰</span>' : ''}
                </div>
                ${descriptionHTML}
            </div>
        </div>
        <div class="item-actions">
            <div class="edit-item" data-item="${itemElement.id}">✎</div>
            <div class="delete-item" data-item="${itemElement.id}">✕</div>
        </div>
    `;
    
    container.appendChild(itemElement);
    
    // Если это слот персонажа, показываем группу слотов
    if (isCharacterSlot) {
        const slotGroup = container.closest('.slot-group');
        if (slotGroup) {
            slotGroup.classList.add('has-items');
        }
    }
    
    // Обработчик удаления предмета
    itemElement.querySelector('.delete-item').addEventListener('click', async function(e) {
        e.stopPropagation();
        if (confirm('Удалить предмет?')) {
            await db.collection("items").doc(itemId).delete();
        }
    });
    
    // Обработчик редактирования предмета
    itemElement.querySelector('.edit-item').addEventListener('click', function(e) {
        e.stopPropagation();
        editItem(itemElement, itemId);
    });
    
    // Настройка drag and drop
    setupDraggableItem(itemElement);
    
    updateTotals();
    return itemElement;
}

// Редактирование предмета
async function editItem(itemElement, itemId) {
    const newName = prompt("Новое название:", itemElement.querySelector('.item-name').textContent);
    if (newName === null) return;
    
    const newValue = parseFloat(prompt("Новая цена:", itemElement.dataset.value));
    if (isNaN(newValue)) return;
    
    const newDescription = prompt("Новое описание:", itemElement.dataset.description || "");
    
    // Обновляем в Firestore
    await db.collection("items").doc(itemId).update({
        name: newName,
        value: newValue,
        description: newDescription
    });
    
    // Локальное обновление (onSnapshot автоматически обновит интерфейс)
}

// Сохранение персонажа
async function saveCharacter() {
    const name = document.getElementById('characterName').value;
    const nickname = document.getElementById('characterNickname').value;
    const imageUrl = document.getElementById('characterImage').value;
    
    if (!name) {
        alert('Пожалуйста, введите имя персонажа');
        return;
    }
    
    try {
        await db.collection("characters").add({
            name: name,
            nickname: nickname || "",
            imageUrl: imageUrl || ""
        });
        
        characterModal.style.display = 'none';
        document.getElementById('characterName').value = '';
        document.getElementById('characterNickname').value = '';
        document.getElementById('characterImage').value = '';
    } catch (error) {
        console.error("Ошибка сохранения персонажа:", error);
        alert('Ошибка сохранения персонажа');
    }
}

// Массовое добавление предметов
async function saveItems() {
    const itemsText = itemsTextarea.value;
    const lines = itemsText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        alert('Введите хотя бы один предмет');
        return;
    }
    
    try {
        const batch = db.batch();
        const itemsRef = db.collection("items");
        
        lines.forEach(line => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length >= 3) {
                const newItemRef = itemsRef.doc();
                batch.set(newItemRef, {
                    name: parts[0],
                    value: parseFloat(parts[1]) || 0,
                    slot: parts[2],
                    description: parts[3] || "",
                    characterId: null
                });
            }
        });
        
        await batch.commit();
        itemsModal.style.display = 'none';
        itemsTextarea.value = '';
    } catch (error) {
        console.error("Ошибка сохранения предметов:", error);
        alert('Ошибка сохранения предметов');
    }
}

// Обновление итоговых значений
function updateTotals() {
    // Сначала скрываем все группы слотов
    document.querySelectorAll('.slot-group').forEach(group => {
        group.classList.remove('has-items');
    });
    
    // Показываем только те группы, где есть предметы
    document.querySelectorAll('.slot .item').forEach(item => {
        const slotGroup = item.closest('.slot-group');
        if (slotGroup) {
            slotGroup.classList.add('has-items');
        }
    });
    
    // Обновляем итоги для каждого персонажа
    document.querySelectorAll('.character').forEach(character => {
        let totalValue = 0;
        
        character.querySelectorAll('.slot .item').forEach(item => {
            totalValue += parseFloat(item.dataset.value) || 0;
        });
        
        const totalElement = character.querySelector('.character-total-header span');
        if (totalElement) {
            totalElement.textContent = `${totalValue.toFixed(2)} зол.`;
        }
    });
    
    // Обновляем итог для "Не распределено"
    let unassignedValue = 0;
    document.querySelectorAll('#unassignedItems .item').forEach(item => {
        unassignedValue += parseFloat(item.dataset.value) || 0;
    });
    document.getElementById('unassignedTotal').textContent = `${unassignedValue.toFixed(2)} зол.`;
    
    // Обновляем глобальные итоги
    let globalGold = 0;
    let globalItems = 0;
    
    document.querySelectorAll('.item').forEach(item => {
        globalGold += parseFloat(item.dataset.value) || 0;
        globalItems++;
    });
    
    document.getElementById('globalGoldTotal').textContent = `${globalGold.toFixed(2)} зол.`;
    document.getElementById('globalItemsTotal').textContent = globalItems;
}

// Drag and Drop функции
function setupDraggableItem(item) {
    item.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', this.id);
        setTimeout(() => {
            this.classList.add('item-dragging');
        }, 0);
    });
    
    item.addEventListener('dragend', function() {
        this.classList.remove('item-dragging');
        document.querySelectorAll('.slot-highlight').forEach(el => {
            el.classList.remove('slot-highlight');
        });
    });
}

function setupDropTarget(slot) {
    slot.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('slot-highlight');
    });
    
    slot.addEventListener('dragleave', function() {
        this.classList.remove('slot-highlight');
    });
    
    slot.addEventListener('drop', async function(e) {
        e.preventDefault();
        this.classList.remove('slot-highlight');
        const itemId = e.dataTransfer.getData('text/plain');
        const itemElement = document.getElementById(itemId);
        
        if (itemElement) {
            const targetSlot = this.dataset.slot;
            const itemSlot = itemElement.dataset.slot;
            
            // Проверяем соответствие слота (или разрешаем для Other)
            if (targetSlot === itemSlot || targetSlot === 'Other') {
                const itemData = {
                    name: itemElement.querySelector('.item-name').textContent,
                    value: parseFloat(itemElement.dataset.value),
                    slot: itemSlot,
                    description: itemElement.dataset.description || "",
                    isGold: itemElement.dataset.isGold === 'true'
                };
                
                // Получаем ID предмета из элемента
                const itemFirebaseId = itemId.replace('item-', '');
                
                // Обновляем в Firestore
                await db.collection("items").doc(itemFirebaseId).update({
                    characterId: this.closest('.character')?.id.replace('character-', '') || null
                });
                
                // Локальное обновление произойдет через onSnapshot
            }
        }
    });
}

function setupCharacterDropTarget(character) {
    character.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    character.addEventListener('drop', async function(e) {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        const itemElement = document.getElementById(itemId);
        
        if (itemElement) {
            const slotType = itemElement.dataset.slot;
            const slot = character.querySelector(`.slot[data-slot="${slotType}"]`) || 
                         character.querySelector('.slot[data-slot="Other"]');
            
            if (slot) {
                const itemData = {
                    name: itemElement.querySelector('.item-name').textContent,
                    value: parseFloat(itemElement.dataset.value),
                    slot: slotType,
                    description: itemElement.dataset.description || "",
                    isGold: itemElement.dataset.isGold === 'true'
                };
                
                const itemFirebaseId = itemId.replace('item-', '');
                
                // Обновляем в Firestore
                await db.collection("items").doc(itemFirebaseId).update({
                    characterId: character.id.replace('character-', '')
                });
                
                // Локальное обновление произойдет через onSnapshot
            }
        }
    });
}

// Обновление данных
function refreshData() {
    charactersContainer.innerHTML = '';
    unassignedItemsContainer.innerHTML = '';
    loadData();
}