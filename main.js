const API = "/api/articles";

let allArticles = [];

let currentCategory = "All";


// Load articles from MongoDB

async function loadArticles() {

    try {

        const response = await fetch(API);

        if (!response.ok) {
            throw new Error("Could not load articles");
        }

        allArticles = await response.json();

        displayArticles();

    }

    catch (error) {

        document.getElementById("grid").textContent =
            error.message;

    }

}


// Display articles

function displayArticles() {

    const search = document
        .getElementById("search")
        .value.toLowerCase();

    const filtered = allArticles.filter(a =>

        (currentCategory === "All" ||
            a.category === currentCategory) &&

        (
            a.title.toLowerCase().includes(search) ||
            a.description.toLowerCase().includes(search)
        )

    );

    const grid = document.getElementById("grid");

    if (!filtered.length) {

        grid.textContent = "No articles found.";

        return;

    }

    grid.innerHTML = filtered.map(a => `

        <article class="card">

            <small>${safe(a.category)}</small>

            <h3>${safe(a.title)}</h3>

            <p>${safe(a.description)}</p>

            <div class="actions">

                <button onclick="editArticle('${a._id}')">
                    Edit
                </button>

                <button onclick="deleteArticle('${a._id}')">
                    Delete
                </button>

            </div>

        </article>

    `).join("");

}


// Safely display text

function safe(value) {

    return String(value ?? "").replace(/[&<>"']/g, c => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"

    })[c]);

}


// Filter articles

function filter(category) {

    currentCategory = category;

    displayArticles();

}


// Open form

function openForm(article = null) {

    document.getElementById("form").reset();

    document.getElementById("id").value =
        article ? article._id : "";

    document.getElementById("formTitle").textContent =
        article ? "Edit Article" : "Add Article";

    if (article) {

        document.getElementById("title").value =
            article.title;

        document.getElementById("category").value =
            article.category;

        document.getElementById("description").value =
            article.description;

    }

    document.getElementById("modal")
        .classList.add("show");

}


// Close form

function closeForm() {

    document.getElementById("modal")
        .classList.remove("show");

}


// Edit article

function editArticle(id) {

    const article = allArticles.find(a => a._id === id);

    if (article) {

        openForm(article);

    }

}


// Delete article

async function deleteArticle(id) {

    if (!confirm("Delete this article?")) return;

    const response = await fetch(`${API}/${id}`, {

        method: "DELETE"

    });

    if (!response.ok) {

        alert("Delete failed");

        return;

    }

    alert("Article deleted successfully!");

    loadArticles();

}


// Add or update article

document.getElementById("form")
    .addEventListener("submit", async e => {

        e.preventDefault();

        const id = document.getElementById("id").value;

        const article = {

            title: document.getElementById("title").value.trim(),

            category: document.getElementById("category").value,

            description: document.getElementById("description")
                .value.trim()

        };

        const response = await fetch(

            id ? `${API}/${id}` : API,

            {

                method: id ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(article)

            }

        );

        if (!response.ok) {

            alert("Could not save article");

            return;

        }

        alert(
            id
                ? "Article updated successfully!"
                : "Article added successfully!"
        );

        closeForm();

        loadArticles();

    });


// Initial loading

loadArticles();