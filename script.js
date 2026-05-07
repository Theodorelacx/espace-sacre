// --- INITIALISATION ---
let currentUser = "";
let posts = JSON.parse(localStorage.getItem('family_vault_posts')) || [];
let passwords = JSON.parse(localStorage.getItem('family_vault_pwds')) || {};
let userProfiles = JSON.parse(localStorage.getItem('family_vault_avatars')) || {
    "Bethsabée": "", "Lucile": "", "Théodore": ""
};

// --- AUTHENTIFICATION ---
function validerConnexion() {
    const name = document.getElementById('user-select').value;
    const pwd = document.getElementById('password-input').value;
    
    if (!pwd) return alert("Mot de passe requis.");

    if (!passwords[name]) {
        passwords[name] = pwd;
        localStorage.setItem('family_vault_pwds', JSON.stringify(passwords));
    }

    if (passwords[name] === pwd) {
        currentUser = name;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('view-profile-user').value = currentUser;
        document.getElementById('avatar-url').value = userProfiles[currentUser];
        afficherMur();
    } else {
        alert("Mot de passe incorrect.");
    }
}

// --- GESTION DES AVATARS ---
function mettreAJourAvatar() {
    const url = document.getElementById('avatar-url').value;
    userProfiles[currentUser] = url;
    localStorage.setItem('family_vault_avatars', JSON.stringify(userProfiles));
    alert("Photo de profil mise à jour !");
    saveAndRefresh();
}

// --- GESTION DES POSTS (AJOUT & SUPPRESSION) ---
function ajouterPost() {
    const text = document.getElementById('post-content').value;
    const link = document.getElementById('post-link').value;
    const type = document.getElementById('post-type').value;

    if (!text && !link) return alert("Remplissez au moins un champ.");

    const newPost = {
        id: Date.now(),
        author: currentUser,
        text: text,
        media: link,
        type: type,
        date: new Date().toLocaleDateString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
        likes: [],
        comments: []
    };

    posts.unshift(newPost);
    saveAndRefresh();
    document.getElementById('post-content').value = "";
    document.getElementById('post-link').value = "";
}

function supprimerPost(postId) {
    if (confirm("Supprimer définitivement ce partage ?")) {
        posts = posts.filter(p => p.id !== postId);
        saveAndRefresh();
    }
}

// --- INTERACTIONS ---
function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    const idx = post.likes.indexOf(currentUser);
    idx > -1 ? post.likes.splice(idx, 1) : post.likes.push(currentUser);
    saveAndRefresh();
}

function ajouterCommentaire(postId) {
    const msg = prompt("Votre commentaire :");
    if (!msg) return;
    const post = posts.find(p => p.id === postId);
    post.comments.push({ user: currentUser, text: msg });
    saveAndRefresh();
}

// --- AFFICHAGE ---
function renderPost(p) {
    const hasLiked = p.likes.includes(currentUser);
    const avatar = userProfiles[p.author] || `https://ui-avatars.com/api/?name=${p.author}&background=random`;
    const deleteBtn = (p.author === currentUser) ? `<button class="btn-delete" onclick="supprimerPost(${p.id})" title="Supprimer">🗑️</button>` : "";

    let mediaHtml = "";
    if (p.media) {
        if (p.type === 'image') mediaHtml = `<img src="${p.media}" class="post-img">`;
        else if (p.type === 'video') mediaHtml = `<div class="btn-action" style="text-align:center"><a href="${p.media}" target="_blank">🎥 Voir Vidéo</a></div>`;
        else if (p.type === 'audio') mediaHtml = `<div class="btn-action" style="text-align:center"><a href="${p.media}" target="_blank">🎵 Écouter Musique</a></div>`;
    }

    return `
        <div class="post">
            <div class="post-header">
                <img src="${avatar}" class="user-avatar">
                <div class="post-info">
                    <b>${p.author}</b>
                    <span>${p.date}</span>
                </div>
                ${deleteBtn}
            </div>
            <div class="post-body">
                <p>${p.text}</p>
                ${mediaHtml}
            </div>
            <div class="post-footer">
                <button class="btn-action ${hasLiked ? 'liked' : ''}" onclick="toggleLike(${p.id})">
                    ${hasLiked ? '❤️' : '🤍'} ${p.likes.length}
                </button>
                <button class="btn-action" onclick="ajouterCommentaire(${p.id})">💬 ${p.comments.length}</button>
            </div>
            <div class="comments-list">
                ${p.comments.map(c => `<div class="comment-item"><b>${c.user}:</b> ${c.text}</div>`).join('')}
            </div>
        </div>
    `;
}

function afficherMur() {
    document.getElementById('wall-section').innerHTML = posts.map(p => renderPost(p)).join('');
}

function afficherProfil() {
    const target = document.getElementById('view-profile-user').value;
    const userPosts = posts.filter(p => p.author === target);
    const categories = ['text', 'image', 'video', 'audio'];

    categories.forEach(cat => {
        const container = document.getElementById('cat-' + cat);
        const filtered = userPosts.filter(p => p.type === cat);
        container.innerHTML = filtered.length > 0 ? filtered.map(p => renderPost(p)).join('') : "<p style='color:#cbd5e1; font-size:0.75rem; text-align:center;'>Vide</p>";
    });
}

// --- UTILS ---
function saveAndRefresh() {
    localStorage.setItem('family_vault_posts', JSON.stringify(posts));
    afficherMur();
    if (document.getElementById('profile-section').style.display === 'block') afficherProfil();
}

function changerOnglet(tab) {
    document.getElementById('wall-section').style.display = tab === 'wall' ? 'block' : 'none';
    document.getElementById('publish-area').style.display = tab === 'wall' ? 'block' : 'none';
    document.getElementById('profile-section').style.display = tab === 'profile' ? 'block' : 'none';
    
    document.getElementById('btn-wall').className = tab === 'wall' ? 'tab active' : 'tab';
    document.getElementById('btn-profile').className = tab === 'profile' ? 'tab active' : 'tab';

    if (tab === 'profile') afficherProfil();
}

function deconnexion() { location.reload(); }