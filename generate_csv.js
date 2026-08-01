const fs = require('fs');
const headers = [
  'Product Handle', 'Product Title', 'Product Subtitle', 'Product Description', 'Product Status', 
  'Product Thumbnail', 'Product Type', 'Product Collection Title', 'Product Collection Handle',
  'Product Tags', 'Variant Title', 'Variant SKU', 'Variant Inventory Quantity', 'Variant Manage Inventory',
  'Option 1 Name', 'Option 1 Value', 'Option 2 Name', 'Option 2 Value', 'Price INR', 'Image 1 Url'
];
const dresses = [
  { name: 'Flowy Maxi Dress', desc: 'A beautiful flowy maxi dress perfect for summer.', price: 2999, img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80' },
  { name: 'Linen Shirt Dress', desc: 'Comfortable linen shirt dress.', price: 3499, img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80' },
  { name: 'Satin Slip Dress', desc: 'Elegant evening satin dress.', price: 4999, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80' },
  { name: 'Floral Wrap Dress', desc: 'Wrap dress with floral print.', price: 2499, img: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80' },
  { name: 'Ribbed Knit Midi', desc: 'Cozy ribbed knit midi dress.', price: 3999, img: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&q=80' },
  { name: 'Denim Pinafore', desc: 'Casual denim pinafore.', price: 2799, img: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800&q=80' },
  { name: 'Polka Dot Mini', desc: 'Cute polka dot mini dress.', price: 1999, img: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&q=80' },
  { name: 'Velvet Party Dress', desc: 'Luxurious velvet dress for parties.', price: 5499, img: 'https://images.unsplash.com/photo-1596783049103-da0e66d4826c?w=800&q=80' },
  { name: 'Cotton Sun Dress', desc: 'Lightweight cotton sun dress.', price: 1499, img: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=800&q=80' },
  { name: 'Pleated Chiffon Gown', desc: 'Formal pleated chiffon gown.', price: 7999, img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80' }
];
const rows = [headers.join(',')];
dresses.forEach((d, i) => {
  const handle = d.name.toLowerCase().replace(/ /g, '-');
  const sizes = ['S', 'M', 'L'];
  sizes.forEach((s, idx) => {
    const row = [
      handle,
      `"${d.name}"`,
      '""',
      `"${d.desc}"`,
      'published',
      `"${d.img}"`,
      'Dresses',
      'Women',
      'women',
      '"mango,dress"',
      `"${s}"`,
      `"${handle}-${s}"`,
      100,
      'TRUE',
      'Size',
      s,
      'Color',
      'Black',
      d.price + (idx * 200),
      `"${d.img}"`
    ];
    rows.push(row.join(','));
  });
});
fs.writeFileSync('mango_test_products.csv', rows.join('\n'));
console.log('Successfully generated mango_test_products.csv in the project root!');
