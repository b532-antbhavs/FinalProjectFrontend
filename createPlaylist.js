const userId = -1;

document.addEventListener('DOMContentLoaded', () => {
    fetch(`http://localhost:8080/playlists?userId=${userId}`)
        .then(response => response.json())
        .then(playlists => {
            const dropdown = document.getElementById("playlistDropdown");

            playlists.forEach(playlist => {
                const option = document.createElement("option");
                option.value = playlist.id;
                option.textContent = playlist.name;
                dropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error fetching playlists:", error);
            alert("Failed to load playlists");
        });
});

document.getElementById("createPlaylistForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("playlistName").value;
    const isPublic = document.getElementById("isPublic").checked;

    fetch("http://localhost:8080/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: name,
            isPublic: isPublic,
            createdBy: userId
        })
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to create playlist");
        return response.json();
    })
    .then(data => {
        alert("Playlist created successfully!");
        window.location.reload();
    })
    .catch(error => {
        console.error("Create playlist failed:", error);
        alert("Error creating playlist");
    });
});

document.getElementById("uploadSongForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const fileInput = document.getElementById("songFile");
    const playlistId = document.getElementById("playlistDropdown").value;

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetch(`http://localhost:8080/playlists/${playlistId}/songs/upload`, {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error("Upload failed");
        return response.json();
    })
    .then(data => {
        alert("Song uploaded successfully!");
        fileInput.value = ""; 
    })
    .catch(error => {
        console.error("Upload song error:", error);
        alert("Error uploading song");
    });
});
document.addEventListener('DOMContentLoaded', () => {
    fetch(`http://localhost:8080/playlists?userId=${userId}`)
        .then(response => response.json())
        .then(playlists => {
            const songDropdown = document.getElementById("playlistDropdown");
            const parentDropdown = document.getElementById("parentPlaylist");

            playlists.forEach(playlist => {
                const option1 = document.createElement("option");
                option1.value = playlist.id;
                option1.textContent = playlist.name;
                songDropdown.appendChild(option1);

                const option2 = option1.cloneNode(true);
                parentDropdown.appendChild(option2);
            });
        })
        .catch(error => {
            console.error("Error loading playlists:", error);
        });
});
document.getElementById("addSubplaylistForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const parentId = document.getElementById("parentPlaylist").value;
    const subName = document.getElementById("subplaylistName").value;
    const userId = getUserId()

    fetch("http://localhost:8080/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: subName,
            isPublic: false,
            createdBy: userId
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error("Create subplaylist failed:", response.status);
            throw new Error("Failed to create subplaylist");
        }
        return response.json();
    })
    .then(subplaylist => {
        console.log("Subplaylist created:", subplaylist);
        const childId = subplaylist.id;

        const url = `http://localhost:8080/playlists/${parentId}/add-subplaylist/${childId}?userId=${userId}`;
        console.log("Calling subplaylist-linking API:", url);

        return fetch(url, {
            method: "POST"
        });
    })
    .then(response => {
        if (!response.ok) {
            console.error("Linking failed:", response.status);
            return response.text().then(text => {
                console.error("Response body:", text);
                throw new Error("Failed to link subplaylist");
            });
        }
        return response.json();
    })
    .then(() => {
        alert("Subplaylist added successfully!");
        window.location.reload();
    })
    .catch(error => {
        console.error("Subplaylist error:", error);
        alert("Error adding subplaylist");
    });
});
function getUserId() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.id || null;
}