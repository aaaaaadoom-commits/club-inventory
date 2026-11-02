'use strict';
// Prototype only: local browser storage is NOT secure or shared between staff.
const KEY='clubInventoryEmptyProductsV1';
const DEFAULT_PRODUCTS=[];
function products(){try{const x=JSON.parse(localStorage.getItem(KEY));return Array.isArray(x)?x:DEFAULT_PRODUCTS.map(p=>({...p}));}catch{return DEFAULT_PRODUCTS.map(p=>({...p}));}}
function saveProducts(p){try{localStorage.setItem(KEY,JSON.stringify(p));return true;}catch{alert('Browser storage is full. Try a smaller image.');return false;}}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function theme(){return localStorage.getItem('clubTheme')==='light'?'light':'dark';}
function applyTheme(){document.documentElement.dataset.theme=theme();}
function toggleTheme(){localStorage.setItem('clubTheme',theme()==='dark'?'light':'dark');applyTheme();}
applyTheme();
function demoLogin(event){event.preventDefault();const email=document.getElementById('email').value.trim().toLowerCase();if(!email)return;sessionStorage.setItem('clubDemoEmail',email);location.href='viewer.html';}
function logout(){sessionStorage.removeItem('clubDemoEmail');location.href='index.html';}
function renderInventory(mode){
 const list=document.getElementById('productGrid');if(!list)return;
 const all=products(),q=(document.getElementById('search')?.value||'').toLowerCase(),category=document.getElementById('categoryFilter')?.value||'';
 const categories=[...new Set(all.map(p=>p.category||'Uncategorized'))].sort();
 const sel=document.getElementById('categoryFilter');if(sel){const prev=sel.value;sel.innerHTML='<option value="">All categories</option>'+categories.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');sel.value=prev;}
 const filtered=all.filter(p=>(p.name+' '+(p.category||'')+' '+(p.notes||'')).toLowerCase().includes(q)&&(!category||(p.category||'Uncategorized')===category));
 list.innerHTML=filtered.length?filtered.map(p=>{
 const idx=all.findIndex(x=>x.id===p.id);const photo=p.image?`<img alt="${escapeHtml(p.name)}" src="${p.image}">`:'<span>🖼️ Product image coming soon</span>';
 const controls=mode==='editor'?`<button class="more" aria-label="Product options" onclick="toggleMenu(${idx})">⋯</button><div id="menu-${idx}" class="menu hidden"><button class="secondary" onclick="location.href='edit.html?id=${encodeURIComponent(p.id)}'">✏️ Edit</button><button class="danger" onclick="deleteProduct(${idx})">🗑️ Delete</button></div>`:'';
 const qty=mode==='editor'?`<div class="card-bottom"><div class="quantity-actions"><button class="secondary round" aria-label="Subtract one" onclick="changeQuantity(${idx},-1)">−</button><span class="stock">${Number(p.quantity)||0}</span><button class="secondary round" aria-label="Add one" onclick="changeQuantity(${idx},1)">+</button></div><small class="muted">in stock</small></div>`:`<div class="stock">${Number(p.quantity)||0} <small>in stock</small></div>`;
 return `<article class="card"><div class="photo">${photo}</div>${controls}<div class="card-content"><span class="tag">${escapeHtml(p.category||'Uncategorized')}</span><h2>${escapeHtml(p.name)}</h2>${qty}${p.owner?`<p class="small">Owner: ${escapeHtml(p.owner)}</p>`:''}${p.notes?`<p class="small">${escapeHtml(p.notes)}</p>`:''}</div></article>`;
 }).join(''):'<p class="empty">No products found.</p>';
}
function toggleMenu(i){document.querySelectorAll('.menu').forEach(m=>{if(m.id!=='menu-'+i)m.classList.add('hidden');});document.getElementById('menu-'+i)?.classList.toggle('hidden');}
function changeQuantity(i,delta){const p=products();if(!p[i])return;p[i].quantity=Math.max(0,(Number(p[i].quantity)||0)+delta);if(saveProducts(p))renderInventory('editor');}
function deleteProduct(i){const p=products();if(!p[i])return;if(!confirm(`Delete "${p[i].name}"? This cannot be undone in this browser.`))return;p.splice(i,1);if(saveProducts(p))renderInventory('editor');}
function imageAsDataUrl(file){return new Promise((resolve,reject)=>{if(!file){resolve('');return;}if(!['image/jpeg','image/png','image/webp'].includes(file.type)){reject(new Error('Choose a JPG, PNG, or WebP image.'));return;}if(file.size>2*1024*1024){reject(new Error('Use an image smaller than 2 MB for this demo.'));return;}const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read image.'));reader.readAsDataURL(file);});}
function setStatus(msg){const el=document.getElementById('status');if(el)el.textContent=msg;}
async function submitProduct(event,editing){event.preventDefault();setStatus('');try{
 const name=document.getElementById('name').value.trim(),quantity=Number(document.getElementById('quantity').value),file=document.getElementById('image').files[0];
 if(!name||!Number.isInteger(quantity)||quantity<0)throw new Error('Enter a name and a valid nonnegative whole-number quantity.');
 const p=products(),id=new URLSearchParams(location.search).get('id'),existing=editing?p.find(x=>x.id===id):null;
 if(editing&&!existing)throw new Error('Product not found.');
 if(!editing&&!file)throw new Error('Choose a product image.');
 const image=file?await imageAsDataUrl(file):(existing?.image||'');
 const record={id:existing?.id||('item-'+Date.now()+'-'+Math.random().toString(36).slice(2)),name,quantity,image,category:document.getElementById('category').value.trim(),owner:document.getElementById('owner').value.trim(),notes:document.getElementById('notes').value.trim()};
 if(existing)Object.assign(existing,record);else p.push(record);
 if(saveProducts(p))location.href='editor.html';
 }catch(e){setStatus(e.message||'Unable to save product.');}}

function loadEdit() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const product = products().find(p => p.id === id);

    if (!product) {
        setStatus("Product not found.");
        return;
    }

    const fields = ["name", "quantity", "category", "owner", "notes"];

    fields.forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            input.value = product[field] ?? "";
        }
    });

    const preview = document.getElementById("currentImage");

    if (preview && product.image) {
        preview.src = product.image;
        preview.classList.remove("hidden");
    }
}
