import { create } from '@web3-storage/w3up-client';

// ✅ Node.js Runtime erzwingen
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let storachaClient = null;
let isClientReady = false;

async function initStorachaClient() {
  if (storachaClient && isClientReady) {
    return storachaClient;
  }

  try {
    console.log('🔧 Initializing Storacha backend client...');
    storachaClient = await create();
    
    // Login mit deiner Email (einmalig)
    console.log('📧 Logging in backend...');
    await storachaClient.login('rs@ds2.de');
    
    // Verwende deine Space DID aus Umgebungsvariable
    const spaceDid = process.env.STORACHA_SPACE_DID;
    if (!spaceDid) {
      throw new Error('STORACHA_SPACE_DID environment variable is required');
    }
    
    console.log('🎯 Setting space DID:', spaceDid);
    
    // Warte kurz für den Login
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Prüfe verfügbare Spaces
    const spaces = storachaClient.spaces();
    console.log('📋 Available spaces:', spaces.length);
    
    if (spaces.length > 0) {
      const targetSpace = spaces.find(s => s.did() === spaceDid) || spaces[0];
      await storachaClient.setCurrentSpace(targetSpace.did());
      console.log('✅ Space set:', targetSpace.did());
      isClientReady = true;
    } else {
      console.log('⏳ No spaces yet, they might still be loading...');
      // Versuche es trotzdem
      isClientReady = true;
    }
    
    return storachaClient;
  } catch (error) {
    console.error('❌ Failed to initialize Storacha client:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    console.log('📝 Received campaign upload request');
    
    // Validiere Input
    const campaignData = await request.json();
    
    if (!campaignData.title || !campaignData.description || !campaignData.target) {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields: title, description, target' 
      }, { status: 400 });
    }
    
    console.log('📋 Campaign:', campaignData.title);
    
    // Get backend client
    const client = await initStorachaClient();
    
    // Prüfe nochmal current space
    if (!client.currentSpace()) {
      console.log('🔧 No current space, trying to set...');
      const spaces = client.spaces();
      if (spaces.length > 0) {
        await client.setCurrentSpace(spaces[0].did());
        console.log('✅ Space set:', spaces[0].did());
      } else {
        throw new Error('No spaces available in backend');
      }
    }

    // Create metadata mit besserer Struktur
    const metadata = {
      title: campaignData.title,
      description: campaignData.description,
      category: campaignData.category || 'Technology',
      target: parseFloat(campaignData.target),
      creator: campaignData.creator,
      timestamp: Date.now(),
      version: '1.0',
      platform: 'go-ape-me',
      // Zusätzliche Metadaten
      createdAt: new Date().toISOString(),
      status: 'active',
      type: 'crowdfunding-campaign'
    };

    const metadataJson = JSON.stringify(metadata, null, 2);
    
    // ✅ FIX: Node.js-kompatible File-Erstellung
    // Verwende Buffer statt File() für Node.js
    const fileBuffer = Buffer.from(metadataJson, 'utf8');
    const fileName = `campaign-${Date.now()}.json`;
    
    // Storacha erwartet ein File-like Object - erstelle eines
    const fileObject = {
      name: fileName,
      type: 'application/json',
      size: fileBuffer.length,
      stream: () => {
        const { Readable } = require('stream');
        return Readable.from(fileBuffer);
      },
      // Node.js File-Interface für Storacha
      arrayBuffer: () => Promise.resolve(fileBuffer.buffer.slice(
        fileBuffer.byteOffset, 
        fileBuffer.byteOffset + fileBuffer.byteLength
      )),
    };

    console.log('📤 Uploading to IPFS...');
    const cid = await client.uploadFile(fileObject);
    
    console.log('✅ Upload successful! CID:', cid.toString());
    
    return Response.json({ 
      success: true, 
      cid: cid.toString(),
      url: `https://${cid.toString()}.ipfs.w3s.link`,
      metadata: metadata
    });
    
  } catch (error) {
    console.error('❌ Backend upload failed:', error);
    
    // Bessere Error-Behandlung
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    
    return Response.json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: statusCode });
  }
}