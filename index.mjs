import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Keep your database connection details here, or move them to environment variables
// before sharing/deploying this project publicly.
const pool = mysql.createPool({
    host: "iwqrvsv8e5fz4uni.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "rn4ku76n4s0jtla7",
    password: "l5ztpf5llgqsl8tq",
    database: "c27yjafh1i5965gu",
    connectionLimit: 10,
    waitForConnections: true
});

// HELPER FUNCTIONS

// Gets one quote using its ID.
async function getQuoteById(quoteId) {
    const query = 'SELECT * FROM quotes WHERE quoteId = ?';
    const [rows] = await pool.query(query, [quoteId]);

    return rows.length > 0 ? rows[0] : null;
}

// Gets one author using its ID.
async function getAuthorById(authorId) {
    const query = 'SELECT * FROM authors WHERE authorId = ?';
    const [rows] = await pool.query(query, [authorId]);

    return rows.length > 0 ? rows[0] : null;
}

// Gets authors and categories for the quote forms.
async function getFormData() {
    const [authors] = await pool.query(
        'SELECT * FROM authors ORDER BY firstName, lastName'
    );

    const [categories] = await pool.query(
        'SELECT categoryName AS category FROM categories ORDER BY categoryName'
    );

    return { authors, categories };
}

// HOME

app.get('/', (req, res) => {
    res.render('home.ejs');
});

// QUOTES

// Shows an empty quote form.
app.get('/newQuote', async (req, res) => {
    try {
        const formData = await getFormData();

        res.render('newQuote.ejs', {
            ...formData,
            formObject: {
                quote: '',
                authorId: '',
                category: '',
                likes: 0
            },
            formErrors: {}
        });

    } catch (error) {
        console.error('Could not load new quote form:', error);
        res.status(500).send('Could not load the quote form.');
    }
});

// Saves a new quote.
// app.post('/insertQuote', async (req, res) => {
//     const formObject = {
//         quote: (req.body.quote || '').trim(),
//         authorId: req.body.authorId,
//         category: req.body.category || '',
//         likes: req.body.likes
//     };
//
//     const formErrors = {};
//
//     if (!formObject.quote) {
//         formErrors.quote = 'Quote cannot be empty.';
//     }
//
//     if (!formObject.authorId) {
//         formErrors.authorId = 'Please select an author.';
//     }
//
//     if (!formObject.category) {
//         formErrors.category = 'Please select a category.';
//     }
//
//     if (
//         formObject.likes === '' ||
//         !Number.isInteger(Number(formObject.likes)) ||
//         Number(formObject.likes) < 0
//     ) {
//         formErrors.likes = 'Likes must be a whole number of 0 or more.';
//     }
//
//     if (Object.keys(formErrors).length > 0) {
//         try {
//             const formData = await getFormData();
//
//             return res.status(400).render('newQuote.ejs', {
//                 ...formData,
//                 formObject,
//                 formErrors
//             });
//         } catch (error) {
//             console.error('Could not reload quote form:', error);
//             return res.status(500).send('Could not reload the quote form.');
//         }
//     }
//
//     try {
//         const query = `
//             INSERT INTO quotes (quote, authorId, category, likes)
//             VALUES (?, ?, ?, ?)
//         `;
//
//         await pool.query(query, [
//             formObject.quote,
//             formObject.authorId,
//             formObject.category,
//             Number(formObject.likes)
//         ]);
//
//         res.redirect('/quoteList');
//
//     } catch (error) {
//         console.error('Could not insert quote:', error);
//         res.status(500).send('Could not save the quote.');
//     }
// });

