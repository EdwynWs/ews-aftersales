import {Router} from 'express';
import rateLimit from 'express-rate-limit';
import {z} from 'zod';
import {pool} from './db.js';

const router=Router();
const schema=z.object({
  name:z.string().trim().min(2).max(120),
  email:z.string().trim().email().max(180),
  company:z.string().trim().min(2).max(150),
  phone:z.string().trim().max(30).optional().default(''),
  teamSize:z.enum(['1–5 técnicos','6–15 técnicos','16–50 técnicos','Mais de 50 técnicos','Ainda estou estruturando']),
  message:z.string().trim().max(1500).optional().default(''),
  consent:z.literal(true),
  website:z.string().max(100).optional().default(''),
}).strict();

router.post('/leads',rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-7',legacyHeaders:false}),async(req,res,next)=>{
  try{
    const parsed=schema.safeParse(req.body);
    if(!parsed.success)return res.status(400).json({error:'Confira os campos e a autorização de contato.'});
    const d=parsed.data;
    if(d.website)return res.status(200).json({ok:true});
    await pool.query('INSERT INTO marketing_leads (name,email,company,phone,team_size,message,consent) VALUES ($1,$2,$3,$4,$5,$6,$7)',[d.name,d.email.toLowerCase(),d.company,d.phone||null,d.teamSize,d.message||null,true]);
    return res.status(201).json({ok:true});
  }catch(err){next(err)}
});
export default router;
