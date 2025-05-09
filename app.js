const baseUrl = "https://playlistmanager.onrender.com";
    let currentUserId = null;
    let currentPlaylistId = null;
    let currentSongIndex = 0;
    let songsList = [];

    function loginUser() {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        const loginData = {
            username: username,
            password: password
        };

        fetch(`${baseUrl}/users/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(loginData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.id) {
                localStorage.setItem('user', JSON.stringify(data));
                currentUserId = data.id;
                
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('main-content').style.display = 'block';
                document.getElementById('user-info').textContent = `Welcome, ${username}`;
                document.getElementById('user-info').style.display = 'inline';
                document.getElementById('logout-btn').style.display = 'inline-block';
                
                loadParentPlaylistList();
                if (isAdmin()) {
                    showAdminUserList();
                }
            } else {
                throw new Error('Invalid user data received');
            }
        })
        .catch(error => {
            console.error('Error during login:', error);
            alert('Login failed. Please check your credentials and try again.');
        });
    }

    function logoutUser() {
        localStorage.removeItem('user');
        currentUserId = null;
        
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        document.getElementById('songList').innerHTML = 'Select a playlist to view songs.';
        document.getElementById("admin-section").style.display = "none"; 

    }
    function toggleLoginRegister(showLogin) {
        document.getElementById('login-section').style.display = showLogin ? 'block' : 'none';
        document.getElementById('register-section').style.display = showLogin ? 'none' : 'block';
    }
    
    function registerUser() {
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
    
        if (!username || !password) {
            alert("Please fill out both fields");
            return;
        }
    
        fetch(`${baseUrl}/users/register`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => {
            if (!response.ok) throw new Error("Registration failed");
            return response.json();
        })
        .then(data => {
            alert("Registration successful! You can now log in.");
            toggleLoginRegister(true);
        })
        .catch(err => {
            alert("Error: " + err.message);
        });
    }

    function loadParentPlaylistList() {
        const userId = getUserId();
        if (!userId) {
            alert("User ID is missing. Please log in.");
            return;
        }
        if(isAdmin()) {
            document.getElementById("create-playlist-link").style.display = "block";
        } else {
            document.getElementById("create-playlist-link").style.display = "none";
        }

        fetch(`${baseUrl}/playlists?userId=${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load playlists');
                }
                return response.json();
            })
            .then(playlists => {
                const parentPlaylistList = document.getElementById("parent-playlists-list");
                parentPlaylistList.innerHTML = "";

                playlists.forEach(p => {
                    const playlistItem = document.createElement("li");
                    playlistItem.textContent = p.name;
                    playlistItem.addEventListener("click", () => {
                        loadSongsForSelectedPlaylist(p.id);
                    });
                    parentPlaylistList.appendChild(playlistItem);
                });
            })
            .catch(error => {
                console.error("Error fetching playlists:", error);
                alert("Failed to load playlists. Please try again.");
            });
    }

    function showAdminUserList() {
        document.getElementById("admin-section").style.display = "block";
    
        fetch(`${baseUrl}//users`)
            .then(res => res.json())
            .then(users => {
                const tbody = document.getElementById("userTableBody");
                tbody.innerHTML = "";
    
                users.forEach(user => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td style="padding: 0.8rem; border-bottom: 1px solid var(--light-gray);">${user.id}</td>
                        <td style="padding: 0.8rem; border-bottom: 1px solid var(--light-gray);">${user.username}</td>
                    `;
                    tbody.appendChild(row);
                });
            })
            .catch(err => console.error("Error fetching users:", err));
    }

    function loadSongsForSelectedPlaylist(playlistId) {
        currentPlaylistId = playlistId;
        fetch(`${baseUrl}/playlists/${playlistId}/songs`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load songs');
                }
                return response.json();
            })
            .then(songs => {
                songsList = songs;
                currentSongIndex = 0;

                const songListDiv = document.getElementById('songList');
                songListDiv.innerHTML = "";

                if (songs.length === 0) {
                    songListDiv.innerHTML = '<div class="no-songs">No songs in this playlist</div>';
                    return;
                }

                songs.forEach((song, index) => {
                    const songItem = document.createElement('div');
                    songItem.classList.add('song-item');
                    songItem.innerText = song.title || "Unnamed Song";
                    songItem.addEventListener('click', () => {
                        currentSongIndex = index;
                        playSong(song, playlistId);
                    });
                    songListDiv.appendChild(songItem);
                });
            })
            .catch(error => {
                console.error("Error loading songs:", error);
                alert("Failed to load songs. Please try again.");
            });
    }

    function playSong(song, playlistId) {
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) return;

        const songUrl = `${baseUrl}/playlists/${playlistId}/songs/${song.id}/audio`;
        audioPlayer.src = songUrl;
        audioPlayer.play().catch(e => console.error("Audio play failed:", e));
    }

    function getUserId() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.id || null;
        } catch (e) {
            return null;
        }
    }

    function isAdmin() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return false;
        try {
            const user = JSON.parse(userStr);
            return user.isAdmin
        } catch (e) {
            return false;
        }
    }

    function sendCommand(command) {
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) return;

        switch (command) {
            case 'play':
                audioPlayer.play().catch(e => console.error("Play failed:", e));
                break;
            case 'pause':
                audioPlayer.pause();
                break;
            case 'stop':
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                break;
            case 'next':
                if (songsList.length > 0) {
                    currentSongIndex = (currentSongIndex + 1) % songsList.length;
                    playSong(songsList[currentSongIndex], currentPlaylistId);
                }
                break;
            case 'prev':
                if (songsList.length > 0) {
                    currentSongIndex = (currentSongIndex - 1 + songsList.length) % songsList.length;
                    playSong(songsList[currentSongIndex], currentPlaylistId);
                }
                break;
            default:
                console.warn("Unknown command:", command);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                if (userData.id) {
                    document.getElementById('login-section').style.display = 'none';
                    document.getElementById('main-content').style.display = 'block';
                    document.getElementById('user-info').textContent = `Welcome, ${userData.username || 'User'}`;
                    document.getElementById('user-info').style.display = 'inline';
                    document.getElementById('logout-btn').style.display = 'inline-block';
                    document.getElementById('public-label').style.display = userData.role === 'ADMIN' ? 'block' : 'none';
                    loadParentPlaylistList();
                }
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
    });