// Journal App - Main JavaScript

// State
let entries = [];
let currentEntryId = null;
let currentCalendarDate = new Date();

// DOM Elements
const journalForm = document.getElementById('journalForm');
const entryDateInput = document.getElementById('entryDate');
const entryContentInput = document.getElementById('entryContent');
const entryTagsInput = document.getElementById('entryTags');
const entriesList = document.getElementById('entriesList');
const searchInput = document.getElementById('searchInput');
const sortNewestBtn = document.getElementById('sortNewest');
const sortOldestBtn = document.getElementById('sortOldest');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const entryViewer = document.getElementById('entryViewer');
const closeViewerBtn = document.getElementById('closeViewer');
const deleteEntryBtn = document.getElementById('deleteEntryBtn');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const menuToggle = document.getElementById('menuToggle');
const sidebarNav = document.querySelector('.sidebar-nav');

// Calendar
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentMonthDisplay = document.getElementById('currentMonth');
const calendarDates = document.getElementById('calendarDates');

// Backup/Import/Export
const exportBtn = document.getElementById('exportBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const importFileName = document.getElementById('importFileName');

// Initialize App
function init() {
    loadEntriesFromStorage();
    setTodayDate();
    renderEntries();
    updateStats();
    attachEventListeners();
    generateCalendar();
    updateTotalEntries();
}

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    entryDateInput.value = today;
}

// Event Listeners
function attachEventListeners() {
    // Form
    journalForm.addEventListener('submit', handleAddEntry);

    // Search and Sort
    searchInput.addEventListener('input', handleSearch);
    sortNewestBtn.addEventListener('click', () => handleSort('newest'));
    sortOldestBtn.addEventListener('click', () => handleSort('oldest'));

    // Delete
    deleteAllBtn.addEventListener('click', handleDeleteAll);

    // Entry Viewer
    closeViewerBtn.addEventListener('click', closeViewer);
    deleteEntryBtn.addEventListener('click', handleDeleteCurrentEntry);
    entryViewer.addEventListener('click', (e) => {
        if (e.target === entryViewer) closeViewer();
    });

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    // Mobile Menu Toggle
    menuToggle.addEventListener('click', toggleMobileMenu);

    // Calendar
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));

    // Backup/Import/Export
    exportBtn.addEventListener('click', handleExport);
    exportCsvBtn.addEventListener('click', handleExportCSV);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', handleImport);
}

