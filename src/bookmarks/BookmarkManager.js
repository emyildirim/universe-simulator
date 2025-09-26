export class BookmarkManager {
    constructor(camera, selectionManager) {
        this.camera = camera;
        this.selectionManager = selectionManager;
        
        this.setupUI();
        this.loadFromURL();
    }
    
    setupUI() {
        // Create bookmark controls
        this.createBookmarkUI();
    }
    
    createBookmarkUI() {
        // Add bookmark button to UI
        const bookmarkPanel = document.createElement('div');
        bookmarkPanel.id = 'bookmark-panel';
        bookmarkPanel.className = 'ui-panel';
        bookmarkPanel.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            align-items: center;
        `;
        
        bookmarkPanel.innerHTML = `
            <button id="save-bookmark-btn" class="control-button">📖 Save View</button>
            <button id="share-link-btn" class="control-button">🔗 Share Link</button>
            <button id="load-bookmark-btn" class="control-button">📂 Load</button>
        `;
        
        document.getElementById('ui-overlay').appendChild(bookmarkPanel);
        
        // Add event listeners
        document.getElementById('save-bookmark-btn').addEventListener('click', () => {
            this.saveBookmark();
        });
        
        document.getElementById('share-link-btn').addEventListener('click', () => {
            this.generateShareLink();
        });
        
        document.getElementById('load-bookmark-btn').addEventListener('click', () => {
            this.showLoadDialog();
        });
    }
    
    saveBookmark() {
        const bookmark = this.createBookmarkData();
        
        // Prompt for bookmark name
        const name = prompt('Enter a name for this bookmark:', 
            `View ${new Date().toLocaleString()}`);
        
        if (name) {
            bookmark.name = name;
            this.saveToLocalStorage(bookmark);
            alert('Bookmark saved successfully!');
        }
    }
    
    createBookmarkData() {
        const selectedObjects = this.selectionManager.getSelectedObjects();
        
        return {
            timestamp: new Date().toISOString(),
            camera: {
                position: {
                    x: this.camera.position.x,
                    y: this.camera.position.y,
                    z: this.camera.position.z
                },
                rotation: {
                    x: this.camera.rotation.x,
                    y: this.camera.rotation.y,
                    z: this.camera.rotation.z
                },
                fov: this.camera.fov,
                zoom: this.camera.zoom
            },
            selectedObjects: selectedObjects.map(obj => ({
                name: obj.userData.name,
                position: {
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z
                }
            }))
        };
    }
    
    saveToLocalStorage(bookmark) {
        const bookmarks = this.getBookmarks();
        bookmarks.push(bookmark);
        localStorage.setItem('universeBookmarks', JSON.stringify(bookmarks));
    }
    
    getBookmarks() {
        return JSON.parse(localStorage.getItem('universeBookmarks') || '[]');
    }
    
    generateShareLink() {
        const bookmark = this.createBookmarkData();
        const encodedData = btoa(JSON.stringify(bookmark));
        
        // Create shareable URL
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?view=${encodedData}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            this.showShareDialog(shareUrl);
        }).catch(() => {
            // Fallback for older browsers
            this.showShareDialog(shareUrl);
        });
    }
    
    showShareDialog(url) {
        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const dialog = document.createElement('div');
        dialog.className = 'ui-panel';
        dialog.style.cssText = `
            position: relative;
            width: 90%;
            max-width: 600px;
            padding: 20px;
        `;
        
        dialog.innerHTML = `
            <h3>Share This View</h3>
            <p>Copy this link to share your current view and selections:</p>
            <textarea id="share-url" style="width: 100%; height: 100px; background: #222; color: #fff; border: 1px solid #555; padding: 10px; margin: 10px 0;">${url}</textarea>
            <div style="text-align: right; margin-top: 15px;">
                <button id="copy-url-btn" class="control-button">Copy URL</button>
                <button id="close-share-btn" class="control-button">Close</button>
            </div>
        `;
        
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        // Select the URL text
        const textarea = dialog.querySelector('#share-url');
        textarea.select();
        
        // Event listeners
        dialog.querySelector('#copy-url-btn').addEventListener('click', () => {
            textarea.select();
            document.execCommand('copy');
            alert('URL copied to clipboard!');
        });
        
        dialog.querySelector('#close-share-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    showLoadDialog() {
        const bookmarks = this.getBookmarks();
        
        if (bookmarks.length === 0) {
            alert('No saved bookmarks found.');
            return;
        }
        
        // Create load dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const dialog = document.createElement('div');
        dialog.className = 'ui-panel';
        dialog.style.cssText = `
            position: relative;
            width: 90%;
            max-width: 500px;
            max-height: 70%;
            overflow-y: auto;
            padding: 20px;
        `;
        
        let bookmarkList = '<h3>Load Bookmark</h3>';
        bookmarks.forEach((bookmark, index) => {
            const date = new Date(bookmark.timestamp).toLocaleString();
            bookmarkList += `
                <div class="bookmark-item" style="border: 1px solid #555; margin: 10px 0; padding: 10px; cursor: pointer;" data-index="${index}">
                    <strong>${bookmark.name || 'Unnamed Bookmark'}</strong><br>
                    <small>${date}</small><br>
                    <small>Objects: ${bookmark.selectedObjects.length}</small>
                </div>
            `;
        });
        
        bookmarkList += `
            <div style="text-align: right; margin-top: 15px;">
                <button id="clear-bookmarks-btn" class="control-button" style="background: #d32f2f;">Clear All</button>
                <button id="close-load-btn" class="control-button">Close</button>
            </div>
        `;
        
        dialog.innerHTML = bookmarkList;
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        // Event listeners
        dialog.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.loadBookmark(bookmarks[index]);
                modal.remove();
            });
        });
        
        dialog.querySelector('#clear-bookmarks-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all bookmarks?')) {
                localStorage.removeItem('universeBookmarks');
                modal.remove();
            }
        });
        
        dialog.querySelector('#close-load-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    loadBookmark(bookmark) {
        // Restore camera position and orientation
        this.camera.position.set(
            bookmark.camera.position.x,
            bookmark.camera.position.y,
            bookmark.camera.position.z
        );
        
        this.camera.rotation.set(
            bookmark.camera.rotation.x,
            bookmark.camera.rotation.y,
            bookmark.camera.rotation.z
        );
        
        if (bookmark.camera.fov) {
            this.camera.fov = bookmark.camera.fov;
            this.camera.updateProjectionMatrix();
        }
        
        // Clear current selections
        this.selectionManager.clearSelection();
        
        // Restore selected objects (if they still exist)
        bookmark.selectedObjects.forEach(objData => {
            // This would need access to the universe renderer to find objects by name
            // For now, we'll just log the intended selections
            console.log('Would select object:', objData.name);
        });
        
        console.log('Bookmark loaded successfully');
    }
    
    loadFromURL() {
        // Check if there's a view parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const viewData = urlParams.get('view');
        
        if (viewData) {
            try {
                const bookmark = JSON.parse(atob(viewData));
                // Small delay to ensure everything is initialized
                setTimeout(() => {
                    this.loadBookmark(bookmark);
                }, 1000);
            } catch (error) {
                console.error('Failed to load view from URL:', error);
            }
        }
    }
    
    updateURLWithCurrentView() {
        const bookmark = this.createBookmarkData();
        const encodedData = btoa(JSON.stringify(bookmark));
        
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('view', encodedData);
        
        // Update URL without page reload
        window.history.replaceState({}, '', newUrl);
    }
    
    // Method to export bookmarks
    exportBookmarks() {
        const bookmarks = this.getBookmarks();
        const dataStr = JSON.stringify(bookmarks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'universe-bookmarks.json';
        link.click();
    }
    
    // Method to import bookmarks
    importBookmarks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedBookmarks = JSON.parse(e.target.result);
                const existingBookmarks = this.getBookmarks();
                const mergedBookmarks = [...existingBookmarks, ...importedBookmarks];
                localStorage.setItem('universeBookmarks', JSON.stringify(mergedBookmarks));
                alert('Bookmarks imported successfully!');
            } catch (error) {
                alert('Error importing bookmarks: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}