app.get('/newQuote', async (req, res) => {
    try {
        const formData = await getFormData();

        console.log('FORM DATA:', formData);

        res.render('newQuote.ejs', {
            ...formData,
            formObject: {
                quote: '',
                authorId: '',
                category: '',
                likes: 0
            },
            formErrors: {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Could not load quote form.');
    }
});

// Shows the list of quotes.
app.get('/quoteList', async (req, res) => {
    try {
        const query = `
            SELECT quotes.*, authors.firstName, authors.lastName
            FROM quotes
            LEFT JOIN authors ON quotes.authorId = authors.authorId
            ORDER BY quotes.quoteId
        `;

        const [rows] = await pool.query(query);

        res.render('quoteList.ejs', { quotes: rows });

    } catch (error) {
        console.error('Could not load quotes:', error);
        res.status(500).send('Could not load quotes.');
    }
});

// Loads a quote into the edit form.
app.get('/editQuote', async (req, res) => {
    try {
        const quoteId = req.query.id;
        const formObject = await getQuoteById(quoteId);

        if (!formObject) {
            return res.redirect('/quoteList');
        }

        const formData = await getFormData();

        res.render('editQuote.ejs', {
            ...formData,
            formObject,
            formErrors: {}
        });

    } catch (error) {
        console.error('Could not load quote for editing:', error);
        res.status(500).send('Could not load the quote for editing.');
    }
});

// Validates and updates an existing quote.
app.post('/updateQuote', async (req, res) => {
    const formObject = {
        quoteId: req.body.quoteId,
        quote: (req.body.quote || '').trim(),
        authorId: req.body.authorId,
        category: req.body.category || '',
        likes: req.body.likes
    };

    const formErrors = {};

    if (!formObject.quote) {
        formErrors.quote = 'Quote cannot be empty.';
    }

    if (!formObject.authorId) {
        formErrors.authorId = 'Please select an author.';
    }

    if (!formObject.category) {
        formErrors.category = 'Please select a category.';
    }

    if (
        formObject.likes === '' ||
        !Number.isInteger(Number(formObject.likes)) ||
        Number(formObject.likes) < 0
    ) {
        formErrors.likes = 'Likes must be a whole number of 0 or more.';
    }

    if (Object.keys(formErrors).length > 0) {
        try {
            const formData = await getFormData();

            return res.status(400).render('editQuote.ejs', {
                ...formData,
                formObject,
                formErrors
            });
        } catch (error) {
            console.error('Could not reload edit form:', error);
            return res.status(500).send('Could not reload the edit form.');
        }
    }

    try {
        const query = `
            UPDATE quotes
            SET quote = ?, authorId = ?, category = ?, likes = ?
            WHERE quoteId = ?
        `;

        await pool.query(query, [
            formObject.quote,
            formObject.authorId,
            formObject.category,
            Number(formObject.likes),
            formObject.quoteId
        ]);

        res.redirect('/quoteList');

    } catch (error) {
        console.error('Could not update quote:', error);
        res.status(500).send('Could not update the quote.');
    }
});

// AUTHORS

// Shows the list of authors.
app.get('/authorList', async (req, res) => {
    try {
        const query = `
            SELECT * FROM authors
            ORDER BY lastName, firstName
        `;

        const [rows] = await pool.query(query);

        res.render('authorList.ejs', { authors: rows });

    } catch (error) {
        console.error('Could not load authors:', error);
        res.status(500).send('Could not load authors.');
    }
});

// Shows the new author form.
app.get('/newAuthor', (req, res) => {
    res.render('newAuthor.ejs', {
        formObject: {
            firstName: '',
            lastName: '',
            dob: '',
            dod: ''
        },
        formErrors: {}
    });
});

// Validates and inserts a new author.
app.post('/insertAuthor', async (req, res) => {
    const formObject = {
        firstName: (req.body.firstName || '').trim(),
        lastName: (req.body.lastName || '').trim(),
        dob: req.body.dob || '',
        dod: req.body.dod || ''
    };

    const formErrors = {};

    if (!formObject.firstName) {
        formErrors.firstName = 'First name cannot be empty.';
    }

    if (!formObject.lastName) {
        formErrors.lastName = 'Last name cannot be empty.';
    }

    if (
        formObject.dob &&
        formObject.dod &&
        formObject.dod <= formObject.dob
    ) {
        formErrors.dod = 'Date of death must be later than date of birth.';
    }

    if (Object.keys(formErrors).length > 0) {
        return res.status(400).render('newAuthor.ejs', {
            formObject,
            formErrors
        });
    }

    try {
        const query = `
            INSERT INTO authors (firstName, lastName, dob, dod)
            VALUES (?, ?, ?, ?)
        `;

        await pool.query(query, [
            formObject.firstName,
            formObject.lastName,
            formObject.dob || null,
            formObject.dod || null
        ]);

        res.redirect('/authorList');

    } catch (error) {
        console.error('Could not insert author:', error);
        res.status(500).send('Could not save the author.');
    }
});

// Loads an author into the edit form.
app.get('/editAuthor', async (req, res) => {
    try {
        const authorId = req.query.id;
        const formObject = await getAuthorById(authorId);

        if (!formObject) {
            return res.redirect('/authorList');
        }

        res.render('editAuthor.ejs', {
            formObject,
            formErrors: {}
        });

    } catch (error) {
        console.error('Could not load author for editing:', error);
        res.status(500).send('Could not load the author for editing.');
    }
});

// Validates and updates an existing author.
app.post('/updateAuthor', async (req, res) => {
    const formObject = {
        authorId: req.body.authorId,
        firstName: (req.body.firstName || '').trim(),
        lastName: (req.body.lastName || '').trim(),
        dob: req.body.dob || '',
        dod: req.body.dod || ''
    };

    const formErrors = {};

    if (!formObject.firstName) {
        formErrors.firstName = 'First name cannot be empty.';
    }

    if (!formObject.lastName) {
        formErrors.lastName = 'Last name cannot be empty.';
    }

    if (
        formObject.dob &&
        formObject.dod &&
        formObject.dod <= formObject.dob
    ) {
        formErrors.dod = 'Date of death must be later than date of birth.';
    }

    if (Object.keys(formErrors).length > 0) {
        return res.status(400).render('editAuthor.ejs', {
            formObject,
            formErrors
        });
    }

    try {
        const query = `
            UPDATE authors
            SET firstName = ?, lastName = ?, dob = ?, dod = ?
            WHERE authorId = ?
        `;

        await pool.query(query, [
            formObject.firstName,
            formObject.lastName,
            formObject.dob || null,
            formObject.dod || null,
            formObject.authorId
        ]);

        res.redirect('/authorList');

    } catch (error) {
        console.error('Could not update author:', error);
        res.status(500).send('Could not update the author.');
    }
});

// DATABASE TEST

app.get('/dbTest', async (req, res) => {
    try {
        const [rows] = await pool.query('SHOW TABLES');
        res.send(rows);

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Database error!');
    }
});

// START SERVER

app.listen(3000, () => {
    console.log('Express server running on http://localhost:3000');
});