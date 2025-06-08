import { create } from '@web3-storage/w3up-client';

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
    
    // Verwende deine Space DID
    const spaceDid = process.env.STORACHA_SPACE_DID;
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
    
    const campaignData = await request.json();
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

    // Create metadata
    const metadata = {
      title: campaignData.title,
      description: campaignData.description,
      category: campaignData.category,
      target: campaignData.target,
      creator: campaignData.creator,
      timestamp: Date.now(),
      version: '1.0',
      platform: 'go-ape-me'
    };

    const metadataJson = JSON.stringify(metadata, null, 2);
    const file = new File([metadataJson], `campaign-${Date.now()}.json`, {
      type: 'application/json'
    });

    console.log('📤 Uploading to IPFS...');
    const cid = await client.uploadFile(file);
    
    console.log('✅ Upload successful! CID:', cid.toString());
    
    return Response.json({ 
      success: true, 
      cid: cid.toString(),
      url: `https://${cid.toString()}.ipfs.w3s.link`
    });
    
  } catch (error) {
    console.error('❌ Backend upload failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}