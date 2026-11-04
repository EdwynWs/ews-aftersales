import {NextResponse} from 'next/server';
export const runtime='nodejs';
const backend=()=>String(process.env.API_INTERNAL_URL||process.env.NEXT_PUBLIC_API_URL||'http://127.0.0.1:4000').replace(/\/$/,'');
function json(error,status){return NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}})}
export async function POST(req){
 let body;try{body=await req.json()}catch{return json('Envie um formulário válido.',400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return json('Dados inválidos.',400);
 const {company,name,email,password}=body;
 if(typeof company!=='string'||company.trim().length<2||company.length>120||typeof name!=='string'||name.trim().length<2||name.length>120||typeof email!=='string'||email.length>180||typeof password!=='string'||password.length<8||password.length>128)return json('Confira as informações de cadastro.',400);
 try{
  const r=await fetch(`${backend()}/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company:company.trim(),name:name.trim(),email:email.trim(),password}),cache:'no-store',signal:AbortSignal.timeout(12000)});
  const out=await r.json().catch(()=>({}));
  if(!r.ok)return json(typeof out.error==='string'?out.error:'Não foi possível cadastrar.',r.status>=400&&r.status<500?r.status:502);
  // Não envia o JWT ao navegador; o usuário faz login no painel existente.
  return NextResponse.json({ok:true,user:out.user?{name:out.user.name,email:out.user.email}:undefined},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return json('Serviço de cadastro indisponível. Verifique a API do EWS Field.',503)}
}
