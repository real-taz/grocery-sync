import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

// --- 1. TRANSLATIONS ---
const translations = {
  en: { appTitle: 'GrocerySync', products: 'Products', manageLists: 'Manage Lists', shoppingMode: 'Shopping Mode', settings: 'Settings', adminPanel: 'Admin Panel', masterProducts: 'Master Products List', addProduct: 'Add Product', editProduct: 'Edit Product', import: 'Import Data', export: 'Export Data', tapToEdit: 'Tap to edit', pickList: 'Pick a List', createList: 'Create List', newListPlaceholder: 'e.g., Weekend BBQ', itemsTotal: 'items total', itemsRemaining: 'remaining', back: '← Back', scanBarcode: '📷 Scan Barcode', scanToAdd: '📷 Scan to Add', scanToMark: 'Scan item to mark as bought', save: 'Save', cancel: 'Cancel', update: 'Update', allowedUnits: 'Allowed Units', name: 'Name', category: 'Category', barcode: 'Barcode', picture: 'Picture', errNoPc: 'This product does not support pieces (Pc).', uncategorized: 'Uncategorized', categorySort: 'Manage Aisles & Categories', addCategory: 'Add Category', login: 'Login', logout: 'Logout', username: 'Username', password: 'Password', createUser: 'Create User', changePassword: 'Change Password', newPassword: 'New Password', editUser: 'Edit User Permissions', sortByName: 'Sort by Name', sortByCategory: 'Sort by Category', searchProducts: 'Search products...', allCategories: 'All Categories', onlyAdded: 'Only Added' },
  es: { appTitle: 'SúperSync', products: 'Productos', manageLists: 'Listas', shoppingMode: 'De Compras', settings: 'Ajustes', adminPanel: 'Panel de Admin', masterProducts: 'Lista Maestra', addProduct: 'Agregar Producto', editProduct: 'Editar Producto', import: 'Importar Datos', export: 'Exportar Datos', tapToEdit: 'Toca para editar', pickList: 'Elige una Lista', createList: 'Crear Lista', newListPlaceholder: 'Ej. Asado', itemsTotal: 'artículos en total', itemsRemaining: 'restantes', back: '← Volver', scanBarcode: '📷 Escanear Código', scanToAdd: '📷 Escanear para Añadir', scanToMark: 'Escanea para marcar comprado', save: 'Guardar', cancel: 'Cancelar', update: 'Actualizar', allowedUnits: 'Unidades Permitidas', name: 'Nombre', category: 'Categoría', barcode: 'Código de barras', picture: 'Imagen', errNoPc: 'Este producto no admite piezas (Pc).', uncategorized: 'Sin Categoría', categorySort: 'Gestionar Pasillos y Categorías', addCategory: 'Nueva Categoría', login: 'Iniciar Sesión', logout: 'Cerrar Sesión', username: 'Usuario', password: 'Contraseña', createUser: 'Crear Usuario', changePassword: 'Cambiar Contraseña', newPassword: 'Nueva Contraseña', editUser: 'Editar Permisos', sortByName: 'Ordenar por Nombre', sortByCategory: 'Ordenar por Categoría', searchProducts: 'Buscar productos...', allCategories: 'Todas las Categorías', onlyAdded: 'Solo Añadidos' },
  de: { appTitle: 'EinkaufSync', products: 'Produkte', manageLists: 'Listen verwalten', shoppingMode: 'Einkaufsmodus', settings: 'Einstellungen', adminPanel: 'Admin-Bereich', masterProducts: 'Produktstamm', addProduct: 'Produkt hinzufügen', editProduct: 'Produkt bearbeiten', import: 'Daten importieren', export: 'Daten exportieren', tapToEdit: 'Zum Bearbeiten tippen', pickList: 'Liste wählen', createList: 'Liste erstellen', newListPlaceholder: 'z.B. Wochenende', itemsTotal: 'Artikel insgesamt', itemsRemaining: 'verbleibend', back: '← Zurück', scanBarcode: '📷 Barcode scannen', scanToAdd: '📷 Scannen + Hinzufügen', scanToMark: 'Scannen zum Abhaken', save: 'Speichern', cancel: 'Abbrechen', update: 'Aktualisieren', allowedUnits: 'Erlaubte Einheiten', name: 'Name', category: 'Kategorie', barcode: 'Barcode', picture: 'Bild', errNoPc: 'Dieses Produkt unterstützt keine Stückzahl (Pc).', uncategorized: 'Ohne Kategorie', categorySort: 'Kategorien verwalten', addCategory: 'Kategorie hinzufügen', login: 'Anmelden', logout: 'Abmelden', username: 'Benutzername', password: 'Passwort', createUser: 'Benutzer erstellen', changePassword: 'Passwort ändern', newPassword: 'Neues Passwort', editUser: 'Benutzer bearbeiten', sortByName: 'Nach Name sortieren', sortByCategory: 'Nach Kategorie sortieren', searchProducts: 'Produkte suchen...', allCategories: 'Alle Kategorien', onlyAdded: 'Nur Hinzugefügte' },
  he: { appTitle: 'קניותSync', products: 'מוצרים', manageLists: 'ניהול רשימות', shoppingMode: 'מצב קניות', settings: 'הגדרות', adminPanel: 'ניהול מערכת', masterProducts: 'רשימת מוצרים', addProduct: 'הוסף מוצר', editProduct: 'ערוך מוצר', import: 'ייבוא נתונים', export: 'ייצוא נתונים', tapToEdit: 'הקש לעריכה', pickList: 'בחר רשימה', createList: 'צור רשימה', newListPlaceholder: 'לדוגמה, על האש', itemsTotal: 'פריטים בסך הכל', itemsRemaining: 'נותרו', back: '← חזור', scanBarcode: '📷 סרוק ברקוד', scanToAdd: '📷 סרוק להוספה', scanToMark: 'סרוק כדי לסמן כנקנה', save: 'שמור', cancel: 'ביטול', update: 'עדכן', allowedUnits: 'יחידות מותרות', name: 'שם', category: 'קטגוריה', barcode: 'ברקוד', picture: 'תמונה', errNoPc: 'מוצר זה אינו תומך ביחידות (Pc).', uncategorized: 'ללא קטגוריה', categorySort: 'ניהול קטגוריות ומעברים', addCategory: 'הוסף קטגוריה', login: 'התחבר', logout: 'התנתק', username: 'שם משתמש', password: 'סיסמה', createUser: 'צור משתמש', changePassword: 'שנה סיסמה', newPassword: 'סיסמה חדשה', editUser: 'ערוך הרשאות משתמש', sortByName: 'מיין לפי שם', sortByCategory: 'מיין לפי קטגוריה', searchProducts: 'חפש מוצרים...', allCategories: 'כל הקטגוריות', onlyAdded: 'רק פריטים שנוספו' }
};

