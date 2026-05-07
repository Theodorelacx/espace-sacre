// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = 'https://gpbcxnrayfypglhltqyk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cbvOOJLBAwleThiX8gLySA_JpflHHjw';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- VARIABLES ---
let currentUser = "";
let posts = [];
let userProfiles = { "Bethsabée": "", "Lucile": "", "Théodore": "" };

// --- INITIALISATION ---
async function initialiserApp() {
    await chargerProfils();
    await chargerPosts();
}

async function chargerProfils() {
    const { data } = await _supabase.from('profiles').select('*');
    if (data) {
        data.forEach(p => userProfiles[p.username] = p.avatar_url);
    }
}

async function chargerPosts() {
    const { data } = await _supabase.from('posts').select('*').order('id', { ascending: false });
    if (data) {
        posts = data;
        afficherMur();
        if (document.getElementById('profile-section').style.display === 'block') afficherProfil();
    }
}

// --- AUTHENTIFICATION ---
function validerConnexion() {
    const name = document.getElementById('user-select').value;
    const pwd = document.getElementById('password-input').value;
    if (!pwd) return alert("Mot de passe requis.");

    currentUser = name;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    document.getElementById('view-profile-user').value = currentUser;
    document.getElementById('avatar-url').value = userProfiles[currentUser] || "";
    initialiserApp();
}

// --- ACTIONS BASE DE DONNÉES ---
async function ajouterPost() {
    const text = document.getElementById('post-content').value;
    const link = document.getElementById('post-link').value;
    const type = document.getElementById('post-type').value;

    if (!text && !link) return;

    const { error } = await _supabase.from('posts').insert([{
        author: currentUser,
        text: text,
        media: link,
        type: type,
        likes: [],
        comments: []
    }]);

    if (!error) {
        document.getElementById('post-content').value = "";
        document.getElementById('post-link').value = "";
        chargerPosts();
    }
}

async function supprimerPost(postId) {
    if (confirm("Supprimer ce message ?")) {
        const { error } = await _supabase.from('posts').delete().eq('id', postId);
        if (!error) chargerPosts();
    }
}

async function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    let newLikes = [...post.likes];
    const index = newLikes.indexOf(currentUser);
    index > -1 ? newLikes.splice(index, 1) : newLikes.push(currentUser);

    await _supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
    chargerPosts();
}

async function ajouterCommentaire(postId) {
    const msg = prompt("Votre commentaire :");
    if (!msg) return;
    const post = posts.find(p => p.id === postId);
    const newComments = [...post.comments, { user: currentUser, text: msg }];

    await _supabase.from('posts').update({ comments: newComments }).eq('id', postId);
    chargerPosts();
}

async function mettreAJourAvatar() {
    const url = document.getElementById('avatar-url').value;
    await _supabase.from('profiles').upsert({ username: currentUser, avatar_url: url }, { onConflict: 'username' });
    alert("Avatar mis à jour !");
    chargerProfils().then(chargerPosts);
}

// --- AFFICHAGE ---
function renderPost(p) {
    const hasLiked = p.likes.includes(currentUser);
    const avatar = userProfiles[p.author] || `https://ui-avatars.com/api/?name=${p.author}`;
    const deleteBtn = (p.author === currentUser) ? `<button class="btn-delete" onclick="supprimerPost(${p.id})">🗑️</button>` : "";

    let mediaHtml = "";
    if (p.media) {
        if (p.type === 'image') mediaHtml = `<img src="${p.media}" class="post-img">`;
        else mediaHtml = `<div class="btn-action"><a href="${p.media}" target="_blank">🔗 Voir Média</a></div>`;
    }

    return `
        <div class="post">
            <div class="post-header">
                <img src="${avatar}" class="user-avatar">
                <div class="post-info"><b>${p.author}</b><span>${p.author}</span></div>
                ${deleteBtn}
            </div>
            <div class="post-body"><p>${p.text}</p>${mediaHtml}</div>
            <div class="post-footer">
                <button class="btn-action ${hasLiked ? 'liked' : ''}" onclick="toggleLike(${p.id})">❤️ ${p.likes.length}</button>
                <button class="btn-action" onclick="ajouterCommentaire(${p.id})">💬 ${p.comments.length}</button>
            </div>
            <div class="comments-list">${p.comments.map(c => `<div class="comment-item"><b>${c.user}:</b> ${c.text}</div>`).join('')}</div>
        </div>`;
}

function afficherMur() {
    document.getElementById('wall-section').innerHTML = posts.map(p => renderPost(p)).join('');
}

function afficherProfil() {
    const target = document.getElementById('view-profile-user').value;
    const userPosts = posts.filter(p => p.author === target);
    ['text', 'image', 'video', 'audio'].forEach(type => {
        const container = document.getElementById('cat-' + type);
        const filtered = userPosts.filter(p => p.type === type);
        container.innerHTML = filtered.map(p => renderPost(p)).join('') || "<p style='text-align:center; font-size:0.8rem; color:#cbd5e1;'>Vide</p>";
    });
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
