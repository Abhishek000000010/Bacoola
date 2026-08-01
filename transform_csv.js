const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('c:/Projects/bacoola-2/shop.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // Transform
    
    // Header for output CSV
    let out = "Handle,Title,Description,Status,Thumbnail,Image 1,Image 2,Image 3,Profile Name,Option 1 Name,Option 1 Value,Variant SKU,Variant Inventory Quantity,Variant Manage Inventory,Variant Allow Backorder,Variant Price [INR]\n";
    
    // Helper to generate handle
    const generateHandle = (title, index) => {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "-" + index;
    };
    
    let prodIndex = 1;
    
    for (const row of results) {
        const title = row['ProductTitle-module__7eNKla__productTitle'];
        let priceStr = row['SinglePrice-module__y_asRG__center'];
        
        // Sometimes price is in a different column if there's a discount
        if (!priceStr) {
            priceStr = row['SinglePrice-module__y_asRG__crossed'];
        }
        
        const thumbnail = row['ProductMedia-module__xopx3q__mediaWrapper src'];
        
        if (!title || !priceStr) continue;
        
        // Parse price (e.g. "Rs. 3,899.00" -> 3899)
        const priceClean = priceStr.replace(/[^0-9]/g, '');
        const price = parseInt(priceClean, 10) / 100; // Because it includes .00 usually
        
        const img1 = row['ProductMedia-module__xopx3q__mediaWrapper src 2'] || '';
        const img2 = row['ProductMedia-module__xopx3q__mediaWrapper src 3'] || '';
        const img3 = row['ProductMedia-module__xopx3q__mediaWrapper src 4'] || '';
        
        // Extract sizes
        const sizes = [];
        const sizeCols = [
            'SizePicker-module__WzYwuW__sizePickerAddToBagButton',
            'SizePicker-module__WzYwuW__sizePickerAddToBagButton 2',
            'SizePicker-module__WzYwuW__sizePickerAddToBagButton 3',
            'SizePicker-module__WzYwuW__sizePickerAddToBagButton 4',
            'SizePicker-module__WzYwuW__sizePickerAddToBagButton 5',
            'SizePicker-module__WzYwuW__sizePickerAddToBagButton 6'
        ];
        
        for (const col of sizeCols) {
            if (row[col] && row[col].trim() !== '') {
                sizes.push(row[col].trim());
            }
        }
        
        if (sizes.length === 0) {
            sizes.push('One Size');
        }
        
        const handle = generateHandle(title, prodIndex);
        const description = "Premium quality T-shirt from Mango.";
        
        for (const size of sizes) {
            const sku = `${handle}-${size}`.toUpperCase();
            out += `"${handle}","${title}","${description}","published","${thumbnail}","${img1}","${img2}","${img3}","Default","Size","${size}","${sku}",100,TRUE,FALSE,${price}\n`;
        }
        
        prodIndex++;
    }
    
    fs.writeFileSync('c:/Projects/bacoola-2/medusa_tshirts.csv', out);
    console.log("Successfully generated medusa_tshirts.csv with " + (prodIndex - 1) + " products.");
  });