const themes = {
  green: { primary: 'bg-green-600', hover: 'hover:bg-green-700', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-500', hoverBorder: 'hover:border-green-500' },
  blue: { primary: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-500', hoverBorder: 'hover:border-blue-500' },
  purple: { primary: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-500', hoverBorder: 'hover:border-purple-500' },
  rose: { primary: 'bg-rose-600', hover: 'hover:bg-rose-700', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-500', hoverBorder: 'hover:border-rose-500' },
};

const ProductGridItem = ({ p, existingItem, onUpdate, onRemove, theme, canEditList }) => {
  const isAdded = !!existingItem && existingItem.quantity > 0;
  const [qty, setQty] = useState(isAdded ? existingItem.quantity : 0);
  const allowedUnits = (typeof p.allowed_units === 'string' && p.allowed_units.length > 0) ? p.allowed_units.split(',') : ['Pc', 'g', 'Kg'];
  const defaultUnit = allowedUnits.includes('Pc') ? 'Pc' : allowedUnits[0];
  const [unit, setUnit] = useState(isAdded ? (existingItem.unit === 'P' ? 'Pc' : existingItem.unit) : defaultUnit);

  useEffect(() => {
    if (existingItem) { setQty(existingItem.quantity); setUnit(existingItem.unit === 'P' ? 'Pc' : existingItem.unit); } else { setQty(0); }
  }, [existingItem]);

  const commitChange = (newQty, newUnit) => {
    if(!canEditList) return;
    setQty(newQty); setUnit(newUnit);
    if (newQty <= 0) onRemove(p.id); else onUpdate(p.id, newQty, newUnit);
  };

  const handleIncrement = () => {
    if(!canEditList) return;
    let newQty = qty;
    if (unit === 'Pc') newQty = Math.floor(qty) + 1;
    else if (unit === 'g') newQty = Math.floor(qty / 50) * 50 + 50;
    else if (unit === 'Kg') newQty = qty + 0.5;
    commitChange(newQty, unit);
  };

  const handleDecrement = () => {
    if(!canEditList) return;
    let newQty = qty;
    if (unit === 'Pc') newQty = Math.max(0, Math.ceil(qty) - 1);
    else if (unit === 'g') newQty = Math.max(0, Math.ceil(qty / 50) * 50 - 50);
    else if (unit === 'Kg') newQty = Math.max(0, qty - 0.5);
    commitChange(newQty, unit);
  };

  return (
    <div className={`relative p-4 rounded-xl shadow-sm border flex flex-col items-center text-center transition-all ${isAdded ? `${theme.light} ${theme.border} border-2 dark:bg-gray-800` : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
      {isAdded ? <div className={`absolute -top-3 ${document.dir === 'rtl' ? '-left-3' : '-right-3'} ${theme.primary} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-md`}>✓</div> : null}
      {p.picture_url ? <img src={p.picture_url} className="w-16 h-16 object-cover rounded-full mb-2 border" /> : <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>}
      <h3 className="font-semibold text-sm mb-2">{p.name}</h3>
      <div className="w-full mt-auto">
          <div className="flex justify-center gap-1 mb-3">
            {allowedUnits.map(u => (
              <button key={u} disabled={!canEditList} onClick={() => { setUnit(u); if (qty > 0) commitChange(qty, u); }} className={`px-2 py-1 text-xs rounded border transition-colors ${unit === u ? `${theme.primary} text-white ${theme.border}` : 'bg-gray-100 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600'} disabled:opacity-50`}>{u}</button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
              <button disabled={!canEditList} onClick={handleDecrement} className={`w-12 h-12 rounded-full ${qty > 0 ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-400'} text-3xl font-bold flex items-center justify-center pb-1 disabled:opacity-50`}>−</button>
              <input type="number" disabled={!canEditList} value={qty} onBlur={(e) => commitChange(Math.max(0, Number(e.target.value)), unit)} onChange={(e) => setQty(e.target.value)} className="w-16 text-center border-b-2 bg-transparent outline-none dark:border-gray-500 font-bold text-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50" />
              <button disabled={!canEditList} onClick={handleIncrement} className={`w-12 h-12 rounded-full bg-green-600 text-white text-3xl font-bold hover:bg-green-700 flex items-center justify-center pb-1 disabled:opacity-50`}>+</button>
          </div>
      </div>
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('auth_user')));
  const [activeTab, setActiveTab] = useState('shopping');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('theme_dark')) ?? true);
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('theme_color') || 'green');
  const [lang, setLang] = useState(() => localStorage.getItem('theme_lang') || 'en');
  
  const [listSortMode, setListSortMode] = useState(() => localStorage.getItem('theme_listSort') || 'category'); 
  const [listSearchQuery, setListSearchQuery] = useState(''); 
  const [listCategoryFilter, setListCategoryFilter] = useState(''); 
  const [listAddedFilter, setListAddedFilter] = useState(false); 
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lists, setLists] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [editingList, setEditingList] = useState(null); 
  const [shoppingList, setShoppingList] = useState(null);
  const [currentListItems, setCurrentListItems] = useState([]);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingAdminUser, setEditingAdminUser] = useState(null);
  const [removePicture, setRemovePicture] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState(['Pc', 'g', 'Kg']); 
  
  const [isScanning, setIsScanning] = useState(false);
  const [shoppingScanner, setShoppingScanner] = useState(false);
  const [listEditScanner, setListEditScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [socketInstance, setSocketInstance] = useState(null);
  
  const formRef = useRef(null);
  const fileImportRef = useRef(null);

  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;
  const theme = themes[accentColor] || themes.green;
  const isRtl = lang === 'he';

  const isAdmin = user?.is_admin === 1;
  const canCreateProd = isAdmin || user?.perm_products_create === 1;
  const canEditProd = isAdmin || user?.perm_products_edit === 1;
  const canDelProd = isAdmin || user?.perm_products_delete === 1;
  const canCreateList = isAdmin || user?.perm_lists_create === 1;
  const canEditList = isAdmin || user?.perm_lists_edit === 1;
  const canDelList = isAdmin || user?.perm_lists_delete === 1;
  const canManageCats = isAdmin || user?.perm_categories === 1;
  
  const showProductsTab = canCreateProd || canEditProd || canDelProd;
  const showListsTab = canCreateList || canEditList || canDelList;

  const apiFetch = async (url, options = {}) => {
    const headers = { ...options.headers, 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) handleLogout();
    return res;
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user');
    setToken(null); setUser(null); if (socketInstance) socketInstance.disconnect();
  };

  const handleLogin = async (e) => {
      e.preventDefault();
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: e.target.username.value, password: e.target.password.value }) });
      if (res.ok) {
          const data = await res.json();
          localStorage.setItem('auth_token', data.token); localStorage.setItem('auth_user', JSON.stringify(data.user));
          setToken(data.token); setUser(data.user);
      } else { alert("Invalid Credentials"); }
  };

  useEffect(() => {
    localStorage.setItem('theme_dark', JSON.stringify(isDarkMode)); 
    localStorage.setItem('theme_color', accentColor); 
    localStorage.setItem('theme_lang', lang);
    localStorage.setItem('theme_listSort', listSortMode);
    if (isDarkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    document.dir = isRtl ? 'rtl' : 'ltr';
  }, [isDarkMode, accentColor, lang, isRtl, listSortMode]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') { setEditingProduct(null); setEditingAdminUser(null); setIsScanning(false); setShoppingScanner(false); setListEditScanner(false); } };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = async () => {
    if (!token) return;
    try {
        const pRes = await apiFetch('/api/products'); if (pRes.ok) setProducts(await pRes.json());
        const lRes = await apiFetch('/api/lists'); if (lRes.ok) setLists(await lRes.json());
        const cRes = await apiFetch('/api/categories'); if (cRes.ok) setCategories(await cRes.json());
        if (isAdmin) { const uRes = await apiFetch('/api/users'); if (uRes.ok) setUsersList(await uRes.json()); }
    } catch (e) {}
  };

  useEffect(() => { fetchData(); }, [token, user]);

  useEffect(() => {
    if (token) {
        const newSocket = io({ auth: { token } });
        setSocketInstance(newSocket);
        newSocket.on('list_updated', (update) => {
            if (shoppingList && update.listId === shoppingList.id) {
                setCurrentListItems(prev => prev.map(item => item.id === update.productId ? { ...item, is_bought: update.isBought ? 1 : 0 } : item));
            }
            fetchData(); 
        });
        return () => newSocket.disconnect();
    }
  }, [token, shoppingList]);

  // Scanner Logic
  useEffect(() => {
    if (isScanning || shoppingScanner || listEditScanner) {
      const scanner = new Html5QrcodeScanner('reader', { fps: 30, qrbox: { width: 250, height: 250 }, formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.CODE_128] }, false);
      scanner.render((decodedText) => {
        if (isScanning) { setScannedBarcode(decodedText); scanner.clear(); setIsScanning(false);
        } else if (shoppingScanner) {
            const item = currentListItems.find(i => i.barcode === decodedText);
            if (item) { toggleBought(item.id, false); alert(`Checked: ${item.name}`); } else alert("Item not found!");
            scanner.clear(); setShoppingScanner(false);
        } else if (listEditScanner && canEditList) {
            const product = products.find(p => p.barcode === decodedText);
            if (product) {
                const allowed = product.allowed_units ? product.allowed_units.split(',') : ['Pc', 'g', 'Kg'];
                if (!allowed.includes('Pc')) { alert(t('errNoPc')); } 
                else {
                    const existing = currentListItems.find(i => Number(i.id) === Number(product.id));
                    handleUpdateListItem(product.id, existing ? existing.quantity + 1 : 1, 'Pc');
                    alert(`Added 1 Pc of ${product.name}`);
                }
            } else { alert("Product not found!"); }
            scanner.clear(); setListEditScanner(false);
        }
      }, () => {});
      return () => { scanner.clear().catch(e => console.error(e)); };
    }
  }, [isScanning, shoppingScanner, listEditScanner, currentListItems, products, canEditList]);

  const switchTab = (tab) => { 
    setActiveTab(tab); setEditingList(null); setShoppingList(null); setIsSidebarOpen(false); 
    setListSearchQuery(''); setListCategoryFilter(''); setListAddedFilter(false);
  };

  const handlePasswordChange = async (e) => {
      e.preventDefault();
      await apiFetch('/api/change-password', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({newPassword: e.target.newPassword.value}) });
      alert("Password changed successfully!"); e.target.reset();
  };

  const handleAddCategory = async (e) => { e.preventDefault(); await apiFetch('/api/categories', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: e.target.catName.value}) }); e.target.reset(); fetchData(); };
  const moveCategory = async (index, direction) => {
    const newOrder = [...categories]; const temp = newOrder[index]; newOrder[index] = newOrder[index + direction]; newOrder[index + direction] = temp;
    setCategories(newOrder); await apiFetch('/api/categories/reorder', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({orderedIds: newOrder.map(c => c.id)}) }); fetchData();
  };
  const handleDeleteCategory = async (id, name) => { if(window.confirm(`Delete "${name}"?`)) { await apiFetch(`/api/categories/${id}`, { method: 'DELETE' }); fetchData(); } };

  const handleExportJSON = async () => { try { const data = await apiFetch('/api/export').then(res => res.json()); const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data)); const dlAnchorElem = document.createElement('a'); dlAnchorElem.setAttribute("href", dataStr); dlAnchorElem.setAttribute("download", "grocery_data_backup.json"); dlAnchorElem.click(); } catch(e) {} };
  const handleImportJSON = async (e) => { if (!e.target.files[0]) return; const formData = new FormData(); formData.append('file', e.target.files[0]); await apiFetch('/api/import', { method: 'POST', body: formData }); fetchData(); alert("Imported!"); };

  const handleSaveProduct = async (e) => {
    e.preventDefault(); if(selectedUnits.length === 0) { alert("Select at least one Allowed Unit!"); return; }
    const formData = new FormData(formRef.current); formData.set('barcode', scannedBarcode); formData.set('allowed_units', selectedUnits.join(',')); if(removePicture) formData.append('remove_picture', 'true');
    await apiFetch(editingProduct.id ? `/api/products/${editingProduct.id}` : '/api/products', { method: editingProduct.id ? 'PUT' : 'POST', body: formData }); fetchData(); setEditingProduct(null); setScannedBarcode('');
  };
  const openProductModal = (p) => { setEditingProduct(p); setScannedBarcode(p.barcode || ''); setSelectedUnits(p.allowed_units ? p.allowed_units.split(',') : ['Pc', 'g', 'Kg']); setRemovePicture(false); };

  const handleCreateList = async (e) => { e.preventDefault(); await apiFetch('/api/lists', { method: 'POST', body: new FormData(e.target) }); fetchData(); e.target.reset(); };
  const loadListItems = async (listId) => { try { setCurrentListItems(await apiFetch(`/api/lists/${listId}/items`).then(res => res.json())); } catch (e) {} };
  const handleUpdateListItem = async (productId, quantity, unit) => { await apiFetch(`/api/lists/${editingList.id}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId, quantity, unit }) }); loadListItems(editingList.id); fetchData(); };
  const handleRemoveListItem = async (productId) => { await apiFetch(`/api/lists/${editingList.id}/items/${productId}`, { method: 'DELETE' }); loadListItems(editingList.id); fetchData(); };
  const toggleBought = (productId, currentStatus) => {
    if (currentStatus === 1 && !window.confirm("Item already bought. Un-check it?")) return;
    const newStatus = currentStatus === 1 ? 0 : 1;
    setCurrentListItems(prev => prev.map(item => item.id === productId ? { ...item, is_bought: newStatus } : item));
    if (socketInstance) socketInstance.emit('toggle_item_status', { listId: shoppingList.id, productId, isBought: newStatus });
  };

  // ADMIN ACTIONS (With Error Catching for the Last Admin block)
  const handleCreateUser = async (e) => {
      e.preventDefault(); const form = new FormData(e.target);
      await apiFetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.get('username'), password: form.get('password'), is_admin: form.get('is_admin'), perm_products_create: form.get('perm_products_create'), perm_products_edit: form.get('perm_products_edit'), perm_products_delete: form.get('perm_products_delete'), perm_lists_create: form.get('perm_lists_create'), perm_lists_edit: form.get('perm_lists_edit'), perm_lists_delete: form.get('perm_lists_delete'), perm_categories: form.get('perm_categories') }) });
      fetchData(); e.target.reset();
  };
  const handleUpdateUser = async (e) => {
      e.preventDefault(); const form = new FormData(e.target);
      const res = await apiFetch(`/api/users/${editingAdminUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: form.get('password'), is_admin: form.get('is_admin'), perm_products_create: form.get('perm_products_create'), perm_products_edit: form.get('perm_products_edit'), perm_products_delete: form.get('perm_products_delete'), perm_lists_create: form.get('perm_lists_create'), perm_lists_edit: form.get('perm_lists_edit'), perm_lists_delete: form.get('perm_lists_delete'), perm_categories: form.get('perm_categories') }) });
      if (!res.ok) { const data = await res.json(); alert(data.error || "Failed to update user."); return; }
      fetchData(); setEditingAdminUser(null);
  };
  const handleDeleteUser = async (uId, uName) => {
      if(window.confirm(`Delete ${uName}?`)){ 
          const res = await apiFetch(`/api/users/${uId}`, {method:'DELETE'}); 
          if (!res.ok) { const data = await res.json(); alert(data.error || "Failed to delete user."); }
          else fetchData(); 
      }
  };

  const safeLists = Array.isArray(lists) ? lists : []; 
  const safeProducts = Array.isArray(products) ? products : []; 
  const safeCurrentItems = Array.isArray(currentListItems) ? currentListItems : []; 
  const safeCategories = Array.isArray(categories) ? categories : [];
  
  const catNamesOrder = safeCategories.map(c => c.name);

  const sortedProductsForEdit = [...safeProducts]
    .filter(p => p.name.toLowerCase().includes(listSearchQuery.toLowerCase()))
    .filter(p => {
        if (listCategoryFilter === '') return true;
        if (listCategoryFilter === 'UNCATEGORIZED') return !p.product_group;
        return p.product_group === listCategoryFilter;
    })
    .filter(p => {
        if (!listAddedFilter) return true;
        const existing = safeCurrentItems.find(i => Number(i.id) === Number(p.id));
        return existing && existing.quantity > 0;
    })
    .sort((a, b) => {
      if (listSortMode === 'name') {
          return a.name.localeCompare(b.name);
      } else {
          const catA = a.product_group || t('uncategorized');
          const catB = b.product_group || t('uncategorized');
          if (catA !== catB) {
              if (catA === t('uncategorized')) return 1;
              if (catB === t('uncategorized')) return -1;
              const indexA = catNamesOrder.indexOf(catA);
              const indexB = catNamesOrder.indexOf(catB);
              return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
          }
          return a.name.localeCompare(b.name);
      }
  });

  const groupedItems = safeCurrentItems.reduce((acc, item) => { const cat = item.product_group || t('uncategorized'); if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc; }, {});
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => { if (a === t('uncategorized')) return 1; if (b === t('uncategorized')) return -1; const indexA = catNamesOrder.indexOf(a); const indexB = catNamesOrder.indexOf(b); return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB); });

  if (!token) {
      return (
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
              <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-6">
                  <h1 className="text-3xl font-bold text-center text-green-600 dark:text-green-400 mb-4">{t('appTitle')}</h1>
                  <div><label className="block text-sm font-medium mb-2 dark:text-gray-200">{t('username')}</label><input name="username" required className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none" /></div>
                  <div><label className="block text-sm font-medium mb-2 dark:text-gray-200">{t('password')}</label><input type="password" name="password" required className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none" /></div>
                  <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded-lg mt-2 shadow">{t('login')}</button>
              </form>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 flex flex-col">
      <div className="md:hidden flex justify-between items-center bg-white dark:bg-gray-800 p-4 shadow-sm z-20">
          <button onClick={() => setIsSidebarOpen(true)} className={`text-2xl p-1`}>☰</button>
          <h1 className={`text-xl font-bold ${theme.text}`}>{t('appTitle')}</h1>
          <div className="w-8"></div>
      </div>

      {isSidebarOpen ? <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div> : null}

      <nav className={`fixed inset-y-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-40 w-64 bg-white dark:bg-gray-800 dark:border-gray-700 p-6 transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')}`}>
        <div className="flex justify-between items-center mb-8">
            <h1 className={`text-3xl font-bold ${theme.text} hidden md:block`}>{t('appTitle')}</h1>
            <h1 className={`text-2xl font-bold ${theme.text} md:hidden`}>{t('appTitle')}</h1>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-2xl">✕</button>
        </div>
        <div className="flex flex-col gap-4 flex-1">
          <button onClick={() => switchTab('shopping')} className={`p-3 rounded-xl text-lg font-medium transition-colors ${isRtl ? 'text-right' : 'text-left'} ${activeTab === 'shopping' ? `${theme.light} ${theme.text} dark:bg-gray-700` : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t('shoppingMode')}</button>
          {showListsTab ? <button onClick={() => switchTab('lists')} className={`p-3 rounded-xl text-lg font-medium transition-colors ${isRtl ? 'text-right' : 'text-left'} ${activeTab === 'lists' ? `${theme.light} ${theme.text} dark:bg-gray-700` : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t('manageLists')}</button> : null}
          {showProductsTab ? <button onClick={() => switchTab('products')} className={`p-3 rounded-xl text-lg font-medium transition-colors ${isRtl ? 'text-right' : 'text-left'} ${activeTab === 'products' ? `${theme.light} ${theme.text} dark:bg-gray-700` : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t('products')}</button> : null}
          {isAdmin ? <button onClick={() => switchTab('admin')} className={`p-3 rounded-xl text-lg font-medium transition-colors ${isRtl ? 'text-right' : 'text-left'} text-purple-600 ${activeTab === 'admin' ? `bg-purple-50 dark:bg-gray-700` : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>🛡️ {t('adminPanel')}</button> : null}
        </div>
        <div className="mt-auto flex justify-around pb-4 border-t pt-4 dark:border-gray-700">
            <button onClick={() => switchTab('settings')} className={`w-12 h-12 flex items-center justify-center text-2xl rounded-full transition-transform hover:rotate-90 ${activeTab === 'settings' ? `${theme.light} ${theme.text} dark:bg-gray-700` : 'bg-gray-100 dark:bg-gray-800'}`}>⚙️</button>
            <button onClick={handleLogout} className="w-12 h-12 flex items-center justify-center text-2xl rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30">🚪</button>
        </div>
      </nav>

      <main className={`flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden transition-all ${isRtl ? 'md:pr-64' : 'md:ml-64'}`}>
        
        {/* --- ADMIN TAB --- */}
        {activeTab === 'admin' && isAdmin ? (
            <section className="max-w-5xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border dark:border-gray-700 mt-2">
                <h2 className="text-3xl font-bold mb-8 border-b pb-4 text-purple-600">{t('adminPanel')}</h2>
                <form onSubmit={handleCreateUser} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl mb-8 border dark:border-gray-600">
                    <h3 className="text-xl font-bold mb-4">{t('createUser')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input name="username" required placeholder={t('username')} className="p-2 rounded border dark:bg-gray-800 dark:border-gray-600 outline-none" />
                        <input name="password" required placeholder={t('password')} type="password" className="p-2 rounded border dark:bg-gray-800 dark:border-gray-600 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4" dir="ltr">
                        <label className="flex items-center gap-1 font-bold text-purple-600"><input type="checkbox" name="is_admin" className="w-4 h-4" /> Admin</label>
                        <label className="flex items-center gap-1"><input type="checkbox" name="perm_products_create" className="w-4 h-4" /> Create Prod</label>
                        <label className="flex items-center gap-1"><input type="checkbox" name="perm_products_edit" className="w-4 h-4" /> Edit Prod</label>
                        <label className="flex items-center gap-1"><input type="checkbox" name="perm_products_delete" className="w-4 h-4" /> Delete Prod</label>
                        <label className="flex items-center gap-1"><input type="checkbox" name="perm_categories" className="w-4 h-4" /> Categories</label>
                        <label className="flex items-center gap-1"><input type="checkbox" name="perm_lists_create" className="w-4 h-4" /> Create List</label>
                        <label className="flex items-center gap-1"><input type="checkbox" name="perm_lists_edit" className="w-4 h-4" /> Edit List</label>
                        <label className="flex items-center gap-1"><input type="checkbox" name="perm_lists_delete" className="w-4 h-4" /> Delete List</label>
                    </div>
                    <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded shadow hover:bg-purple-700 font-bold">{t('save')}</button>
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap" dir="ltr">
                        <thead><tr className="border-b dark:border-gray-600"><th className="p-2">User</th><th className="p-2">Admin</th><th className="p-2">Products (C/E/D)</th><th className="p-2">Lists (C/E/D)</th><th className="p-2">Cats</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>
                            {usersList.map(u => (
                                <tr key={u.id} className="border-b dark:border-gray-700">
                                    <td className="p-2 font-bold">{u.username}</td>
                                    <td className="p-2">{u.is_admin ? '🛡️' : '❌'}</td>
                                    <td className="p-2">{u.perm_products_create ? '✅' : '❌'} / {u.perm_products_edit ? '✅' : '❌'} / {u.perm_products_delete ? '✅' : '❌'}</td>
                                    <td className="p-2">{u.perm_lists_create ? '✅' : '❌'} / {u.perm_lists_edit ? '✅' : '❌'} / {u.perm_lists_delete ? '✅' : '❌'}</td>
                                    <td className="p-2">{u.perm_categories ? '✅' : '❌'}</td>
                                    <td className="p-2 flex gap-2">
                                        <button onClick={() => setEditingAdminUser(u)} className="text-blue-500 hover:underline">Edit</button>
                                        <button onClick={() => handleDeleteUser(u.id, u.username)} className="text-red-500 hover:underline disabled:opacity-30">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {editingAdminUser ? (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-xl">
                            <h3 className="text-xl font-bold mb-4">{t('editUser')}: {editingAdminUser.username}</h3>
                            <form onSubmit={handleUpdateUser} className="flex flex-col gap-4">
                                <div><label className="text-sm">{t('newPassword')} (Leave blank to keep)</label><input name="password" type="password" className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 outline-none" /></div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4" dir="ltr">
                                    <label className="flex items-center gap-1 font-bold text-purple-600"><input type="checkbox" name="is_admin" defaultChecked={editingAdminUser.is_admin} className="w-4 h-4" /> Admin</label>
                                    <label className="flex items-center gap-1"><input type="checkbox" name="perm_products_create" defaultChecked={editingAdminUser.perm_products_create} className="w-4 h-4" /> Create Prod</label>
                                    <label className="flex items-center gap-1"><input type="checkbox" name="perm_products_edit" defaultChecked={editingAdminUser.perm_products_edit} className="w-4 h-4" /> Edit Prod</label>
                                    <label className="flex items-center gap-1"><input type="checkbox" name="perm_products_delete" defaultChecked={editingAdminUser.perm_products_delete} className="w-4 h-4" /> Delete Prod</label>
                                    <label className="flex items-center gap-1"><input type="checkbox" name="perm_categories" defaultChecked={editingAdminUser.perm_categories} className="w-4 h-4" /> Categories</label>
                                    <label className="flex items-center gap-1"><input type="checkbox" name="perm_lists_create" defaultChecked={editingAdminUser.perm_lists_create} className="w-4 h-4" /> Create List</label>
                                    <label className="flex items-center gap-1"><input type="checkbox" name="perm_lists_edit" defaultChecked={editingAdminUser.perm_lists_edit} className="w-4 h-4" /> Edit List</label>
                                    <label className="flex items-center gap-1"><input type="checkbox" name="perm_lists_delete" defaultChecked={editingAdminUser.perm_lists_delete} className="w-4 h-4" /> Delete List</label>
                                </div>
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-gray-700">
                                    <button type="button" onClick={() => setEditingAdminUser(null)} className="px-4 py-2 text-gray-500">{t('cancel')} (Esc)</button>
                                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded shadow">{t('save')} (Enter)</button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : null}
            </section>
        ) : null}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' ? (
            <section className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border dark:border-gray-700 mt-2">
                <h2 className="text-3xl font-bold mb-8 border-b pb-4 dark:border-gray-700">{t('settings')}</h2>
                
                <form onSubmit={handlePasswordChange} className="mb-8 border-b pb-8 dark:border-gray-700">
                    <span className="text-lg font-medium block mb-4">{t('changePassword')}</span>
                    <div className="flex gap-2">
                        <input name="newPassword" type="password" required placeholder={t('newPassword')} className="flex-1 border p-2 rounded dark:bg-gray-700 dark:border-gray-600 outline-none" />
                        <button type="submit" className={`${theme.primary} text-white px-4 rounded shadow hover:opacity-90`}>{t('save')}</button>
                    </div>
                </form>

                {isAdmin ? (
                <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between border-b pb-8 dark:border-gray-700">
                    <div><span className="text-lg font-medium block">Database Backup</span><span className="text-sm text-gray-500">Products, images & categories</span></div>
                    <div className="flex gap-2">
                        <input type="file" accept=".json" ref={fileImportRef} className="hidden" onChange={handleImportJSON} />
                        <button onClick={() => fileImportRef.current.click()} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded shadow">{t('import')}</button>
                        <button onClick={handleExportJSON} className={`${theme.primary} text-white px-4 py-2 rounded shadow hover:opacity-90`}>{t('export')}</button>
                    </div>
                </div>
                ) : null}

                <div className="mb-8 flex items-center justify-between"><span className="text-lg font-medium">Dark Mode</span><button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${isDarkMode ? theme.primary : 'bg-gray-300'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${isDarkMode ? (isRtl ? '-translate-x-6' : 'translate-x-6') : ''}`}></div></button></div>
                <div className="mb-8"><span className="text-lg font-medium block mb-4">Accent Color</span><div className="flex gap-4">{Object.keys(themes).map(c => (<button key={c} onClick={() => setAccentColor(c)} className={`w-12 h-12 rounded-full border-4 transition-transform hover:scale-110 ${themes[c].primary} ${accentColor === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}></button>))}</div></div>
                <div className="mb-8"><span className="text-lg font-medium block mb-4">Language</span><select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none"><option value="en">English</option><option value="es">Español</option><option value="de">Deutsch</option><option value="he">עברית</option></select></div>

                {canManageCats ? (
                <div className="mb-8">
                    <span className="text-lg font-medium block mb-4">{t('categorySort')}</span>
                    <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                        <input name="catName" required placeholder={t('addCategory')} className="flex-1 border p-2 rounded dark:bg-gray-700 dark:border-gray-600 outline-none" />
                        <button type="submit" className={`${theme.primary} text-white px-4 rounded font-bold hover:opacity-90`}>+</button>
                    </form>
                    <div className="flex flex-col gap-2">
                        {safeCategories.length === 0 ? <p className="text-gray-500 text-sm">No categories found.</p> : null}
                        {safeCategories.map((cat, index) => (
                            <div key={cat.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600">
                                <span className="font-medium">{cat.name}</span>
                                <div className="flex gap-1" dir="ltr">
                                    <button disabled={index === 0} onClick={() => moveCategory(index, -1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-30">⬆️</button>
                                    <button disabled={index === safeCategories.length - 1} onClick={() => moveCategory(index, 1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-30">⬇️</button>
                                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="p-1 ml-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                ) : null}
            </section>
        ) : null}

        {/* --- PRODUCTS --- */}
        {activeTab === 'products' && showProductsTab ? (
          <section>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-2 dark:border-gray-700">
                <h2 className="text-2xl font-bold">{t('masterProducts')}</h2>
                {canCreateProd ? <button onClick={() => openProductModal({})} className={`${theme.primary} text-white px-6 py-2 rounded-lg shadow font-medium hover:opacity-90`}>+ {t('addProduct')}</button> : null}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {safeProducts.map(p => (
                    <div key={p.id} className={`relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border flex flex-col items-center text-center transition-colors ${canEditProd ? 'cursor-pointer hover:border-gray-400' : ''}`} onClick={() => canEditProd && openProductModal(p)}>
                        {canDelProd ? <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${p.name}"?`)) { apiFetch(`/api/products/${p.id}`, {method:'DELETE'}).then(fetchData); } }} className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} text-red-500 hover:scale-125 transition-transform`}>🗑️</button> : null}
                        {p.picture_url ? <img src={p.picture_url} className="w-16 h-16 object-cover rounded-full mb-2 border" /> : <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>}
                        <h3 className="font-semibold">{p.name}</h3>
                        {canEditProd ? <p className={`text-xs mt-1 ${theme.text}`}>{t('tapToEdit')}</p> : null}
                    </div>
                ))}
            </div>

            {/* Product Edit/Add Modal */}
            {editingProduct && (canEditProd || canCreateProd) ? (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingProduct.id ? t('editProduct') : t('addProduct')}</h3>
                        {isScanning ? <div className="mb-4"><div id="reader" className="w-full bg-black rounded overflow-hidden"></div><button onClick={() => setIsScanning(false)} className="mt-2 text-red-500 w-full font-medium">{t('cancel')}</button></div> : null}
                        
                        <form ref={formRef} onSubmit={handleSaveProduct} className="flex flex-col gap-4">
                            <div><label className="text-sm font-medium mb-1 block">{t('name')} *</label><input name="name" defaultValue={editingProduct.name} required className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 outline-none" /></div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">{t('category')}</label>
                                <select name="product_group" defaultValue={editingProduct.product_group || ""} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 outline-none">
                                    <option value="">-- {t('uncategorized')} --</option>
                                    {safeCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">{t('barcode')}</label>
                                <div className="flex gap-2">
                                  <input value={scannedBarcode} onChange={(e) => setScannedBarcode(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 outline-none" />
                                  {!isScanning ? <button type="button" onClick={() => setIsScanning(true)} className={`${theme.primary} text-white px-3 rounded shadow whitespace-nowrap`}>📷</button> : null}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">{t('allowedUnits')}</label>
                                <div className="flex gap-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                    {['Pc', 'g', 'Kg'].map(u => (
                                        <label key={u} className="flex items-center gap-1 cursor-pointer">
                                            <input type="checkbox" checked={selectedUnits.includes(u)} onChange={(e) => { if(e.target.checked) setSelectedUnits([...selectedUnits, u]); else setSelectedUnits(selectedUnits.filter(su => su !== u)); }} className="w-4 h-4" /> <span dir="ltr">{u}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">{t('picture')}</label>
                                <input name="picture" type="file" className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600" />
                                {editingProduct.picture_url && !removePicture ? ( <button type="button" onClick={() => setRemovePicture(true)} className="text-red-500 text-sm mt-2 flex items-center gap-1">🗑️ {t('remove')} {t('picture')}</button> ) : null}
                                {removePicture ? <p className="text-red-500 text-sm mt-2">Picture will be deleted on save.</p> : null}
                            </div>
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-gray-700">
                                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-gray-500 font-medium">{t('cancel')} (Esc)</button>
                                <button type="submit" className={`px-4 py-2 ${theme.primary} text-white rounded shadow font-medium hover:opacity-90`}>{t('save')} (Enter)</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
          </section>
        ) : null}

        {/* --- MANAGE LISTS --- */}
        {activeTab === 'lists' && showListsTab && !editingList ? (
          <section>
            <h2 className="text-2xl font-bold mb-6">{t('manageLists')}</h2>
            {canCreateList ? (
                <form onSubmit={handleCreateList} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border mb-8 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full"><label className="text-sm font-medium mb-1 block">{t('createList')} *</label><input name="name" required className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 outline-none" placeholder={t('newListPlaceholder')} /></div>
                <div><label className="text-sm font-medium mb-1 block">{t('picture')} (Optional)</label><input type="file" name="picture" className="w-full border p-1 rounded dark:bg-gray-700 dark:border-gray-600" /></div>
                <button type="submit" className={`${theme.primary} text-white px-6 py-2 rounded shadow h-[42px] hover:opacity-90`}>+</button>
                </form>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeLists.map(list => (
                <div key={list.id} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors relative group ${canEditList ? theme.hoverBorder : ''}`} onClick={() => { if(canEditList) { setEditingList(list); setListSearchQuery(''); setListCategoryFilter(''); setListAddedFilter(false); loadListItems(list.id); } }}>
                  {canDelList ? <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Delete list?")) apiFetch(`/api/lists/${list.id}`, {method: 'DELETE'}).then(fetchData); }} className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} text-red-500 hidden group-hover:block hover:scale-110`}>🗑️</button> : null}
                  <div className="flex items-center gap-4">
                    {list.picture_url ? <img src={list.picture_url} className="w-16 h-16 rounded object-cover" /> : <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-2xl">📋</div>}
                    <h3 className="font-bold text-2xl">{list.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 md:ml-auto" dir="ltr">
                      <span className={`text-5xl font-bold ${list.total_count > 0 ? theme.text : 'text-gray-300 dark:text-gray-600'}`}>{list.total_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* --- LIST GRID EDITOR --- */}
        {activeTab === 'lists' && editingList ? (
          <section>
            <button onClick={() => {setEditingList(null); setListSearchQuery(''); setListCategoryFilter(''); setListAddedFilter(false); fetchData();}} className={`${theme.text} font-medium mb-4`}>{t('back')}</button>
            <h2 className="text-2xl font-bold mb-6 border-b pb-2 dark:border-gray-700">{editingList.name}</h2>
            
            {/* ADVANCED FILTERS & SEARCH */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap">
                <input 
                    type="text" 
                    placeholder={t('searchProducts')} 
                    value={listSearchQuery} 
                    onChange={(e) => setListSearchQuery(e.target.value)} 
                    className="flex-1 min-w-[200px] border p-2 rounded shadow-sm dark:bg-gray-700 dark:border-gray-600 outline-none"
                />
                <select value={listCategoryFilter} onChange={(e) => setListCategoryFilter(e.target.value)} className="border p-2 rounded shadow-sm dark:bg-gray-700 dark:border-gray-600 outline-none">
                    <option value="">{t('allCategories')}</option>
                    {safeCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    <option value="UNCATEGORIZED">{t('uncategorized')}</option>
                </select>
                <select value={listSortMode} onChange={(e) => setListSortMode(e.target.value)} className="border p-2 rounded shadow-sm dark:bg-gray-700 dark:border-gray-600 outline-none">
                    <option value="category">{t('sortByCategory')}</option>
                    <option value="name">{t('sortByName')}</option>
                </select>
                <button onClick={() => setListAddedFilter(!listAddedFilter)} className={`border p-2 rounded shadow-sm outline-none transition-colors ${listAddedFilter ? theme.primary + ' text-white border-transparent' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}>
                    {t('onlyAdded')}
                </button>
                {canEditList ? <button onClick={() => setListEditScanner(!listEditScanner)} className={`${theme.primary} text-white px-4 py-2 rounded shadow hover:opacity-90`}>{t('scanToAdd')}</button> : null}
            </div>

            {listEditScanner ? (
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border">
                    <h3 className="text-center font-bold mb-2">Scan item to instantly add 1 Pc</h3>
                    <div id="reader" className="w-full bg-black rounded overflow-hidden max-w-sm mx-auto"></div>
                </div>
            ) : null}
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedProductsForEdit.length === 0 && <p className="col-span-full text-center text-gray-500 py-8">No products found.</p>}
              {sortedProductsForEdit.map(p => (
                  <ProductGridItem key={p.id} p={p} existingItem={safeCurrentItems.find(i => Number(i.id) === Number(p.id))} onUpdate={handleUpdateListItem} onRemove={handleRemoveListItem} theme={theme} canEditList={canEditList} />
              ))}
            </div>
          </section>
        ) : null}

        {/* --- SHOPPING MENU --- */}
        {activeTab === 'shopping' && !shoppingList ? (
           <section>
             <h2 className="text-2xl font-bold mb-6">{t('pickList')}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeLists.map(list => (
                <div key={list.id} onClick={() => {setShoppingList(list); loadListItems(list.id);}} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-gray-400`}>
                  <div className="flex items-center gap-4">
                    {list.picture_url ? <img src={list.picture_url} className="w-16 h-16 rounded object-cover" /> : <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-2xl">📋</div>}
                    <h3 className="font-bold text-2xl">{list.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 md:ml-auto" dir="ltr">
                      <span className={`text-5xl font-bold ${list.pending_count > 0 ? theme.text : 'text-gray-300 dark:text-gray-600'}`}>{list.pending_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
           </section>
        ) : null}

        {/* --- ACTIVE SHOPPING --- */}
        {activeTab === 'shopping' && shoppingList ? (
           <section>
            <div className="flex justify-between items-center mb-6 border-b pb-2 dark:border-gray-700">
              <button onClick={() => {setShoppingList(null); fetchData();}} className={`${theme.text} font-medium`}>{t('back')}</button>
              <h2 className="text-2xl font-bold">{shoppingList.name}</h2>
              <button onClick={() => setShoppingScanner(!shoppingScanner)} className={`${theme.primary} text-white px-4 py-2 rounded shadow hover:opacity-90`}>{t('scanBarcode')}</button>
            </div>

            {shoppingScanner ? (
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border">
                    <h3 className="text-center font-bold mb-2">{t('scanToMark')}</h3>
                    <div id="reader" className="w-full bg-black rounded overflow-hidden max-w-sm mx-auto"></div>
                </div>
            ) : null}
            
            {sortedCategories.map(cat => (
                <div key={cat} className="mb-8">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-700">{cat}</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {groupedItems[cat].map(item => {
                            const unitDisplay = item.unit === 'P' ? 'Pc' : item.unit;
                            return (
                            <div key={item.id} onClick={() => toggleBought(item.id, item.is_bought)} className={`p-4 rounded-xl shadow-sm border flex items-center justify-between cursor-pointer transition-all active:scale-95 ${item.is_bought === 1 ? `${theme.light} border-transparent dark:bg-gray-800 opacity-50` : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${item.is_bought === 1 ? `${theme.primary} ${theme.border}` : 'border-gray-300 dark:border-gray-500'}`}>
                                    {item.is_bought === 1 ? <span className="text-white text-lg font-bold">✓</span> : null}
                                </div>
                                {item.picture_url ? <img src={item.picture_url} className="w-12 h-12 object-cover rounded-md border" /> : <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>}
                                <div><p className={`text-xl font-semibold ${item.is_bought === 1 ? 'line-through text-gray-500' : ''}`}>{item.name}</p></div>
                            </div>
                            <div className="text-right flex items-baseline gap-1 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg" dir="ltr">
                                <span className={`text-3xl font-bold ${item.is_bought === 1 ? 'text-gray-500' : theme.text}`}>{item.quantity}</span>
                                <span className={`text-xl font-bold ${item.is_bought === 1 ? 'text-gray-400' : theme.text} opacity-80`}>{unitDisplay}</span>
                            </div>
                            </div>
                        )})}
                    </div>
                </div>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}
