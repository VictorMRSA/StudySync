import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as zip from "https://deno.land/x/zipjs@v2.7.34/index.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Parsing document request received');
    
    // Get the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    console.log('File received:', file.name, file.type, file.size);
    
    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // For Word documents (.docx)
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      const content = await extractTextFromDocx(uint8Array);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          content: content || 'Não foi possível extrair texto do documento Word.',
          fileName: file.name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For PowerPoint presentations (.pptx)
    if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx')) {
      const content = await extractTextFromPptx(uint8Array);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          content: content || 'Não foi possível extrair texto da apresentação.',
          fileName: file.name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For PDF files, extract text
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const text = new TextDecoder().decode(uint8Array);
      const content = extractTextFromPDF(text);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          content: content || 'Não foi possível extrair texto do PDF. O documento pode conter apenas imagens ou estar protegido.',
          fileName: file.name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For other binary formats, return a message
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Formato ${file.type} ainda não suportado para parsing automático. Use arquivos TXT, PDF, DOCX ou PPTX.`
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error parsing document:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to extract text from PDF
function extractTextFromPDF(rawText: string): string {
  try {
    // Very basic PDF text extraction
    // Remove binary data and extract readable text
    const textMatches = rawText.match(/BT\s+(.*?)\s+ET/gs);
    if (textMatches) {
      let extractedText = '';
      textMatches.forEach(match => {
        const textContent = match.match(/\((.*?)\)/g);
        if (textContent) {
          textContent.forEach(text => {
            extractedText += text.replace(/[()]/g, '') + ' ';
          });
        }
      });
      return extractedText.trim();
    }
    
    // Fallback: try to extract any readable text
    const readableText = rawText.match(/[\x20-\x7E\s]{10,}/g);
    if (readableText) {
      return readableText.join(' ').trim();
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return '';
  }
}

// Helper function to extract text from DOCX
async function extractTextFromDocx(uint8Array: Uint8Array): Promise<string> {
  try {
    const blob = new Blob([uint8Array]);
    const reader = new zip.ZipReader(new zip.BlobReader(blob));
    const entries = await reader.getEntries();
    
    // Find document.xml which contains the main text content
    const documentXml = entries.find(entry => entry.filename === 'word/document.xml');
    
    if (!documentXml || !documentXml.getData) {
      console.error('document.xml not found in DOCX');
      return '';
    }
    
    // Extract the XML content
    const textWriter = new zip.TextWriter();
    const xmlContent = await documentXml.getData(textWriter);
    await reader.close();
    
    // Extract text from <w:t> tags
    const textMatches = xmlContent.match(/<w:t[^>]*>(.*?)<\/w:t>/gs);
    if (textMatches) {
      const text = textMatches
        .map(match => match.replace(/<[^>]*>/g, '').trim())
        .filter(t => t.length > 0)
        .join(' ');
      
      return text;
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    return '';
  }
}

// Helper function to extract text from PPTX
async function extractTextFromPptx(uint8Array: Uint8Array): Promise<string> {
  try {
    const blob = new Blob([uint8Array]);
    const reader = new zip.ZipReader(new zip.BlobReader(blob));
    const entries = await reader.getEntries();
    
    // PPTX stores slides in ppt/slides/slideX.xml
    const slideEntries = entries.filter(entry => 
      entry.filename.startsWith('ppt/slides/slide') && 
      entry.filename.endsWith('.xml')
    );
    
    const allText: string[] = [];
    
    for (const slideEntry of slideEntries) {
      if (!slideEntry.getData) continue;
      
      const textWriter = new zip.TextWriter();
      const xmlContent = await slideEntry.getData(textWriter);
      
      // Extract text from <a:t> tags (text content in PowerPoint)
      const textMatches = xmlContent.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
      if (textMatches) {
        const slideText = textMatches
          .map(match => match.replace(/<[^>]*>/g, '').trim())
          .filter(t => t.length > 0)
          .join(' ');
        
        if (slideText) {
          allText.push(`\n--- Slide ${slideEntries.indexOf(slideEntry) + 1} ---\n${slideText}`);
        }
      }
    }
    
    await reader.close();
    return allText.join('\n\n');
  } catch (error) {
    console.error('Error extracting PPTX text:', error);
    return '';
  }
}
