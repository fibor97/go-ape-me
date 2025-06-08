import { create } from '@web3-storage/w3up-client';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    console.log('🔧 Setting up Storacha with email:', email);
    
    const client = await create();
    
    // Login with email
    const account = await client.login(email);
    console.log('📧 Email verification sent to:', email);
    
    // Der Client wartet auf Email-Verifikation
    // Nach Klick im Email werden Spaces verfügbar
    
    return Response.json({
      success: true,
      message: 'Please check your email and click the verification link, then try creating a campaign.'
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}