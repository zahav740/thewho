/**
 * @file: index.ts
 * @description: Экспорт общих компонентов
 * @created: 2025-06-21
 * @updated: 2025-07-07 - Исправлены экспорты компонентов
 */

// UI Components - именованные экспорты
export { Alert, AlertDescription } from './Alert';
export { Badge } from './Badge';
export { Button } from './Button';
export { Card, CardHeader, CardTitle, CardContent } from './Card';
export { Dialog, DialogContent, DialogHeader, DialogTitle } from './Dialog';
export { Input } from './Input';
export { Label } from './Label';
export { Progress } from './Progress';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

// PDF Components
export { PdfViewer } from './PdfViewer';
export { PdfDebugViewer } from './PdfDebugViewer';
export { PdfUpload } from './PdfUpload';
export { SimplePdfViewer } from './SimplePdfViewer';
export { InlinePdfViewer } from './InlinePdfViewer';
export { default as PdfPreview } from './PdfPreview';
export { default as PdfPreviewFixed } from './PdfPreviewFixed';
export { default as PdfPreviewSimple } from './PdfPreviewSimple';