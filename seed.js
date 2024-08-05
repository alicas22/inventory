const admin = require('firebase-admin');
const path = require('path');
const { faker } = require('@faker-js/faker');

// Load the service account key JSON file
const serviceAccount = require(path.resolve(__dirname, './serviceAccountKey.json'));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<YOUR-PROJECT-ID>.firebaseio.com"
});

const db = admin.firestore();

const categories = [
  'Electronics', 'Groceries', 'Furniture', 'Clothing', 'Books',
  'Toys', 'Sporting Goods', 'Beauty Products', 'Automotive', 'Garden Supplies',
  'Health Products', 'Pet Supplies', 'Office Supplies', 'Cleaning Supplies', 'Home Decor',
  'Kitchen Appliances', 'Tools', 'Baby Products', 'Jewelry', 'Footwear'
];

const generateRandomItems = (numItems) => {
  const items = [];
  for (let i = 0; i < numItems; i++) {
    const name = faker.commerce.product();
    items.push({
      id: name,
      name: name,
      quantity: faker.number.int({ min: 1, max: 100 }),
      category: faker.helpers.arrayElement(categories)
    });
  }
  return items;
};

const seedData = async () => {
  const inventoryRef = db.collection('inventory');

  const inventoryData = generateRandomItems(100);

  const batch = db.batch();

  inventoryData.forEach(item => {
    const docRef = inventoryRef.doc(item.id); // Use item name as the document ID
    batch.set(docRef, {
      name: item.name,
      quantity: item.quantity,
      category: item.category
    });
  });

  await batch.commit();
  console.log('Seeding completed successfully!');
};

seedData().catch(console.error);
