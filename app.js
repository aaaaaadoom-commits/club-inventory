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
 }).join(''):'<p class="empty">No products to display yet. Google Sheets products are not connected to this website.</p>';
}
function toggleMenu(i){document.querySelectorAll('.menu').forEach(m=>{if(m.id!=='menu-'+i)m.classList.add('hidden');});document.getElementById('menu-'+i)?.classList.toggle('hidden');}
function changeQuantity(i,delta){const p=products();if(!p[i])return;p[i].quantity=Math.max(0,(Number(p[i].quantity)||0)+delta);if(saveProducts(p))renderInventory('editor');}
function deleteProduct(i){const p=products();if(!p[i])return;if(!confirm(`Delete "${p[i].name}"? This cannot be undone in this browser.`))return;p.splice(i,1);if(saveProducts(p))renderInventory('editor');}

async 
async function imageAsDataUrl(file) {
  if (!file) return "";

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowed.includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error(
      "Image exceeds 20 MB. Choose a smaller file."
    );
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const picture = new Image();

      picture.onload = () => resolve(picture);

      picture.onerror = () => reject(
        new Error("Cannot open this image.")
      );

      picture.src = objectUrl;
    });

    // Automatically reduce resolution and file size.
    for (const maxSize of [1400, 1100, 900, 700, 500]) {
      const scale = Math.min(
        1,
        maxSize / Math.max(
          img.naturalWidth,
          img.naturalHeight
        )
      );

      const canvas = document.createElement("canvas");

      canvas.width = Math.max(
        1, Math.round(img.naturalWidth * scale)
      );

      canvas.height = Math.max(
        1, Math.round(img.naturalHeight * scale)
      );

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Image processing unavailable.");
      }

      // White background for transparent PNG images.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img, 0, 0, canvas.width, canvas.height
      );

      for (const quality of [0.85, 0.72, 0.58, 0.44]) {
        const result = canvas.toDataURL(
          "image/jpeg", quality
        );

        if (
          result.startsWith("data:image/jpeg;base64,")
          && result.length < 900000
        ) {
          return result;
        }
      }
    }

    throw new Error(
      "Image could not be compressed enough."
    );

  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

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

// CLUB LOGIN CONNECTION
const CLUB_URL = "https://script.google.com/macros/s/AKfycbw-7dcW2Ed5ZqbPYJnG_m6JF7T5vu8ZEegyIXw8Rq1_EgYi0nCAb5ah6rsvrRwF6mI/exec";
let requestId = 0;

function clubRequest(action, email="") {
  return new Promise((resolve, reject) => {
    const cb = `clubCb_${Date.now()}_${++requestId}`;
    const script = document.createElement("script");
    let done = false;

    const timer = setTimeout(
      () => finish(new Error("Timeout")), 12000
    );

    function finish(error, data) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      script.remove();
      delete window[cb];
      error ? reject(error) : resolve(data);
    }

    window[cb] = data => finish(null, data);
    script.onerror = () =>
      finish(new Error("Connection failed"));

    const url = new URL(CLUB_URL);
    url.searchParams.set("action", action);
    url.searchParams.set("callback", cb);

    if (email) url.searchParams.set("email", email);

    script.src = url.href;
    document.head.appendChild(script);
  });
}

function blockPage(title, message, retry=false) {
  document.documentElement.classList.remove("clubReady");
  document.getElementById("gateTitle").textContent = title;
  document.getElementById("gateMessage").textContent = message;
  document.getElementById("gateRetry").hidden = !retry;
}

async function checkPage() {
  blockPage(
    "Checking connection…",
    "Contacting Google Sheets."
  );

  try {
    const status = await clubRequest("status");

    if (!status || !status.ok) {
      throw new Error("Offline");
    }

    const page = document.body.dataset.clubPage;

    if (page !== "login") {
      const email = sessionStorage.getItem("clubEmail");

      if (!email) {
        location.replace("index.html");
        return;
      }

      const result = await clubRequest("role", email);

      if (!result || !result.ok) {
        throw new Error("Offline");
      }

      const allowed = page === "viewer"
        ? ["Editor", "Viewer"].includes(result.role)
        : result.role === "Editor";

      if (!allowed) {
        sessionStorage.removeItem("clubEmail");
        blockPage(
          "Access denied",
          "This account cannot open this page."
        );
        return;
      }
    }

    document.documentElement.classList.add("clubReady");

  } catch {
    blockPage(
      "Connection unavailable",
      "Google Sheets could not be reached. " +
      "Access is blocked until the connection works.",
      true
    );
  }
}

async function clubLogin(event) {
  event.preventDefault();

  const emailInput = document.getElementById("email");

  if (!emailInput.reportValidity()) return;

  const submit = event.target.querySelector(
    '[type="submit"]'
  );

  const message = document.getElementById("loginMessage");

  submit.disabled = true;
  message.textContent = "Checking Staff sheet…";

  try {
    const result = await clubRequest(
      "role",
      emailInput.value.trim().toLowerCase()
    );

    if (!result || !result.ok) {
      throw new Error("Offline");
    }

    if (!["Editor", "Viewer"].includes(result.role)) {
      message.textContent =
        "Access denied. Email not listed in Staff.";
      return;
    }

    sessionStorage.setItem(
      "clubEmail",
      emailInput.value.trim().toLowerCase()
    );

    location.href = result.role === "Editor"
      ? "editor.html"
      : "viewer.html";

  } catch {
    blockPage(
      "Connection unavailable",
      "Cannot reach Google Sheets. Login is blocked.",
      true
    );

  } finally {
    submit.disabled = false;
  }
}

window.logout = function () {
  sessionStorage.removeItem("clubEmail");
  location.href = "index.html";
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("gateRetry")
    ?.addEventListener("click", checkPage);

  checkPage();
});

// CLUB REFRESH BUTTON
async function refreshInventoryNow() {
    const button =
        document.getElementById("clubRefresh");

    if (button) {
        button.disabled = true;
        button.textContent = "Refreshing...";
    }

    try {
        await checkPage();

        const connected =
            document.documentElement.classList
            .contains("clubReady");

        if (connected) {
            const mode =
                document.body.dataset.clubPage
                === "viewer" ? "viewer" : "editor";

            renderInventory(mode);
        }
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "↻ Refresh";
        }
    }
}
