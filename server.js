const http = require("http");
const fs = require("fs");
const path = require("path");

const { MongoClient, ObjectId } = require("mongodb");

const PORT = 3000;

const client = new MongoClient(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017"
);

let articles;


// JSON response function

function json(res, status, data) {

    res.writeHead(status, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(data));

}


// Read request body

function readBody(req) {

    return new Promise((resolve, reject) => {

        let data = "";

        req.on("data", chunk => {
            data += chunk;
        });

        req.on("end", () => {

            try {
                resolve(JSON.parse(data || "{}"));
            }
            catch {
                reject(new Error("Invalid JSON"));
            }

        });

        req.on("error", reject);

    });

}


// API handling

async function api(req, res, url) {

    try {

        // GET - Retrieve articles

        if (
            req.method === "GET" &&
            url.pathname === "/api/articles"
        ) {

            const result = await articles.find({}).toArray();

            return json(res, 200, result);

        }


        // POST - Add new article

        if (
            req.method === "POST" &&
            url.pathname === "/api/articles"
        ) {

            const a = await readBody(req);

            if (
                !a.title ||
                !a.category ||
                !a.description
            ) {

                return json(res, 400, {
                    error: "Please enter all required details"
                });

            }

            const result = await articles.insertOne({

                title: a.title.trim(),

                category: a.category,

                description: a.description.trim(),

                createdAt: new Date()

            });

            return json(res, 201, {
                message: "Article added successfully",
                id: result.insertedId
            });

        }


        // Find article ID

        const match = url.pathname.match(
            /^\/api\/articles\/([a-f\d]{24})$/i
        );


        // PUT - Update article

        if (match && req.method === "PUT") {

            const a = await readBody(req);

            if (
                !a.title ||
                !a.category ||
                !a.description
            ) {

                return json(res, 400, {
                    error: "Invalid article details"
                });

            }

            const result = await articles.updateOne(

                {
                    _id: new ObjectId(match[1])
                },

                {
                    $set: {

                        title: a.title.trim(),

                        category: a.category,

                        description: a.description.trim(),

                        updatedAt: new Date()

                    }
                }

            );

            return json(
                res,
                result.matchedCount ? 200 : 404,
                {
                    message: "Article updated successfully"
                }
            );

        }


        // DELETE - Remove article

        if (match && req.method === "DELETE") {

            const result = await articles.deleteOne({

                _id: new ObjectId(match[1])

            });

            return json(
                res,
                result.deletedCount ? 200 : 404,
                {
                    message: "Article deleted successfully"
                }
            );

        }


        // Invalid route

        return json(res, 404, {
            error: "Route not found"
        });

    }

    catch (error) {

        console.error(error);

        return json(res, 500, {
            error: "Server error"
        });

    }

}


// Serve HTML, CSS and JS files

function serve(req, res, url) {

    const requested =
        url.pathname === "/"
            ? "/index.html"
            : decodeURIComponent(url.pathname);

    const root = path.resolve(__dirname, "public");

    const file = path.resolve(root, "." + requested);

    if (!file.startsWith(root + path.sep)) {

        res.writeHead(403);

        return res.end("Forbidden");

    }

    fs.readFile(file, (err, data) => {

        if (err) {

            res.writeHead(404);

            return res.end("File not found");

        }

        const types = {

            ".html": "text/html",

            ".css": "text/css",

            ".js": "application/javascript"

        };

        res.writeHead(200, {

            "Content-Type":
                types[path.extname(file)] ||
                "application/octet-stream"

        });

        res.end(data);

    });

}


// Start application

async function start() {

    try {

        await client.connect();

        console.log("Connected to MongoDB successfully");

        const db = client.db("EcoLifeDB");

        articles = db.collection("Articles");


        // Insert sample articles if database is empty

        if (await articles.countDocuments() === 0) {

            await articles.insertMany([

                {
                    title: "The Importance of Organic Gardening",
                    category: "Gardening",
                    description: "Learn how growing organic plants can improve soil health and support a greener environment."
                },

                {
                    title: "Say No to Single-Use Plastic",
                    category: "Waste Management",
                    description: "Discover simple alternatives to plastic bags, bottles and disposable products."
                },

                {
                    title: "Renewable Energy for a Better Future",
                    category: "Energy",
                    description: "Explore how solar and wind energy help reduce dependence on fossil fuels."
                },

                {
                    title: "Simple Sustainable Lifestyle Habits",
                    category: "Lifestyle",
                    description: "Adopt eco-friendly habits such as saving water, recycling and using reusable products."
                }

            ]);

        }


        const server = http.createServer(async (req, res) => {

            const url = new URL(
                req.url,
                `http://${req.headers.host || "localhost"}`
            );

            if (url.pathname.startsWith("/api/")) {

                await api(req, res, url);

            }

            else {

                serve(req, res, url);

            }

        });


        server.listen(PORT, () => {

            console.log(
                `EcoLife running at http://localhost:${PORT}`
            );

        });

    }

    catch (error) {

        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);

    }

}


start();