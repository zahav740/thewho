// SIMPLE ONE-FILE FIX FOR BAD REQUEST ERROR
// Copy this entire script and run it in your command prompt with:
// node fix-operations-400-error.js

const fs = require('fs');
const path = require('path');

// Path to the service file
const filePath = path.join('backend', 'src', 'modules', 'orders', 'orders.service.ts');

try {
  console.log('Reading orders.service.ts...');
  let content = fs.readFileSync(filePath, 'utf8');
  
  console.log('Fixing machineAxes conversion...');
  // Replace machine creation with safer version
  content = content.replace(
    /machine: (op[^,]+).machineAxes \? `\$\{(op[^,]+).machineAxes\}-axis` : '3-axis'/g,
    "machine: typeof $1.machineAxes === 'number' ? `${$1.machineAxes}-axis` : (String($1.machineAxes).includes('-axis') ? String($1.machineAxes) : `${$1.machineAxes || 3}-axis`)"
  );
  
  console.log('Fixing priority conversion...');
  // Replace priority conversion with safer version
  content = content.replace(
    /priority: parseInt\(orderData\.priority\)/g,
    "priority: parseInt(String(orderData.priority), 10)"
  );
  
  console.log('Fixing priority update conversion...');
  // Replace priority update conversion with safer version
  content = content.replace(
    /processedUpdateData\.priority = parseInt\(orderDataToUpdate\.priority\)/g,
    "processedUpdateData.priority = parseInt(String(orderDataToUpdate.priority), 10)"
  );
  
  console.log('Adding helper function...');
  // Check if helper function already exists
  if (!content.includes('extractMachineAxesNumber')) {
    // Find class end to add helper function
    const lastBraceIndex = content.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      const helperFunction = `
  // Helper method to extract number from "3-axis" string
  private extractMachineAxesNumber(machineStr: string): number {
    if (!machineStr) return 3;
    try {
      const match = machineStr.match(/(\\d+)/);
      return match && match[1] ? parseInt(match[1], 10) : 3;
    } catch (e) {
      return 3; // Default to 3 axes
    }
  }
`;
      // Insert helper function before last brace
      content = content.substring(0, lastBraceIndex) + helperFunction + content.substring(lastBraceIndex);
    }
  }
  
  console.log('Writing fixed content back to file...');
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('FIXED SUCCESSFULLY!');
  console.log('Now restart your application:');
  console.log('1. taskkill /F /IM node.exe');
  console.log('2. cd backend && npm start');
  console.log('3. cd frontend && npm start');
  
} catch (error) {
  console.error('ERROR:', error);
}