// Navigation Handler
function handleNavigation(e) {
    const section = e.currentTarget.dataset.section;

    // Update active nav item
    navItems.forEach(item => item.classList.remove('active'));
    e.currentTarget.classList.add('active');

    // Update active section
    contentSections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(`section-${section}`).classList.add('active');

    // Close mobile menu
    if (window.innerWidth <= 768) {
        toggleMobileMenu();
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    sidebarNav.classList.toggle('active');
}

// Add New Entry
function handleAddEntry(e) {
    e.preventDefault();

    const tags = entryTagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    const newEntry = {
        id: Date.now(),
        date: entryDateInput.value,
        content: entryContentInput.value.trim(),
        tags: tags,
        dateAdded: new Date().getTime(),
        timestamp: new Date(entryDateInput.value).getTime()
    };

    entries.unshift(newEntry);
    saveEntriesToStorage();
    renderEntries();
    updateStats();
    generateCalendar();
    updateTotalEntries();

    // Clear form
    journalForm.reset();
    setTodayDate();

    // Show success feedback
    showNotification('Entry saved successfully!');
}

// Render All Entries
function renderEntries() {
    if (entries.length === 0) {
        entriesList.innerHTML = '<p class="no-entries">No entries yet. Start writing!</p>';
        return;
    }

    entriesList.innerHTML = entries.map(entry => `
        <div class="entry-item" onclick="openEntry(${entry.id})">
            <div class="entry-item-date">${formatDate(entry.date)}</div>
            <div class="entry-item-preview">${escapeHtml(entry.content.substring(0, 150))}${entry.content.length > 150 ? '...' : ''}</div>
            ${entry.tags.length > 0 ? `<div class="entry-item-tags">${entry.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        </div>
    `).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Search Entries
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();

    if (searchTerm === '') {
        renderEntries();
        return;
    }

    const filtered = entries.filter(entry =>
        entry.content.toLowerCase().includes(searchTerm) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    renderFilteredEntries(filtered);
}

// Render Filtered Entries
function renderFilteredEntries(entriesToRender) {
    if (entriesToRender.length === 0) {
        entriesList.innerHTML = '<p class="no-entries">No entries found.</p>';
        return;
    }

    entriesList.innerHTML = entriesToRender.map(entry => `
        <div class="entry-item" onclick="openEntry(${entry.id})">
            <div class="entry-item-date">${formatDate(entry.date)}</div>
            <div class="entry-item-preview">${escapeHtml(entry.content.substring(0, 150))}${entry.content.length > 150 ? '...' : ''}</div>
            ${entry.tags.length > 0 ? `<div class="entry-item-tags">${entry.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        </div>
    `).join('');
}

// Sort Entries
function handleSort(order) {
    if (order === 'newest') {
        entries.sort((a, b) => b.dateAdded - a.dateAdded);
    } else if (order === 'oldest') {
        entries.sort((a, b) => a.dateAdded - b.dateAdded);
    }
    renderEntries();
    saveEntriesToStorage();
    showNotification(`Sorted by ${order === 'newest' ? 'newest' : 'oldest'} first`);
}

// Open Entry Viewer
function openEntry(id) {
    currentEntryId = id;
    const entry = entries.find(e => e.id === id);

    if (!entry) return;

    document.getElementById('viewerDate').textContent = formatDate(entry.date);
    document.getElementById('viewerContent').textContent = entry.content;
    
    const tagsHtml = entry.tags.length > 0 
        ? entry.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
        : '';
    document.getElementById('viewerTags').innerHTML = tagsHtml;

    entryViewer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close Entry Viewer
function closeViewer() {
    entryViewer.classList.remove('active');
    document.body.style.overflow = 'auto';
    currentEntryId = null;
}

// Delete Current Entry
function handleDeleteCurrentEntry() {
    if (!currentEntryId) return;

    if (confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
        entries = entries.filter(e => e.id !== currentEntryId);
        saveEntriesToStorage();
        renderEntries();
        updateStats();
        generateCalendar();
        updateTotalEntries();
        closeViewer();
        showNotification('Entry deleted');
    }
}

// Delete All Entries
function handleDeleteAll() {
    if (entries.length === 0) {
        alert('No entries to delete');
        return;
    }

    if (confirm('Are you sure you want to delete ALL entries? This action cannot be undone.')) {
        entries = [];
        saveEntriesToStorage();
        renderEntries();
        updateStats();
        generateCalendar();
        updateTotalEntries();
        showNotification('All entries deleted');
    }
}

// Update Statistics
function updateStats() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentWeek = getWeekNumber(now);

    const thisYear = entries.filter(e => new Date(e.date).getFullYear() === currentYear).length;
    const thisMonth = entries.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;
    const thisWeek = entries.filter(e => {
        const d = new Date(e.date);
        return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
    }).length;

    document.getElementById('statTotalEntries').textContent = entries.length;
    document.getElementById('statThisMonth').textContent = thisMonth;
    document.getElementById('statThisWeek').textContent = thisWeek;
    document.getElementById('statThisYear').textContent = thisYear;

    // Update tags analytics
    updateTagsAnalytics();
}

// Get Week Number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Update Tags Analytics
function updateTagsAnalytics() {
    const tagCounts = {};

    entries.forEach(entry => {
        entry.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const tagsArray = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const tagsList = document.getElementById('tagsList');

    if (tagsArray.length === 0) {
        tagsList.innerHTML = '<p class="no-tags">No tags yet. Add tags to your entries!</p>';
        return;
    }

    tagsList.innerHTML = tagsArray.map(([tag, count]) => `
        <div class="tag-item">
            ${escapeHtml(tag)}
            <span class="tag-count">${count}</span>
        </div>
    `).join('');
}

// Calendar Functions
function generateCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    currentMonthDisplay.textContent = currentCalendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    let html = '';

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-date other-month">${prevLastDate - i}</div>`;
    }

    // Current month days
    for (let i = 1; i <= lastDate; i++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const hasEntry = entries.some(e => e.date === dateString);
        const isToday = new Date(dateString).toDateString() === new Date().toDateString();

        let className = 'calendar-date';
        if (hasEntry) className += ' has-entry';
        if (isToday) className += ' today';

        html += `<div class="${className}">${i}</div>`;
    }

    // Next month days
    const totalCells = firstDay + lastDate;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
        html += `<div class="calendar-date other-month">${i}</div>`;
    }

    calendarDates.innerHTML = html;
}

function changeMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    generateCalendar();
}

// Export Functions
function handleExport() {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Entries exported successfully!');
}

function handleExportCSV() {
    let csv = 'Date,Content,Tags\n';
    entries.forEach(entry => {
        const content = entry.content.replace(/"/g, '""').replace(/\n/g, ' ');
        const tags = entry.tags.join('; ');
        csv += `"${entry.date}","${content}","${tags}"\n`;
    });

    const dataBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-backup-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Entries exported as CSV successfully!');
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    importFileName.textContent = `Selected: ${file.name}`;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            
            if (!Array.isArray(imported)) {
                throw new Error('Invalid format: expected an array of entries');
            }

            if (confirm(`Import ${imported.length} entries? This will add to your existing entries.`)) {
                entries = [...entries, ...imported];
                entries.sort((a, b) => b.dateAdded - a.dateAdded);
                saveEntriesToStorage();
                renderEntries();
                updateStats();
                generateCalendar();
                updateTotalEntries();
                showNotification(`Successfully imported ${imported.length} entries!`);
                importFileName.textContent = '';
                importFile.value = '';
            }
        } catch (error) {
            alert(`Error importing file: ${error.message}`);
            importFileName.textContent = '';
            importFile.value = '';
        }
    };

    reader.readAsText(file);
}

// Local Storage Functions
function saveEntriesToStorage() {
    localStorage.setItem('journalEntries', JSON.stringify(entries));
}

function loadEntriesFromStorage() {
    const stored = localStorage.getItem('journalEntries');
    if (stored) {
        try {
            entries = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading entries from storage:', error);
            entries = [];
        }
    }
}

// Update Total Entries Counter
function updateTotalEntries() {
    document.getElementById('totalEntries').textContent = entries.length;
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideUp 0.3s ease-out;
        z-index: 2000;
        max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);