// src/app/api/upload-campaign/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Create metadata
    const metadata = {
      title: campaignData.title,
      description: campaignData.description,
      category: campaignData.category || 'Technology',
      target: parseFloat(campaignData.target),
      creator: campaignData.creator,
      timestamp: Date.now(),
      version: '1.0',
      platform: 'go-ape-me',
      createdAt: new Date().toISOString(),
      status: 'active',
      type: 'crowdfunding-campaign'
    };

    const metadataJson = JSON.stringify(metadata, null, 2);

    // ✅ PINATA UPLOAD (viel einfacher!)
    const formData = new FormData();
    const blob = new Blob([metadataJson], { type: 'application/json' });
    formData.append('file', blob, `campaign-${Date.now()}.json`);
    
    // Pinata Metadata
    const pinataMetadata = JSON.stringify({
      name: `Go-Ape-Me Campaign: ${campaignData.title}`,
      keyvalues: {
        platform: 'go-ape-me',
        campaign: campaignData.title,
        creator: campaignData.creator
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    console.log('📤 Uploading to IPFS via Pinata...');
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    const cid = result.IpfsHash;
    
    console.log('✅ Upload successful! CID:', cid);
    
    return Response.json({ 
      success: true, 
      cid: cid,
      url: `https://gateway.pinata.cloud/ipfs/${cid}`,
      metadata: metadata
    });
    
  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    
    return Response.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}