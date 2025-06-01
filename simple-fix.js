// SUPER SIMPLE FIX FOR BAD REQUEST ERROR
const fs = require('fs');
const path = require('path');

// Path to the OrderForm component
const orderFormPath = path.join('frontend', 'src', 'pages', 'Database', 'components', 'OrderForm.tsx');

try {
  console.log('Reading OrderForm component...');
  let orderFormContent = fs.readFileSync(orderFormPath, 'utf8');
  
  console.log('Adding number conversion for operations...');
  // Add manual type conversion for operations before submission
  if (!orderFormContent.includes('Number(op.operationNumber)')) {
    orderFormContent = orderFormContent.replace(
      /setLoading\(true\);/,
      setLoading(true);
    
    // Force convert operation values to numbers
    if (data.operations && data.operations.length > 0) {
      data.operations = data.operations.map(op => ({
        ...op,
        operationNumber: Number(op.operationNumber),
        machineAxes: Number(op.machineAxes),
        estimatedTime: Number(op.estimatedTime)
      }));
      console.log('Operations after number conversion:', data.operations);
    }
    );
    
    fs.writeFileSync(orderFormPath, orderFormContent, 'utf8');
    console.log('OrderForm component updated successfully!');
  } else {
    console.log('Number conversion already added to OrderForm');
  }
  
  console.log('\nFIX APPLIED SUCCESSFULLY!');
  console.log('Now restart your application:');
  console.log('1. taskkill /F /IM node.exe');
  console.log('2. cd backend && npm start');
  console.log('3. cd frontend && npm start');
  
} catch (error) {
  console.error('Error updating OrderForm component:', error);
}
