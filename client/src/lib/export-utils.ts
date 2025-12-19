import jsPDF from 'jspdf';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { addStorageFallbackParam } from './file-utils';

// Export models to CSV
export const exportModelsToCSV = (models: any[]) => {
  const csvData = models.map(model => ({
    'Model Name': model.name,
    'Item Number': model.itemNumber,
    'Chassis': model.chassis || '',
    'Build Status': model.buildStatus,
    'Build Type': model.buildType,
    'Scale': model.scale || '',
    'Drive Type': model.driveType || '',
    'Total Cost': model.totalCost || '0',
    'Release Year': model.releaseYear || '',
    'Tags': model.tags ? model.tags.join(', ') : '',
    'Photos Count': model.photos?.length || 0,
    'Hop-ups Count': model.hopUpParts?.length || 0,
    'Created Date': format(new Date(model.createdAt), 'yyyy-MM-dd'),
    'Notes': model.notes || ''
  }));

  const csv = Papa.unparse(csvData);
  downloadFile(csv, 'models-export.csv', 'text/csv');
};

// Export hop-up parts to CSV
export const exportHopUpsToCSV = (hopUps: any[]) => {
  const csvData = hopUps.map(part => ({
    'Model Name': part.model?.name || 'Unknown',
    'Part Name': part.name,
    'Item Number': part.itemNumber || '',
    'Category': part.category,
    'Manufacturer': part.manufacturer || '',
    'Supplier': part.supplier || '',
    'Cost': part.cost || '0',
    'Quantity': part.quantity || 1,
    'Installation Status': part.installationStatus,
    'Installation Date': part.installationDate ? format(new Date(part.installationDate), 'yyyy-MM-dd') : '',
    'Is Tamiya Brand': part.isTamiyaBrand ? 'Yes' : 'No',
    'Color': part.color || '',
    'Material': part.material || '',
    'Created Date': format(new Date(part.createdAt), 'yyyy-MM-dd'),
    'Notes': part.notes || ''
  }));

  const csv = Papa.unparse(csvData);
  downloadFile(csv, 'hop-ups-export.csv', 'text/csv');
};

// Helper function to load image as base64
const loadImageAsBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxWidth = 400;
        const maxHeight = 300;
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        } else {
          resolve(null);
        }
      } catch (e) {
        console.error('Error converting image to base64:', e);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image:', url);
      resolve(null);
    };
    
    img.src = addStorageFallbackParam(url);
  });
};

// Export build logs to PDF with embedded photos
export const exportBuildLogsToPDF = async (buildLogs: any[]) => {
  const pdf = new jsPDF();
  const pageHeight = pdf.internal.pageSize.height;
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Sort build logs by date (oldest to newest)
  const sortedLogs = [...buildLogs].sort((a, b) => 
    new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );

  // Add title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Build Log Export', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, margin, yPosition);
  yPosition += 20;

  for (const entry of sortedLogs) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    // Entry header
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${entry.model.name} - Entry #${entry.entryNumber}`, margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(entry.title, margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${format(new Date(entry.entryDate), 'MMMM d, yyyy')}`, margin, yPosition);
    yPosition += 10;

    // Content
    if (entry.content) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const splitContent = pdf.splitTextToSize(entry.content, pageWidth - 2 * margin);
      
      for (const line of splitContent) {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      }
      yPosition += 5;
    }

    // Photos section - embed actual images
    if (entry.photos && entry.photos.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Photos (${entry.photos.length}):`, margin, yPosition);
      yPosition += 8;

      for (const photoLink of entry.photos) {
        const photo = photoLink.photo;
        const imageUrl = photo.url;
        
        // Load and embed the actual image
        const base64Image = await loadImageAsBase64(imageUrl);
        
        if (base64Image) {
          // Calculate image dimensions to fit in page
          const maxImgWidth = pageWidth - 2 * margin;
          const maxImgHeight = 80;
          
          // Check if we need a new page for the image
          if (yPosition + maxImgHeight + 15 > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          
          try {
            pdf.addImage(base64Image, 'JPEG', margin, yPosition, maxImgWidth * 0.6, maxImgHeight);
            yPosition += maxImgHeight + 5;
          } catch (e) {
            console.error('Failed to add image to PDF:', e);
            pdf.text(`[Image: ${photo.originalName}]`, margin, yPosition);
            yPosition += 6;
          }
        } else {
          // Fallback to filename if image can't be loaded
          pdf.setFont('helvetica', 'normal');
          pdf.text(`[Image: ${photo.originalName}]`, margin, yPosition);
          yPosition += 6;
        }
        
        // Add caption if present
        if (photo.caption) {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.setFont('helvetica', 'italic');
          pdf.text(`"${photo.caption}"`, margin + 5, yPosition);
          yPosition += 6;
        }
        
        yPosition += 3;
      }
    }

    yPosition += 15; // Space between entries
  }

  // Save the PDF
  pdf.save('build-logs-export.pdf');
};

// Helper function to download files
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
