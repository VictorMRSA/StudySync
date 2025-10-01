import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    // For PDF files, extract text
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Simple text extraction for PDFs
      // Note: This is a basic implementation. For better results, consider using a proper PDF parsing library
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
    
    // For Word documents (.docx)
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      // Basic text extraction for DOCX
      const text = new TextDecoder().decode(uint8Array);
      const content = extractTextFromDocx(text);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          content: content || 'Não foi possível extrair texto do documento Word.',
          fileName: file.name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For other binary formats, return a message
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Formato ${file.type} ainda não suportado para parsing automático. Use arquivos TXT ou PDF.`
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
function extractTextFromDocx(rawText: string): string {
  try {
    // DOCX files are ZIP archives with XML files
    // Try to extract text from XML content
    const textMatches = rawText.match(/<w:t[^>]*>(.*?)<\/w:t>/gs);
    if (textMatches) {
      return textMatches
        .map(match => match.replace(/<[^>]*>/g, ''))
        .join(' ')
        .trim();
    }
    
    // Fallback: extract readable text
    const readableText = rawText.match(/[\x20-\x7E\s]{10,}/g);
    if (readableText) {
      return readableText.join(' ').trim();
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    return '';
  }
}
