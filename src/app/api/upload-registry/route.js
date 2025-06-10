// src/app/api/upload-registry/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    console.log('📝 Received registry upload request');
    
    // Validiere Input
    const registryData = await request.json();
    
    if (!registryData.campaigns || !Array.isArray(registryData.campaigns)) {
      return Response.json({ 
        success: false, 
        error: 'Invalid registry data: campaigns array required' 
      }, { status: 400 });
    }
    
    console.log('📋 Registry contains:', registryData.campaigns.length, 'campaigns');

    // ✅ Check Pinata JWT
    const pinataJWT = process.env.PINATA_JWT;
    if (!pinataJWT) {
      throw new Error('PINATA_JWT environment variable is required');
    }

    // Create registry metadata
    const registryMetadata = {
      ...registryData,
      type: 'go-ape-me-registry',
      platform: 'go-ape-me',
      lastUpdated: new Date().toISOString()
    };

    const registryJson = JSON.stringify(registryMetadata, null, 2);

    // ✅ PINATA UPLOAD
    const formData = new FormData();
    const blob = new Blob([registryJson], { type: 'application/json' });
    formData.append('file', blob, `go-ape-me-registry-${Date.now()}.json`);
    
    // Pinata Metadata
    const pinataMetadata = JSON.stringify({
      name: `Go-Ape-Me Registry (${registryData.campaigns.length} campaigns)`,
      keyvalues: {
        platform: 'go-ape-me',
        type: 'registry',
        campaignCount: registryData.campaigns.length.toString(),
        version: registryData.version || '1.0'
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    console.log('📤 Uploading registry to IPFS via Pinata...');
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      console.error('❌ Pinata API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      throw new Error(`Pinata upload failed (${response.status}): ${errorData.error || errorData.message || errorText}`);
    }

    const result = await response.json();
    const cid = result.IpfsHash;
    
    console.log('✅ Registry upload successful! CID:', cid);
    console.log('📊 Registry stats:', {
      campaigns: registryData.campaigns.length,
      size: registryJson.length,
      cid: cid
    });
    
    return Response.json({ 
      success: true, 
      cid: cid,
      url: `https://tomato-petite-butterfly-553.mypinata.cloud/ipfs/${cid}`,
      metadata: registryMetadata,
      stats: {
        campaignCount: registryData.campaigns.length,
        registrySize: registryJson.length
      }
    });
    
  } catch (error) {
    console.error('❌ Registry upload failed:', error);
    
    return Response.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}