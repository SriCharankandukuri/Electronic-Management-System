const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection URI
const uri = 'mongodb://localhost:27017'; // Replace this with your MongoDB URI

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'splashscreen.html'));
});

// Register user
app.post('/register', async (req, res) => {
    const { name, gender, mobile, email, adhar, address, dob, workshift, doj, jobRole, qualification, username, password } = req.body;

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db();
        const collection = database.collection('users');
        await collection.insertOne({ name, gender, mobile, email, adhar, address, dob, workshift, doj, jobRole, qualification, username, password });
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'An error occurred while registering user' });
    } finally {
        await client.close();
    }
});

// Login user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db();
        const collection = database.collection('users');
        const loginCollection = database.collection('logins');

        // Find user by username and password
        const user = await collection.findOne({ username, password });

        if (user) {
            // Log successful login attempt
            const loginTime = new Date();
            const loginRecord = {
                username,
                loginTime,
                ipAddress: req.ip // IP address of the user
            };
            await loginCollection.insertOne(loginRecord);

            // Send response with jobRole
            res.status(200).json({ success: true, message: 'Login successful', jobRole: user.jobRole });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, message: 'An error occurred while logging in' });
    } finally {
        await client.close();
    }
});
app.get('/choose.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'choose.html'));
});

app.get('/manageproduct.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manageproduct.html'));
});

app.get('/employeereport.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'employeereport.html'));
});


// Add product
app.post('/addProduct', async (req, res) => {
    const { productType, productBrand, productName, modelNo, serialNo, warranty, guarantee, supplierName, contactNo, importDate, productId, price, mrp } = req.body;

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db();
        const collection = database.collection('products');
        await collection.insertOne({ productType, productBrand, productName, modelNo, serialNo, warranty, guarantee, supplierName, contactNo, importDate, productId, price, mrp });
        res.status(201).json({ success: true, message: 'Product added successfully' });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ success: false, message: 'An error occurred while adding product' });
    } finally {
        await client.close();
    }
});

// Get products
app.get('/products', async (req, res) => {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db();
        const collection = database.collection('products');
        const products = await collection.find().toArray();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching products' });
    } finally {
        await client.close();
    }
});

// Get users
app.get('/users', async (req, res) => {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db();
        const collection = database.collection('users');
        const users = await collection.find().toArray();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching users' });
    } finally {
        await client.close();
    }
});

// Add a route to delete a user
app.delete('/user/:_id', async (req, res) => {
    const userId = req.params._id;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db();
        const collection = database.collection('users');
        const result = await collection.deleteOne({ _id: new ObjectId(userId) });

        if (result.deletedCount === 1) {
            res.status(200).json({ success: true, message: 'User deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting user' });
    } finally {
        await client.close();
    }
});
app.delete('/deleteProduct', async (req, res) => {
    const productId = req.body.productId; // Get the product id from the request body

    // Create a MongoDB client
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to the MongoDB database
        await client.connect();

        // Get the database and collection
        const database = client.db();
        const collection = database.collection('products'); // Replace 'products' with your actual collection name

        // Delete the product by Id
        const result = await collection.deleteOne({ productId: productId });

        if (result.deletedCount === 1) {
            res.status(200).json({ success: true, message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting product' });
    } finally {
        // Close the MongoDB client
        await client.close();
    }
});
// Add endpoint to generate bill and update sold status
app.post('/sellProduct', async (req, res) => {
    const { customerName, mobileNo, email, city, deliveryAddress, products } = req.body;

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db();
        const billCollection = database.collection('bills');
        const productCollection = database.collection('products');

        // Create a new bill document
        const newBill = {
            customerName,
            mobileNo,
            email,
            city,
            deliveryAddress,
            products,
            date: new Date()
        };

        // Insert the bill document into the collection
        await billCollection.insertOne(newBill);

        // Update the sold status of the products
        const productIds = products.map(productId => new ObjectId(productId));
        await productCollection.updateMany(
            { _id: { $in: productIds } },
            { $set: { sold: true } }
        );

        res.status(201).json({ success: true, message: 'Bill generated and products updated successfully' });
    } catch (error) {
        console.error('Error generating bill:', error);
        res.status(500).json({ success: false, message: 'An error occurred while generating the bill' });
    } finally {
        await client.close();
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
