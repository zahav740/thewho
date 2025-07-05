#!/bin/bash
echo "🔧 Fixing all Express import issues..."

cd backend

# Define the files to fix
declare -a files=(
    "src/modules/orders/excel-import-simple.controller.ts"
    "src/modules/orders/excel-import.service.ts" 
    "src/modules/orders/excel-preview.service.ts"
    "src/modules/orders/orders.controller.ts"
    "src/modules/orders/orders.middleware.ts"
    "src/modules/orders/excel-column-mapper.service.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Processing $file..."
        
        # Replace Express import statements
        sed -i "s/import type { Express } from 'express';/import { MulterFile } from '..\/..\/types\/express';/g" "$file"
        sed -i "s/import { Express } from 'express';/import { MulterFile } from '..\/..\/types\/express';/g" "$file"
        sed -i "s/import { Request, Response, NextFunction } from 'express';/import { Request, Response, NextFunction } from '..\/..\/types\/express';/g" "$file"
        sed -i "s/import { Response } from 'express';/import { Response } from '..\/..\/types\/express';/g" "$file"
        sed -i "s/import { Request } from 'express';/import { Request } from '..\/..\/types\/express';/g" "$file"
        
        # Replace Express.Multer.File usage
        sed -i "s/Express\.Multer\.File/MulterFile/g" "$file"
        
        echo "✅ Fixed $file"
    else
        echo "⚠️ File not found: $file"
    fi
done

echo "🎉 All Express import fixes completed!"
echo "🧪 Testing compilation..."
npx tsc --noEmit

echo "✅ Done!"
