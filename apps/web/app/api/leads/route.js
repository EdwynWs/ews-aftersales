import {NextResponse} from 'next/server';
export const runtime='nodejs';
const backend=()=>String(process.env.API_INTERNAL_URL||process.env.NEXT_PUBLIC_API_URL||'http://127.0.0.1:4000').replace(/\/$/,'');
function json(error,status){return NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}})}
export async function POST(req){
 let body;try{body=await req.json()}catch{return json('Envie um formulário válido.',400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return json('Dados inválidos.',400);
 // Campo isca para robôs; não armazena contatos de submissões automatizadas.
 if(body.website)return NextResponse.json({ok:true},{status:200});
 if(body.consent!==true)return json('Autorize o contato para continuar.',400);
 if(typeof body.name!=='string'||body.name.trim().length<2||body.name.length>120||typeof body.email!=='string'||body.email.length>180||typeof body.company!=='string'||body.company.trim().length<2||body.company.length>150)return json('Preencha nome, empresa e e-mail.',400);
 try{
  const r=await fetch(`${backend()}/public/leads`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(12000)});
  const out=await r.json().catch(()=>({}));
  if(!r.ok)return json(typeof out.error==='string'?out.error:'Não foi possível enviar.',r.status>=400&&r.status<500?r.status:502);
  return NextResponse.json({ok:true},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return json('Não conseguimos receber seu contato agora. Tente mais tarde.',503)}
}
