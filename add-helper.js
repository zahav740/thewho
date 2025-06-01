// Add missing helper function 
const fs = require('fs'); 
const path = require('path'); 
const filePath = path.join('backend', 'src', 'modules', 'orders', 'orders.service.ts'); 
 
try { 
  let content = fs.readFileSync(filePath, 'utf8'); 
 
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
    } catch (e) { 
      return 3; // Default to 3 axes 
    } 
  } 
`; 
      // Insert helper function before last brace 
      const newContent = content.substring(0, lastBraceIndex) + helperFunction + content.substring(lastBraceIndex); 
      fs.writeFileSync(filePath, newContent, 'utf8'); 
      console.log('Added helper function successfully'); 
    } 
  } else { 
    console.log('Helper function already exists'); 
  } 
} catch (error) { 
  console.error('Error adding helper function:', error); 
} 
